import {RenderEngine} from "./rendering/renderEngine";
import {Scene, SceneGraphNode} from "./rendering/scene";
import {planets} from "./testData/PlanetNodes";
import {RenderablePlanet} from "./globeBrowsing";
import {Transformation} from "./rendering/base";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RenderableBackgroundSphere} from "./renderableBackgroundSphere";
import {Navigator} from "./navigation/navigator";
import {InteractionHandler} from "./interaction/interactionHandler";
import {Timer} from "three/addons/misc/Timer.js";

class App{
    constructor(webGlRender,threeJsScene,camera) {
        this.renderEngine = new RenderEngine(webGlRender,threeJsScene,camera);
        this.scene = new Scene();
        this.renderEngine.setScene(this.scene);
        const sceneGraphNode = new SceneGraphNode({identifier:"galaxy"});
        sceneGraphNode.parentNode = this.scene.findNodeByIdentifier("root");
        sceneGraphNode.renderableObject = new RenderableBackgroundSphere(1e16,"/data/eso_dark.jpg");
        this.scene.addNode(sceneGraphNode);
        planets.forEach((i)=>{this.addGraphNode(i);});
        this.camera = camera;
        this.camera.position.set(0,0,6000e5);
        this.camera.lookAt(0,0,0);
        //this.controls = new OrbitControls(camera,webGlRender.domElement);
        this.navigator = new Navigator(this.camera,new InteractionHandler(webGlRender.domElement),this.scene.findNodeByIdentifier("earth"));
        this.timer = new Timer();
    }
    render(timeStamp){
        requestAnimationFrame((t)=>{this.render(t)});
        // this.controls.update();
        this.timer.update(timeStamp);
        const deltaTime = this.timer.getDelta();
        this.navigator.update(deltaTime);
        this.renderEngine.updateScene();
        this.renderEngine.render();
    }

    addGraphNode(nodeJson){
        function extractStr(json,name){
            const str = json[name];
            return typeof str ==="string"?str.toLowerCase():null;
        }
        const identifier = extractStr(nodeJson,"identifier");
        if (identifier == null){
            return;
        }
        if (this.scene.findNodeByIdentifier(identifier)!=null){return;}
        let parentIdentifier  = extractStr(nodeJson,"parent");
        if (parentIdentifier == null){return;}
        const parentNode = this.scene.findNodeByIdentifier(parentIdentifier);
        if (parentNode == null){return;}
        let position = new THREE.Vector3(nodeJson.transformation.position[0],nodeJson.transformation.position[1],nodeJson.transformation.position[2]);
        let rotation = nodeJson.transformation.rotation;
        let rotationMat = new THREE.Matrix4().makeRotationFromEuler(rotation[0],rotation[1],rotation[2]);
        let scaling = new THREE.Vector3(nodeJson.transformation.scaling[0],nodeJson.transformation.scaling[1],nodeJson.transformation.scaling[2]);
        const renderable = nodeJson.renderableObject;
        let renderableObject = null;
        let reachRadius = nodeJson.reachRadius;
        if (renderable != undefined && renderable != null){
            const radius = renderable.radius;
            const layers = [];
            if (renderable.layers != undefined && renderable.layers != null){
                renderable.layers.forEach((l)=>{layers.push(l)});
            }
            renderableObject = new RenderablePlanet({radius: radius,layers: layers});
        }
        const sceneGraphNode = new SceneGraphNode({
            identifier:identifier,
            transformation:new Transformation(position, rotationMat, scaling),
            parentNode:parentNode,
            renderableObject:renderableObject,
            reachRadius:reachRadius
        });
        this.scene.addNode(sceneGraphNode);
    }
}


const renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer:true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1e15 );
const scene = new THREE.Scene();
const app = new App(renderer,scene,camera);

app.render();


