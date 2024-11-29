import * as THREE from "three"
import {RenderableObject,RenderData,UpdateData} from "../rendering/base";
import {GLSL3, ShaderMaterial} from "three";
import {appContext} from "../applicationContext";


export class RenderableOrbit extends RenderableObject{


    static orbitSegments = 64;


    static vs = `
    
    highp float;
   
    out float vsDepth;
    uniform float radius;
    void main(){
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position * radius,1.0);
        vsDepth = gl_Position.w;
        gl_PointSize = 4.0;
        gl_Position.z = 0.0; 
    }
    `



    static fs = `
    highp float;
    in float vsDepth;
    
    layout(location = 1) out vec4 gPosition;
    layout(location = 0) out vec4 fragColor;
    
    
    uniform vec4 orbitColor;
    
    void main(){
    
        gl_FragDepth = log(vsDepth+1.0) / log(1e20+1.0);
        fragColor = orbitColor;
        gPosition = vec4(1.0);
    
    }
    
    
    
    
    `


    constructor(orbitTarget,orbitColor = 0xADD8E6) {
        super();
        this.orbitNode = appContext.scene.findNodeByIdentifier(orbitTarget);
        this.orbitColor = orbitColor;
        this.init = true;
        const points = [];
        for (let i = 0; i <= RenderableOrbit.orbitSegments; i++) {
            const theta = (i / RenderableOrbit.orbitSegments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta), 0,Math.sin(theta)));
        }

        const buffer = new THREE.BufferGeometry().setFromPoints(points);
        // const material =
        // const ringGeometry = new THREE.RingGeometry(this.radius,10*this.radius);
        const material = new THREE.ShaderMaterial({
            glslVersion:THREE.GLSL3,
            fragmentShader:RenderableOrbit.fs,
            vertexShader:RenderableOrbit.vs,
            uniforms:{
                orbitColor:{value:new THREE.Vector4(1.0,1.0,1.0,1.0)},
                radius:{value:0}
            },
            side:THREE.DoubleSide
        })

        this.orbitRing = new THREE.Line(buffer,material);
        this.orbitRing.frustumCulled = false;
    }


    convertColorToRGB(color){
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return new THREE.Vector4(r,g,b,255).divideScalar(255);
    }

    update(updateData) {
        this.orbitRing.material.uniforms.orbitColor.value = (this.convertColorToRGB(this.orbitColor));
        this.orbitRing.material.uniforms.radius.value = this.orbitNode.getWorldPosition()
            .clone().sub(updateData.transformation.translation).length();
    }

    render(renderData) {


        if (this.init){
            this.init = false;
            renderData.scene.add(this.orbitRing);
        }
        const translation = renderData.transformation.translation;
        this.orbitRing.position.set(translation.x,translation.y,translation.z);
    }


}