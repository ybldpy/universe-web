import * as THREE from "three";
import {Transformation,RenderData,UpdateData} from "./base";
import {Matrix4, ShaderMaterial} from "three";
import {appContext} from "../applicationContext";
import {RenderablePlanet} from "../renderable/globeBrowsing";
import {RENDERABLE_OBJECT_TYPES} from "../manage/renderableObjectManage"
import node from "three/src/nodes/core/Node";




export class SceneGraphNodeFactory{
    constructor() {


    }


    extractStr(json,name){
        const str = json[name];
        return typeof str ==="string"?str.toLowerCase():null;
    }


    extractTransformation(nodeParams){


        const transformationName = "transformation"
        const defaultTransformation = [0,0,0]
        if (!nodeParams.hasOwnProperty(transformationName)){
            return [defaultTransformation,defaultTransformation,defaultTransformation];
        }

        const transformation = nodeParams[transformationName]
        const translationName = "position";
        const rotationName = "rotation";
        const scalingName = "scaling";

        if (!translationName in transformation || !rotationName in transformation || ! scalingName in transformation){
            return null;
        }

        if ((!Array.isArray(transformation[translationName])||transformation[translationName].length!=3)
            ||(!Array.isArray(transformation[rotationName])||transformation[rotationName].length!=3)||(!Array.isArray(transformation[scalingName])||transformation[scalingName].length!=3)){
            return null;
        }
        return [transformation[translationName],transformation[rotationName],transformation[scalingName]];


    }

    /**
     *
     * @param nodeParams json object
     */
    createNode(nodeParams,scene){


        const identifier = this.extractStr(nodeParams,"identifier");
        if (identifier == null){
            return null;
        }
        if (scene.findNodeByIdentifier(identifier)!=null){return null;}

        let parentIdentifier  = this.extractStr(nodeParams,"parent");
        if (parentIdentifier == null){
            parentIdentifier = "root"
        }
        const parentNode = scene.findNodeByIdentifier(parentIdentifier);
        if (parentNode == null){return null;}



        const transfomation = this.extractTransformation(nodeParams);
        if (transfomation == null){
            return null;
        }
        let position = new THREE.Vector3(transfomation[0][0],transfomation[0][1],transfomation[0][1]);
        let rotationMat = new THREE.Matrix4().makeRotationFromEuler(transfomation[1][0],transfomation[1][1],transfomation[1][2]);
        let scaling = new THREE.Vector3(transfomation[2][0],transfomation[2][1],transfomation[2][2]);
        const renderable = nodeParams.renderableObject;
        let renderableObject = null;
        let reachRadius = nodeParams.reachRadius??10;
        if (renderable != undefined && renderable != null){
            const type = RENDERABLE_OBJECT_TYPES[renderable["type"]]
            if (type===undefined){return null;}
            renderableObject = new type(renderable["params"])
        }
        const sceneGraphNode = new SceneGraphNode({
            identifier:identifier,
            transformation:new Transformation(position, rotationMat, scaling),
            parentNode:parentNode,
            renderableObject:renderableObject,
            reachRadius:reachRadius
        });

        return sceneGraphNode


    }





}

export class SceneGraphNode{




    constructor({reachRadius = 10,identifier = "", transformation = new Transformation(), parentNode = null, renderableObject = null}){
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
        this.props = {
            [this.identifier]: null
        }

    }

    getProps(){
        if (this.renderableObject!=null){
            this.props[this.identifier] = this.renderableObject.getProps();
        }
        return this.props;
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
        return this.localPosition.clone();
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
        return this.worldRotation.clone();
    }
    getWorldScaling(){
        return this.worldScaling.clone();
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
        this.modelTransformionCached.makeTranslation(localPos.x,localPos.y,localPos.z).
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
    }

    updateRenderableObject(camera){
        if (this.renderableObject!=null){
            const transformation = new Transformation(this.getLocalPosition().clone(),this.getWorldRotation().clone(),this.getWorldScaling().clone());
            this.renderableObject.update(new UpdateData(transformation,camera));
        }
    }

    render(renderData,deferRenderingTaskQueue){
        if(this.renderableObject==null){return;}
        renderData.transformation = new Transformation(this.getLocalPosition(),this.getWorldRotation(),this.getWorldScaling());
        renderData.modelTransform = this.getModelTransform();
        this.renderableObject.render(renderData,deferRenderingTaskQueue);
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

    getAllNodeIdentifiers(){
        const identifiers = [];
        for(let i in this.nodes){
            identifiers.push(this.nodes[i].getIdentifier());
        }
        return identifiers;
    }


    /**
     *
     * @param node: node is configured accurately
     */
    addNode(node){
        this.nodes[node.getIdentifier()] = node;
        this.nodes[node.getParentIdentifier()].addChild(node);
        appContext["uiManager"].addSceneNodeUi(node.getProps(),node.getIdentifier());
    }

    update(camera){
        //nothing to update at present
        const nodesUpdateList = [this.nodes.root];
        const updateDataList = []
        while(nodesUpdateList.length > 0){
            const node = nodesUpdateList.shift();
            const updateData = new UpdateData(node.getTransformation(),camera);
            updateDataList.push(updateData);
            node.update(updateData);
            node.childrenNodes.forEach((node)=>{nodesUpdateList.push(node)})
        }
        nodesUpdateList.push(this.nodes.root);
        let idx = 0;
        while(nodesUpdateList.length > 0){
            const node = nodesUpdateList.shift();
            //const updateData = new UpdateData(node.getTransformation(),camera);
            node.updateRenderableObject(camera);
            node.childrenNodes.forEach((node)=>{nodesUpdateList.push(node)})
        }
    }

    onFocusNodeChange(camera){
        this.update(camera);
    }

    render(scene,camera,deferRenderingTaskQueue){
        const nodesUpdateList = [this.nodes.root];
        while(nodesUpdateList.length > 0){
            const node = nodesUpdateList.shift();
            const renderData = new RenderData(null,null,camera,scene);
            node.render(renderData,deferRenderingTaskQueue);
            node.childrenNodes.forEach((node)=>{nodesUpdateList.push(node)})
        }
    }


}