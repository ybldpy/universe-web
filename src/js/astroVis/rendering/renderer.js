import * as THREE from "three";

export class FrameBufferRenderer{
    constructor(renderer){
        this.renderer = renderer;
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;
        this.postProcessShaderQueue = [];
        this.gBuffer = new THREE.WebGLRenderTarget(screen.width,
            screen.height,{
                count:2,
                format:THREE.RGBAFormat,
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                type:THREE.FloatType
            });
        this.rtA = new THREE.WebGLRenderTarget(screen.width,
            screen.height ,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                stencilBuffer:false,
                depthBuffer:false,
                type:THREE.FloatType
            });
        this.rtB =  new THREE.WebGLRenderTarget(screen.width,
            screen.height,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                stencilBuffer:false,
                depthBuffer:false,
                type:THREE.FloatType
            });
        // this.postProcessShaderQueue = [];
        this.postScene = new THREE.Scene();
        this.postCamera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,2);
        const planeGeo = new THREE.PlaneGeometry(2,2);
        const vs = `

        out vec2 vUv;
        void main(){
            gl_Position = vec4(position,1.0);
            vUv = uv;
        }
        `

        const fs = `
        in vec2 vUv;
        out vec4 color;
        uniform sampler2D screenColor;
        void main(){
            color = texture(screenColor,vUv);
        }
        `
        this.postShader = new THREE.ShaderMaterial({
            glslVersion:THREE.GLSL3,
            vertexShader:vs,
            fragmentShader:fs,
            uniforms:{
                screenColor:{value:null}
            }

        });

        this.plane = new THREE.Mesh(planeGeo,this.postShader);
        this.postScene.add(this.plane);
    }



    resize(width,height){
        //this.renderer.setSize(width,height)
        // const renderTargetWidth = width * window.devicePixelRatio;
        // const renderTargetHeight = height * window.devicePixelRatio;
        // this.gBuffer.setSize(renderTargetWidth,renderTargetHeight);
        // this.rtA.setSize(renderTargetWidth,renderTargetHeight)
        // this.rtB.setSize(renderTargetWidth,renderTargetHeight);
    }


    getPostProcessShaderQueue(){
        return this.postProcessShaderQueue;
    }

    excutePostProcessing(camera,postProcessShaders){
        this.renderer.setRenderTarget(this.rtA);
        this.postScene.add(this.plane);
        this.plane.material = this.postShader;
        this.plane.material.uniforms.screenColor.value = this.gBuffer.textures[0];
        this.renderer.render(this.postScene,this.postCamera);
        let renderedTarget = this.rtA;
        let nextRenderTarget = null;
        let idx = false;
        while(postProcessShaders.length>0){
            nextRenderTarget = idx?this.rtA:this.rtB;
            this.renderer.setRenderTarget(nextRenderTarget);
            const shader= postProcessShaders.shift();
            const uniforms = shader.uniforms;
            uniforms.gPositionTexture.value = this.gBuffer.textures[1];
            uniforms.screenColorTexture.value = renderedTarget.texture;
            this.plane.material=shader;
            this.renderer.render(this.postScene,this.postCamera);
            idx = !idx;
            renderedTarget = nextRenderTarget;
        }
        this.plane.material = this.postShader;
        this.plane.material.uniforms.screenColor.value = renderedTarget.texture;
    }

    render(scene,camera){



        const originalRenderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.gBuffer);
        // render gBuffer
        this.renderer.render(scene,camera);
        this.excutePostProcessing(camera,this.getPostProcessShaderQueue(),originalRenderTarget);
        this.renderer.setRenderTarget(originalRenderTarget);
        this.renderer.render(this.postScene,this.postCamera);
    }

    getSize(){
        return this.renderer.getSize();
    }

}