import * as THREE from 'three';
import {GlobularEvolution} from './globularEvolution.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/Addons.js';
import * as Lerc from 'lerc';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three-stdlib';



async function f1(){
    await Lerc.load({locateFile:(a,b)=>{console.log(a,b);return "/node_modules/lerc/lerc-wasm.wasm"}});

    const arrayBuffer = await fetch('http://earthlive.maptiles.arcgis.com/arcgis/rest/services/GCS_Elevation3D/ImageServer/tile/0/0/0')
    .then(response => response.arrayBuffer());
    const pixelBlock = Lerc.decode(arrayBuffer);
    const { height, width, pixels, mask } = pixelBlock;
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (!mask || mask[i * width + j]) {
                //console.log(pixels[0][i * width + j]);
            }
        }
    }
}





// const vs = `
// precision highp float;
// in vec3 position;
// uniform mat4 trans;

// void main(){
    
//     gl_Position = trans * vec4(position,1.0);
    
// }
// `

// const fs = `
// precision highp float;

// out vec4 col;
// void main(){
    
//     col = vec4(1.0,1.0,1.0,1.0);
    
// }
// `



// new THREE.TextureLoader().load("/data/halo.png",onload = (texture)=>{
//     console.log(texture);
// },onerror = (e)=>{
//     console.log("error");
//     console.log(e);
// })


// const scene = new THREE.Scene();


// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(80,80,80);


const scene = new THREE.Scene();
// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const control = new OrbitControls(camera,renderer.domElement);
//const control = new FlyControls(camera,renderer.domElement)


const pointLight = new THREE.PointLight(0xffffff,1);
scene.add(pointLight)
scene.add(new THREE.AmbientLight(0xffffff,0.7))
pointLight.position.set(100,100,100);
const baseGeo = new THREE.SphereGeometry(10,32,32);
const baseMaterial = new THREE.MeshBasicMaterial({color:0xffffff});
// scene.add(new THREE.Mesh(baseGeo,baseMaterial));
const geometry = new THREE.SphereGeometry(60,64,64);
const atmosphere = new THREE.Mesh(geometry,baseMaterial);
atmosphere.material.side = THREE.FrontSide;
// scene.add(atmosphere);
// atmosphere.material.wireframe = true

scene.background = new THREE.Color(0xffffff)

// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    control.update(0.01);
    renderer.render(scene, camera);
}
// animate();

const lod = new THREE.LOD()
const modelLoader = new GLTFLoader();
modelLoader.load("/data/nanosuit.glb",(gltf)=>{
    const model = gltf.scene;
    // 遍历模型中的每个对象
    model.traverse((object) => {
      if (object.isMesh) {
        // 为每个 Mesh 对象创建线框材质
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          //map:object.material.map,// 或者你想要的颜色
          color:0,
          wireframe: true
        });
        const modifier = new SimplifyModifier();
        let simplifiedGeometry = modifier.modify(object.geometry, Math.floor(object.geometry.attributes.position.count * 0.73)); // 减少50%的顶点
        object.geometry = simplifiedGeometry;
  
        // 设置材质为线框材质
        object.material = wireframeMaterial;
      }
    });

    new THREE.TorusGeometry()
  
    // 将模型添加到场景中
    scene.add(model)
    animate()
})