import * as THREE from 'three';
import {GlobularEvolution} from './globularEvolution.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { EffectComposer, OutlinePass, OutputPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { BloomPass } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Timer } from 'three/examples/jsm/misc/Timer.js';


var stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1e20 );
const colorMapUrl = '/data/evolution/color.cmap';
const starDataUrl = '/data/evolution/nbin_new';
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


const processorControl = {
    paused:false,
    resetFlag:false,
    onPause:function (){
        this.paused = true;
    },
    resume:function (){
        this.paused = false;
    },
    reset:function(){
        this.resetFlag = true
    }
}

const evolutionSpeed = {
    speed:1
}

const progress = {
    progressText:"0/0"
}
gui.add(progress,"progressText").listen().name("Progress")



gui.add(shaderParameters,"colorScale").onChange((e)=>{
    globularEvolution.shader.uniforms.colorScale.value = e;
});

const controlFolder = gui.addFolder("Control")
controlFolder.open();
controlFolder.add(processorControl,"onPause").name("Pause")
controlFolder.add(processorControl,"resume").name("Resume")
controlFolder.add(processorControl,"reset").name("Reset")

gui.add(evolutionSpeed,"speed",1,100,1).name("Speed")





globularEvolution.shader.uniforms.colorScale.value = shaderParameters.colorScale;


const timer = new Timer();
function update(timeStampe){
    requestAnimationFrame(update);
    timer.update(timeStampe);
    controls.update();

    let deltaTime = timer.getDelta() * 1e3;
    deltaTime *= evolutionSpeed.speed * 0.5;
    if (processorControl.paused){
        deltaTime = 0;
    }
    if (processorControl.resetFlag){
        globularEvolution.reset();
        processorControl.resetFlag = false;
    }
    progress.progressText = `${globularEvolution.getCurrentIndex()}/${globularEvolution.getMaxIndex()}`
    globularEvolution.update(scene,camera,deltaTime);
    stats.begin()
    renderer.render(scene,camera);
    stats.end()
}

update();
