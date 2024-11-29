import * as THREE from "three";



export class Transformation{

    /**
     *
     * @param translation:vec3
     * @param rotation:mat4
     * @param scaling:vec3
     */
    constructor(translation = new THREE.Vector3(),rotation=new THREE.Matrix4(),scaling = new THREE.Vector3(1,1,1)){
        this.translation = translation;
        this.rotation = rotation;
        this.scaling = scaling;
    }
}
export class UpdateData{
    constructor(transformation){
        this.transformation = transformation;
    }
}
export class RenderData{
    constructor(transformation,modelTransform,camera,scene){
        this.transformation = transformation;
        this.modelTransform = modelTransform;
        this.camera = camera;
        this.scene = scene;
    }

    
}
export class RenderableObject{
    constructor(){}



    addUIComponent(uiComponent){}

    update(updateData){}
    render(renderData){}
}
