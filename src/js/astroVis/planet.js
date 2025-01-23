import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clamp } from 'three/src/math/mathutils';
import { Timer } from 'three/addons/misc/Timer.js';
import * as dat from 'dat.gui';
import * as Lerc from 'lerc';
import { ThreeMFLoader, Wireframe } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { ShaderPass } from 'three/examples/jsm/Addons.js';
import { OutputPass } from 'three/examples/jsm/Addons.js';
import { buffer, cameraFar, cameraNear, cameraPosition, float, storage, texture } from 'three/examples/jsm/nodes/Nodes.js';
import { GaiaStars } from './gaiaStars';
import { Image } from "image-js"
import Stats from 'three/examples/jsm/libs/stats.module.js';
var stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );

const renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer:true});
const composer = new EffectComposer(renderer);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1e15 );
camera.position.set(0,0,20000e3);
camera.lookAt(0,0,0)

// controls.enablePan = false;
// camera.position.set(-2,-2,-2);
const ui = {
    wireFrame:false,
    multiplier:15000,
    chunkEdge:false
}


const atmosphereUI = {
    intensity:14,
    scatteringStrength:2,
    falloff:15,
    density:3,
    redWave:800,
    greenWave:700,
    blueWave:570
}

const utils = {
    clamp:function(value,min,max){
        return Math.min(Math.max(value,min),max);
    },
    V3toV4:function(positionVector3,w){
        return new THREE.Vector4(positionVector3.x,positionVector3.y,positionVector3.z,w);
    },
    angleToRadian:function(angle){
        return angle * Math.PI / 180;
    },
    cloneShader:function(shader){
        const newShader = shader.clone();
        const cloneUniforms = function(uniforms){
            const newUniforms = {};
            for(const key in uniforms){
                const value = uniforms[key];
                if (typeof value === 'object' && value !== null && value.constructor === Object) {
                    newUniforms[key] = cloneUniforms(value);
                }
                else {
                    newUniforms[key] = value;
                }
            }
            return newUniforms;
        };

        newShader.uniforms = cloneUniforms(shader.uniforms);
        return newShader;
    }
}




const localVs = `

precision highp float;

#ifndef LAYER
#define LAYER
struct UVTransform{
    vec2 uvOffset;
    float scale;
};

struct Layer{
    sampler2D tile;
    UVTransform uvTransform;
};
#endif

in vec2 in_uv;
out vec2 out_uv;
out float fragDepth;


uniform vec3 p00;
uniform vec3 p10;
uniform vec3 p01;
uniform vec3 p11;
uniform vec3 patchNormalCameraSpace;
uniform float multiplier;
uniform Layer heightLayer;

vec3 bilinearInterpolation(vec2 uv) {
    vec3 p0 = mix(p00, p10, uv.x);
    vec3 p1 = mix(p01, p11, uv.x);
    return mix(p0, p1, uv.y);
}

bool isSkirt(vec2 uv){
    return uv.x < 0.0 || uv.x >1.0 || uv.y<0.0 || uv.y >1.0;
}

void main(){

    vec3 pos = bilinearInterpolation(in_uv);
    if(!isSkirt(in_uv)){
        float height = texture(heightLayer.tile,in_uv * heightLayer.uvTransform.scale + heightLayer.uvTransform.uvOffset).r;
        pos += patchNormalCameraSpace * height * multiplier;
    }
    gl_Position = projectionMatrix * vec4(pos,1.0);
    gl_Position.xyz/=gl_Position.w;
    out_uv = in_uv;

}




`

const globalVs = `
precision highp float;
in vec2 in_uv;
out vec2 out_uv;
out vec4 vsPosition;
out float depth;
out vec4 posCamSpace;


#ifndef LAYER
#define LAYER
struct UVTransform{
    vec2 uvOffset;
    float scale;
};

struct Layer{
    sampler2D tile;
    UVTransform uvTransform;
};
#endif



uniform float radius;
uniform vec2 minLatLon;
uniform vec2 lonLatScalingFactor;
uniform float multiplier;
uniform float minHeight;
uniform Layer heightLayer;

bool isBorder(vec2 uv){
    const float BorderSize = 0.005;
    const vec3 BorderColor = vec3(1.0, 0.0, 0.0);
  
    vec2 uvOffset = uv - vec2(0.5);
    float thres = 0.5 - BorderSize * 0.5;
    return abs(uvOffset.x) > thres || abs(uvOffset.y) > thres;
}

vec3 getPosition(vec2 uv){
        vec2 lonlat = lonLatScalingFactor * in_uv + vec2(minLatLon.y,minLatLon.x);
        float cosLat = cos(lonlat.y);
        vec3 normal = vec3(cosLat * cos(lonlat.x), cosLat * sin(lonlat.x), sin(lonlat.y));
        vec2 hUv = (in_uv*heightLayer.uvTransform.scale + heightLayer.uvTransform.uvOffset);
        vec2 widthOffset = vec2(0.5,0.0)*heightLayer.uvTransform.scale;
        vec2 hOffset = vec2(0.0,0.5)*heightLayer.uvTransform.scale;
        // hUv+=widthOffset;
        // hUv+=hOffset;
        float h = (texture(heightLayer.tile,vec2(hUv.x,hUv.y)).r);
        h*=multiplier;
        if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){
            h = h - min(radius, lonLatScalingFactor.y/2.0*1000000.0);
        }
        // else {
        //     // h+=600.0;
        // }

        return (h+radius) * normal;
}

void main(){
    vec3 pos = getPosition(in_uv);
    //positionWorldSpace = vec3(modelMatrix * vec4(pos,1.0));
    posCamSpace = viewMatrix*vec4(pos,1.0);
    gl_Position = projectionMatrix*posCamSpace;
    //gl_Position.z = ((gl_Position.z - 0.1) / (1e20-0.1));
    vsPosition = gl_Position;
    gl_Position.z = 0.0;
    out_uv = in_uv;
}

`


const fs = `
precision highp float;

layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 fragColor;

in vec2 out_uv;
in vec4 vsPosition;
in vec4 posCamSpace;
#ifndef LAYER
#define LAYER
struct UVTransform{
    vec2 uvOffset;
    float scale;
};

struct Layer{
    sampler2D tile;
    UVTransform uvTransform;
};
#endif

bool isBorder(vec2 uv){
    const float BorderSize = 0.005;
    const vec3 BorderColor = vec3(1.0, 0.0, 0.0);
    vec2 uvOffset = uv - vec2(0.5);
    float thres = 0.5 - BorderSize * 0.5;
     return abs(uvOffset.x) > thres || abs(uvOffset.y) > thres;
}




float LinearizeDepth(float depth) 
{
    float near = 0.1; 
    float far  = 1e10; 
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));    
}


float normalizeFloat(float inpt) {
    if (inpt > 1.0) {
      return inpt / pow(10.0, 10.0);
    }
    else {
      return inpt;
    }
}


uniform Layer colorLayer;
uniform bool chunkEdge;
void main(){
    //gl_FragDepth = LinearizeDepth(-vsPosition.w);
    gl_FragDepth = log(1.0*vsPosition.z+1.0)/ log(1.0 * 1e20 +1.0);
    //gl_FragDepth = (vsPosition.z - 0.1) / (1e20-0.1);
    fragColor = vec4(texture(colorLayer.tile,colorLayer.uvTransform.uvOffset + colorLayer.uvTransform.scale*out_uv).rgb,1.0);
    gPosition = vec4(posCamSpace.xyz,0.0);
    if(isBorder(out_uv)&&chunkEdge){
        fragColor = vec4(1.0,0.0,0.0,1.0);
    }
    //col = vec4(1.0,0.0,0.0,1.0);
}
`





class TileIndex{
    static DIRECTION = {
        NORTH:0,
        SOUTH:1,
        WEST:2,
        EAST:3
    }
    constructor(level,x,y){
        this.level = level;
        this.x = x;
        this.y = y;
    }

    nextLevelIndex(ns,we){
        const level = this.level+1;
        const x2 = this.x*2;
        const y2 = this.y*2;
        if(ns == TileIndex.DIRECTION.NORTH){
            if(we == TileIndex.DIRECTION.WEST){
                return new TileIndex(level,x2,y2);
            }
            else {
                return new TileIndex(level,x2+1,y2);
            }
        }
        else {
            if(we == TileIndex.DIRECTION.WEST){return new TileIndex(level,x2,y2+1)}
            else {return new TileIndex(level,x2+1,y2+1);}
        }
    }

    positionRelativeToParent(){
        const yOffset = this.y%2 == 0?0.5:0;
        const xOffset = this.x%2 == 0?0:0.5;
        return new THREE.Vector2(xOffset,yOffset);
    }
}

class Tile{
    static STATUS = {
        unavailable:0,
        downloading:1,
        available:2
    }
    constructor(texture,status = Tile.STATUS.unavailable){
        this.texture = texture;
        this.status = status;
        this.uploaded = false;

        // this min and max value is used for storing max height and min height of height tile
        this.minPixelValue = 0;
        this.maxpixelValue = 0;
    }
    uploadTextureToGPU(){
        if(this.status == Tile.STATUS.available && !this.uploaded){
            this.texture.needsUpdate = true;
            this.uploaded = true;
        }
    }
    dispose(){
        if(this.status == Tile.available){
            this.texture.dispose()
        }
    }
}




class TileProvider{
    constructor(requestUrlFormat,maxLevel = 19){
        this.tiles = new Map();
        this.maxLevel = maxLevel;
        this.initTileArray(maxLevel);
        this.requestUrlFormat = requestUrlFormat;
        this.currentMaxLevel = -1;
        this.maxLevelFind = false;
        this.textureLoader = new THREE.TextureLoader();
        this.unavailableTile = new Tile(null,Tile.STATUS.unavailable);
        this.retryQueue = [];
        setInterval(()=>{
            const tile = this.retryQueue.shift();
            if(tile == undefined){return;}
            tile.status = Tile.STATUS.unavailable;
        },4.5*1000);
    }

    initTileArray(maxLevel){
        for(let i=0;i<=maxLevel;i++){
            const pow = Math.pow(2,i);
            let level = [];
            for(let x = 0;x<pow;x++){
                let row = [];
                for(let y=0;y<pow;y++){
                    row.push(null);
                }
                level.push(row);
            }
            this.tiles.set(i,level);
        }
    }

    clear(){
        this.tiles.forEach((key,value)=>{
            for(let x=0;x<value.length;x++){
                for(let y=0;y<value.length;y++){
                    if(value[x][y]!=null){
                        value[x][y].dispose()
                    }
                }
            }
        });
    }
    getTileRequestUrl(tileIndex){
        return this.requestUrlFormat.replace("{z}",tileIndex.level).replace("{x}",tileIndex.x).replace("{y}",tileIndex.y);
    }
    
    isTileAvailable(tileIndex){
        if(!this.isWithinRange(tileIndex)){return false;}
        const tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        return tile!=null && tile.status == Tile.STATUS.available;
    }
    isWithinRange(tileIndex){
        if(tileIndex.level>this.maxLevel){return false;}
        const max = Math.pow(2,tileIndex.level);
        return tileIndex.x<max && tileIndex.y<max;
    }


    getTile(tileIndex){
        if(!this.isWithinRange(tileIndex)){
            return this.unavailableTile;
        }
        const tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        const isnullOrUndef = tile==null;
        if(!isnullOrUndef&&tile.status==Tile.STATUS.downloading){return this.unavailableTile;}
        else if(!isnullOrUndef&&tile.status == Tile.STATUS.available){return tile;}
        else {
            this.downloadTile(this.getTileRequestUrl(tileIndex),tileIndex);
            return this.unavailableTile;
        }
    }
    getCurrentMaxLevel(){
        return this.currentMaxLevel;
    }

    doesMaxLevelFind(){
        return this.maxLevelFind;
    }

    enqueueRetryDownload(tile){
        this.retryQueue.push(tile);
    }
    downloadTile(requestUrl,tileIndex){
        
        let tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        if(tile==null){
            tile = new Tile(null);
            this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y] = tile;
        }
        tile.status = Tile.STATUS.downloading;

        this.textureLoader.load(requestUrl,onload = (texture)=>{
            // texture.wrapS = THREE.ClampToEdgeWrapping;
            // texture.wrapT = THREE.ClampToEdgeWrapping;
            this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
            tile.texture = texture;
            tile.status = Tile.STATUS.available;
        },
        onerror = (e)=>{
            this.enqueueRetryDownload(tile);
        })
        // this.textureLoader.load(requestUrl,onload = (texture)=>{
        //     this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
        //     tile.texture = texture;
        //     tile.status = Tile.STATUS.available;
        //     tile.uploadTextureToGPU();
        // });
        
    }
}



class HeightTileProvider extends TileProvider{
    constructor(requestUrlFormat,maxLevel = 19){
        super(requestUrlFormat,maxLevel);
    }


    downloadTile(requestUrl,tileIndex){
        let tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        if(tile==null){
            tile = new Tile(null);
            this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y] = tile;
        }
        tile.status = Tile.STATUS.downloading;
        Image.load(requestUrl).then((image)=>{
            if(image.channels!=1){
                return;
            }
            //let dataView = new DataView(image.data.buffer);
            let type = THREE.FloatType;
            // let heightBuffer = image.data;
            let heightBuffer = null;
            let typedBuffer = null;
            if (image.bitDepth == 8){
                typedBuffer = new Uint8Array(image.data.buffer);
            }
            else if(image.bitDepth==16){
                typedBuffer = new Int16Array(image.data.buffer);

            }
            else if(image.bitDepth==32){
                typedBuffer = new Float32Array(image.data.buffer);
            }
            heightBuffer = new Float32Array(typedBuffer.length);
            let minValue = 0;

            typedBuffer.forEach((v,i)=>{heightBuffer[i] = v;minValue = min(minValue,v)});
            const dataTexture = new THREE.DataTexture(heightBuffer,image.width,image.height,THREE.RedFormat,type);
            tile.texture = dataTexture;
            tile.minPixelValue = minValue;
            tile.maxPixelValue = image.maxValue;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.generateMipmaps = true;
            
            tile.status = Tile.STATUS.available;
            this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
        },(e)=>{this.enqueueRetryDownload(tile)})
    }

}


//tile is compressed by Lerc
class LercCompressedTileProvide extends TileProvider{



    constructor(requestUrlFormat,maxLevel = 19){
        super(requestUrlFormat,maxLevel);
        Lerc.load({locateFile:(a,b)=>{console.log(a,b);return "/node_modules/lerc/lerc-wasm.wasm"}});
    }
    getTile(tileIndex){
        if(!this.isWithinRange(tileIndex)){
            return this.unavailableTile;
        }
        let tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        if(tile == null){
            tile = new Tile(null);
            this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y] = tile;
        }
        if(tile.status == Tile.STATUS.downloading){return this.unavailableTile;}
        if(tile.status==Tile.STATUS.available){return tile;}
        this.downloadTile(this.getTileRequestUrl(tileIndex),tileIndex);
        return this.unavailableTile;
    }


    createTile(arrayBuffer,tile,level){
        const pixelBlock = Lerc.decode(arrayBuffer);
        const { height, width, pixels, mask } = pixelBlock;

        const tileDataBuffer = [];
        for(let h = 0;h<height;h++){
            for(let w = 0;w<width;w++){
                if(!mask || mask[h * width + w]){
                    tileDataBuffer.push(pixels[0][h * width + w]);
                }
                // tileDataBuffer[h*width + w] = 1.0;
            }
        }
            
        const dataTexture = new THREE.DataTexture(new Float32Array(tileDataBuffer),width,height,THREE.RedFormat,THREE.FloatType);
        // dataTexture.wrapS = THREE.ClampToEdgeWrapping;
        // dataTexture.wrapT = THREE.ClampToEdgeWrapping;
        tile.texture = dataTexture;
        tile.status = Tile.STATUS.available;
        //this.currentMaxLevel = Math.max(this.currentMaxLevel,);
    }

    downloadTile(requestUrl,tileIndex){
        if(!Lerc.isLoaded()){return;}
        const tile = this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y];
        tile.status = Tile.STATUS.downloading;
        // this.createTile(null,tileIndex);
        fetch(requestUrl).
        then(response=>response.arrayBuffer(),reason=>{this.enqueueRetryDownload(this.tiles.get(tileIndex.level)[tileIndex.x][tileIndex.y])}).
        then(arrayBuffer=>this.createTile(arrayBuffer,tile,tileIndex.level));
    }
}


class SingleImageTileProvider extends TileProvider{


    constructor(imageUrl){
        super(imageUrl,0);
        this.tile = new Tile(null,Tile.STATUS.downloading);
        this.downloadTile(imageUrl,null);
    }

    isTileAvailable(tileIndex){
        return tileIndex.level==0&&tileIndex.x==0&&tileIndex.y==0;
    }
    getCurrentMaxLevel(){
        return 0;
    }
    downloadTile(requestUrl,tileIndex){
        this.tile.status = Tile.STATUS.downloading;
        this.textureLoader.loadAsync(requestUrl).then((texture)=>{
            // texture.wrapS = THREE.ClampToEdgeWrapping;
            // texture.wrapT = THREE.ClampToEdgeWrapping;
            this.tile.texture = texture;
            this.tile.status = Tile.STATUS.available;
        },(error)=>{this.tile.status = Tile.STATUS.unavailable;});
    }
    getTile(tileIndex){
        // if(tileIndex.level!=0){
        //     return new Tile(null,Tile.STATUS.unavailable);
        // }
        if(this.tile.status==Tile.STATUS.unavailable){
            this.downloadTile(this.requestUrlFormat,null);
        }
        return this.tile;
    }

}


class Layer{


    static TYPE = {
        COLOR:"COLOR",
        HEIGHT:"HEIGHT"
    }

    constructor(tileProvider,type){
        this.tileProvider = tileProvider
        this.type = type;
    }
    getTile(tileIndex){
        const tile = this.tileProvider.getTile(tileIndex);
        return tile;
    }
    getCurrentMaxLevel(){
        return this.tileProvider.getCurrentMaxLevel();
    }
    isTileAvailable(tileIndex){
        return this.tileProvider.isTileAvailable(tileIndex);
    }
    dispose(tileIndex){
        this.getTile(tileIndex).dispose();
    }
    //the clost tile is self
    findClostAvailableTile(tileIndex){
        const uvTransform = [new THREE.Vector2(0,0),1];
        while(tileIndex.level>=1&&!this.isTileAvailable(tileIndex)){
            uvTransform[0].multiplyScalar(0.5);
            uvTransform[0].add(tileIndex.positionRelativeToParent());
            uvTransform[1]*=0.5;
            tileIndex.level--;
            tileIndex.x = Math.floor((tileIndex.x)/2);
            tileIndex.y = Math.floor((tileIndex.y)/2);
        }
        const tile = this.getTile(tileIndex);
        return {tile,uvTransform};
    }
    exploreDeeperLevel(){
        this.tileProvider.getTile(new TileIndex(this.getCurrentMaxLevel()+1,0,0));
    }
}



class Grid{
    constructor(xSegements,ySegements,gl){
        this.xSegements = xSegements;
        this.ySegements = ySegements;
        this.init();    
    }

    numElements(xSegements,ySegements){
        return 3*2*xSegements*ySegements;
    }

    createElements(xSegements,ySegements){
        let elements = new Array(this.numElements(xSegements+2,ySegements+2));
        let index = 0;
        for(let y=0;y<ySegements+2;y++){
            for(let x = 0;x<xSegements+2;x++){
                const v00 = (y + 0) * (xSegements + 2 + 1) + x + 0;
                const v10 = (y + 0) * (xSegements + 2 + 1) + x + 1;
                const v01 = (y + 1) * (xSegements + 2 + 1) + x + 0;
                const v11 = (y + 1) * (xSegements + 2 + 1) + x + 1;
                elements[index++] = v00;
                elements[index++] = v10;
                elements[index++] = v11;
                elements[index++] = v00;
                elements[index++] = v11;
                elements[index++] = v01;
            }
        }
        return elements;
    }

    numVertices(xSegements,ySegements){
        return (xSegements+1)*(ySegements+1);
    }

    createTextureCoordinates(xSegements,ySegements){
        let textureCoordinates = new Array(this.numVertices(xSegements+2,ySegements+2));
        let index = 0;
        const offset = 1.0/(2*(xSegements));
        for(let y=-1;y<ySegements+2;y++){
            for(let x = -1;x<xSegements+2;x++){
                textureCoordinates[index++] = new THREE.Vector2(clamp(x/(xSegements),0-offset,1+offset),clamp(y/(ySegements),0-offset,1+offset));
            }
        }
        return textureCoordinates;
    }

    init(){
        this.elements = this.createElements(this.xSegements,this.ySegements);
        const texturesCoordinates = this.createTextureCoordinates(this.xSegements,this.ySegements);
        this.textures = new Float32Array(texturesCoordinates.length*2);
        let idx = 0;
        for(let i=0;i<texturesCoordinates.length;i++){
            this.textures[idx++]=texturesCoordinates[i].x;
            this.textures[idx++]=texturesCoordinates[i].y;
        }
        // this.vao = gl.createVertexArray();
        // gl.bindVertexArray(vao);
        // this.vbo = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        // gl.bufferData(gl.ARRAY_BUFFER, this.textures, gl.STATIC_DRAW);
        // const coordinates = 0; // 假设位置属性的位置是 0
        // gl.vertexAttribPointer(coordinates, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(coordinates);
        // this.ebo = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.elements, gl.STATIC_DRAW);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // gl.bindVertexArray(null);

    }


    draw(gl){
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.elements.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }



}

class TilePile{

    constructor(lastLevelTile,lastLevelTileUVTransform,currentLevelTile,currentTileUVTransform){
        this.tileLastLevel = lastLevelTile;
        this.tileLastLevelUVTransform = lastLevelTileUVTransform;
        this.tileCurrentLevel = currentLevelTile;
        this.tileCurrentLevelUVTransform = currentTileUVTransform;
    }
}

class Chunk {
    static STATUS = {
        wantSplit:0,
        wantMerge:1,
        doNothing:2
    }
    static angleToRadianFactor = Math.PI/180;
    constructor(minLat,maxLat,minLon,maxLon,tileIndex = new TileIndex(0,0,0),status = Chunk.STATUS.doNothing){
        this.minLat = minLat;
        this.maxLat = maxLat;
        this.minLon = minLon;
        this.maxLon = maxLon;
        this.children = [null,null,null,null]; 
        this.tileIndex = tileIndex;
        this.surface = null;
        this.status = status;
    }
    getMinLatInAngle(){
        return this.minLat;
    }
    getMaxLatInAngle(){
        return this.maxLat;
    }
    getMinLonInAngle(){
        return this.minLon;
    }
    getMaxLonInAngle(){
        return this.maxLon;
    }
    getMinInAngle(){
        return this.minLat;
    }
    getMinLatInRadian(){
        return Chunk.angleToRadianFactor * this.minLat;
    }
    getMaxLatInRadian(){
        return Chunk.angleToRadianFactor * this.maxLat;
    }
    getMinLonInRadian(){
        return Chunk.angleToRadianFactor * this.minLon;
    }
    getMaxLonInRadian(){
        return Chunk.angleToRadianFactor * this.maxLon;
    }
    getTileIndexInUse(){
        return this.tileIndexInUse;
    }
    getTileIndexInUseUVTransform(){
        return this.tileIndexInUseUVTransform;
    }
    setTileIndexInUse(tileIndex){
        this.tileIndexInUse = tileIndex;
    }
    // setTileIndexUVTransform(tileAvailable,parent){
    //     if(tileAvailable){this.tileIndexInUseUVTransform[0].set(0,0);this.tileIndexInUseUVTransform[1] = 1;return;}
    //     const zero = 1e-5;
    //     const isNorth = Math.abs(this.minLat-parent.minLat)<=zero;
    //     const isWest = Math.abs(this.minLon-parent.minLon)<=zero;
    //     const parentTileIndexInUseUVTransform = parent.getTileIndexInUseUVTransform();
    //     const half = parentTileIndexInUseUVTransform[1]/2;
    //     const offset = new THREE.Vector2().copy(parentTileIndexInUseUVTransform[0])
    //     if(isNorth){
    //         offset.y+=half;
    //     }
    //     if(!isWest){
    //         offset.x += half;
    //     }
    //     this.tileIndexInUseUVTransform[0] = offset;
    //     this.tileIndexInUseUVTransform[1] = half;
    // }
    isLeaf(){
        return this.children[0] == null;
    }

    normalizeAngleAround(angle,center){
        const PI2 = Math.PI *2;
        angle -= center + Math.PI;
        angle = angle % PI2;
        if(angle<0){
            angle += PI2;
        }
        angle += center - Math.PI;
        return angle;
    }
    // lat and lon in radians
    calculateCloestPoint(position){
        const center = new THREE.Vector2((this.getMinLonInRadian()+this.getMaxLonInRadian())/2,(this.getMinLatInRadian()+this.getMaxLatInRadian())/2);
        const pointLat = this.normalizeAngleAround(position.y,center.y);
        const pointLon = this.normalizeAngleAround(position.x,center.x);
        const centerToPointLon = this.normalizeAngleAround(center.x - pointLon,0);
        const lonDistanceToClosestPatch = Math.abs(centerToPointLon) - (this.getMaxLonInRadian()-this.getMinLonInRadian())/2;
        const clampedLat = lonDistanceToClosestPatch > Math.PI/2?clamp(this.normalizeAngleAround(Math.PI - pointLat,center.y),this.getMinLatInRadian(),this.getMaxLatInRadian()):clamp(pointLat,this.getMinLatInRadian(),this.getMaxLatInRadian());
        const clampedLon = clamp(pointLon,this.getMinLonInRadian(),this.getMaxLonInRadian());
        return new THREE.Vector2(clampedLon,clampedLat);
    }
}

class RenderableAtmosphere{




    static vs = `
    precision highp float;
    out vec2 vUV;
    void main(){
        gl_Position = vec4(position,1.0);
        vUV = uv;
    }
    `


    static fs3 = `
    #define PI 3.1415926535897932
    #define POINTS_FROM_CAMERA 10 // number sample points along camera ray
    #define OPTICAL_DEPTH_POINTS 10 // number sample points along light ray

    out vec4 outputColor;

    // varying
    in vec2 vUV; // screen coordinates


    // uniforms
    uniform sampler2D textureSampler; // the original screen texture
    uniform sampler2D depthSampler; // the depth map of the camera

    uniform vec3 sunPosition; // position of the sun in world space
    uniform vec3 cameraPos; // position of the camera in world space

    uniform sampler2D gPositionTexture;
    uniform sampler2D screenColorTexture;

    uniform mat4 inverseProjection; // camera's inverse projection matrix
    uniform mat4 inverseView; // camera's inverse view matrix

    uniform float cameraNear; // camera minZ
    uniform float cameraFar; // camera maxZ

    uniform vec3 planetPosition; // planet position in world space
    uniform float planetRadius; // planet radius for height calculations
    uniform float atmosphereRadius; // atmosphere radius (calculate from planet center)

    uniform float falloffFactor; // controls exponential opacity falloff
    uniform float sunIntensity; // controls atmosphere overall brightness
    uniform float scatteringStrength; // controls color dispersion
    uniform float densityModifier; // density of the atmosphere

    uniform float redWaveLength; // the wave length for the red part of the scattering
    uniform float greenWaveLength; // same with green
    uniform float blueWaveLength; // same with blue

    // remap a value comprised between low1 and high1 to a value between low2 and high2
    float remap(float value, float low1, float high1, float low2, float high2) {
        return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
    }

    // compute the world position of a pixel from its uv coordinates and depth
    vec3 worldFromUV(vec2 UV, float depth) {
        vec4 ndc = vec4(UV * 2.0 - 1.0, 0.0, 1.0); // normalized device coordinates for only the UV
        vec4 posVS = inverseProjection * ndc; // unproject the pixel to view space
        posVS.xyz *= remap(depth, 0.0, 1.0, cameraNear, cameraFar); // now account for the depth (we can't do it before because of the perspective projection being non uniform)
        vec4 posWS = inverseView * vec4(posVS.xyz, 1.0); // unproject the point to world space
        return posWS.xyz;
    }


    // returns whether or not a ray hits a sphere, if yes out intersection points
    // a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection
    bool rayIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
        vec3 relativeOrigin = rayOrigin - spherePosition; // rayOrigin in sphere space

        float a = 1.0;
        float b = 2.0 * dot(relativeOrigin, rayDir);
        float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
        
        float d = b*b - 4.0*a*c;

        if(d < 0.0) return false; // no intersection

        float r0 = (-b - sqrt(d)) / (2.0*a);
        float r1 = (-b + sqrt(d)) / (2.0*a);

        t0 = min(r0, r1);
        t1 = max(r0, r1);

        return (t1 >= 0.0);
    }

    // based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
    float densityAtPoint(vec3 densitySamplePoint) {
        float heightAboveSurface = length(densitySamplePoint - planetPosition) - planetRadius; // actual height above surface
        float height01 = heightAboveSurface / (atmosphereRadius - planetRadius); // normalized height between 0 and 1
        
        float localDensity = densityModifier * exp(-height01 * falloffFactor); // density with exponential falloff
        localDensity *= (1.0 - height01); // make it 0 at maximum height

        return localDensity;
    }

    float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

        float stepSize = rayLength / (float(OPTICAL_DEPTH_POINTS) - 1.0); // ray length between sample points
        
        vec3 densitySamplePoint = rayOrigin; // that's where we start
        float accumulatedOpticalDepth = 0.0;

        for(int i = 0 ; i < OPTICAL_DEPTH_POINTS ; i++) {
            float localDensity = densityAtPoint(densitySamplePoint); // we get the density at the sample point

            accumulatedOpticalDepth += localDensity * stepSize; // linear approximation : density is constant between sample points

            densitySamplePoint += rayDir * stepSize; // we move the sample point
        }

        return accumulatedOpticalDepth;
    }

    vec3 calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength) {

        vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray

        vec3 sunDir = normalize(sunPosition - planetPosition); // direction to the light source
        
        vec3 wavelength = vec3(redWaveLength, greenWaveLength, blueWaveLength); // the wavelength that will be scattered (rgb so we get everything)
        vec3 scatteringCoeffs = pow(1063.0 / wavelength.xyz, vec3(4.0)) * scatteringStrength; // the scattering is inversely proportional to the fourth power of the wave length;
        // about the 1063, it is just a constant that makes the scattering look good
        scatteringCoeffs /= planetRadius; // Scale invariance by Yincognyto https://github.com/BarthPaleologue/volumetric-atmospheric-scattering/issues/6#issuecomment-1432409930

        float stepSize = rayLength / (float(POINTS_FROM_CAMERA) - 1.0); // the ray length between sample points

        vec3 inScatteredLight = vec3(0.0); // amount of light scattered for each channel

        for (int i = 0 ; i < POINTS_FROM_CAMERA ; i++) {

            float sunRayLengthInAtm = atmosphereRadius - length(samplePoint - planetPosition); // distance traveled by light through atmosphere from light source
            float t0, t1;
            if(rayIntersectSphere(samplePoint, sunDir, planetPosition, atmosphereRadius, t0, t1)) {
                sunRayLengthInAtm = t1;
            }

            float sunRayOpticalDepth = opticalDepth(samplePoint, sunDir, sunRayLengthInAtm); // scattered from the sun to the point
            
            float viewRayLengthInAtm = stepSize * float(i); // distance traveled by light through atmosphere from sample point to cameraPosition
            float viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm); // scattered from the point to the camera
            
            vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * scatteringCoeffs); // exponential scattering with coefficients
            
            float localDensity = densityAtPoint(samplePoint); // density at sample point

            inScatteredLight += localDensity * transmittance * scatteringCoeffs * stepSize; // add the resulting amount of light scattered toward the camera
            
            samplePoint += rayDir * stepSize; // move sample point along view ray
        }

        // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
        // https://glossary.ametsoc.org/wiki/Rayleigh_phase_function
        float costheta = dot(rayDir, sunDir);
        float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + costheta * costheta);
        
        inScatteredLight *= phaseRayleigh; // apply rayleigh pahse
        inScatteredLight *= sunIntensity; // multiply by the intensity of the sun

        return inScatteredLight;
    }

    vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
        float impactPoint, escapePoint;
        if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
            
            return originalColor; // if not intersecting with atmosphere, return original color
        }

        impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
        escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

        float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
        
        vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

        vec3 light = calculateLight(firstPointInAtmosphere, rayDir, distanceThroughAtmosphere); // calculate scattering
        
        return originalColor * (1.0 - light) + light; // blending scattered color with original color
    }


    void main() {
        vec3 screenColor = texture2D(screenColorTexture, vUV).rgb;
        //float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
        
        // deepest physical point from the camera in the direction of the pixel (occlusion)
        // if there is no occlusion, the deepest point is on the far plane
        vec4 gPos = texture2D(gPositionTexture,vUV);
        vec3 worldPos = vec3(0.0);
        if(gPos.w>0.0){worldPos = worldFromUV(vUV,1.0);}
        
        else {worldPos = vec3(inverseView * vec4(gPos.xyz,1.0));}
        vec3 deepestPoint = worldPos - cameraPos;
        
        float maximumDistance = length(deepestPoint); // the maxium ray length due to occlusion

        vec3 rayDir = deepestPoint / maximumDistance; // normalized direction of the ray

        // this will account for the non perfect sphere shape of the planet
        // as t0 is exactly the distance to the planet, while maximumDistance suffers from the 
        // imperfect descretized and periodic geometry of the sphere
        // DO NOT USE IF your planet has landmasses
        float t0, t1;
        if(rayIntersectSphere(cameraPos, rayDir, planetPosition, planetRadius, t0, t1)) {
            if(maximumDistance > t0 - 1.0) maximumDistance = t0; // the -1.0 is to avoid some imprecision artifacts
        }
        vec3 finalColor = scatter(screenColor, cameraPos, rayDir, maximumDistance); // the color to be displayed on the screen
        float d = 1.0;
        outputColor = vec4(finalColor,1.0); // displaying the final color
        //outputColor = vec4(1.0,0.0,0.0,1.0);
        //outputColor = vec4(gPos.xyz/d,1.0);
        
    }
    
    
    
    
    
    `


    constructor(parent,radius,atmColor){
        this.parent = parent;
        this.radius = radius;
        this.atmosphere = null;
        this.atmColor = atmColor;
        this.shader = new THREE.ShaderMaterial({
            vertexShader:RenderableAtmosphere.vs,
            fragmentShader:RenderableAtmosphere.fs3,
            glslVersion:THREE.GLSL3,
            // transparent:true,
            uniforms:{
                gPositionTexture:{value:null},
                screenColorTexture:{value:null},
                sunPosition:{value:new THREE.Vector3()},
                cameraPos:{value:new THREE.Vector3()},
                inverseProjection:{value:new THREE.Matrix4()},
                inverseView:{value:new THREE.Matrix4()},
                cameraNear:{value:0.1},
                cameraFar:{value:1e15},
                planetPosition:{value:new THREE.Vector3()},
                planetRadius:{value:this.parent.radius},
                atmosphereRadius:{value:this.radius},
                falloffFactor:{value:5.0},
                sunIntensity:{value:20.0},
                scatteringStrength:{value:5},
                densityModifier:{value:5},
                redWaveLength:{value:530},
                greenWaveLength:{value:600},
                blueWaveLength:{value:640}
            },
        })
        
    }
    getModelTransform(){
        return this.parent.getModelTransform();
    }
    getPosition(){
        return this.parent.getPosition();
    }


    render(camera,postScene,postProcessShaderQueue){
        const uniforms = this.shader.uniforms;
        uniforms.sunPosition.value.copy(camera.position);
        uniforms.cameraPos.value.copy(camera.position);
        uniforms.inverseProjection.value.copy(camera.projectionMatrix.clone().invert());
        uniforms.inverseView.value.copy(camera.matrixWorldInverse.clone().invert());
        uniforms.cameraNear.value = 0.1
        uniforms.cameraFar.value = 1e15;
        uniforms.sunIntensity.value = atmosphereUI.intensity;
        uniforms.scatteringStrength.value = atmosphereUI.scatteringStrength;
        uniforms.falloffFactor.value = atmosphereUI.falloff;
        uniforms.densityModifier.value = atmosphereUI.density;
        uniforms.redWaveLength.value = atmosphereUI.redWave;
        uniforms.blueWaveLength.value = atmosphereUI.blueWave,
        uniforms.greenWaveLength.value = atmosphereUI.greenWave;            
        postProcessShaderQueue.push(this.shader);
    }
}



class Planet {




    constructor(radius,layers){
        this.radius = radius;
        this.root = new Chunk(-90,90,-180,180,new TileIndex(0,0,0));
        // this.leftRoot = new Chunk(-90,90,-180,0,new TileIndex(0,0,0));
        // this.rightRoot = new Chunk(-90,90,0,180,new TileIndex(0,1,0));
        this.grid = new Grid(64,64,renderer.getContext()); 
        this.shader = new THREE.ShaderMaterial({
            vertexShader:globalVs,
            fragmentShader:fs,
            glslVersion:THREE.GLSL3,
            side:THREE.FrontSide,
            uniforms:{
                chunkEdge:{value:false},
                radius:{value:1.0},
                minLatLon:{value:null},
                lonLatScalingFactor:{value:null},
                multiplier:{value:ui.multiplier},
                colorLayer:{
                    value:{
                        tile:new THREE.Texture(),
                        uvTransform:{
                            uvOffset:new THREE.Vector2(0,0),
                            scale:1.0
                        }
                    }
                },
                heightLayer:{
                    value:{
                        tile:new THREE.Texture(),
                        uvTransform:{
                            uvOffset:new THREE.Vector2(0,0),
                            scale:1.0
                        }
                    }
                }
            }
        });
        this.maxLevel = 13;
        this.minLevel = 2;
        //this.scene = scene;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Matrix4();
        this.scale = new THREE.Vector3();
        this.modelTransformCached = new THREE.Matrix4().makeTranslation(this.position);
        this.modelTransformCached.multiply(this.rotation);
        this.level0Threshold = this.radius + 1.5* this.radius;
        this.translation = new THREE.Matrix4();
        //this.colorTileProvider = new TileProvider("https://tiledbasemaps.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",this.maxLevel)
        //this.setTileProvider("https://tiledbasemaps.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",this.maxLevel,scene)
        this.setLayers(layers)
        //this.initShader(renderer.getContext());
    }

    initShader(gl){
        if(true){return;}
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // 检查顶点着色器是否编译成功
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(vertexShader));
        }

        // 创建片元着色器对象
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // 检查片元着色器是否编译成功
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(fragmentShader));
        }

        // 创建着色器程序对象
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // 检查着色器程序是否链接成功
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        }

        this.shaderProgram = shaderProgram;
    }
    activeShaderProgram(gl){
        gl.useProgram(this.shaderProgram);
    }
    deactiveShaderProgram(gl){
        gl.useProgram(null)
    }


    getGlobalShader(){
        return new THREE.ShaderMaterial({
            vertexShader:globalVs,
            fragmentShader:fs,
            glslVersion:THREE.GLSL3,
            side:THREE.FrontSide,
            uniforms:{
                chunkEdge:{value:false},
                radius:{value:1.0},
                minLatLon:{value:null},
                lonLatScalingFactor:{value:null},
                multiplier:{value:ui.multiplier},
                minHeight:{value:0},
                colorLayer:{
                    value:{
                        tile:new THREE.Texture(),
                        uvTransform:{
                            uvOffset:new THREE.Vector2(0,0),
                            scale:1.0
                        }
                    }
                },
                heightLayer:{
                    value:{
                        tile:new THREE.Texture(),
                        uvTransform:{
                            uvOffset:new THREE.Vector2(0,0),
                            scale:1.0
                        }
                    }
                }
            }
        });
    }
    getLocalShader(){
        return new THREE.ShaderMaterial(
            {
                vertexShader:localVs,
                fragmentShader:fs,
                glslVersion:THREE.GLSL3,

                uniforms:{
                    p00:{value:new THREE.Vector3()},
                    p10:{value:new THREE.Vector3()},
                    p01:{value:new THREE.Vector3()},
                    p11:{value:new THREE.Vector3()},
                    patchNormalCameraSpace:{value:new THREE.Vector3()},
                    heightLayer:{
                        value:{
                            tile:new THREE.Texture(),
                            uvTransform:{
                                uvOffset:new THREE.Vector2(0,0),
                                scale:1.0
                            }
                        }
                    },
                    multiplier:{value:ui.multiplier},
                    colorLayer:{
                        value:{
                            tile:new THREE.Texture(),
                            uvTransform:{
                                uvOffset:new THREE.Vector2(0,0),
                                scale:1.0
                            }
                        }
                    },
                    chunkEdge:{value:false},
                }
            }
        )
    }

    setLayers(layers){
        this.layers = [];
        for(let i = 0;i<layers.length;i++){
            this.layers.push(layers[i]);
        }
        // const colorLayer = new Layer(new TileProvider("https://tiledbasemaps.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",this.maxLevel),Layer.TYPE.COLOR);
        // //const colorLayer = new Layer(new SingleImageTileProvider("/data/earth_bluemarble.jpg",this.maxLevel),Layer.TYPE.COLOR);
        // //const colorLayer = new Layer(new SingleImageTileProvider("/data/1_earth_16k.jpg",this.maxLevel),Layer.TYPE.COLOR);
        // //const colorLayer = new Layer(new TileProvider("https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg",this.maxLevel),Layer.TYPE.COLOR);
        // this.layers.push(colorLayer);
        // //const heightLayer = new Layer(new LercCompressedTileProvide("https://tiledbasemaps.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/{z}/{y}/{x}",this.maxLevel),Layer.TYPE.HEIGHT);
        // const heightLayer = new Layer(new SingleImageTileProvider("/data/earth_bluemarble_height.jpg"),Layer.TYPE.HEIGHT);
        // //const heightLayer = new Layer(new LercCompressedTileProvide("http://localhost:8000/terrain/{z}/{y}/{x}.bin",2),Layer.TYPE.HEIGHT);
        // this.layers.push(heightLayer);
    } 

    getPosition(){
        return this.position;
    }
    getRotation(){
        return this.rotation;
    }
    getScale(){
        return this.scale;
    }
    getModelTransform(){
        return this.modelTransformCached;
    }


    setTileProvider(requestFormat,maxLevel,scene){
        if(this.colorTileProvider==undefined || this.colorTileProvider == null){ 
            this.colorTileProvider = new TileProvider(requestFormat,maxLevel);
            return;
        }
        this.mergeChunk(this.root,scene)
        this.root = new Chunk(this.root.getMinInAngle(),this.root.getMaxLatInAngle(),this.root.getMinLonInAngle(),this.root.getMaxLonInAngle())
        this.colorTileProvider.clear();
        this.colorTileProvider = new TileProvider(requestFormat,maxLevel)     
    }

    latLonToXYZ(lat,lon,radius){
        const cosLat = Math.cos(lat);
        const normal = new THREE.Vector3(cosLat*Math.cos(lon),cosLat*Math.sin(lon),Math.sin(lat));
        return normal.multiplyScalar(radius);
    }
    update(){

    }
    isVisible(NDCpos){
        return NDCpos.x<=1&&NDCpos.x>=-1&&NDCpos.y<=1&&NDCpos.y>-1&&NDCpos.z<=1&&NDCpos.z>=-1;
    }
    XYZToLonLat(posVec3ModelSpace){
        const normal = posVec3ModelSpace.normalize();
        // const latitude = Math.asin(normal.z);
        // const longtitude = Math.asin(normal.y/Math.cos(latitude));
        return new THREE.Vector2(Math.atan2(normal.y,normal.x),Math.asin(normal.z/normal.length()));
    }
    intersectsWithFrustram(chunk,camera){
        const pos00 = utils.V3toV4(this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMinLonInRadian(),this.radius),1.0);
        const pos10 = utils.V3toV4(this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMaxLonInRadian(),this.radius),1.0);
        const pos01 = utils.V3toV4(this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMinLonInRadian(),this.radius),1.0);
        const pos11 = utils.V3toV4(this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMaxLonInRadian(),this.radius),1.0);
        
        const mvp = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(this.getModelTransform());
        const pos00NDC = pos00.applyMatrix4(mvp);
        pos00NDC.divideScalar(pos00NDC.w);
        const pos10NDC = pos10.applyMatrix4(mvp)
        pos10NDC.divideScalar(pos10NDC.w);
        const pos01NDC = pos01.applyMatrix4(mvp)
        pos01NDC.divideScalar(pos01NDC.w)
        const pos11NDC = pos11.applyMatrix4(mvp)
        pos11NDC.divideScalar(pos11NDC.w);
        const maxV = pos00NDC.clone();
        const minV = pos00NDC.clone();
        maxV.max(pos00NDC).max(pos10NDC).max(pos01NDC).max(pos11NDC);
        minV.min(pos00NDC).min(pos10NDC).min(pos01NDC).min(pos11NDC);
        const interactsWithInterval = (intervalMin,intervalMax,minVal,maxVal)=>{
            return ((minVal>=intervalMin&&minVal<=intervalMax)||(maxVal>=intervalMin&&maxVal<=intervalMax)||(minVal<=intervalMin&&maxVal>=intervalMax));
        }
        //const intersects = interactsWithInterval(-1,1,minV.x,maxV.x)||interactsWithInterval(-1,1,minV.y,maxV.y)||interactsWithInterval(0,1e15,minV.z,maxV.z);
        const intersects = -1 <= maxV.x && 1>=minV.x && -1<=maxV.y && 1>=minV.y && 0<=maxV.z && 1e35>=minV.z; 
        // console.log(intersects);
        return intersects;
    }


    findClostCornerToCamera(chunk,camera){
        const v00 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMinLonInRadian(),this.radius);
        const v01 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMaxLonInRadian(),this.radius);
        const v10 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMinLonInRadian(),this.radius);
        const v11 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMaxLonInRadian(),this.radius);
        const camPosModelSpace = camera.position.clone().applyMatrix4(this.getModelTransform().clone().invert());
        let length = v00.clone().sub(camPosModelSpace).length();
        let corner = v00;
        let temp = length;
        if((temp = v01.clone().sub(camPosModelSpace).length())<length){
            length = temp;
            corner = v01;
        }
        if((temp = v10.clone().sub(camPosModelSpace).length())<length){
            length = temp;
            corner = v10;
        }
        if((temp = v11.clone().sub(camPosModelSpace).length())<length){
            length = temp;
            corner = v11;
        }

        return corner;
        
    }

    cullChunksByProjectionArea(chunk,camera){
        const cloestCorner = this.findClostCornerToCamera(chunk,camera);
        const cameraPosModelSpace = camera.position.clone().applyMatrix4(this.getModelTransform().clone().invert());
        const cornerToCamera = cameraPosModelSpace.clone().sub(cloestCorner);
        const cos = cornerToCamera.clone().normalize().dot(cloestCorner.normalize());
        const cullable = cos>0;
        // console.log(cos);
        return false;
    }
    cullInvisibleChunks(root,camera){
        
        const queue = [];
        queue.push(root);
        while(queue.length>0){
            const chunk = queue.shift();
            if(!this.intersectsWithFrustram(chunk,camera)||this.cullChunksByProjectionArea(chunk,camera)){
                const setStates = function(c){
                    c.status == Chunk.STATUS.wantMerge;
                    if(!c.isLeaf()){
                        for(let i=0;i<c.children.length;i++){
                            setStates(c.children[i]);
                        }
                    }
                };
                setStates(chunk);
            }
            else if(!chunk.isLeaf()){
                queue.push(chunk.children[0]);
                queue.push(chunk.children[1]);
                queue.push(chunk.children[2]);
                queue.push(chunk.children[3]);
            }
        }
    }

    mergeChunk(chunk,scene){
        if(!chunk.isLeaf()){
            for(let i=0;i<chunk.children.length;i++){
                this.mergeChunk(chunk.children[i],scene);
            }
            for(let i=0;i<chunk.children.length;i++){
                this.disposeChunk(chunk.children[i],scene);
                chunk.children[i] = null;
            }
        }
    }

    splitChunk(chunk){
        const children = chunk.children;
        const halfLat = (chunk.getMaxLatInAngle()-chunk.getMinLatInAngle())/2 + chunk.getMinLatInAngle();
        const halfLon = (chunk.getMaxLonInAngle()-chunk.getMinLonInAngle())/2 + chunk.getMinLonInAngle();
        children[0] = new Chunk(halfLat,chunk.getMaxLatInAngle(),chunk.getMinLonInAngle(),halfLon,chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST));
        children[1] = new Chunk(halfLat,chunk.getMaxLatInAngle(),halfLon,chunk.getMaxLonInAngle(),chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.EAST));
        children[2] = new Chunk(chunk.getMinLatInAngle(),halfLat,chunk.getMinLonInAngle(),halfLon,chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.WEST));
        children[3] = new Chunk(chunk.getMinLatInAngle(),halfLat,halfLon,chunk.getMaxLonInAngle(),chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.EAST));
    }

    bindTileToChunk(chunk){
        const tile = this.colorTileProvider.getTile(chunk.tileIndex);
        chunk.setTile(tile);
    }


    updateChunk(chunk,camera){
        let canBeCulled = !this.intersectsWithFrustram(chunk,camera) || this.cullChunksByProjectionArea(chunk,camera);
        canBeCulled = false;
        if(canBeCulled){
            chunk.status = Chunk.STATUS.wantMerge;
            return;
        }
        const dl = this.calDesiredLevel(chunk,camera);
        const tileAvailable = this.layers[0].getTile(chunk.tileIndex).status == Tile.STATUS.available || this.layers[1].getTile(chunk.tileIndex).status == Tile.STATUS.available;
        if(chunk.tileIndex.level < dl && chunk.isLeaf()){
            if(!tileAvailable){chunk.status = Chunk.STATUS.doNothing;}
            else {
                const tileIndex = chunk.tileIndex;
                let canSplit = false;

                for(let i=0;i<this.layers.length;i++){
                    const childTile00 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST));
                    const childTile10 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.EAST));
                    const childTile01 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.WEST));
                    const childTile11 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.EAST));
                    const tileAvailableState = Tile.STATUS.available;
                    canSplit = canSplit || childTile00.status==tileAvailableState || childTile10.status == tileAvailableState || childTile01.status == tileAvailableState || childTile11.status == tileAvailableState;
                }
                chunk.status = canSplit?Chunk.STATUS.wantSplit:Chunk.STATUS.doNothing;
            }
        }
        else if(chunk.tileIndex.level > dl && chunk.isLeaf()){
            chunk.status = Chunk.STATUS.wantMerge;
        }
        else {

            chunk.status = Chunk.STATUS.doNothing;
        }

    }
    updateChunkTree(chunk,camera,scene){
        this.updateChunk(chunk,camera);
        if(chunk.status == Chunk.STATUS.wantSplit){   
            this.splitChunk(chunk);
        }
        if(!chunk.isLeaf()){
            let allChildrenWantMerge = true;
            for(let i=0;i<4;i++){
                this.updateChunkTree(chunk.children[i],camera,scene);
                allChildrenWantMerge = allChildrenWantMerge && chunk.children[i].status==Chunk.STATUS.wantMerge;
            }
            if(allChildrenWantMerge){
                this.mergeChunk(chunk,scene);
            }
        }

        // if(chunk.isLeaf()){
        //     if(canBeCulled){chunk.status = Chunk.STATUS.wantMerge;return;}
        //     // const leafTileAvailable = chunk.tilePile.tileCurrentLevel!=null && chunk.tilePile.tileCurrentLevel.status==Tile.STATUS.available;
        //     const tileIndex = chunk.tileIndex;
        //     if(tileIndex.level>dl){
        //         chunk.status = Chunk.STATUS.wantMerge;
        //         return;
        //     }
        //     let leafTileAvailable = false;
        //     for(let i=0;i<this.layers.length;i++){
        //         // download tile if tile is not available
        //         leafTileAvailable = leafTileAvailable || this.layers[i].getTile(chunk.tileIndex).status == Tile.STATUS.available;
        //     }
        //     if(tileIndex.level<dl&&leafTileAvailable){
        //         const tileAvailableState = Tile.STATUS.available;
        //         let canSplit = false;
        //         for(let i=0;i<this.layers.length;i++){
        //             const childTile00 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST));
        //             const childTile10 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.EAST));
        //             const childTile01 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.WEST));
        //             const childTile11 = this.layers[i].getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.EAST));
        //             const tileAvailableState = Tile.STATUS.available;
        //             canSplit = canSplit || childTile00.status==tileAvailableState || childTile10.status == tileAvailableState || childTile01.status == tileAvailableState || childTile11.status == tileAvailableState;
        //             // canSplit = canSplit || childTile00;
        //         }
                
        //         if(canSplit){
        //             this.splitChunk(chunk);
        //         }
        //         chunk.status = Chunk.STATUS.doNothing;
        //     }
            
        // }
        // else {
        //     if(canBeCulled){
        //         //this.mergeChunk(chunk,scene);
        //         chunk.status = Chunk.STATUS.wantMerge;
        //         return;
        //     }
            
        //     let allChildrenWantMerge = true;
        //     for(let i=0;i<chunk.children.length;i++){
        //         this.updateChunkTree(chunk.children[i],camera,scene);
        //         allChildrenWantMerge = allChildrenWantMerge&&(chunk.children[i].status==Chunk.STATUS.wantMerge);
        //     }
        //     if(allChildrenWantMerge){
        //         this.mergeChunk(chunk,scene);
        //     }
        //     else {chunk.status = chunk.tileIndex.level > dl?Chunk.STATUS.wantMerge:Chunk.STATUS.doNothing;}
        // }
    }

    calDesiredLevel(chunk,camera){
        const dl = clamp(this.calculateDesireLevelByDisance(chunk,camera),this.minLevel,this.maxLevel);
        const maxTileAvaibleLevel = Math.max(this.layers[0].getCurrentMaxLevel(),this.layers[1].getCurrentMaxLevel());
        
        if(dl>maxTileAvaibleLevel){
            const tileIndexNextLevel = chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST);
            for(let i=0;i<this.layers.length;i++){
                this.layers[i].getTile(tileIndexNextLevel);
            }
        }

        return clamp(Math.min(dl,maxTileAvaibleLevel),this.minLevel,this.maxLevel);

        // const inversedTranslation = this.getModelTransform().clone().invert();
        // const camPosModelSpace = camera.position.clone().applyMatrix4(inversedTranslation);
        // const distanceToSuface = camPosModelSpace.length()-this.radius;
        
        // if(distanceToSuface<=0){return this.maxLevel;}
        // const levelByDistance = Math.ceil(Math.log2(this.radius / distanceToSuface));
        // //console.log((1-distanceToSuface/this.level0Threshold)*this.maxLevel);
        // let maxLevelAvailable = -1;
        // for(let i=0;i<this.layers.length;i++){
        //     if(this.maxLevel>this.layers[i].getCurrentMaxLevel()&&this.layers[i].getCurrentMaxLevel()<levelByDistance){
        //         this.layers[i].exploreDeeperLevel();
        //     }
        //     else {
        //         maxLevelAvailable = Math.max(this.layers[i].getCurrentMaxLevel(),levelByDistance);
        //     }
        // }
        // const dl = clamp(Math.min(levelByDistance,maxLevelAvailable),this.minLevel,this.maxLevel);
        // //const needNextLevel = levelByDistance > maxLevelAvailable && maxLevelAvailable+1 <= this.maxLevel;
        // return dl;
    }
    calculateDesireLevelByDisance(chunk,camera){
        const cameraPositionModelSpace = camera.position.clone().applyMatrix4(this.getModelTransform().clone().invert());
        const cloestPointOnPatch = chunk.calculateCloestPoint(this.XYZToLonLat(cameraPositionModelSpace.clone()));
        const pointPositionXYZ = this.latLonToXYZ(cloestPointOnPatch.y,cloestPointOnPatch.x,this.radius);
        const cameraToChunk = cameraPositionModelSpace.clone().sub(pointPositionXYZ);
        const distance = cameraToChunk.length();
        // const corner = this.findClostCornerToCamera(chunk,camera);
        // const distance = cameraPositionModelSpace.sub(corner).length();
        // console.log(Math.ceil(Math.log2(3*this.radius / distance)));
        //console.log(Math.ceil(Math.log2(1.5*this.radius / distance)))
        return Math.ceil(Math.log2(2*this.radius / distance));
    }
    disposeChunk(chunk,scene){
        if(chunk.surface!=null){
            scene.remove(chunk.surface);
            chunk.surface.geometry.dispose();
            chunk.surface = null;
        }
    }
    getRenderedChunks(chunk,list,scene){
        if(chunk.isLeaf()){
            list.push(chunk);
            return;
        }
        else {
            if(chunk.surface!=null){
                //scene.remove(chunk.surface);
                chunk.surface.visible = false;
            }
        }
        for(let i=0;i<chunk.children.length;i++){
            this.getRenderedChunks(chunk.children[i],list,scene);
        }   
    }


    setLayerUniforms(layer,chunk,uniforms,uniformName){
        const tileIndexCopied = new TileIndex(chunk.tileIndex.level,chunk.tileIndex.x,chunk.tileIndex.y);
        //console.log(tileIndexCopied);
        const {tile,uvTransform} = layer.findClostAvailableTile(tileIndexCopied);
        uniforms[uniformName].value.tile = tile.texture;
        tile.uploadTextureToGPU();
        uniforms[uniformName].value.uvTransform.uvOffset = uvTransform[0];
        uniforms[uniformName].value.uvTransform.scale = uvTransform[1];
        
        // if(tile.texture!=null){
        //     tile.texture.wrapS = THREE.ClampToEdgeWrapping;
        //     tile.texture.wrapT = THREE.ClampToEdgeWrapping;
        // }
        if(layer.type == Layer.TYPE.HEIGHT){
            uniforms.minHeight.value = tile.minPixelValue;
        }
        
    }

    setUniforms(chunk,camera,i){
        const uniforms = chunk.surface.material.uniforms;
        uniforms.multiplier.value = ui.multiplier;
        uniforms.chunkEdge.value = ui.chunkEdge;
        for(let i=0;i<this.layers.length;i++){
            const uniformName = this.layers[i].type == Layer.TYPE.COLOR?"colorLayer":"heightLayer"
            this.setLayerUniforms(this.layers[i],chunk,uniforms,uniformName);
        }
        if(chunk.tileIndex.level > 7&&false){
            const p00 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMinLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            const p10 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMaxLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            const p01 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMinLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            const p11 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMaxLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            const normal = p11.clone().sub(p01).cross(p10.clone().sub(p01)).normalize();
            uniforms.p00.value.copy(p00);
            uniforms.p10.value.copy(p10);
            uniforms.p01.value.copy(p01);
            uniforms.p11.value.copy(p11);
            uniforms.patchNormalCameraSpace.value.copy(normal);
        }
        else {
            uniforms.radius.value = this.radius;
            uniforms.minLatLon.value = uniforms.minLatLon.value==null?new THREE.Vector2(chunk.getMinLatInRadian(),chunk.getMinLonInRadian()):uniforms.minLatLon.value.set(chunk.getMinLatInRadian(),chunk.getMinLonInRadian());
            uniforms.lonLatScalingFactor.value = uniforms.lonLatScalingFactor.value==null?new THREE.Vector2(chunk.getMaxLonInRadian()-chunk.getMinLonInRadian(),chunk.getMaxLatInRadian()-chunk.getMinLatInRadian()):uniforms.lonLatScalingFactor.value.set(chunk.getMaxLonInRadian()-chunk.getMinLonInRadian(),chunk.getMaxLatInRadian()-chunk.getMinLatInRadian());
        }
        // uniforms.colorTilePile.value.tileLastLevel.texture = chunk.tilePile.tileLastLevel.texture;
        // uniforms.colorTilePile.value.tileLastLevel.uvTransform.uvOffset = chunk.tilePile.tileLastLevelUVTransform[0];
        // uniforms.colorTilePile.value.tileLastLevel.uvTransform.uvScale = chunk.tilePile.tileLastLevelUVTransform[1];
        // uniforms.colorTilePile.value.tileCurrentLevel.texture = chunk.tilePile.tileCurrentLevel.texture;
        // uniforms.colorTilePile.value.tileCurrentLevel.uvTransform.uvOffset = chunk.tilePile.tileCurrentLevelUVTransform[0];
        // uniforms.colorTilePile.value.tileCurrentLevel.uvTransform.uvScale = chunk.tilePile.tileCurrentLevelUVTransform[1];
        // uniforms.currentLevelWeight.value = chunk.tilePile.tileCurrentLevel.status==Tile.STATUS.available?1:0;
        
        
    }

    createSurface(chunk){
        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.setAttribute("in_uv",new THREE.BufferAttribute(this.grid.textures,2));
        bufferGeometry.setIndex(this.grid.elements);
        const mesh = new THREE.Mesh(bufferGeometry,chunk.tileIndex.level>7&&false?this.getLocalShader():this.getGlobalShader());
        mesh.frustumCulled = false;
        
        return mesh;
    }
    renderChunk(chunk,camera,scene,i){
        if(chunk.surface == null){
            chunk.surface = this.createSurface(chunk);
            scene.add(chunk.surface);
        }
        chunk.surface.visible = true;
        //chunk.surface.visible = chunk.tileIndex.x%2==0;
        chunk.surface.material.wireframe = ui.wireFrame;
        //console.log(ui.wireFrame);
        this.setUniforms(chunk,camera,i);
        
        // const gl = renderer.getContext();
        // this.activeShaderProgram(gl);

        // gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram,"projectionMatrix"),false,camera.projectionMatrix);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram,"modelViewMatrix"),)

    }
    renderChunks(camera,scene){
        //const dl = this.calDesiredLevel(camera);
        // this.updateChunkTree(this.leftRoot,camera,scene);
        // this.updateChunkTree(this.rightRoot,camera,scene);
        this.updateChunkTree(this.root,camera,scene);
        const renderedChunkList = [];
        this.getRenderedChunks(this.root,renderedChunkList,scene);
        // let maxL = 0;
        // renderedChunkList.forEach((chunk)=>{
        //     maxL = Math.max(maxL,chunk.tileIndex.level);
        // })
        // console.log(maxL,renderedChunkList.length);
        // this.getRenderedChunks(this.rightRoot,renderedChunkList,scene);

        for(let i=0;i<renderedChunkList.length;i++){
            this.renderChunk(renderedChunkList[i],camera,scene,i);
        }
    }
    render(camera,scene){

        this.renderChunks(camera,scene);
        
    }
}

// class ScrollListener{
//     constructor(targetDomElement){
//         this.domElement = targetDomElement;
//         this.domElement.addEventListener("wheel",(e)=>{

//         })
        
//     }

// }
class InteractionHandler{


    static BUTTON = {
        LEFT:0,
        MIDDLE:1,
        RIGHT:2
    }

    initState(){
        this.leftInteractionHappen = false;
        this.rightInteractionHappen = false;

        this.rotationVelocity = 0;
        this.globalRotateStart = new THREE.Vector2();
        this.globalRotate = new THREE.Vector2();

        this.localRotateStart = new THREE.Vector2();
        this.localRotation = new THREE.Vector2();
        this.ctrl = "Control";
        this.ctrlDown = false;

        this.translateVelocity = 0;

        this.rollStartX = 0;
    }


    initMouseInteraction(renderDomElement){
        renderDomElement.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
        })
        renderDomElement.addEventListener("mousedown",(e)=>{
            if(e.button == InteractionHandler.BUTTON.RIGHT){
                this.handleRightClick(e);
            }
            else {
                this.handleLeftClick(e);
            }
        });
        renderDomElement.addEventListener("mousemove",(e)=>{
            this.handleLeftMove(e);
            this.handleRightMove(e);
            
        });
        renderDomElement.addEventListener("mouseup",(e)=>{
            if(e.button == InteractionHandler.BUTTON.RIGHT){
                this.handleRightUp(e);
            }
            else if(e.button == InteractionHandler.BUTTON.LEFT){
                this.handleLeftUp(e);
            }
        })
    }

    initKeyboardInteraction(renderDomElement){

        window.addEventListener("keydown",(e)=>{
            if(e.key === this.ctrl){
                this.ctrlDown = true;
            }
        });

        window.addEventListener("keyup",(e)=>{
            if(e.key === this.ctrl){
                this.ctrlDown = false;
            }
        })

    }
    constructor(renderDomElement){
        this.renderDomElement = renderDomElement;
        this.initState();
        this.initMouseInteraction(this.renderDomElement);
        this.initKeyboardInteraction(this.renderDomElement);
    }


    getLocalRotate(){
        return this.localRotation.clone();
    }
    getGlobalRotate(){
        return this.globalRotate.clone();
    }
    handleLeftClick(event){
        this.leftInteractionHappen = true;
        this.globalRotateStart.set(event.clientX,event.clientY);
        this.localRotateStart.set(event.clientX,event.clientY);
    }
    
    handleLeftMove(event){
        if(!this.leftInteractionHappen){return;}
        let rotate = this.globalRotate;
        let rotateStart = this.globalRotateStart;
        if(this.ctrlDown){rotate = this.localRotation;rotateStart = this.localRotateStart;}
        rotate.set(event.clientX,event.clientY);
        rotate.sub(rotateStart).multiplyScalar(0.075);
    }
    handleLeftUp(event){
        this.leftInteractionHappen = false;
    }
    handleRightClick(event){
        this.rightInteractionHappen = true;
        this.rightStartY = event.clientY;
    }
    handleRightMove(event){
        if(!this.rightInteractionHappen){return;}
        this.translateVelocity = (this.rightStartY - event.clientY) / window.innerHeight/2;
    }
    handleRightUp(event){
        this.rightInteractionHappen = false;
    }
    updateTranslateVelocity(deltaTime){
        if(this.rightInteractionHappen || Math.abs(this.translateVelocity)<=1e-5){return;}
        this.translateVelocity-=this.translateVelocity*deltaTime;
    }
    updateGlobalRotate(deltaTime){
        if(this.leftInteractionHappen || this.globalRotate.length()<=1e-5){return;}
        const angleScale = 1/2;
        const decreaseX = this.globalRotate.x*angleScale*deltaTime;
        const decreaseY = this.globalRotate.y*angleScale*deltaTime;
        this.globalRotate.sub(new THREE.Vector2(decreaseX,decreaseY));
    }
    updateLocalRotateState(deltaTime){
        if(!this.ctrlDown){this.localRotation.set(0,0);}
    }
    updateState(deltaTime){
        this.updateTranslateVelocity(deltaTime);
        this.updateGlobalRotate(deltaTime);
        this.updateLocalRotateState(deltaTime);
    }
    getTranslateVelocity(){
        return this.translateVelocity;
    }
}

class OrbitNavigator{
    
    constructor(interactionHandler){
        this.anchor = null;
        this.interactionHandler = interactionHandler;
    }
    setAnchor(anchor){
        this.anchor = anchor;
    }
    pushToSurface(camera,deltaTime){
        const inversedModelTransform = this.anchor.getModelTransform().clone().invert();
        const centerToCameraVector = camera.position.clone().applyMatrix4(inversedModelTransform);
        const length = centerToCameraVector.length();
        const dict = centerToCameraVector.clone().normalize();
        const surfaceToCamLength = length - this.anchor.radius;
        const velocity = this.interactionHandler.getTranslateVelocity();
        
        const cameraNewPosModelSpace = new THREE.Vector3(centerToCameraVector.x - dict.x * surfaceToCamLength * velocity * deltaTime,
            centerToCameraVector.y - dict.y * surfaceToCamLength * velocity * deltaTime,
            centerToCameraVector.z - dict.z * surfaceToCamLength * velocity * deltaTime);
        
        if(cameraNewPosModelSpace.length()<=100){return;}
        camera.position.copy(cameraNewPosModelSpace.applyMatrix4(this.anchor.getModelTransform()));
    }
    decomposeCameraRotation(camera,focus){
        const camRotation = camera.quaternion.clone();
        // const cameraViewWorldSpace = new THREE.Vector3();
        // camera.getWorldDirection(cameraViewWorldSpace);
        // const cameraToCenterDict = focus.getPosition().clone().sub(camera.position).normalize();
        // let localRotation1 = new THREE.Quaternion().setFromUnitVectors(cameraToCenterDict,cameraViewWorldSpace.normalize());
        // //localRotation.copy(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))));
        // const globalRotation = camRotation.clone().multiply(localRotation1);
        
        const globalRotation = this.calculateGlobalRotation(camera,focus);
        const localRotation = globalRotation.clone().invert().multiply(camRotation);
        return {localRotation,globalRotation};
    }
    calculateGlobalRotation(camera,focus){
        const cameraToCenterDict = focus.getPosition().clone().sub(camera.position).normalize();
        const cameraUp = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
        const cameraViewDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraViewDirection);
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,cameraViewDirection.add(cameraUp).normalize());
    }
    calcLookAtQuaternion(eye,target,up){
        return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye,target,up));
    }

    rotateLocally(camera,localRotation,deltaTime){
        const localRotate = this.interactionHandler.getLocalRotate();
        const pitch = clamp(-localRotate.y,-89,89)*Math.PI/180 * deltaTime;
        const yaw = clamp(-localRotate.x,-179,179)*Math.PI/180*deltaTime;
        const euler = new THREE.Euler(pitch,yaw,0,"XYZ");
        localRotation = localRotation.multiply(new THREE.Quaternion().setFromEuler(euler));
        // const lookAtMat = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation));
        // return new THREE.Quaternion().setFromRotationMatrix(lookAtMat).invert();
        //return localRotation
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))
    }
    rotateGlobally(camera,anchor,globalRotation){
        const cameraToCenterDict = anchor.getPosition().clone().sub(camera.position).normalize();
        //const lookAtMat = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
        // return new THREE.Quaternion().setFromRotationMatrix(lookAtMat).invert();
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
    }
    rotateAroundAnchor(camera,deltaTime,globalRotation){
        const globalRotate = this.interactionHandler.getGlobalRotate();
        const centerToCameraVecWorldSpace = camera.position.clone().sub(this.anchor.getPosition());
        const lengthToSurface = centerToCameraVecWorldSpace.length() - this.anchor.radius;
        const scale = Math.min(lengthToSurface / this.anchor.radius,1.0);
        const pitch = clamp(-globalRotate.y*scale,-89,89)*Math.PI/180 * deltaTime; 
        const yaw = clamp(-globalRotate.x*scale,-179,179)*Math.PI/180 * deltaTime;
        const euler = new THREE.Euler(pitch,yaw,0,"XYZ");
        const targetQuat = new THREE.Quaternion().setFromEuler(euler);
        const rotationDiffWorldSpace = globalRotation.clone().multiply(targetQuat).multiply(globalRotation.clone().invert());
        globalRotation.multiply(targetQuat);
        const cameraPosWorldSpace = centerToCameraVecWorldSpace.clone().applyQuaternion(rotationDiffWorldSpace).sub(centerToCameraVecWorldSpace);
        camera.position.add(cameraPosWorldSpace);
    }

    rotate(camera,deltaTime){
        let {localRotation,globalRotation} = this.decomposeCameraRotation(camera,this.anchor);
        localRotation = this.rotateLocally(camera,localRotation,deltaTime);
        this.rotateAroundAnchor(camera,deltaTime,globalRotation);
        globalRotation = this.rotateGlobally(camera,this.anchor,globalRotation);
        camera.quaternion.copy(globalRotation.multiply(localRotation));
    }
    updateCamera(camera,deltaTime){
        deltaTime = Math.min(deltaTime,0.01);
        this.interactionHandler.updateState(deltaTime);
        this.rotate(camera,deltaTime);
        this.pushToSurface(camera,deltaTime);
    }
}


class PostProcessing{

    constructor(renderer,renderTarget){
        this.renderer = renderer;
        this.renderTarget = renderTarget;
        this.rtA = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight,{
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            format:THREE.RGBAFormat,
            stencilBuffer:false,
            depthBuffer:true,
            depthTexture:new THREE.DepthTexture(),
        });
        this.rtB = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight,{
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            format:THREE.RGBAFormat,
            stencilBuffer:false,
            depthBuffer:true,
            depthTexture:new THREE.DepthTexture(),
        });
        this.postProcessTasks = [];
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2,
        window.innerHeight / 2, window.innerHeight / -2, 0.1,1e15);
        const vs = `

        out vec2 vUv;
        void main(){
            gl_Position = projectionMatrix * modelViewMatrix *  vec4(position,1.0);
            vUv = uv;
        }
        `

        const fs = `
        in vec2 vUv;
        out vec4 color;
        uniform sampler2D screenColor;
        void main(){
            color = vec4(texture(screenColor,vUv).rgb,1.0);
        }
        `
        const shader = new THREE.ShaderMaterial({
            vertexShader:vs,
            fragmentShader:fs,
            glslVersion:THREE.GLSL3,
            uniforms:{
                screenColor:{value:null}
            }
        })
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth,window.innerHeight),shader);
    }
    addTask(task){
        this.postProcessTasks.push(task);
    }

    getNextRT(index){
        return index %2 ==0?this.rtA:this.rtB;
    }
    render(scene,camera){
        this.scene.clear()
        let renderedTarget = this.rtA;
        const depthTexture = renderedTarget.depthTexture;
        this.renderer.setRenderTarget(this.rtA);
        this.renderer.render(scene,camera);
        let idx = 1;
        while(this.postProcessTasks.length>0){
            const rt = this.getNextRT(idx);
            this.renderer.setRenderTarget(rt);
            const task = this.postProcessTasks.shift();
            task(this.scene,camera,renderedTarget,depthTexture);
            this.renderer.render(this.scene,this.camera);
            this.scene.clear();
            idx++;
            renderedTarget = rt;
        }
        this.renderer.setRenderTarget(this.renderTarget);
        this.plane.material.uniforms.screenColor.value = renderedTarget.texture;
        this.scene.add(this.plane);
        this.renderer.render(this.scene,this.camera);
        this.renderer.setRenderTarget(null);
        
    }
}


class FrameBufferRenderer{
    constructor(renderTarget){
        this.renderTarget = renderTarget;
        this.gBuffer = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,{
            count:2,
            format:THREE.RGBAFormat,
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            type:THREE.FloatType
        });
        this.rtA = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,{
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            format:THREE.RGBAFormat,
            stencilBuffer:false,
            depthBuffer:false,
            type:THREE.FloatType
        });
        this.rtB =  new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,{
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            format:THREE.RGBAFormat,
            stencilBuffer:false,
            depthBuffer:false,
            type:THREE.FloatType
        });
        this.postProcessShaderQueue = [];
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
            color = vec4(texture(screenColor,vUv).rgb,1.0);
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
    getPostProcessShaderQueue(){
        return this.postProcessShaderQueue;
    }

    excutePostProcessing(renderer,camera,postProcessShaders,gBuffer,renderTarget){
        renderer.setRenderTarget(this.rtA);
        this.postScene.add(this.plane);
        this.plane.material = this.postShader;
        this.plane.material.uniforms.screenColor.value = gBuffer.textures[1];
        renderer.render(this.postScene,this.postCamera);
        let renderedTarget = this.rtA;
        let nextRenderTarget = null;
        let idx = false;
        while(postProcessShaders.length>0){
            nextRenderTarget = idx?this.rtA:this.rtB;
            renderer.setRenderTarget(nextRenderTarget);
            const shader= postProcessShaders.shift();
            const uniforms = shader.uniforms;
            uniforms.gPositionTexture.value = gBuffer.textures[0];
            uniforms.screenColorTexture.value = renderedTarget.texture;
            this.plane.material=shader;
            renderer.render(this.postScene,this.postCamera);
            idx = !idx;
            renderedTarget = nextRenderTarget;
        }
        this.plane.material = this.postShader;
        this.plane.material.uniforms.screenColor.value = renderedTarget.texture;
        renderer.setRenderTarget(renderTarget);
        renderer.render(this.postScene,this.postCamera);
    }

    render(renderer,scene,camera){
        renderer.setRenderTarget(this.gBuffer);
        // render gBuffer
        renderer.render(scene,camera);
        this.excutePostProcessing(renderer,camera,this.getPostProcessShaderQueue(),this.gBuffer,this.renderTarget);
        renderer.setRenderTarget(null);
    }
}



const testEnv = true;

let earthColorTileUrlFormat = testEnv?"http://localhost:8001/color/{z}/{y}/{x}.jpg":"/data/tile/earth_uploadedTile/color/{z}/{y}/{x}.jpg";
//earthColorTileUrlFormat = "http://121.40.212.118:5000/data/tile/earth_uploadedTile/color/{z}/{y}/{x}.jpg"
const frameBufferRenderer = new FrameBufferRenderer(null);
const planet = new Planet(6358e3,[new Layer(new TileProvider(earthColorTileUrlFormat,12),Layer.TYPE.COLOR),new Layer(new SingleImageTileProvider("/data/earth_bluemarble_height.jpg",0),Layer.TYPE.HEIGHT)]);
const moon = new Planet(1737e3,[new Layer(new TileProvider("http://localhost:8002/color/{z}/{y}/{x}.jpg",7),Layer.TYPE.COLOR),new Layer(new HeightTileProvider("http://localhost:8002/height/{z}/{y}/{x}.png",5),Layer.TYPE.HEIGHT)]);
//const gaiaStars = new GaiaStars("http://localhost:8000/3.bin",scene)

const atmosphere = new RenderableAtmosphere(planet,6600e3,new THREE.Vector3(0.5, 0.65, 1));
const orbitNavigator = new OrbitNavigator(new InteractionHandler(renderer.domElement));
orbitNavigator.setAnchor(planet);
const timer = new Timer()
const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2,
window.innerHeight / 2, window.innerHeight / -2, 0.1,1e15);
// const axesHelper = new THREE.AxesHelper(500000e3);
// scene.add(axesHelper);
const xXis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(2000e3,0,0),new THREE.Vector3(),new THREE.Vector3(0,2000e3,0),new THREE.Vector3(),new THREE.Vector3(0,0,2000e3)]),new THREE.LineBasicMaterial({color:0x00ff00,linewidth:300}));
// const sphere = new THREE.Mesh(new THREE.SphereGeometry(300e3,64,64),new THREE.MeshBasicMaterial({color:0x00ff00}))
// sphere.position.set(3000e3,100e3,100e3)
// scene.add(xXis)
function render(timerStamp){
    requestAnimationFrame(render);
    // controls.update();
    
    timer.update(timerStamp);
    // console.log(timerStamp/1000);
    const delta = timer.getDelta();
    // console.log(delta*1000);
    orbitNavigator.updateCamera(camera,delta);
    //controls.update()
    //controls.update();
    camera.updateMatrixWorld(true);
    planet.render(camera,scene);
    //gaiaStars.render(camera)
    //moon.render(camera,scene)
    //atmosphere.render(camera,scene,frameBufferRenderer.getPostProcessShaderQueue());
    //stats.begin()
    frameBufferRenderer.render(renderer,scene,camera);
    //stats.end();
    //renderer.render(scene,camera)
}

render(new Date().getTime()/1000);
const fileInput = document.createElement("input")
fileInput.type = "file"
fileInput.style.display = "none"
fileInput.accept = "image/*";
const url = "http://localhost:8000"
const gui = new dat.GUI({})
gui.add(ui,"wireFrame")
gui.add(ui,"multiplier",0.1,1e5,0.1);
gui.add(ui,"chunkEdge");
const inputFormContainer = gui.addFolder("Select texture")
const inputForm = {
    "Select texture":function(){
        if(fileInput.onchange==undefined || fileInput.onchange == null){
            fileInput.onchange = function(e){
                inputForm.selectedTexture = e.target.files[0];
            }
        }
        fileInput.click();
    },
    selectedTexture:null,
    "Min latitude":-90,
    "Max latitude":90,
    "Min longtitude":-180,
    "Max longtitude":180,
    "Add":function(){
        if(this.selectedTexture==null || this['Min latitude']>=this["Max latitude"] || this['Min longtitude']>=this["Max longtitude"]){
            return;
        }
        const formData = new FormData()
        formData.append("texture",this.selectedTexture)
        formData.append("minLat",this["Min latitude"])
        formData.append("maxLat",this["Max latitude"])
        formData.append("minLon",this["Min longtitude"])
        formData.append("maxLon",this["Max longtitude"])
        
        fetch(`${url}/layer/upload`,{
            method:"post",
            body:formData
        }).then(response=>response.json()).then(data=>{
            if(data.status != 200){
                console.log(data);
                return;
            }
            const textureId = data.textureId
            const colorLayer = new Layer(new TileProvider("${url}/layer/${textureId}/tiles/{z}/{y}/{x}",6));
            planet.layers[0] = colorLayer;
        })

    }
}






inputFormContainer.add(inputForm,"Select texture");
inputFormContainer.add(inputForm,"Min latitude",-90,90,1)
inputFormContainer.add(inputForm,"Max latitude",-90,90,1)
inputFormContainer.add(inputForm,"Min longtitude",-180,180,1)
inputFormContainer.add(inputForm,"Max longtitude",-180,180,1)
inputFormContainer.add(inputForm,"Add")

const atmosphereContainer = gui.addFolder("atmosphere");
atmosphereContainer.add(atmosphereUI,"intensity",1,20,1);
atmosphereContainer.add(atmosphereUI,"scatteringStrength",1,20,1);
atmosphereContainer.add(atmosphereUI,"falloff",0,20,1);
atmosphereContainer.add(atmosphereUI,"density",0,30,1);
atmosphereContainer.add(atmosphereUI,"redWave",0,900,1);
atmosphereContainer.add(atmosphereUI,"blueWave",0,900,1);
atmosphereContainer.add(atmosphereUI,"greenWave",0,900,1);

// new TIFFLoader().load("http://localhost:8002/ldem_64.tif",onload = (texture)=>{
//     console.log(texture.type)
//     console.log(texture.format)
// })
