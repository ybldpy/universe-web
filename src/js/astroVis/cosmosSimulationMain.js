import * as THREE from "three";
import {RenderEngine} from "./rendering/renderEngine";
import {Scene, SceneGraphNode, SceneGraphNodeFactory} from "./rendering/scene";
import {
    defaultAssets,
    createStarsTestNode,
    createOrbitTestNode,
    createSolarSystemPlantsOrbitNode
} from "./testData/PlanetNodes";
import {RenderablePlanet} from "./renderable/globeBrowsing";
import {Transformation} from "./rendering/base";
import {RenderableBackgroundSphere} from "./renderableBackgroundSphere";
import {Navigator} from "./navigation/navigator";
import {InteractionHandler} from "./interaction/interactionHandler";
import {Timer} from "three/addons/misc/Timer.js";
import {appContext} from "./applicationContext";
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import {AssetManager} from "./manage/assetManage";
import {BACKEND_API,PARAMETERS} from "../api";
import {RenderableModel} from "./renderable/renderableModel";

class App{



    constructor(webGlRender,threeJsScene,camera) {
        this.renderEngine = new RenderEngine(webGlRender,threeJsScene,camera);
        this.scene = new Scene();
        this.sceneGraphNodeFactory = new SceneGraphNodeFactory()
        this.renderEngine.setScene(this.scene);
        appContext.camera = camera;
        appContext.scene = this.scene;
        this.camera = camera;
        this.camera.position.set(0,0,6000e5);
        this.camera.lookAt(0,0,0);
        this.ui = new dat.GUI();
        appContext["gui"] = {
            "root": this.ui,
            "scene": this.ui.addFolder("scene"),
        }
        this.navigator = new Navigator(this.camera,new InteractionHandler(webGlRender.domElement));

        appContext.navigator = this.navigator;
        this.assetManager = new AssetManager();

        this.assetManager.loadAssets(defaultAssets(),this.scene);
        this.assetManager.loadUserAssets(BACKEND_API.FILE_QUERYALL,{status:PARAMETERS.FILE.STATUS.READY},this.scene);

        const sceneGraphNode = new SceneGraphNode({identifier:"galaxy"});
        sceneGraphNode.parentNode = this.scene.findNodeByIdentifier("root");
        sceneGraphNode.renderableObject = new RenderableBackgroundSphere(1e20,"/data/eso_dark.jpg");
        this.scene.addNode(createStarsTestNode("stars","speck","/data/stars/stars.speck",4.0));
        // this.scene.addNode(createStarsTestNode("Gaia","streamOctree","/data/stars/octree",5.0))
        // this.scene.addNode(createStarsTestNode("LAMOST","streamOctree","/data/stars/octree_LA",6.0))
        createSolarSystemPlantsOrbitNode().forEach((node)=>{
            this.scene.addNode(node)
        });
        this.navigator.orbitNavigator.setFocusNode(this.scene.findNodeByIdentifier("earth"));
        this.timer = new Timer();
        this.stat = new Stats();
        document.body.appendChild(this.stat.dom);
        this.initUI();

        new RenderableModel({modelUrl:"/data/3dModel/EinsteinProbe.fbx"})

        // this.ui.add({"fov":45},"fov")


        // fetch("https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/0/0/0.jpg").then((response)=>{
        //     console.log(response);
        // })
    }

    initUI(){
        const nodeIds = [];

        this.scene.getAllNodes().forEach(node=>{
            // const nodeUI = sceneFolder.addFolder(node.getIdentifier());
            // node.setupUI();
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

        this.ui.add({jumpToDataManagement:()=>{
            window.location.href = "/dataManagement.html"
            }}, 'jumpToDataManagement').name('Go to upload data');


    }


    render(timeStamp){
        requestAnimationFrame((t)=>{this.render(t)});
        // this.controls.update();

        this.timer.update(timeStamp);
        const deltaTime = this.timer.getDelta();
        this.navigator.update(deltaTime);
        this.camera.updateMatrixWorld(true)
        this.renderEngine.updateScene();
        this.stat.begin()
        this.renderEngine.render();
        this.stat.end()
    }

    addGraphNode(nodeJson){
        const node = this.sceneGraphNodeFactory.createNode(nodeJson,this.scene)
        if (node == null){return;}
        this.scene.addNode(node);
    }




    resize(){
        this.renderEngine.resize(window.innerWidth,window.innerHeight);
    }

}


const renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer:true,antialias:false});
renderer.setSize( screen.width,screen.height );
document.body.appendChild( renderer.domElement );
const camera = new THREE.PerspectiveCamera( 45, screen.width / screen.height, 1, 1e25 );
const scene = new THREE.Scene();
const app = new App(renderer,scene,camera);
app.render();
window.onresize = ()=>{
    app.resize()
}


