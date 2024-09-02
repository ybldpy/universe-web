import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Octree } from 'three/examples/jsm/Addons.js';
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

    constructor(dataUrl,scene){
        this.loadStars(dataUrl,true);
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
        const lines = data.split("\n");
        let dataOffset = 0;
        
        while(lines[dataOffset]!="\r"){
            dataOffset++;
        }
        dataOffset+=1;
        for(let i=0;dataOffset+i<lines.length/10&&lines[dataOffset+i]!="\r";i+=2){
            const rows = lines[dataOffset+i].split(" ");
            for(let u=0;u<3;u++){
                this.positions.push(parseFloat(rows[u])*3e19);
            }
        }
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


    
    async loadStars(dataUrl,isBinaryFormat){

        const responsePromise = fetch(dataUrl);
        const textureLoadPromise = new THREE.TextureLoader().loadAsync("/data/halo.png")
        const response = await responsePromise
        if(isBinaryFormat){
            this.loadStarBinaryFormat(await response.arrayBuffer());
        }
        else {
            this.loadStarSpeckFormat(await response.text());
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





// class Octree{

// }
// class OctreeNode{
//     constructor(capacity,center,size,){
//         this.capacity = capacity
//         this.center = center;
//         this.size = size;
//         this.children = []
//     }

// }

