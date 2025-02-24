import { FrameBufferRenderer } from "./renderer";
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
        this.scene.update(this.camera);
    }
    render(){
        if (this.scene == null){return;}
        this.scene.render(this.threeJsScene,this.camera,this.frameBufferRenderer.getPostProcessShaderQueue());
        this.frameBufferRenderer.render(this.threeJsScene,this.camera);
    }



    resize(width,height){
        this.frameBufferRenderer.resize(width,height);
        //this.camera.aspect = width/height;
        //this.camera.updateProjectionMatrix();
    }
}