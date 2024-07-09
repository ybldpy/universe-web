import * as THREE from 'three';
import {GlobularEvolution} from './globularEvolution.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { EffectComposer, OutlinePass, OutputPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { BloomPass } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
var stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1e20 );
const colorMapUrl = '/data/color.cmap';
const starDataUrl = '/data/nbin_new';
const renderer = new THREE.WebGLRenderer();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
composer.addPass(new BloomPass(3,3,0.4));
composer.addPass(new OutputPass());
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const globularEvolution = new GlobularEvolution(colorMapUrl,starDataUrl,100);
const box = new THREE.BoxGeometry(3,3,3);
const mat = new THREE.MeshBasicMaterial({color:0x11ff00})
const cube = new THREE.Mesh(box,mat);
scene.add(cube)
const controls = new OrbitControls( camera, renderer.domElement );
camera.position.set(1e14,1e14,1e14);
controls.update();
const gui = new dat.GUI({})
const shaderParameters = {
    colorScale:1.0
}
gui.add(shaderParameters,"colorScale").onChange((e)=>{
    
    globularEvolution.shader.uniforms.colorScale.value = e;
});
globularEvolution.shader.uniforms.colorScale.value = shaderParameters.colorScale;
import { Timer } from 'three/examples/jsm/misc/Timer.js';
const timer = new Timer();
function update(timeStampe){
    requestAnimationFrame(update);
    timer.update(timeStampe);
    controls.update();
    globularEvolution.update(scene,camera,timer.getDelta() * 1e3);
    stats.begin()
    renderer.render(scene,camera);
    stats.end()
}


function moveCamera(code){
    const speed = 1e2;
    const dictFromCenterToCam = camera.position.clone();
    dictFromCenterToCam.normalize();
    // const moveDict = dictFromCenterToCam;
    // if(code == 1){
    //     moveDict.negate();
    // }

    // camera.position.addScaledVector(moveDict,speed);
    controls.update();
}

// window.onload = function(){
//     document.getElementById("x-").onclick = ()=>{moveCamera(1);}
//     document.getElementById("x+").onclick = ()=>{moveCamera(2);}
//     document.getElementById("y-").onclick = ()=>{moveCamera(3);}
//     document.getElementById("y+").onclick = ()=>{moveCamera(4);}
//     document.getElementById("z-").onclick = ()=>{moveCamera(5);}
//     document.getElementById("z+").onclick = ()=>{moveCamera(6);}

// }


update();
