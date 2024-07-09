import * as THREE from 'three'

const float32Size = 4;
var testFlag = true;
const littleEnd = true;
const vs = 
        `
        precision highp float;
        out float vs_mass;
        out float vs_screenDepth;
        in vec4 posAndMass;
        in vec4 nextPosAndMass;

        uniform float kpc;

        uniform float displacement;

        uniform mat4 transformation;

        vec3 getNextPos(){
            vec3 pathDictVector = nextPosAndMass.xyz - posAndMass.xyz;
            //vec3 currentPos = progressPercentage * (pathVector);
            //float pathLength = length(pathVector);
            return posAndMass.xyz + displacement * pathDictVector;

            
        }

        void main(){
            float pointSize = 0.1;
            float sizeScale = 1.0;
            vec3 pos=getNextPos()*kpc;
            gl_Position = transformation*vec4(pos,1.0);
            vs_screenDepth = gl_Position.z;
            gl_Position.z = 0.0;
            //gl_Position = vec4(0.0,0.0,0.0,1.0);
            gl_PointSize = 0.5;
            vs_mass = posAndMass.w;
        }

    `
        const fs = `

        precision highp float;
        out vec4 color;
        //out float gl_FragDepth;

        in float vs_mass;
        in float vs_screenDepth;

        uniform float minMass;
        uniform float maxMass;
        uniform float kpc;
        uniform float scale;
        uniform float colorScale;

        
        uniform sampler2D colorTexture;
        uniform sampler2D spriteTexture;

        void main() {
            gl_FragDepth = log(vs_screenDepth+1.0) / log(1e20+1.0);
            float mass = vs_mass;
            float normalizedMass = (mass - minMass)/(maxMass-minMass);
            //float depth = gl_FragDepth * 100.0;
            //float attenuation = 1.0 / (1.0 + 5.0 * depth);
            int width = textureSize(colorTexture, 0).x;
            int colorMapIndex = int(normalizedMass * 256.0);
            float depth = gl_FragDepth * 100.0;
            float attenuation = 1.0 / (1.0 + 5.0 * depth);
            vec4 pixel = texture(colorTexture,vec2(float(colorMapIndex)/float(width),0.0)) * texture(spriteTexture,gl_PointCoord)*colorScale;
            color = vec4(pixel.xyz, 0.7);
            //color = vec4(1.0,1.0,1.0,1.0);
        }
        `

// const gs = `
        // #version __CONTEXT__

        // layout(points) in;
        // layout(points,max_vertices = 1) out;

        // in float vs_mass[];
                
        // out float mass;
        // out float vs_screenDepth;

        // void main(){

        //     vec4 position = gl_in[0].gl_Position;    
        //     gl_Position = position;
        //     vs_screenDepth = position.w;
        //     gl_Position.z = 0;
        //     mass = vs_mass[0];
        //     EmitVertex();
        //     EndPrimitive();
        // }
        // `
export class GlobularEvolution {
    
    
    


    initGL(){
        
        this.shader = new THREE.RawShaderMaterial({
            vertexShader:vs,
            fragmentShader:fs, 
            uniforms:{
                spriteTexture:{value:null},
                transformation:{value:null},
                minMass:{value:0.0},
                maxMass:{value:1.0},
                kpc:{value:3e16},
                colorScale:{value:0.1},
                colorTexture:{value:null},
                displacement:{value:0.0}
            },
            glslVersion:THREE.GLSL3
        });
    }

    loadStarTexture(textureUrl){
        this.textureLoader.load(textureUrl,texture=>{
            
            this.shader.uniforms.spriteTexture.value = texture;
            this.starTextureReady = true;
            //texture.needsUpdate = true;
            this.shader.uniforms.spriteTexture.value.needsUpdate = true;
        });
    }



    init(){
        this.initGL()
        this.loadColorMap(this.colorMapUrl);
        this.loadStar(this.starUrl,this.currentIndex);
        this.loadStarTexture("/data/halo.png");
    }

    loadStar(starUrl,index){
        fetch(starUrl+"/snap_"+index+".bin")
        .then(response=>response.arrayBuffer())
        .then(data=>{
            const dataView = new DataView(data);
            // 从子数组中获取第一个整数
            const numsRecords = dataView.getInt32(0,littleEnd);
            const elementsInRow = dataView.getInt32(4,littleEnd);
            const dataPartOffset = 8;
            if(this.starNums<=0){
                this.starNums = numsRecords/elementsInRow;
            }
            if(this.starBeginBuffer.length<=0){
                this.starBeginBuffer = new Float32Array(this.starNums*this.starAttrNums);
                this.starEndBuffer = new Float32Array(this.starNums*this.starAttrNums);
            }
            for(let i = 0;i<this.starNums;i++){
                let bufferOffset = i*this.starAttrNums;
                let binaryArrOffset = dataPartOffset+i*this.starAttrNums*2*float32Size;
                this.starBeginBuffer[bufferOffset] = dataView.getFloat32(binaryArrOffset,littleEnd);
                this.starBeginBuffer[bufferOffset+1] = dataView.getFloat32(binaryArrOffset+float32Size,littleEnd);
                this.starBeginBuffer[bufferOffset+2] = dataView.getFloat32(binaryArrOffset+float32Size*2,littleEnd);
                this.starBeginBuffer[bufferOffset+3] = dataView.getFloat32(binaryArrOffset+float32Size*3,littleEnd);
                binaryArrOffset = binaryArrOffset+float32Size*4;
                this.starEndBuffer[bufferOffset] = dataView.getFloat32(binaryArrOffset,littleEnd);
                this.starEndBuffer[bufferOffset+1] = dataView.getFloat32(binaryArrOffset+float32Size,littleEnd);
                this.starEndBuffer[bufferOffset+2] = dataView.getFloat32(binaryArrOffset+float32Size*2,littleEnd);
                this.starEndBuffer[bufferOffset+3] = dataView.getFloat32(binaryArrOffset+float32Size*3,littleEnd);
            }
            
            this.starDataReady = true;
        })
    }

    
    

    loadColorMap(colorMapUrl) {
        fetch(colorMapUrl)
            .then(response => response.text())
            .then(data => {
                let lines = data.split("\n");
                this.shader.uniforms.minMass.value = parseFloat(lines[0]);
                this.shader.uniforms.maxMass.value = parseFloat(lines[1]);
                this.colorNums = parseInt(lines[2]);
                this.colors = new Float32Array(this.colorNums*4);
                for (let i = 3; i < lines.length; i++) {
                    let colorStr = lines[i].split(" ");
                    // this.colors[] = ([parseFloat(colorStr[0]), parseFloat(colorStr[1]), parseFloat(colorStr[2])]);
                    let offset = (i-3)*4;
                    this.colors[offset] = parseFloat(colorStr[0]);
                    this.colors[offset+1] = parseFloat(colorStr[1]);
                    this.colors[offset+2] = parseFloat(colorStr[2]);
                    this.colors[offset+3] = 1.0;           
                }
                this.colorMapTexture = new THREE.DataTexture(this.colors,this.colorNums,1,THREE.RGBAFormat,THREE.FloatType)
                this.shader.uniforms.colorTexture.value = this.colorMapTexture;
                this.shader.uniforms.colorTexture.value.needsUpdate = true;
                this.colorMapReady = true;
            })
    }

    update(scene,camera,deltaTime){
        if((this.initState || this.displacement>1)&&this.starDataReady&&this.colorMapReady&&this.starTextureReady){
            this.initState = false;
            this.displacement = 0;
            this.pastTime = 0;
            this.starDataReady = false;
            if(this.points==undefined||this.points==null){
                const bufferGeometry = new THREE.BufferGeometry();
                bufferGeometry.setAttribute("posAndMass",new THREE.BufferAttribute(this.starBeginBuffer,4));
                bufferGeometry.setAttribute("nextPosAndMass",new THREE.BufferAttribute(this.starEndBuffer,4));
                bufferGeometry.setDrawRange(0,this.starNums);
                this.points = new THREE.Points(bufferGeometry,this.shader);
                scene.add(this.points);
            }
            else {
                // 将新的数组传进points中
                const bufferGeometry = this.points.geometry;
                const posAndMassAttribute = bufferGeometry.getAttribute('posAndMass');
                posAndMassAttribute.array = this.starBeginBuffer; // 新的数据数组
                posAndMassAttribute.needsUpdate = true;

                // 更新 nextPosAndMass 属性的数据
                const nextPosAndMassAttribute = bufferGeometry.getAttribute('nextPosAndMass');
                nextPosAndMassAttribute.array = this.starEndBuffer; // 新的数据数组
                nextPosAndMassAttribute.needsUpdate = true;
            }
            this.loadStar(this.starUrl,++this.currentIndex);
        }
        if(this.points==undefined||this.points==null){return;}
        //this.shader.uniforms.kpc.value = 3e2;
        let t = new THREE.Matrix4();
        this.pastTime+=deltaTime;
        // const displacement = this.pastTime / this.standardInterval;
        this.displacement = this.pastTime / this.standardInterval;
        this.shader.uniforms.displacement.value = Math.min(this.displacement,1.0);
        t.multiplyMatrices(camera.projectionMatrix,t).multiplyMatrices(t,camera.matrixWorldInverse);
        this.shader.uniforms.transformation.value = t;
    }


    constructor(colorMapUrl, starUrl, maxIndex) {
        
        this.colorMapUrl = colorMapUrl;
        this.starUrl = starUrl;
        this.maxIndex = maxIndex;
        this.colorMapReady = false;
        this.starTextureReady = false;
        this.colorNums = 0;
        this.colors = [];
        this.starBeginBuffer = [];
        this.starEndBuffer = [];
        this.starNums = 0;
        this.starAttrNums = 4;
        this.starDataReady = false;
        this.currentIndex = 0;
        this.initState = true;
        this.textureLoader = new THREE.TextureLoader();
        this.modelMat = new THREE.Matrix4().makeTranslation(new THREE.Vector3(0,0,0));
        this.modelMat.multiplyMatrices(this.modelMat,new THREE.Matrix4().makeScale(1,1,1))
        this.pastTime = 0.0;
        this.standardInterval = 2 * 1000;
        this.init();
    }






}

