import * as THREE from "three"
import {RenderableObject, RenderData,UpdateData} from "../rendering/base"
import {appContext} from "../applicationContext";
import {commonFunctionsInclude} from "../rendering/common";


const createBillboardDrawIndex = function (counts){
    const pointDrawIndex = []
    for(let i = 0;i<counts;i++){
        const offset = i*4;
        pointDrawIndex.push(offset,offset+1,offset+2,offset,offset+2,offset+3)
    }
    return pointDrawIndex;
}

const normalizeVelocity = function (velocityBuffer){

    let maxSpeedX = -1e20
    let maxSpeedY = maxSpeedX
    let maxSpeedZ = maxSpeedX
    let minSpeedX = 1e20
    let minSpeedY = minSpeedX
    let minSpeedZ = minSpeedX

    // const getNormalizedValue = function (min,max,v){
    //
    //     if (min<0){
    //         const absMin = Math.abs(min)
    //         v+=absMin
    //         return v/(max+absMin)
    //     }
    //     return (v-min)/(max-min)
    //
    // }

    for(let i = 0;i<velocityBuffer.length;i+=3){
        let idx = i
        maxSpeedX = Math.max(maxSpeedX,velocityBuffer[idx])
        minSpeedX = Math.min(minSpeedX,velocityBuffer[idx])
        idx+=1
        maxSpeedY = Math.max(maxSpeedY,velocityBuffer[idx])
        minSpeedY = Math.min(minSpeedY,velocityBuffer[idx])
        idx++
        maxSpeedZ = Math.max(maxSpeedZ,velocityBuffer[idx])
        minSpeedZ = Math.min(minSpeedZ,velocityBuffer[idx])
    }


    for(let i = 0;i<velocityBuffer.length;i+=3){
        velocityBuffer[i] = (velocityBuffer[i]-minSpeedX)/(maxSpeedX-minSpeedX)
        velocityBuffer[i+1] = (velocityBuffer[i+1]-minSpeedY)/(maxSpeedY-minSpeedY)
        velocityBuffer[i+2] = (velocityBuffer[i+2]-minSpeedZ)/(maxSpeedZ-minSpeedZ)
    }


}

class StarDataBuffer{

    constructor({positions = [],bvLumAbsMag = [],velocity = [],speed = []}) {
        this.positions = positions
        this.bvLumAbsMag = bvLumAbsMag
        this.velocity = velocity
        this.speed = speed
    }


    getPositions(){
        return this.positions
    }
    getBvLumAbsMag(){return this.bvLumAbsMag}
    getVelocity(){return this.velocity}
    getSpeed(){return this.speed}


}



class DataLoader{


    static DATA_SOURCE_FORMAT = {
        STREAM_OCTREE:"streamOctree",
        SPECK:"speck"
    }
    constructor() {

    }
    parseStreamOctreeNode(arrayBuffer){

        const positionBuffer = []
        const bvLumAbsMagBuffer = []
        const velocityBuffer = []
        const speedBuffer = []
        const littleEndian = true;
        const dataView = new DataView(arrayBuffer)
        const step = 10*4;
        const size = 4;
        for (let i = 0;i<arrayBuffer.byteLength;i+=step){
            const offset = i
            positionBuffer.push(dataView.getFloat32(offset,littleEndian),dataView.getFloat32(offset+size,littleEndian),dataView.getFloat32(offset+2*size,littleEndian))
            bvLumAbsMagBuffer.push(dataView.getFloat32(offset+3*size,littleEndian),dataView.getFloat32(offset+4*size,littleEndian),dataView.getFloat32(offset+5*size,littleEndian))
            velocityBuffer.push(dataView.getFloat32(offset+6*size,littleEndian),dataView.getFloat32(offset+7*size,littleEndian),dataView.getFloat32(offset+8*size,littleEndian))
            speedBuffer.push(dataView.getFloat32(offset+9*size,littleEndian))
        }

        return new StarDataBuffer({positions:positionBuffer,bvLumAbsMag:bvLumAbsMagBuffer,velocity:velocityBuffer,speed:speedBuffer});
    }

    parseSpeck(data){
        const lines = data.trim().split("\n");
        const regex = /^[+-]?\d/
        const datavarRegex = /datavar(?:k|\s\d+)\s+(\w+)/
        const cols = []
        const positions = []
        const bvLumAbsMag = []
        const velocity = []
        const speed = []
        lines.forEach((line)=>{
            line = line.trim()
            if(line.startsWith("#")){return;}
            if (!regex.test(line)){
                return;
            }
            const row = line.split(" ");
            positions.push(parseFloat(row[0]),parseFloat(row[1]),parseFloat(row[2]))
            bvLumAbsMag.push(parseFloat(row[3]),parseFloat(row[4]),parseFloat(row[5]))
            velocity.push(parseFloat(row[13]),parseFloat(row[14]),parseFloat(row[15]))

            speed.push(parseFloat(row[16]))
            if (isNaN(speed[speed.length-1])){
                speed[speed.length-1] = 0
            }
        })
        console.log(positions)
        return new StarDataBuffer({positions:positions,bvLumAbsMag:bvLumAbsMag,speed:speed,velocity:velocity})
    }


    load(requestUrl,requestDataFormat,onLoad=(starData)=>{},onError=(response)=>{}){
        fetch(requestUrl).then(async (response)=>{
            // let rows = []
            // let cols = []
            if (response.ok){

                if (requestDataFormat === DataLoader.DATA_SOURCE_FORMAT.STREAM_OCTREE){
                    const starData = this.parseStreamOctreeNode(await response.arrayBuffer())
                    onLoad(starData)
                }
                else if (requestDataFormat === DataLoader.DATA_SOURCE_FORMAT.SPECK){
                    const starData = this.parseSpeck(await response.text());
                    onLoad(starData);
                }
            }
            else {
                onError(response);
            }
        })
    }
}


function createBillboardBuffer(starDataBuffer){


    const bufferPositions = starDataBuffer.getPositions()
    const bufferBvLumAbsMag = starDataBuffer.getBvLumAbsMag()
    const bufferVelocity = starDataBuffer.getVelocity();
    const bufferSpeed = starDataBuffer.getSpeed();
    const starCount = Math.floor(bufferPositions.length/3)

    const positionArray = new Float32Array(starCount*3*4);
    const bvLumAbsMagArray = new Float32Array(starCount*3*4);
    const velocityArray = new Float32Array(starCount*3*4);
    const speedArray = new Float32Array(starCount*4);
    const cornerArray = new Float32Array(starCount*4*2)
    const vUVArray = new Float32Array(starCount*4*2)



    for(let i = 0;i<starCount;i++){

        const offset = i*4;
        const vec3BufferIdx = 3*i
        for(let u = 0;u<4;u++){

            for(let j = 0;j<3;j++){
                const idx = offset*3 + 3*u+j;
                positionArray[idx] = bufferPositions[vec3BufferIdx+j]
                bvLumAbsMagArray[idx] = bufferBvLumAbsMag[vec3BufferIdx+j]
                velocityArray[idx] = bufferVelocity[vec3BufferIdx+j]
            }
            speedArray[offset+u] = bufferSpeed[i]
        }
        // vUV.push(0,0)
        const vec2Offset = offset*2;
        vUVArray[vec2Offset] = 0
        vUVArray[vec2Offset+1] = 0
        // vUV.push(0,1)
        vUVArray[vec2Offset+2] = 0
        vUVArray[vec2Offset+3] = 1
        // vUV.push(1,1)
        vUVArray[vec2Offset+4] = 1
        vUVArray[vec2Offset+5] = 1
        // vUV.push(1,0)
        vUVArray[vec2Offset+6] = 1
        vUVArray[vec2Offset+7] = 0
        // corner.push(-1,-1)
        cornerArray[vec2Offset] = -1
        cornerArray[vec2Offset+1] = -1
        // corner.push(-1,1)
        cornerArray[vec2Offset+2] = -1
        cornerArray[vec2Offset+3] = 1
        // corner.push(1,1)
        cornerArray[vec2Offset+4] = 1
        cornerArray[vec2Offset+5] = 1
        // corner.push(1,-1)
        cornerArray[vec2Offset+6] = 1
        cornerArray[vec2Offset+7] = -1
    }

    return {
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.position]:positionArray,
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.bvLumAbsMag]:bvLumAbsMagArray,
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.velocity]:velocityArray,
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.speed]:speedArray,
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.vUV]:vUVArray,
        [RenderableStars.SHADER_IN_ATTRIBUTE_NAME.corner]:cornerArray
    }

}

class OctreeNode{




    constructor(originX,originY,originZ,dimision,emptyNode,requestUrlIndex,shaderMaterial,requestUrlPrefix) {
        this.children = []
        for(let i = 0;i<8;i++){
            this.children.push(null)
        }
        this.originX = originX
        this.originY = originY
        this.originZ = originZ
        this.dimision = dimision
        this.emptyNode = emptyNode
        this.dataLoaded = false
        this.dataLoading = false
        this.loadFail = false;
        this.position = [];
        this.cornerDirection = []
        this.vUV = []
        this.colorLumAbsMag = [];
        this.pointDrawIndex = []
        this.requestUrlIndex = requestUrlIndex
        this.loadedToGPU = false;
        this.meshPoint = new THREE.Mesh()
        this.meshPoint.material = shaderMaterial
        this.meshPoint.frustumCulled = false;
        this.memoryUsage = 0;
        this.downloadUrl = requestUrlPrefix+"/"+requestUrlIndex+".bin"

    }


    setMeshPoint(meshPoint){
        this.meshPoint = meshPoint
    }
    getMeshPoint(){
        return this.meshPoint
    }

    setLoadedToGPU(loadedToGPU){
        this.loadedToGPU = loadedToGPU
    }

    isLoadedToGPU(){
        return this.loadedToGPU;
    }



    createPointDrawIndex(length){
        this.pointDrawIndex = createBillboardDrawIndex(length);
    }


    dispose(){
        this.meshPoint.geometry.dispose()
        this.loadedToGPU = false;
        this.dataLoaded = false
        this.memoryUsage = 0;
    }

    setGeometryBuffer(position,bvLumAbsMag,velocity,speed,vUV,corner){

        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.position,new THREE.BufferAttribute(position,3))
        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.vUV,new THREE.BufferAttribute(vUV,2))
        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.bvLumAbsMag,new THREE.BufferAttribute(bvLumAbsMag,3))
        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.corner,new THREE.BufferAttribute(corner,2))
        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.velocity,new THREE.BufferAttribute(velocity,3))
        this.meshPoint.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.speed,new THREE.BufferAttribute(speed,1))
    }

    downloadData(dataLoader){


        if (this.emptyNode){return;}
        if(this.loadFail){
            return;
        }
        this.dataLoading = true
        dataLoader.load(this.downloadUrl,DataLoader.DATA_SOURCE_FORMAT.STREAM_OCTREE,(starDataBuffer)=>{
            this.loadFail = false;
            const litterEndian = true;
            this.dataLoading = false;
            normalizeVelocity(starDataBuffer.getVelocity());
            const arraybuffers = createBillboardBuffer(starDataBuffer);
            this.setGeometryBuffer(arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.position],arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.bvLumAbsMag],arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.velocity],arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.speed],arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.vUV],arraybuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.corner]);
            // this.createPointDrawIndex(Math.floor(starDataBuffer.getPositions().length/3))
            if (this.pointDrawIndex.length <1){
                this.pointDrawIndex = createBillboardDrawIndex(Math.floor(starDataBuffer.getPositions().length/3));
            }
            this.meshPoint.geometry.setIndex(this.pointDrawIndex);
            this.dataLoaded = true;
            this.dataLoading = false;
        },(e)=>{this.loadFail = true;this.dataLoading = false});

    }

    isLeaf(){
        return this.children[0] == null
    }



}

class Octree{

    // build octree from index
    constructor(jsonMetaData,shaderMaterial,nodeRequestUrlPrefix) {

        const maxDist = jsonMetaData.maxDist;
        const rootOrigin = -maxDist/2
        this.shaderMaterial = shaderMaterial;
        this.nodeRequestUrlPrefix = nodeRequestUrlPrefix
        this.root = new OctreeNode(rootOrigin,rootOrigin,rootOrigin,maxDist,true,"0",shaderMaterial,nodeRequestUrlPrefix)
        this.nonEmptyLeafList = []
        jsonMetaData.index.sort()
        this.build(jsonMetaData.index)
    }

    split(node,nodeIndex,shaderMaterial){
        const halfD = node.dimision/2

        for(let i = 0;i<8;i++){
            let originX = node.originX
            let originY = node.originY
            let originZ = node.originZ
            if (i%2 != 0){
                originX+=halfD
            }
            if (i>=4){
                originY+=halfD
            }
            if (i==2 || i==3 || i==6 || i==7){
                originZ+=halfD
            }
            node.children[i] = new OctreeNode(originX,originY,originZ,halfD,false,nodeIndex+String(i),shaderMaterial,this.nodeRequestUrlPrefix)
        }
    }

    DFSBuild(nodeIndex,index,parent,shaderMaterial){
        if (parent.isLeaf()){
            this.split(parent,nodeIndex.substring(0,index),shaderMaterial)
        }
        if (index==nodeIndex.length-1){
            const childIndex = parseInt(nodeIndex.slice(-1));
            parent.children[childIndex].emptyNode = false
            this.nonEmptyLeafList.push(parent.children[childIndex]);
        }
        else {
            const childIndex = parseInt(nodeIndex.substring(index,index+1));
            this.DFSBuild(nodeIndex,index+1,parent.children[childIndex],shaderMaterial);
        }
    }

    build(indexList){
        // first element must be "0"
        if (indexList.length<1){
            this.root.emptyNode = false
            return
        }
        indexList.forEach((nodeIndex)=>{
            this.DFSBuild(nodeIndex,1,this.root,this.shaderMaterial)
        })
    }

}




export class RenderableStars extends RenderableObject {


    static SHADER_IN_ATTRIBUTE_NAME = {
        position:"position",
        vUV:"uv",
        bvLumAbsMag:"bvLumAbsMag",
        corner:"cornerDirection",
        velocity:"velocity",
        speed:"speed"
    }





    static vs = `
    highp float;


    out float vsDepth;
    out float vSpeed;
    out float radius;
  
    out vec2 vUV;
    
    out vec3 vBvLumAbsMag;
    out vec3 vVelocity;
    out vec3 centerPosition;
    out vec3 vPosition;
    
    in float speed;
 
    in vec2 cornerDirection;
    in vec3 bvLumAbsMag;
    in vec3 velocity;
    
    
    
    uniform float kpc;
    uniform float widthScaleFactor;
    uniform float heightScaleFactor;
    uniform float magExponent;
    uniform vec3 cameraUp;
    uniform vec3 cameraPos;
    
    ${commonFunctionsInclude}
    
    
    
    
    
    float calculateSizeFactor(float absMag){
        return exp((-30.623 - absMag) * 0.462) * pow(10.0, magExponent+10.0) * 2000.0;
    }
    
    float calculateSizeFactorAbsMag(float absMag){
    
        return (-absMag + 35.0) * pow(10.0, magExponent+9.0);
    
    
    }
    
    void main(){
    
        vec3 vWorldPos = vec3(modelMatrix * vec4(position*kpc,1.0));
        
        vec3 normal = normalize(cameraPosition-vWorldPos);
        vec3 right = normalize(cross(normal,cameraUp));
        vec3 up = normalize(cross(normal,right));
        
        float sizeScaleFactor = calculateSizeFactor(bvLumAbsMag.z);
            
        vec3 vPos =  vWorldPos + cornerDirection.x*sizeScaleFactor*right + cornerDirection.y*sizeScaleFactor*up;
        gl_Position = projectionMatrix * viewMatrix * vec4(vPos,1.0);
        vUV = uv;
        vsDepth = gl_Position.w;
        gl_Position.z = 0.0;
        vPosition = vPos;
        radius = sizeScaleFactor/2.0;
        centerPosition = vWorldPos;
        vBvLumAbsMag = bvLumAbsMag;
        vSpeed = speed;
        vVelocity = velocity;
        
    }
    `

    static fs = `
    highp float;

    layout(location = 1) out vec4 gPosition;

    in float vsDepth;
    in float radius;
    in float vSpeed;
    
    
    in vec2 vUV;
    in vec3 vPosition;
    in vec3 centerPosition;
    in vec3 vBvLumAbsMag;
    in vec3 vVelocity;
    
    uniform int renderColorOption;
    uniform sampler2D haloTex;
    uniform sampler2D colorTexture;
    
    
    ${commonFunctionsInclude}
    
    
    vec4 getBVColor(float bv){
        
        return texture(colorTexture,vec2((bv+0.4)/2.4,0.0));
    
    }
    
    
    
    void main(){
        gl_FragDepth = calculateLogDepth(vsDepth);
        vec2 shiftedCoords = (vUV - 0.5) * 2.0;
        
        
        
        
        vec2 scaledCoordsHalo = shiftedCoords / 1.0;
        vec2 unshiftedCoordsHalo = (scaledCoordsHalo + 1.0) / 2.0;
        vec4 color = vec4(0.0);
        switch(renderColorOption){
            case 0:
                color = getBVColor(vBvLumAbsMag.x);
                break;
            case 1:
                color.xyz = vVelocity;
                break;
            default:
                break;
        }
        vec4 haloColor = texture(haloTex,vUV);
        float alpha = pow(haloColor.a,3.0)*1.0;
        float dist = distance(vPosition,centerPosition);
        
        pc_fragColor = vec4(color.xyz,exp((-dist*dist)/(0.5*radius*radius)));
        //pc_fragColor = vec4(color.xyz*exp((-dist*dist)/(0.5*radius*radius)),1.0);
        //pc_fragColor = haloColor;
        //pc_fragColor = vec4(1.0,1.0,1.0,1.0);
        gPosition = vec4(1.0);
    }
    `


    HALO_TEXTURE = null
    HALO_TEXTURE_NAME = "haloTex"

    COLOR_MAP_TEXTURE = null
    COLOR_MAP_TEXTURE_NAME = "colorTexture"




    constructor({dataFormat = "speck",magExponent=1,requestUrl}) {
        super();


        this.prop = {
            magExponent:magExponent,
            visible:true,
            renderColorOption:{
                isOption: true,
                optionMap:{
                    "bv":0,
                    "velocity":1,
                    "speed":2
                },
                selected: 0
            }
        }


        this.streamOctreeDataSource = dataFormat === DataLoader.DATA_SOURCE_FORMAT.STREAM_OCTREE
        this.initGL();
        this.dataLoader = new DataLoader()
        this.loadStars(dataFormat,requestUrl)
        this.loadColorMap("/data/stars/colorbv.cmap")
        this.octree = null
        this.visibleNodes = []
        this.notVisibleNodes = {}
        this.init = true;
    }


    // addUIComponent(uiComponent){
    //     uiComponent.add(this.prop,"magExponent",1,20);
    //     uiComponent.add(this.prop,"visible");
    //     uiComponent.add(this.prop,"renderColorOption",["bv","velocity","speed"]).onChange((value)=>{
    //         this.shaderMaterial.uniforms.renderColorOption.value = this.renderColorOptionMap[value]
    //     })
    // }


    getProps() {
        return this.prop;
    }


    createOctreeFromIndex(requestUrl){
        fetch(`${requestUrl}/index.json`).then(response=>response.json()).then((json)=>{
            this.octree = new Octree(json,this.shaderMaterial,requestUrl)
        })
    }

    loadTexture(){

        if(true){return;}

        if (this.HALO_TEXTURE !== null) {this.setUniformsTexture(this.HALO_TEXTURE,this.HALO_TEXTURE_NAME);return}
        new THREE.ImageLoader().load("/data/halo.png",(image)=>{
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(0,0,image.width,image.height);
            const pixels = imageData.data

            const alpha = new Float32Array(pixels.length/4)
            let offset = 0
            for(let i = 3;i<pixels.length;i+=4){
                alpha[offset] = pixels[i]/255
                offset+=1
            }
            this.HALO_TEXTURE = new THREE.DataTexture(alpha,image.width,image.height,THREE.RedFormat,THREE.FloatType)
            this.HALO_TEXTURE.needsUpdate = true
            this.setUniformsTexture(this.HALO_TEXTURE,this.HALO_TEXTURE_NAME)

        });
    }

    setUniformsTexture(texture,name){
        this.mesh.material.uniforms[name].value = texture
    }

    initGL(){

        this.kpcScale = 1e12
        this.starBase = new THREE.Group();
        this.shaderMaterial = new THREE.ShaderMaterial({
            version:THREE.GLSL3,
            fragmentShader:RenderableStars.fs,
            vertexShader:RenderableStars.vs,
            uniforms:{
                kpc:{value:this.kpcScale},
                [this.HALO_TEXTURE_NAME]:{value:this.TEXTURE},
                [this.COLOR_MAP_TEXTURE_NAME]:{value:this.COLOR_MAP_TEXTURE},
                cameraUp:{value:new THREE.Vector3(0,1,0)},
                magExponent:{value:1.0},
                renderColorOption:{value:this.prop.renderColorOption.selected},
            },
            transparent:true,
            //depthTest: false,
            depthWrite:false,
            blending: THREE.AdditiveBlending,
            side:THREE.DoubleSide
        })
        this.mesh = new THREE.Mesh()
        this.mesh.material = this.shaderMaterial;
        this.mesh.frustumCulled = false
        this.starBase.add(this.mesh)
        this.starBase.renderOrder = 1;
    }





    loadStarsFromSpeck(url){



        this.dataLoader.load(url,DataLoader.DATA_SOURCE_FORMAT.SPECK,(starData)=>{

            normalizeVelocity(starData.getVelocity());
            const indices =createBillboardDrawIndex(Math.floor(starData.getPositions().length/3))
            const arrayBuffers = createBillboardBuffer(starData)
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.vUV,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.vUV],2))
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.bvLumAbsMag,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.bvLumAbsMag],3))
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.corner,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.corner],2))
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.position,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.position],3));
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.speed,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.speed],1))
            this.mesh.geometry.setAttribute(RenderableStars.SHADER_IN_ATTRIBUTE_NAME.velocity,new THREE.BufferAttribute(arrayBuffers[RenderableStars.SHADER_IN_ATTRIBUTE_NAME.velocity],3))
            this.mesh.geometry.setIndex(indices)
            this.mesh.geometry.needsUpdate = true;

        });
    }

    loadStars(dataFormat,requestUrl){

        dataFormat = dataFormat.toLowerCase()
        if (dataFormat === DataLoader.DATA_SOURCE_FORMAT.SPECK.toLowerCase()){
            this.loadStarsFromSpeck(requestUrl)
        }
        else if (dataFormat === DataLoader.DATA_SOURCE_FORMAT.STREAM_OCTREE.toLowerCase()){
            this.createOctreeFromIndex(requestUrl)
        }

    }

     loadColorMap(colorMapUrl){

        fetch(colorMapUrl).then(response=>response.text()).then((text)=>{
            const lines = text.trim().split("\n")
            let number = 0;
            const commentRegex = /^\s*#/

            const colorMap = []
            for(let i= 0;i<lines.length;i++){
                const line = lines[i].trim()
                if(commentRegex.test(line)){continue}
                const cols = line.split(" ")
                if (cols.length<2){
                    number = parseInt(cols[0])
                }
                else {
                    for(let i = 0;i<4;i++){
                        if (i>=cols.length){
                            colorMap.push(1)
                        }
                        else {colorMap.push(parseFloat(cols[i]))}
                    }
                }
            }

            const dataTexture = new THREE.DataTexture(new Float32Array(colorMap),number,1,THREE.RGBAFormat,THREE.FloatType)
            this.COLOR_MAP_TEXTURE = dataTexture
            dataTexture.needsUpdate = true
            this.setUniformsTexture(dataTexture,this.COLOR_MAP_TEXTURE_NAME)
        })
    }
    findVisibleNode(camera,octree,translation){
        const leafNodes = octree.nonEmptyLeafList
        const pcScale = this.kpcScale
        const nodeBoundingBoxCenterWorldSpace = new THREE.Vector3()
        const visibleNodes = []
        const boundingBox = new THREE.Box3()
        const boundBoxSize = new THREE.Vector3()
        const frustum = new THREE.Frustum();
        const projectionMatrix = camera.projectionMatrix.clone();


        // const cameraPosition = new THREE.Vector3();
        // camera.position.copy(cameraPosition)
        // const cameraQuat = new THREE.Quaternion();
        // camera.quaternion.copy(cameraQuat);
        // const matrixWorld = new THREE.Matrix4();
        // matrixWorld.compose(cameraPosition, cameraQuat, new THREE.Vector3());
        // cameraQuat.conjugate();



        const viewMatrix = camera.matrixWorldInverse.clone();
        //const positionScale = Math.pow(10,16-this.ui.pcScale-1);
        const positionScale = 1e4
        viewMatrix[12]/=positionScale
        viewMatrix[13]/=positionScale
        viewMatrix[14]/=positionScale
        const scaledTranslation = new THREE.Vector3();
        translation.copy(scaledTranslation)
        scaledTranslation.x/=positionScale
        scaledTranslation.y/=positionScale
        scaledTranslation.z/=positionScale
        frustum.setFromProjectionMatrix(projectionMatrix.multiply(viewMatrix));
        const planes = frustum.planes.filter((plane, index) => index < 4);
        const infinity = 1e20; // 非常大的常数，模拟无限远

        // frustum.planes[0].constant*=1e3; // Left plane
        // frustum.planes[1].constant*=1e3;  // Right plane
        // frustum.planes[2].constant*=1e3; // Bottom plane
        // frustum.planes[3].constant*=1e3;  // Top plane
        leafNodes.forEach((node)=>{
            const halfD = (node.dimision)/2
            nodeBoundingBoxCenterWorldSpace.x = (node.originY+halfD)*pcScale
            nodeBoundingBoxCenterWorldSpace.y = (node.originX+halfD)*pcScale
            nodeBoundingBoxCenterWorldSpace.z= (node.originZ+halfD)*pcScale
            nodeBoundingBoxCenterWorldSpace.add(scaledTranslation)
            boundBoxSize.x = halfD*2*pcScale
            boundBoxSize.y = halfD*2*pcScale
            boundBoxSize.z = boundBoxSize.y
            boundingBox.setFromCenterAndSize(nodeBoundingBoxCenterWorldSpace,boundBoxSize)
            const points = [
                new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z),
                new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.max.z),
                new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.min.z),
                new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.max.z),
                new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.min.z),
                new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.max.z),
                new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.min.z),
                new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z),
            ];

            // 转换每个点到归一化设备坐标 (NDC)
            const isVisible = points.some((point) => {
                const ndc = point.clone().applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
                return ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1;
            });
            

            if(this.prop.visible&&(isVisible||planes.some((p)=>p.intersectsBox(boundingBox)))){
                visibleNodes.push(node)
            }
            // if (frustum.intersectsBox(boundingBox)){
            //     visibleNodes.push(node)
            // }
        })

        return visibleNodes;


    }
    update(updateData) {



        this.mesh.visible = !this.streamOctreeDataSource && this.prop.visible
        if(this.octree!=null){
            const disposeNodesIndices = []
            const now = Math.floor(Date.now()/1000)
            for(const key in this.notVisibleNodes){
                if (now - this.notVisibleNodes[key]>60){
                    disposeNodesIndices.push(key)
                }
            }
            this.octree.nonEmptyLeafList.forEach((node)=>{
                if(disposeNodesIndices.includes(node.requestUrlIndex)){
                    node.dispose()
                }
            })

            disposeNodesIndices.forEach((idx)=>{delete this.notVisibleNodes[idx]});
        }


        this.shaderMaterial.uniforms.renderColorOption.value = this.prop.renderColorOption.selected;

    }
    render(renderData) {
        
        if (this.init){
            renderData.scene.add(this.starBase);
            this.init = false;
        }
        else if (this.octree!=null){

            const visibleNodes = this.findVisibleNode(renderData.camera,this.octree,renderData.transformation.translation.clone());
            const notVisibleNodes = this.visibleNodes.filter((n)=>{
                for(let i = 0;i<visibleNodes.length;i++){
                    delete this.notVisibleNodes[visibleNodes[i].requestUrlIndex]
                    if (visibleNodes[i].requestUrlIndex === n.requestUrlIndex){
                        return false;
                    }
                }
                return true;
            })
            const current = Math.floor(Date.now()/1000)
            notVisibleNodes.forEach((node)=>{
                node.setLoadedToGPU(false)
                this.starBase.remove(node.meshPoint);
                this.notVisibleNodes[node.requestUrlIndex] = current
            })

            this.visibleNodes = visibleNodes;
            for(let i = 0;i<visibleNodes.length;i++){
                const node = visibleNodes[i]
                if (node.dataLoaded&&!node.isLoadedToGPU()){
                    this.starBase.add(visibleNodes[i].meshPoint);
                    visibleNodes[i].setLoadedToGPU(true)
                }
                else if (!node.dataLoaded&&!node.dataLoading){
                    node.downloadData(this.dataLoader)
                }
            }
        }


        this.shaderMaterial.uniforms.kpc.value = 1e14;
        this.shaderMaterial.uniforms.magExponent.value = this.prop.magExponent
        const translation = renderData.transformation.translation;
        const up = new THREE.Vector3(0,1,0);
        up.applyQuaternion(renderData.camera.quaternion);
        this.starBase.position.set(translation.x,translation.y,translation.z);
    }


}