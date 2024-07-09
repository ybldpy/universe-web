import { FrameBufferRenderer } from "./renderer";
import * as THREE from "three";
import {WebGLRenderer} from "three";
import {Scene} from "./scene";
import scene from "three/addons/offscreen/scene";
export class RenderEngine{
    constructor(webGlRender,threeJsScene,camera){
        this.threeJsScene = threeJsScene;
        this.camera = camera;
        this.frameBufferRenderer = new FrameBufferRenderer(webGlRender);
        this.scene = null;
    }
    setThreeJsScene(threeJsScene){
        this.threeJsScene = threeJsScene;
    }
    getThreeJsScene(){
        return this.threeJsScene;
    }
    setScene(scene){
        this.scene = scene;
    }
    updateScene(){
        this.scene.update();
    }
    render(){
        if (this.scene == null){return;}
        this.scene.render(this.threeJsScene,this.camera);
        this.frameBufferRenderer.render(this.threeJsScene,this.camera);
    }
}