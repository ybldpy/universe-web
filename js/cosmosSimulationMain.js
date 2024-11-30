import * as THREE from "three";
import {RenderEngine} from "./rendering/renderEngine";
import {Scene, SceneGraphNode} from "./rendering/scene";
import {
    planets,
    createStarsTestNode,
    createOrbitTestNode,
    createSolarSystemPlantsOrbitNode
} from "./testData/PlanetNodes";
import {RenderablePlanet} from "./globeBrowsing";
import {Transformation} from "./rendering/base";
import {RenderableBackgroundSphere} from "./renderableBackgroundSphere";
import {Navigator} from "./navigation/navigator";
import {InteractionHandler} from "./interaction/interactionHandler";
import {Timer} from "three/addons/misc/Timer.js";
import {appContext} from "./applicationContext";
import * as dat from 'dat.gui';
import Stats from 'stats.js';

class App{



    constructor(webGlRender,threeJsScene,camera) {
        this.renderEngine = new RenderEngine(webGlRender,threeJsScene,camera);

        this.scene = new Scene();
        this.renderEngine.setScene(this.scene);
        appContext.camera = camera;
        appContext.scene = this.scene;
        this.camera = camera;
        this.camera.position.set(0,0,6000e5);
        this.camera.lookAt(0,0,0);
        this.ui = new dat.GUI();
        appContext["gui"] = this.ui
        this.navigator = new Navigator(this.camera,new InteractionHandler(webGlRender.domElement));
        appContext.navigator = this.navigator;

        const sceneGraphNode = new SceneGraphNode({identifier:"galaxy"});
        sceneGraphNode.parentNode = this.scene.findNodeByIdentifier("root");
        // sceneGraphNode.renderableObject = new RenderableBackgroundSphere(1e20,"/data/eso_dark.jpg");
        this.scene.addNode(sceneGraphNode);
        // this.scene.addNode(createOrbitTestNode());
        this.scene.addNode(createStarsTestNode("stars","speck","/data/stars/stars.speck","",4.0));
        this.scene.addNode(createStarsTestNode("Gaia","streamOctree","/data/stars/octree/index.json","/data/stars/octree",5.0))
        this.scene.addNode(createStarsTestNode("LAMOST","streamOctree","/data/stars/octree_LA/index.json","/data/stars/octree_LA",6.0))
        planets.forEach((i)=>{this.addGraphNode(i);});
        createSolarSystemPlantsOrbitNode().forEach((node)=>{
            this.scene.addNode(node)
        });
        //this.controls = new OrbitControls(camera,webGlRender.domElement);
        this.navigator.orbitNavigator.setFocusNode(this.scene.findNodeByIdentifier("earth"));
        this.timer = new Timer();
        this.stat = new Stats()
        document.body.appendChild(this.stat.dom)
        this.initUI();
    }

    initUI(){




        const nodeIds = [];
        const sceneFolder = this.ui.addFolder("scene")
        this.scene.getAllNodes().forEach(node=>{
            const nodeUI = sceneFolder.addFolder(node.getIdentifier())
            node.addUIComponent(nodeUI)
           if (node.renderableObject!=null){
               nodeIds.push(node.getIdentifier());
           }
        });
        const focus = {
            focusNode:this.navigator.orbitNavigator.getFocusNode().getIdentifier()
        }
        this.focusNodeUI = this.ui.add(focus,"focusNode",nodeIds).onChange(value=>{
            const nextFocusNode = this.scene.findNodeByIdentifier(value);
            this.navigator.pathNavigator.flyTo(nextFocusNode,this.camera);
        });
    }


    render(timeStamp){
        requestAnimationFrame((t)=>{this.render(t)});
        // this.controls.update();

        this.timer.update(timeStamp);
        const deltaTime = this.timer.getDelta();
        this.navigator.update(deltaTime);
        this.renderEngine.updateScene();
        this.stat.begin()
        this.renderEngine.render();
        this.stat.end()
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


const renderer = new THREE.WebGLRenderer({});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1e15 );
const scene = new THREE.Scene();
const app = new App(renderer,scene,camera);

app.render();


