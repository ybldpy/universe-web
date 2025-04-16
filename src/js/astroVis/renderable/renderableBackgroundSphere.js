import {RenderableObject, RenderData,UpdateData} from "../rendering/base"
import * as THREE from "three"
import {commonFunctionsInclude} from "../rendering/common";

export class RenderableBackgroundSphere extends RenderableObject{


    static vs = `
    precision highp float;
    
    
    out vec2 vUv;
    out float vsDepth;
    
    void main(){
    
        vUv = uv;
        gl_Position = projectionMatrix *  modelViewMatrix * vec4(position,1.0);
        vsDepth = gl_Position.w;
        gl_Position.z = 0.0;
    }
    `

    static fs = `
    
    precision highp float;
    
    in vec2 vUv;
    in float vsDepth;
    
    
    layout(location = 1) out vec4 gPosition;
    //layout(location = 0) out vec4 fragColor;
    
    
    uniform sampler2D background;
    
    
    ${commonFunctionsInclude}
    
    void main(){
        gl_FragDepth = calculateLogDepth(vsDepth);
        pc_fragColor = vec4(texture(background,vUv).xyz*0.75,1.0);
        //pc_fragColor = vec4(0.0);
        //if(vUv.x < 0.5 && vUv.y<0.5){pc_fragColor = vec4(1.0);}
        gPosition = vec4(1.0);
    }
    
    
    
    `

    constructor({radius, backgroundUrl}) {
        super();
        this.radius = radius;
        this.backgroundTexture = null;
        this.textureNeedsUpdate = false;
        new THREE.TextureLoader().load(backgroundUrl,(texture)=>{
            this.backgroundTexture = texture;
            this.textureNeedsUpdate = true;
        });
        const sphereGeometry = new THREE.SphereGeometry(this.radius,64,64);
        const shaderMaterial = new THREE.ShaderMaterial({
            version:THREE.GLSL3,
            vertexShader:RenderableBackgroundSphere.vs,
            fragmentShader:RenderableBackgroundSphere.fs,
            uniforms:{
                background:{value:new THREE.Texture()}
            },
            transparent:false,
            side:THREE.FrontSide
        });
        this.sphere = new THREE.Mesh(sphereGeometry,shaderMaterial);
        this.sphere.renderOrder = 4;
        this.ui = {
            hidden:false
        }
        this.addedToScene = false;
    }

    addUIComponent(uiComponent) {
        uiComponent.add(this.ui,"hidden");
    }

    update(updateData) {
        if (this.textureNeedsUpdate){
            this.sphere.material.uniforms.background.value = this.backgroundTexture;
            this.backgroundTexture.needsUpdate = true;
            this.textureNeedsUpdate = false;
        }
        this.sphere.visible = !this.ui.hidden;
        this.sphere.position.copy(updateData.transformation.translation);
    }
    render(renderData) {
        if (this.addedToScene){return;}
        renderData.scene.add(this.sphere);
        this.addedToScene = true;
    }


}