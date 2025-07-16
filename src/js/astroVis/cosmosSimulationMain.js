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
// import {RenderableBackgroundSphere} from "./renderableBackgroundSphere";
import {NavigationController} from "./navigation/navigator";
import {InteractionHandler} from "./interaction/interactionHandler";
import {Timer} from "three/addons/misc/Timer.js";
import {appContext} from "./applicationContext";
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import {AssetManager} from "./manage/assetManage";
import {BACKEND_API,PARAMETERS} from "../api";
import {RenderableModel} from "./renderable/renderableModel";
import {createApp,reactive} from "vue";
import UiComponent from "./GUI/AstroVisGUI.vue";
import {UIManager} from "./GUI/GuiManager";

class App{




    constructor(webGlRender,threeJsScene,camera,uiContainer) {
        this.renderEngine = new RenderEngine(webGlRender,threeJsScene,camera);
        this.stat = new Stats();
        appContext["uiManager"] = new UIManager(this,this.stat);
        this.scene = new Scene();
        this.sceneGraphNodeFactory = new SceneGraphNodeFactory()
        this.renderEngine.setScene(this.scene);
        appContext.camera = camera;
        appContext.scene = this.scene;
        this.camera = camera;
        this.camera.position.set(2000e4,2000e4,2000e4);
        this.camera.lookAt(0,0,0);
        this.navigator = new NavigationController(this.camera,new InteractionHandler(webGlRender.domElement));
        appContext.navigator = this.navigator;
        this.assetManager = new AssetManager();
        this.assetManager.addAssets(defaultAssets(),this.scene);
        this.assetManager.loadUserAssets(BACKEND_API.FILE_QUERYALL,{status:PARAMETERS.FILE.STATUS.READY},this.scene);

        const sceneGraphNode = new SceneGraphNode({identifier:"galaxy"});
        sceneGraphNode.parentNode = this.scene.findNodeByIdentifier("root");
        //sceneGraphNode.renderableObject = new RenderableBackgroundSphere(1e20,"/data/eso_dark.jpg");
        this.scene.addNode(createStarsTestNode("stars","speck","/data/stars/stars.speck",6.8));
        // this.scene.addNode(createStarsTestNode("LAMOST","streamOctree","/data/stars/octree_LA",2.0))
        this.scene.addNode(createStarsTestNode("85Clusters","speck", "/data/stars/85Clusters.speck", 6.0));
        // this.scene.addNode(createStarsTestNode("Gaia","streamOctree","/data/stars/octree",5.0))
        // this.scene.addNode(createStarsTestNode("LAMOST","streamOctree","/data/stars/octree_LA",6.0))
        createSolarSystemPlantsOrbitNode().forEach((node)=>{
            this.scene.addNode(node)
        });
        this.navigator.setFocusNode(this.scene.findNodeByIdentifier("earth"));
        this.timer = new Timer();

        //new RenderableModel({modelUrl:"/data/3dModel/EinsteinProbe.fbx"})
    }





    getUIManager(){
        return appContext.uiManager;
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

    getFocusNodeName(){
        return this.navigator.getFocusNode().getIdentifier()
    }


    getNodeIdentifiers(){

        return this.scene.getAllNodes()

    }

    flyTo(targetName){
        this.navigator.flyTo(targetName)
    }

}




const renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer:true});
// import { VRButton } from 'three/addons/webxr/VRButton.js';
// document.body.appendChild( VRButton.createButton( renderer ) );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1e25 );
const scene = new THREE.Scene();
const app = new App(renderer,scene,camera);
app.render();
window.onresize = ()=>{
    app.resize()
}


console.log(app.getUIManager().getSceneNodesUi());

const uiComp = createApp(UiComponent,{
    uiManager:app.getUIManager()
})
uiComp.mount("#UI")


