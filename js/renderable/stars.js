import * as THREE from "three"
import {RenderableObject, RenderData,UpdateData} from "../rendering/base"


export class RenderableStars extends RenderableObject {



    static vs = `
    highp float;


    out float vsDepth;
    out vec2 vUV;
    //out vec3 vsPosition;

    void main(){
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        vUV = uv;
        vsDepth = gl_Position.w;
        gl_Position.z = 0.0;
        gl_PointSize = 2.0;
    }
    `

    static fs = `
    highp float;

    layout(location = 1) out vec4 gPosition;
    //layout(location = 0) out vec4 fragColor;

    in float vsDepth;
    in vec2 vUV;
    in vec3 vsPosition;
    uniform sampler2D tex;

    void main(){
        gl_FragDepth = log(vsDepth+1.0) / log(1e15+1.0);
        pc_fragColor = vec4(1.0);
        gPosition = vec4(1.0);
    }
    
    `


    constructor(requestUrl) {
        super();
        this.starBase = new THREE.Object3D();
        this.loadStars(requestUrl);
        this.init = true;
        this.points = new THREE.Points();
        // this.points.material = new THREE.PointsMaterial({
        //     size:0.5,
        //     color:0xffffff,
        //     transparent:true
        // })
        this.points.material = new THREE.ShaderMaterial({
            version:THREE.GLSL3,
            fragmentShader:RenderableStars.fs,
            vertexShader:RenderableStars.vs
        })
    }
    async loadStars(url){
        const response = await fetch(url);
        if (response.ok) {
            this.loadStarsFromBinary(await response.arrayBuffer());
        }
    }
    loadStarsFromBinary(buffer){

        const dataView = new DataView(buffer);
        const colNums = 17;
        // 4 bytes
        const itemSize = 4;
        const starsNums = Math.floor(buffer.byteLength / (itemSize*colNums));
        const positions = [];
        const kpc = 1e10;
        for(let i=0;i<starsNums;i++){
            const offset = i*itemSize*colNums
            for(let u = 0;u<3;u++){
                positions.push(dataView.getFloat32(offset+u*itemSize,true)  * kpc);
            }
        }
        this.points.geometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(positions),3));
        this.points.geometry.needsUpdate = true;
        this.starBase.add(this.points);
    }

    update(updateData) {
        super.update(updateData);
    }
    render(renderData) {
        if (this.init){
            renderData.scene.add(this.starBase);
            this.init = false;
        }
        const translation = renderData.transformation.translation;
        this.starBase.position.set(translation.x,translation.y,translation.z);
    }


}