import * as THREE from 'three';
export class GaiaStars{


    static vs = `
    highp float;


    out float vsDepth;
    out vec2 vUV;
    out vec3 vsPosition;

    uniform mat4 inversedCameraTranslation;
    uniform mat4 viewRotationMatrix;

    void main(){
        vsPosition = vec3((viewMatrix) * vec4(position*3e16,1.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vsPosition,1.0);
        vUV = uv;
        vsDepth = gl_Position.w;
        gl_Position.z = 0.0;
        gl_PointSize = 3.0;
        
    }
    `


    static fs = `
    highp float;



    layout(location = 0) out vec4 gPosition;
    layout(location = 1) out vec4 fragColor;

    in float vsDepth;
    in vec2 vUV;
    in vec3 vsPosition;
    uniform sampler2D tex;

    void main(){
        gl_FragDepth = log(vsDepth+1.0) / log(1e20+1.0);
        fragColor = vec4(1.0);
        gPosition = vec4(vsPosition,1.0);
    }
    
    `



    DATA_SOURCE_FORMAT = {
        BINARY:"BINARY",
        SPECK:"SPECK"
    }

    constructor(dataUrl,scene,format){
        this.loadStars(dataUrl,format);
        this.scene = scene;    
        this.positions = [];
        this.starDataReady = false;
        this.shader = new THREE.ShaderMaterial({
            glslVersion:THREE.GLSL3,
            vertexShader:GaiaStars.vs,
            fragmentShader:GaiaStars.fs,
            
            uniforms:{
                tex:{value:null},
                inversedCameraTranslation:{value:new THREE.Matrix4()},
                viewRotationMatrix:{value:new THREE.Matrix4()}
            }
        })
        this.loadStars(dataUrl,true);
    }

    render(camera){
        this.shader.uniforms.inversedCameraTranslation.value.copy(this.shader.uniforms.inversedCameraTranslation.value.makeTranslation(camera.position).invert())
        this.shader.uniforms.viewRotationMatrix.value.makeRotationFromQuaternion(camera.quaternion)
        
    }

    loadStarSpeckFormat(data){
        const lines = data.trim().split("\n");
        const regex = /^\D/
        lines.forEach((row)=>{
            row = row.trim()
            if(row.startsWith("#")){return;}
            if (!regex.test(row)){return;}
            const cols = row.split(/s+/)
            this.positions.push(parseFloat(cols[0]),parseFloat(cols[1]),parseFloat(cols[2]))
        })
    }

    loadStarBinaryFormat(data){
        const dataViewer = new DataView(data);
        console.log(data.length);
        const colNums = 17;
        // 4 bytes
        const itemSize = 4;
        const starsNums = Math.floor(data.byteLength / (itemSize*colNums));
        console.log(starsNums);
        this.positions = [];
        for(let i=0;i<starsNums;i++){
            const offset = i*itemSize*colNums
            for(let u = 0;u<3;u++){
                this.positions.push(dataViewer.getFloat32(offset+u*itemSize,true));
            }
        }
    }


    
    async loadStars(dataUrl,format){

        const responsePromise = fetch(dataUrl);
        const textureLoadPromise = new THREE.TextureLoader().loadAsync("/data/halo.png")
        const response = await responsePromise
        if(this.DATA_SOURCE_FORMAT.BINARY === format){
            this.loadStarBinaryFormat(await response.arrayBuffer());
        }
        else if (this.DATA_SOURCE_FORMAT.SPECK===format){
            this.loadStarSpeckFormat(await response.text());
        }
        else {
            return
        }
        this.starDataReady = true;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(this.positions),3));
        const texture = await textureLoadPromise
        texture.needsUpdate = true
        const points = new THREE.Points(geometry,this.shader);
        points.frustumCulled = false;
        this.shader.uniforms.tex.value = texture;
        this.scene.add(points);
    }
}


