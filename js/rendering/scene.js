import * as THREE from "three";
import {Transformation,RenderData,UpdateData} from "./base";
import {Matrix4, ShaderMaterial} from "three";
import {appContext} from "../applicationContext";


export class SceneGraphNode{
    constructor({reachRadius = 10,identifier = "", transformation = new Transformation(), parentNode = null, renderableObject = null} = {}){
        this.identifier = identifier;
        this.parentNode = parentNode;
        this.childrenNodes = [];
        this.transformation = transformation;
        this.renderableObject = renderableObject;
        this.reachRadius = reachRadius;
        this.worldPosition = new THREE.Vector3();
        this.worldRotation = new THREE.Matrix4();
        this.worldScaling = new THREE.Vector3();
        this.scalingMat = new THREE.Matrix4();
        this.modelTransformionCached = new THREE.Matrix4();
        this.localPosition = new THREE.Vector3();
    }

    getReachRadius(){
        return this.reachRadius;
    }
    getParentIdentifier(){
        if (this.parentNode == null){return null;}
        return this.parentNode.getIdentifier();
    }

    //return the position relative to focus node
    getLocalPosition(){
        return this.localPosition;
    }

    calcLocalPosition(){
        const focusNode = appContext.navigator.orbitNavigator.getFocusNode();
        if (focusNode.getIdentifier() === this.getIdentifier()){
            this.localPosition.set(0,0,0);
        }
        const worldPos = this.getWorldPosition().clone();
        const focusNodeWorldPos = focusNode.getWorldPosition();
        this.localPosition = worldPos.applyMatrix4(new THREE.Matrix4().makeTranslation(focusNodeWorldPos.x,focusNodeWorldPos.y,focusNodeWorldPos.z).invert());

    }

    addChild(node){
        this.childrenNodes.push(node);
    }
    getIdentifier(){
        return this.identifier;
    }

    getTransformation(){
        return this.transformation;
    }

    getWorldPosition(){
        return this.worldPosition;
    }
    getWorldRotation(){
        return this.worldRotation;
    }
    getWorldScaling(){
        return this.worldScaling;
    }
    addChild(node){
        this.childrenNodes.push(node);
    }
    calcWorldPosition(transformation){
        if (this.parentNode==null){
            return transformation.translation;
        }

        const parentWorldPosition = this.parentNode.getWorldPosition();
        const parentWorldRotation = this.parentNode.getWorldRotation();
        const parentWorldScaling = this.parentNode.getWorldScaling();
        const position = transformation.translation.clone();

        position.multiply(parentWorldScaling).applyMatrix4(parentWorldRotation);
        const worldPosition = parentWorldPosition.clone();
        return worldPosition.add(position);
    }
    calcWorldRotation(transformation){
        if(this.parentNode==null){
            return transformation.rotation;
        }
        return transformation.rotation.clone().multiply(this.parentNode.getWorldRotation());
    }
    calcWorldScaling(transformation){
        if(this.parentNode == null){
            return transformation.scaling;
        }
        return transformation.scaling.clone().multiply(this.parentNode.getWorldScaling());
    }
    calcModelTransform(){
        const localPos = this.getLocalPosition();
        this.modelTransformionCached.makeTranslation(localPos,localPos.y,localPos.z).
        multiply(this.scalingMat.makeScale(this.worldScaling.x,this.worldScaling.y,this.worldScaling.z)).multiply(this.worldRotation);
    }
    getModelTransform(){
        return this.modelTransformionCached;
    }

    update(updateData){
        this.transformation.translation = updateData.transformation.translation;
        this.transformation.rotation = updateData.transformation.rotation;
        this.transformation.scaling = updateData.transformation.scaling;

        this.worldPosition = this.calcWorldPosition(updateData.transformation);
        this.worldRotation = this.calcWorldRotation(updateData.transformation);
        this.worldScaling = this.calcWorldScaling(updateData.transformation);
        this.calcLocalPosition();
        this.calcModelTransform();
        if (this.renderableObject!=null){
            this.renderableObject.update(new UpdateData(new Transformation(this.worldPosition.clone(),this.worldRotation.clone(),this.worldScaling.clone())));
        }
    }
    render(renderData){
        if(this.renderableObject==null){return;}
        // const data = new RenderData(new Transformation(this.getWorldPosition(),this.getWorldRotation(),this.getWorldScaling()),
        //     renderData.camera,
        //     renderData.scene);
        this.renderableObject.render(renderData);
    }
}

export class Scene{

    constructor() {
        // this.root = new SceneGraphNode("root");
        // this.cachedNodeIdentifier = new Set();
        // this.cachedNodeIdentifier.add("root");
        this.nodes = {
            "root":new SceneGraphNode({identifier:"root"})
        };
    }

    findNodeByIdentifier(identifier){
        const node = this.nodes[identifier];
        return node == undefined?null:node;
    }

    getAllNodes(){
        const nodes = [];
        for(const key in this.nodes){
            nodes.push(this.nodes[key]);
        }
        return nodes;
    }


    /**
     *
     * @param node: node is configured accurately
     */
    addNode(node){
        this.nodes[node.getIdentifier()] = node;
        this.nodes[node.getParentIdentifier()].addChild(node);
    }

    update(){
        //nothing to update at present
        const nodesUpdateList = [this.nodes.root];
        while(nodesUpdateList.length > 0){
            const node = nodesUpdateList.shift();
            const updateData = new UpdateData(node.getTransformation());
            node.update(updateData);
            node.childrenNodes.forEach((node)=>{nodesUpdateList.push(node)})
        }
    }

    onFocusNodeChange(){
        this.update();
    }

    render(scene,camera){
        const nodesUpdateList = [this.nodes.root];
        while(nodesUpdateList.length > 0){
            const node = nodesUpdateList.shift();
            const renderData = new RenderData(new Transformation(node.getLocalPosition(),node.getWorldRotation(),node.getWorldScaling()),node.getModelTransform(),camera,scene);
            node.render(renderData);
            // console.log(camera);
            node.childrenNodes.forEach((node)=>{nodesUpdateList.push(node)})
        }
    }


}