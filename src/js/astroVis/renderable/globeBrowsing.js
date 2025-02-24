import * as THREE from 'three';
import {clamp} from 'three/src/math/mathutils';
import {Image} from "image-js"
import {RenderableObject} from '../rendering/base';
import {commonFunctionsInclude} from "../rendering/common";
import {appContext} from "../applicationContext";
import {BACKEND_API} from "../../api";

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
        let x2 = this.x*2;
        let y2 = this.y*2;

        if (ns == TileIndex.DIRECTION.SOUTH){
            y2+=1
        }
        if (we == TileIndex.DIRECTION.EAST){
            x2+=1;
        }

        return new TileIndex(level,x2,y2)

        // if(ns == TileIndex.DIRECTION.NORTH){
        //     if(we == TileIndex.DIRECTION.WEST){
        //         return new TileIndex(level,x2,y2);
        //     }
        //     else {
        //         return new TileIndex(level,x2+1,y2);
        //     }
        // }
        // else {
        //     if(we == TileIndex.DIRECTION.WEST){return new TileIndex(level,x2,y2+1)}
        //     else {return new TileIndex(level,x2+1,y2+1);}
        // }
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
            this.uploaded = false
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
        this.tileReadyBitMapList = [];
        this.tileList = [];
        this.tileIndices = [];
        // for(let i=0;i<=maxLevel;i++){
        //     const pow = Math.pow(2,i);
        //     let level = [];
        //     for(let x = 0;x<pow;x++){
        //         let row = [];
        //         for(let y=0;y<pow;y++){
        //             row.push(null);
        //         }
        //         level.push(row);
        //     }
        //     this.tiles.set(i,level);
        // }
        for(let i=0;i<=maxLevel;i++){
            const pow = Math.pow(2,i);
            const level = [];
            const indexLevel = [];
            for(let u = 0;u<pow;u++){
                const y = [];
                for(let j = 0;j<Math.ceil(pow/64);j++){
                    //y.push(0n);
                }
                //indexLevel.push({});
                //level.push(y);
                level.push({});
            }
            //this.tileIndices.push(indexLevel);
            //this.tileReadyBitMapList.push(level);
            this.tileList.push(level)
        }

    }

    clear(){
        this.tiles.forEach((key,value)=>{
            for(let x=0;x<value.length;x++){
                for(let y=0;y<value.length;y++){
                    if(value[y][x]!=null){
                        value[y][x].dispose()
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
        const tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x];
        return tile!==null && tile !== undefined && tile.status == Tile.STATUS.available;
    }
    isWithinRange(tileIndex){
        if(tileIndex.level>this.maxLevel){return false;}
        const max = Math.pow(2,tileIndex.level);
        return tileIndex.x<max && tileIndex.y<max;
    }


    initializeTile(tileIndex){
        let tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x];
        if(tile === undefined || tile===null){
            tile = new Tile(null);
            this.tileList[tileIndex.level][tileIndex.y][tileIndex.x] = tile;
        }
    }



    deleteTile(tileIndex){
        const tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x];
        if (tile === undefined || tile === null){return;}
        tile.dispose();
        tile.texture = null;
        delete this.tileList[tileIndex.level][tileIndex.y][tileIndex.x];
    }


    getTile(tileIndex){
        if(!this.isWithinRange(tileIndex)){
            return this.unavailableTile;
        }
        const tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x];
        const isnullOrUndef = tile===null || tile===undefined;
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



    putTileToBuffer(tile,tileIndex){
        //const tileReadyBitMap = this.tileReadyBitMapList[tileIndex.z][tileIndex.y];
        //tileReadyBitMap[Math.floor(tileIndex.x/64)] |= 1<<tileIndex.x%64;
        // this.tileList.push(tile);
        this.tileIndices[tileIndex.level][tileIndex.y][tileIndex.x] = tile;
    }

    downloadTile(requestUrl,tileIndex){
        
        this.initializeTile(tileIndex);

        const tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x]
        tile.status = Tile.STATUS.downloading;
        this.textureLoader.load(requestUrl,onload = (texture)=>{
            // texture.wrapS = THREE.ClampToEdgeWrapping;
            // texture.wrapT = THREE.ClampToEdgeWrapping;
            this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
            tile.texture = texture;
            tile.status = Tile.STATUS.available;
            // this.putTileToBuffer(tile,tileIndex);
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


class ProxyTileProviderAdapter extends TileProvider{

    constructor(requestFormat,maxLevel) {
        super(requestFormat,maxLevel);
    }



    downloadTile(requestUrl, tileIndex) {
        const parameters = encodeURI(`proxyUrl=${this.requestUrlFormat}&z=${tileIndex.level}&y=${tileIndex.y}&x=${tileIndex.x}`);

        super.downloadTile(`${BACKEND_API.TILE_DOWNLOAD_PROXY}?${parameters}`,tileIndex);
    }
}


class HeightTileProvider extends TileProvider{
    constructor(requestUrlFormat,maxLevel = 19){
        super(requestUrlFormat,maxLevel);
    }





    downloadTile(requestUrl,tileIndex){




        // if (true){
        //     super.downloadTile(requestUrl,tileIndex);
        //     return;
        // }

        this.initializeTile(tileIndex);
        const tile = this.tileList[tileIndex.level][tileIndex.y][tileIndex.x]
        tile.status = Tile.STATUS.downloading;
        // if (true){
        //     this.textureLoader.load(requestUrl,onload = (texture)=>{
        //             // texture.wrapS = THREE.ClampToEdgeWrapping;
        //             // texture.wrapT = THREE.ClampToEdgeWrapping;
        //             this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
        //             tile.texture = texture;
        //
        //             tile.status = Tile.STATUS.available;
        //         },
        //         onerror = (e)=>{
        //             this.enqueueRetryDownload(tile);
        //         })
        //     return;
        // }


        // if (true){
        //
        //
        //     fetch(requestUrl).then(response=>response.arrayBuffer()).then(arrayBuffer=>{
        //         const heightBuffer = new Float32Array(arrayBuffer);
        //         tile.texture = new THREE.DataTexture(heightBuffer,1024,512,THREE.RedFormat,THREE.FloatType)
        //         tile.texture.generateMipmaps = false;
        //         tile.status = Tile.STATUS.available
        //         tile.uploadTextureToGPU()
        //     })
        //
        //     return;
        // }

        Image.load(requestUrl).then((image)=>{

            //let dataView = new DataView(image.data.buffer);
            // let heightBuffer = image.data;
            let heightBuffer = null;
            let typedBuffer = null;

            //console.log(image.getPixelsArray());
            if (image.bitDepth == 8){
                typedBuffer = new Uint8Array(image.getPixelsArray().length);
                image.getPixelsArray().forEach((v,i)=>{
                    typedBuffer[i] = v[0]
                })
                //typedBuffer = new Uint8Array(image.data.buffer)
            }
            else if(image.bitDepth==16){
                typedBuffer = new Int16Array(image.data.buffer);
            }
            else if(image.bitDepth==32){
                typedBuffer = new Float32Array(image.data.buffer);
            }
            heightBuffer = new Float32Array(image.width*image.height);
            let minValue = 0;
            let maxValue = 0;
            typedBuffer.forEach((v,i)=>{heightBuffer[i]=v;minValue = Math.min(minValue,v);});
            tile.maxPixelValue = image.maxValue;
            tile.minPixelValue = minValue;
            tile.texture = new THREE.DataTexture(heightBuffer, image.width, image.height, THREE.RedFormat, THREE.FloatType,THREE.UVMapping,
                THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,THREE.LinearFilter);
            //tile.texture.isDataTexture = false;
            tile.status = Tile.STATUS.available;
            tile.texture.flipY = true
            tile.texture.flipX = true
            tile.uploadTextureToGPU();
            tile.texture.generateMipmaps = false;
            this.currentMaxLevel = Math.max(tileIndex.level,this.currentMaxLevel);
        },(e)=>{this.enqueueRetryDownload(tile)})
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
        this.toDeleteMap = {};
    }
    getTile(tileIndex){
        return this.tileProvider.getTile(tileIndex);
    }
    getCurrentMaxLevel(){
        return this.tileProvider.getCurrentMaxLevel();
    }
    isTileAvailable(tileIndex){
        return this.tileProvider.isTileAvailable(tileIndex);
    }
    dispose(tileIndex){
        const tileIndexKey = `${tileIndex.level}/${tileIndex.y}/${tileIndex.x}`
        if (this.toDeleteMap[tileIndexKey]!==undefined){return;}
        else {
            this.toDeleteMap[tileIndexKey] = true;
            setTimeout(()=>{
                if (this.toDeleteMap[tileIndexKey]===undefined){return;}
                delete this.toDeleteMap[tileIndexKey];
                this.tileProvider.deleteTile(tileIndex);
            },45*1000);
        }
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
        const tileIndexKey = `${tileIndex.level}/${tileIndex.y}/${tileIndex.x}`;
        if (this.toDeleteMap[tileIndexKey]!==undefined){
            delete this.toDeleteMap[tileIndexKey];
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


    getBufferGeometry(){
        return this.bufferGeometry;
    }

    createBufferGeometry(){
        const bufferGeometry = new THREE.BufferGeometry()
        bufferGeometry.setAttribute("in_uv",new THREE.BufferAttribute(this.textures,2));
        bufferGeometry.setIndex(this.elements);
        return bufferGeometry;
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
        this.bufferGeometry = this.createBufferGeometry();

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
        this.minHeight = 0;
        this.maxHeight = 0;
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
export class RenderablePlanet extends RenderableObject{
    static globalVs = `
    precision highp float;
    in vec2 in_uv;
    
    out vec2 out_uv;
    out vec3 normalVec;
    out vec4 vsPosition;
    out vec3 vsPositionWorldSpace;
    out float depth;
    out vec4 posCamSpace;
    out vec4 vHeightColor;
    
    
    
    #ifndef LAYER
    #define LAYER
    struct UVTransform{
        vec2 uvOffset;
        float scale;
    };
    #endif
    
    struct HeightLayer{
        sampler2D tile;
        UVTransform uvTransform;
    };
    
    
    
    
    
    
    uniform float radius;
    uniform vec2 minLatLon;
    uniform vec2 lonLatScalingFactor;
    uniform float heightMultiplier;
    uniform float minHeight;
    uniform float heightOffset;
    uniform HeightLayer heightLayer;
    uniform mat4 modelTransform;
    
     
    ${commonFunctionsInclude}
    
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
            
            normalVec = mat3(transpose(inverse(modelTransform))) * normal;
            vec2 hUv = (in_uv*heightLayer.uvTransform.scale + heightLayer.uvTransform.uvOffset);
            vec2 widthOffset = vec2(0.5,0.0)*heightLayer.uvTransform.scale;
            vec2 hOffset = vec2(0.0,0.5)*heightLayer.uvTransform.scale;
            // hUv+=widthOffset;
            // hUv+=hOffset;
            float h = 0.0;
            vHeightColor = texture(heightLayer.tile,in_uv);
            
            if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){
                // h = h - min(radius, lonLatScalingFactor.y/2.0*1000000.0);
                h = minHeight - 1e3;
            }
            else {
                h = texture(heightLayer.tile,vec2(hUv.x,hUv.y)).x;
                h*=heightMultiplier;
                h+=heightOffset;
            
            }
            // else {
            //     // h+=600.0;
            // }
    
            return (h+radius) * normal;
    }
    
    void main(){
        vec3 pos = getPosition(in_uv);
        vsPositionWorldSpace = vec3(modelMatrix * vec4(pos,1.0));
        posCamSpace = viewMatrix*modelTransform*vec4(pos,1.0);
        gl_Position = projectionMatrix*posCamSpace;
        //gl_Position.z = ((gl_Position.z - 0.1) / (1e20-0.1));
        vsPosition = gl_Position;
        gl_Position.z = 0.0;
        out_uv = in_uv;
       
    }
    `







    static fs = `
    precision highp float;

    layout(location = 1) out vec4 gPosition;
    layout(location = 0) out vec4 fragColor;
    
    
    
    // in bool isShadow;
    //in vec3 shadowSourceViewPos;
    
    in vec2 out_uv;
    in vec3 normalVec;
    in vec4 vsPosition;
    in vec4 posCamSpace;
    in vec4 vHeightColor;
    in vec3 vsPositionWorldSpace;
    
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
    
    
    uniform bool isShadow;
    uniform vec3 shadowSourceWorldPos;
    
    
    ${commonFunctionsInclude}

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
    uniform vec4 childIndexColor;
    uniform bool childIndexRenderEnabled;
    void main(){
        //gl_FragDepth = LinearizeDepth(-vsPosition.w);
        gl_FragDepth = calculateLogDepth(vsPosition.w);
        //gl_FragDepth = (vsPosition.z - 0.1) / (1e20-0.1);
        vec4 color = vec4(texture(colorLayer.tile,colorLayer.uvTransform.uvOffset + colorLayer.uvTransform.scale*out_uv).rgb,1.0);
        //vec4 color = vec4(vHeight,vHeight,vHeight,1.0);
        gPosition = vec4(posCamSpace.xyz,0.0);
        
        vec3 dictFromLightToPlanetSurface = normalize(shadowSourceWorldPos-vsPositionWorldSpace);
        //dictFromLightToPlanetSurface = -dictFromLightToPlanetSurface;
        
     
        float diff = max(dot(dictFromLightToPlanetSurface,normalVec),0.0);
        // vec3 lightColor = vec3(1.0,1.0,1.0) * diff;
        if(chunkEdge&&isBorder(out_uv)){
            color = vec4(1.0,0.0,0.0,1.0);
        }
        else if(isShadow){
           color*=diff;
           //vec3 reflectedLight = reflect(dictFromLightToPlanetSurface,normalVec);
           //vec4 specular = vec4(1.0)*pow(max(dot(vec3(0.0,0.0,-1.0), reflectedLight), 0.0), 32)*10;
           //color+=specular;
        }
        
        fragColor = color;
    }
    `


    static X_SEGMENTS= 64;
    static Y_SEGMENTS = 64;
    static RENDER_GRID = new Grid(RenderablePlanet.X_SEGMENTS,RenderablePlanet.Y_SEGMENTS)


    static DEFAULT_MAX_LEVEL = 13;
    static DEFAULT_MIN_LEVEL = 1;
    constructor({radius = 10,layers = [], shadow = {}} = {}){
        super();
        shadow = {
            isShadow: shadow.isShadow ?? false,
            shadowSource: shadow.shadowSource ?? null
        }


        this.radius = radius;
        this.root = new Chunk(-90,90,-180,180,new TileIndex(0,0,0));
        this.grid = RenderablePlanet.RENDER_GRID;
        this.maxLevel = RenderablePlanet.DEFAULT_MAX_LEVEL;
        this.minLevel = RenderablePlanet.DEFAULT_MIN_LEVEL;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Matrix4();
        this.scale = new THREE.Vector3();
        this.modelTransformCached = new THREE.Matrix4().makeTranslation(this.position);
        this.modelTransformCached.multiply(this.rotation);
        this.level0Threshold = this.radius + 3 * this.radius;
        this.translation = new THREE.Matrix4();
        this.heightMultiplier = 1;
        this.base = new THREE.Group();
        //this.colorTileProvider = new TileProvider("https://tiledbasemaps.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",this.maxLevel)
        //this.setTileProvider("https://tiledbasemaps.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",this.maxLevel,scene)
        this.initLayers();
        layers.forEach(layer=>this.addLayer(layer));
        this.initProps(shadow);
        this.addedToScene = false;


    }
    initLayers(){
        let defaultTileProvider = new TileProvider("",this.maxLevel);
        this.colorLayer = new Layer(defaultTileProvider,Layer.TYPE.COLOR);
        this.heightLayer = new Layer(defaultTileProvider,Layer.TYPE.HEIGHT);
    }


    updateModelTransform(position,rotation,scaling){
        const tempMat = new THREE.Matrix4();
        tempMat.makeScale(scaling.x,scaling.y,scaling.z);
        this.modelTransformCached.copy(rotation).premultiply(tempMat);
        tempMat.makeTranslation(position.x,position.y,position.z);
        this.modelTransformCached.premultiply(tempMat);
    }


    initProps(shadow){

        this.props = {
            heightMultiplier:this.heightMultiplier,
            chunkEdge:false,
            heightOffset:0,
            shadow:{
                isShadow:shadow.isShadow,
                shadowSource:shadow.shadowSource,
                shadowSourceWorldPos: new THREE.Vector3()
            }
        }
    }

    createGlobalShaderUniformStructure(){
        return {
            chunkEdge:{value:false},
            radius:{value:1.0},
            minLatLon:{value:null},
            lonLatScalingFactor:{value:null},
            heightMultiplier:{value:1},
            minHeight:{value:0},
            childIndexRenderEnabled:{value:true},
            childIndexColor:{value:new THREE.Vector4()},
            heightOffset:{value:0},
            colorLayer:{
                value:{
                    tile:null,
                    uvTransform:{
                        uvOffset:new THREE.Vector2(0,0),
                        scale:1.0
                    }
                }
            },
            heightLayer:{
                value:{
                    tile:null,
                    uvTransform:{
                        uvOffset:new THREE.Vector2(0,0),
                        scale:1.0
                    }
                }
            },
            modelTransform:{value:new THREE.Matrix4()},
            isShadow:{value:false},
            shadowSourceWorldPos:{value:this.props.shadow.shadowSourceWorldPos}
        }
    }



    addUIComponent(uiComponent) {
        const layersUI = uiComponent.addFolder("layers")
        layersUI.add(this.props,"heightMultiplier",1,100000,2)
        uiComponent.add(this.props,"chunkEdge",false)
        uiComponent.add(this.props,"heightOffset",-1000000,1000000,1)
        uiComponent.add(this.props.shadow,"isShadow");
    }

    getGlobalShader(){
        return new THREE.ShaderMaterial({
            vertexShader:RenderablePlanet.globalVs,
            fragmentShader:RenderablePlanet.fs,
            glslVersion:THREE.GLSL3,
            side:THREE.FrontSide,
            transparent:false,
            uniforms:this.createGlobalShaderUniformStructure()
        });
    }
    addLayer(layer){
        let type = layer.type;
        const maxLevel = layer.maxLevel;
        if(type==undefined||type==null||typeof type !== 'string'||maxLevel==undefined||maxLevel==null||typeof maxLevel !=="number"){return;}
        type = type.toLowerCase();
        if(Layer.TYPE.COLOR.toLowerCase() === type){

            const useProxy = layer.useProxy || false;
            this.colorLayer = new Layer(useProxy?new ProxyTileProviderAdapter(layer.requestUrlFormat,maxLevel):new TileProvider(layer.requestUrlFormat,maxLevel),Layer.TYPE.COLOR);
        }
        else if (Layer.TYPE.HEIGHT.toLowerCase() === type){
            if (layer.heightMultiplier!==undefined){
                this.heightMultiplier = layer.heightMultiplier;
            }
            if (maxLevel <= 0){
                this.heightLayer = new Layer(new SingleImageTileProvider(layer.requestUrlFormat),Layer.TYPE.HEIGHT);
            }
            else {
                this.heightLayer = new Layer(new HeightTileProvider(layer.requestUrlFormat,maxLevel),Layer.TYPE.HEIGHT);
            }

        }
        
    }
    latLonToXYZ(lat,lon,radius){
        const cosLat = Math.cos(lat);
        const normal = new THREE.Vector3(cosLat*Math.cos(lon),cosLat*Math.sin(lon),Math.sin(lat));
        return normal.multiplyScalar(radius);
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
        // const cloestCorner = this.findClostCornerToCamera(chunk,camera);
        // const cameraPosModelSpace = camera.position.clone().applyMatrix4(this.getModelTransform().invert());
        // const cornerToCamera = cameraPosModelSpace.clone().sub(cloestCorner);
        // const cos = cornerToCamera.clone().normalize().dot(cloestCorner.normalize());
        // const cullable = cos<0;
        // return cullable;


        const dictToCamera = camera.position.clone().applyMatrix4(this.getModelTransform().invert());
        dictToCamera.normalize();
        new THREE.Vector3().length()
        const projectedPoint = new THREE.Vector2(Math.asin(dictToCamera.z),Math.atan2(dictToCamera.y,dictToCamera.x));
        




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

    mergeChunk(chunk){
        if(!chunk.isLeaf()){
            for(let i=0;i<chunk.children.length;i++){
                this.mergeChunk(chunk.children[i]);
            }
            for(let i=0;i<chunk.children.length;i++){
                this.disposeChunk(chunk.children[i]);
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

    canChunkSplit(tileIndex,layer){

        const childTile00 = layer.getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST));
        const childTile01 = layer.getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.EAST));
        const childTile10 = layer.getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.WEST));
        const childTile11 = layer.getTile(tileIndex.nextLevelIndex(TileIndex.DIRECTION.SOUTH,TileIndex.DIRECTION.EAST));
        const tileAvailableState = Tile.STATUS.available;
        const canSplit = childTile00.status==tileAvailableState || childTile10.status == tileAvailableState || childTile01.status == tileAvailableState || childTile11.status == tileAvailableState;
        return canSplit;
    }


    getChunkMinHeight(tileIdx){

        const tileIdxCopy = new TileIndex(tileIdx.length,tileIdx.x,tileIdx.y);
        const {tile,uvTransform} = this.heightLayer.findClostAvailableTile(tileIdxCopy);
        return tile.minPixelValue *this.props.heightMultiplier + this.props.heightOffset;
    }

    updateChunk(chunk,camera){
        let canBeCulled = this.cullChunksByProjectionArea(chunk,camera);
        // canBeCulled = false;
        if(canBeCulled){
            chunk.status = Chunk.STATUS.wantMerge;
            return;
        }

        chunk.minHeight = this.getChunkMinHeight(chunk.tileIndex);
        const dl = this.calDesiredLevel(chunk,camera);
        const tileAvailable = this.colorLayer.getTile(chunk.tileIndex).status == Tile.STATUS.available || this.heightLayer.getTile(chunk.tileIndex).status == Tile.STATUS.available;
        //const tileAvailable = this.colorLayer.getTile(chunk.tileIndex).status == Tile.STATUS.available;
        if(chunk.tileIndex.level < dl && chunk.isLeaf()){
            if(!tileAvailable){chunk.status = Chunk.STATUS.doNothing;}
            else {
                const tileIndex = chunk.tileIndex;
                chunk.status = (this.canChunkSplit(tileIndex,this.colorLayer)||this.canChunkSplit(tileIndex,this.heightLayer))?Chunk.STATUS.wantSplit:Chunk.STATUS.doNothing;
                //chunk.status = (this.canChunkSplit(tileIndex,this.colorLayer))?Chunk.STATUS.wantSplit:Chunk.STATUS.doNothing;
            }
        }
        else if(chunk.tileIndex.level > dl && chunk.isLeaf()){
            chunk.status = Chunk.STATUS.wantMerge;
        }
        else {
            chunk.status = Chunk.STATUS.doNothing;
        }

    }
    updateChunkTree(chunk,camera){
        this.updateChunk(chunk,camera);
        if(chunk.status == Chunk.STATUS.wantSplit){
            this.splitChunk(chunk);
        }
        else if(!chunk.isLeaf()){
            let allChildrenWantMerge = true;
            for(let i=0;i<4;i++){
                this.updateChunkTree(chunk.children[i],camera);
                allChildrenWantMerge = allChildrenWantMerge && chunk.children[i].status==Chunk.STATUS.wantMerge;
            }
            if(allChildrenWantMerge){
                this.mergeChunk(chunk);
                this.updateChunk(chunk,camera);
            }
        }
    }

    calDesiredLevel(chunk,camera){
        const dl = clamp(this.calculateDesireLevelByDistance(chunk,camera,this.getModelTransform()),this.minLevel,this.maxLevel);
        const maxTileAvaibleLevel = Math.max(this.colorLayer.getCurrentMaxLevel(),this.heightLayer.getCurrentMaxLevel());

        if(dl>maxTileAvaibleLevel){
            const tileIndexNextLevel = chunk.tileIndex.nextLevelIndex(TileIndex.DIRECTION.NORTH,TileIndex.DIRECTION.WEST);
            // for(let i=0;i<this.layers.length;i++){
            //     this.layers[i].getTile(tileIndexNextLevel);
            // }
            this.colorLayer.getTile(tileIndexNextLevel);
            this.heightLayer.getTile(tileIndexNextLevel);
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
    getModelTransform(){
        return this.modelTransformCached.clone();
    }
    calculateDesireLevelByDistance(chunk,camera,objectTransform){
        const modelTransform = objectTransform;
        const cameraPositionModelSpace = camera.position.clone().applyMatrix4(modelTransform.clone().invert());
        const closestPointOnPatch = chunk.calculateCloestPoint(this.XYZToLonLat(cameraPositionModelSpace.clone()));
        const pointPositionXYZ = this.latLonToXYZ(closestPointOnPatch.y,closestPointOnPatch.x,this.radius);
        const cameraToChunk = cameraPositionModelSpace.clone().sub(pointPositionXYZ);
        const distance = cameraToChunk.length();
        // const corner = this.findClostCornerToCamera(chunk,camera);
        // const distance = cameraPositionModelSpace.sub(corner).length();
        // console.log(Math.ceil(Math.log2(3*this.radius / distance)));
        //console.log(Math.ceil(Math.log2(1.5*this.radius / distance)))
        return Math.ceil(Math.log2(6*this.radius / distance));
    }
    disposeChunk(chunk){
        if(chunk.surface!=null){
            this.base.remove(chunk.surface);
            this.heightLayer.dispose(chunk.tileIndex)
            this.colorLayer.dispose(chunk.tileIndex)
            chunk.surface = null;
        }
    }
    getRenderedChunks(chunk,list){
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
            this.getRenderedChunks(chunk.children[i],list);
        }
    }




    setLayerUniforms(layer,chunk,uniforms,uniformName){
        const tileIndexCopied = new TileIndex(chunk.tileIndex.level,chunk.tileIndex.x,chunk.tileIndex.y);
        const {tile,uvTransform} = layer.findClostAvailableTile(tileIndexCopied);
        uniforms[uniformName].value.tile = tile.texture;
        //tile.uploadTextureToGPU();
        uniforms[uniformName].value.uvTransform.uvOffset = uvTransform[0];
        uniforms[uniformName].value.uvTransform.scale = uvTransform[1];
        if(layer.type == Layer.TYPE.HEIGHT){
            uniforms.minHeight.value = tile.minPixelValue;
        }
    }

    setUniforms(chunk,renderData,i){
        const uniforms = chunk.surface.material.uniforms;
        //uniforms.multiplier.value = ui.multiplier;
        //uniforms.chunkEdge.value = ui.chunkEdge;
        uniforms.modelTransform.value = renderData.modelTransform;
        uniforms.chunkEdge.value = this.props.chunkEdge;
        uniforms.isShadow.value = this.props.shadow.isShadow;
        this.setLayerUniforms(this.heightLayer,chunk,uniforms,"heightLayer");
        this.setLayerUniforms(this.colorLayer,chunk,uniforms,"colorLayer");

        if(false && chunk.tileIndex.level > 7){
            // const p00 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMinLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            // const p10 = this.latLonToXYZ(chunk.getMaxLatInRadian(),chunk.getMaxLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            // const p01 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMinLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            // const p11 = this.latLonToXYZ(chunk.getMinLatInRadian(),chunk.getMaxLonInRadian(),this.radius).applyMatrix4(camera.matrixWorldInverse.clone().multiply(this.getModelTransform()));
            // const normal = p11.clone().sub(p01).cross(p10.clone().sub(p01)).normalize();
            // uniforms.p00.value.copy(p00);
            // uniforms.p10.value.copy(p10);
            // uniforms.p01.value.copy(p01);
            // uniforms.p11.value.copy(p11);
            // uniforms.patchNormalCameraSpace.value.copy(normal);
        }
        else {
            uniforms.heightOffset.value = this.props.heightOffset
            uniforms.radius.value = this.radius;
            uniforms.minLatLon.value = uniforms.minLatLon.value==null?new THREE.Vector2(chunk.getMinLatInRadian(),chunk.getMinLonInRadian()):uniforms.minLatLon.value.set(chunk.getMinLatInRadian(),chunk.getMinLonInRadian());
            uniforms.lonLatScalingFactor.value = uniforms.lonLatScalingFactor.value==null?new THREE.Vector2(chunk.getMaxLonInRadian()-chunk.getMinLonInRadian(),chunk.getMaxLatInRadian()-chunk.getMinLatInRadian()):uniforms.lonLatScalingFactor.value.set(chunk.getMaxLonInRadian()-chunk.getMinLonInRadian(),chunk.getMaxLatInRadian()-chunk.getMinLatInRadian());
            uniforms.heightMultiplier.value = this.heightMultiplier;
            const idxColor = new THREE.Vector4(1.0,0,0,1);
            if (chunk.tileIndex.y%2 == 1){
                if (chunk.tileIndex.x%2==0){
                    idxColor.x = 0;
                    idxColor.y = 1
                }
                else {
                    idxColor.x = 0;
                    idxColor.z = 1
                }
            }
            else if (chunk.tileIndex.x%2==1){
                idxColor.x = 0.5;
                idxColor.z = 0.8
                idxColor.y = 0.65
            }
            uniforms.childIndexColor.value.copy(idxColor);
        }
    }

    createSurface(chunk){
        const mesh = new THREE.Mesh(this.grid.getBufferGeometry(),this.getGlobalShader());
        mesh.frustumCulled = false;
        return mesh;
    }



    renderChunk(chunk,renderData,i){
        if(chunk.surface == null){
            chunk.surface = this.createSurface(chunk);
            this.base.add(chunk.surface);
        }
        chunk.surface.visible = true;
        this.setUniforms(chunk,renderData,i);
    }


    updateShadowSourceWorldPosition(){
        if (this.props.shadow.isShadow && this.props.shadow.shadowSource!==null){
            const shadowSourceNode = appContext.scene.findNodeByIdentifier(this.props.shadow.shadowSource);
            if (shadowSourceNode){
                this.props.shadow.shadowSourceWorldPos.copy(shadowSourceNode.getLocalPosition());
            }
        }
    }

    update(updateData){
        this.position = updateData.transformation.translation;
        this.rotation = updateData.transformation.rotation;
        this.scaling = updateData.transformation.scaling;
        const translationMat = new THREE.Matrix4().makeTranslation(this.position.x,this.position.y,this.position.z);
        const scalingMat = new THREE.Matrix4().makeScale(this.scaling.x,this.scaling.y,this.scaling.z);
        this.updateModelTransform(this.position,this.rotation,this.scaling);
        this.heightMultiplier = this.props.heightMultiplier
        this.updateChunkTree(this.root,updateData.camera);
        this.updateShadowSourceWorldPosition();
    }

    render(renderData){

        if (!this.addedToScene){
            this.addedToScene = true;
            renderData.scene.add(this.base);
        }
        const renderedChunkList = [];
        this.getRenderedChunks(this.root,renderedChunkList);
        for(let i=0;i<renderedChunkList.length;i++){
            this.renderChunk(renderedChunkList[i],renderData,i);
        }
    }
}