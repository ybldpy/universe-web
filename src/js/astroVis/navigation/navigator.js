import * as THREE from "three";
import {clamp} from "three/src/math/mathutils";
import {InteractionHandler} from "../interaction/interactionHandler";
import {appContext} from "../applicationContext";


function calcRotationBetweenCameraAndNode(camera,node){
    const cameraToCenterDict = node.getLocalPosition().clone().sub(camera.position).normalize();
    const cameraUp = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
    const cameraViewDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraViewDirection);
    return calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,cameraViewDirection.add(cameraUp).normalize());
}

function calcLookAtQuaternion(eye,target,up){
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye,target,up));
}

function slerpCameraLookAtToNode(camera,node,t){
    const targetQuat = calcRotationBetweenCameraAndNode(camera,node);
    camera.quaternion.slerp(targetQuat,t);
}

export class NavigationController{

    constructor(camera,interactionHandler) {
        this.camera = camera;
        this.orbitNavigator = new OrbitNavigator();
        this.pathNavigator = new PathNavigator();
        this.interactionHandler = interactionHandler;
    }

    update(deltaTime){
        this.interactionHandler.updateState(deltaTime);
        if (this.pathNavigator.isFlying()){
            this.pathNavigator.update(this.camera,deltaTime);
        }
        else {
            this.orbitNavigator.updateCamera(this.camera,deltaTime,this.interactionHandler);
        }
    }


    setFocusNode(focusNode){
        this.orbitNavigator.setFocusNode(focusNode);
    }
    getFocusNode(){
        return this.orbitNavigator.getFocusNode();
    }
    flyTo(targetNodeName){
        const flyToNode = appContext.scene.findNodeByIdentifier(targetNodeName);
        if (flyToNode===null || flyToNode===undefined){
            return
        }
        this.pathNavigator.flyTo(flyToNode,this.camera);
    }


}



class OrbitNavigator{

    constructor(){
        this.focusNode = appContext.scene.findNodeByIdentifier("root");
        this.needTarget = false;
        this.targetDuration = 1000;
        this.targetCount = 0;
    }
    pushToSurface(camera,deltaTime,focusNode,interactionHandler){
        const inversedModelTransform = focusNode.getModelTransform().clone().invert();
        const centerToCameraVector = camera.position.clone().applyMatrix4(inversedModelTransform);
        const length = centerToCameraVector.length();
        const dict = centerToCameraVector.clone().normalize();
        const reachRadius = focusNode.getReachRadius();
        const surfaceToCamLength = length - reachRadius;
        const velocity = interactionHandler.getTranslateVelocity();
        const cameraNewPosModelSpace = new THREE.Vector3(
            centerToCameraVector.x - dict.x * surfaceToCamLength * velocity * deltaTime,
            centerToCameraVector.y - dict.y * surfaceToCamLength * velocity * deltaTime,
            centerToCameraVector.z - dict.z * surfaceToCamLength * velocity * deltaTime);
        if(cameraNewPosModelSpace.length()<=reachRadius){
            interactionHandler.resetTranslateVelocity();
            const goBackSpeed = 0.1 * reachRadius;
            cameraNewPosModelSpace.set(centerToCameraVector.x + dict.x * goBackSpeed * deltaTime,
                centerToCameraVector.y + dict.y * goBackSpeed * deltaTime,
                centerToCameraVector.z + dict.z * goBackSpeed * deltaTime);
        }
        camera.position.copy(cameraNewPosModelSpace.applyMatrix4(focusNode.getModelTransform()));
    }
    decomposeCameraRotation(camera){
        const camRotation = camera.quaternion.clone();
        // const cameraViewWorldSpace = new THREE.Vector3();
        // camera.getWorldDirection(cameraViewWorldSpace);
        // const cameraToCenterDict = focus.getPosition().clone().sub(camera.position).normalize();
        // let localRotation1 = new THREE.Quaternion().setFromUnitVectors(cameraToCenterDict,cameraViewWorldSpace.normalize());
        // //localRotation.copy(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))));
        // const globalRotation = camRotation.clone().multiply(localRotation1);

        const globalRotation = this.calculateGlobalRotation(camera,this.focusNode);
        const localRotation = globalRotation.clone().invert().multiply(camRotation);
        return {localRotation,globalRotation};
    }
    calculateGlobalRotation(camera,focus){
        return calcRotationBetweenCameraAndNode(camera,focus);
    }
    calcLookAtQuaternion(eye,target,up){
        return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye,target,up));
    }

    rotateLocally(camera,localRotation,deltaTime,interactionHandler){
        const localRotate = interactionHandler.getLocalRotate();
        const pitch = clamp(-localRotate.y,-89,89)*Math.PI/180 * deltaTime;
        const yaw = clamp(-localRotate.x,-179,179)*Math.PI/180*deltaTime;
        const euler = new THREE.Euler(pitch,yaw,0,"XYZ");
        localRotation = localRotation.multiply(new THREE.Quaternion().setFromEuler(euler));
        // const lookAtMat = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation));
        // return new THREE.Quaternion().setFromRotationMatrix(lookAtMat).invert();
        //return localRotation
        return calcLookAtQuaternion(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))
    }
    rotateGlobally(camera,anchor,globalRotation){
        const anchorPosition = anchor.getLocalPosition().clone();
        const cameraToCenterDict = anchorPosition.sub(camera.position).normalize();
        //const lookAtMat = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
        // return new THREE.Quaternion().setFromRotationMatrix(lookAtMat).invert();
        return calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
    }
    rotateAroundAnchor(camera,deltaTime,globalRotation,focusNode,interactionHandler){
        const globalRotate = interactionHandler.getGlobalRotate();
        const focusNodePosition = new THREE.Vector3();
        const centerToCameraVecWorldSpace = camera.position.clone().sub(focusNodePosition);
        const lengthToSurface = centerToCameraVecWorldSpace.length() - focusNode.getReachRadius();
        const scale = Math.min(lengthToSurface / focusNode.getReachRadius(),1.0);
        const pitch = clamp(-globalRotate.y*scale,-89,89)*Math.PI/180 * deltaTime;
        const yaw = clamp(-globalRotate.x*scale,-179,179)*Math.PI/180 * deltaTime;
        const euler = new THREE.Euler(pitch,yaw,0,"XYZ");
        const targetQuat = new THREE.Quaternion().setFromEuler(euler);
        const rotationDiffWorldSpace = globalRotation.clone().multiply(targetQuat).multiply(globalRotation.clone().invert());
        globalRotation.multiply(targetQuat);
        const cameraPosWorldSpace = centerToCameraVecWorldSpace.clone().applyQuaternion(rotationDiffWorldSpace).sub(centerToCameraVecWorldSpace);
        camera.position.add(cameraPosWorldSpace);
    }
    setFocusNode(focusNode){
        const lastFocusNode = this.focusNode;
        if (lastFocusNode.getIdentifier() == focusNode.getIdentifier()){
            return;
        }
        this.focusNode = focusNode;
        appContext.scene.onFocusNodeChange(appContext.camera);
        const camera = appContext.camera;
        //initializing
        if (lastFocusNode == null){
            //const inversedFocusNodeTranslation = new THREE.Matrix4().makeTranslation(focusNodeWorldPos.x,focusNodeWorldPos.y,focusNodeWorldPos.z).invert();
            const focusNodePos = this.focusNode.getWorldPosition();
            camera.position.set(camera.position.x - focusNodePos.x,camera.position.y - focusNodePos.y,camera.position.z - focusNodePos.z);
            //camera.lookAt.applyMatrix4(inversedFocusNodeTranslation);
            return;
        }
        camera.position.add(lastFocusNode.getLocalPosition());
    }
    getFocusNode(){
        return this.focusNode;
    }

    setNeedTarget(needTarget){
        this.needTarget = needTarget;
    }

    targetNode(node,camera,deltaTime){
        //let {localRotation,globalRotation} = this.decomposeCameraRotation(camera,this.focusNode);
        this.targetCount += deltaTime * 100;
        let t = this.targetCount / this.targetDuration;
        if (t>=1){
            t = 1;
            this.targetCount = 0;
            this.setNeedTarget(false);
        }
        slerpCameraLookAtToNode(camera,node,t);

    }

    rotate(camera,deltaTime,focusNode,interactionHandler){
        if (this.needTarget){
            this.targetNode(this.focusNode,camera,deltaTime);
            return;
        }
        let {localRotation,globalRotation} = this.decomposeCameraRotation(camera,focusNode);
        localRotation = this.rotateLocally(camera,localRotation,deltaTime,interactionHandler);
        this.rotateAroundAnchor(camera,deltaTime,globalRotation,focusNode,interactionHandler);
        globalRotation = this.rotateGlobally(camera,focusNode,globalRotation);
        camera.quaternion.copy(globalRotation.multiply(localRotation));
    }

    updateCamera(camera,deltaTime,interactionHandler){
        deltaTime = Math.min(deltaTime,0.05);
        this.rotate(camera,deltaTime,this.focusNode,interactionHandler);
        this.pushToSurface(camera,deltaTime,this.focusNode,interactionHandler);
    }
}



export class PathNavigator{


    constructor() {
        this.hasPath = false;
        this.targetNode = null;
        this.beginNode = null;
        this.startPosition = new THREE.Vector3();
        this.pathLength = 0;
        //ms
        this.moveCameraLookAtToTargetDuration = 1500;
        this.moveCameraLookAtToTargetCount = 0;

        this.moveCameraPositionTargetDuration = 2500;
        this.moveCameraPositionTargetCount = 0;


        this.moveDone = false;
        this.adjustCameraDone = false;
    }

    flyTo(node,camera){
        this.reset();
        this.targetNode = node;
        if (this.targetNode == null || this.targetNode == undefined){
            this.targetNode = null;
            return;
        }
        this.startPosition.copy(camera.position);
        this.beginNode = appContext.navigator.getFocusNode();
        this.hasPath = true;
        this.pathLength = this.targetNode.getLocalPosition().distanceTo(this.beginNode.getLocalPosition());
    }

    reset() {
        this.hasPath = false;
        this.targetNode = null;
        this.beginNode = null;
        this.startPosition.set(0,0,0);
        this.moveCameraLookAtToTargetCount = 0;
        this.moveDone = false;
        this.adjustCameraDone = false;
        this.moveCameraPositionTargetCount = 0;
    }

    isFlying(){
        return this.targetNode!=null&&this.hasPath;
    }


    rotateCamera(camera,deltaTime){


        if (this.moveCameraLookAtToTargetCount >= this.moveCameraLookAtToTargetDuration){return;}
        this.moveCameraLookAtToTargetCount += deltaTime * 10;
        const t = this.moveCameraLookAtToTargetCount/this.moveCameraLookAtToTargetDuration;
        if (t>1){
            return;
        }
        slerpCameraLookAtToNode(camera,this.targetNode,t);

    }

    calcSpeed(traveledDistance,camera){
        const startPosition = this.beginNode.getLocalPosition();
        const endPosition = this.targetNode.getLocalPosition();

        const distanceToStartPosition = startPosition.distanceTo(camera.position);
        const distanceToEndPosition = endPosition.distanceTo(camera.position);

        const speed = Math.min(distanceToEndPosition,distanceToEndPosition);

        const dampenDistanceFactor = 3.0;
        let startUpDistance = this.beginNode.getBoundingSphere() * dampenDistanceFactor;
        let closeUpDistance = this.targetNode.getBoundingSphere() * dampenDistanceFactor;

        const maxDistance = 1e12;
        startUpDistance = Math.min(maxDistance,startUpDistance);
        closeUpDistance = Math.min(maxDistance,closeUpDistance);


        if (this.pathLength < startUpDistance + closeUpDistance){
            startUpDistance = 0.4 * this.pathLength;
            closeUpDistance = startUpDistance;
        }

        let dampeningFactor = 1;
        if (traveledDistance < startUpDistance){
            dampeningFactor = traveledDistance / startUpDistance;
        }else {
            const remainingDistance = camera.position.distanceTo(this.targetNode.getLocalPosition());
            if (remainingDistance < closeUpDistance){
                dampeningFactor = remainingDistance / closeUpDistance;
            }
        }

        dampeningFactor = Math.max(0,dampeningFactor);
        dampeningFactor = Math.min(1,dampeningFactor);

        dampeningFactor = Math.sin(dampeningFactor*Math.PI/2)+0.01;
        return speed * dampeningFactor;
    }


    moveCamera(camera,deltaTime){

        const sameNode = this.targetNode.getIdentifier() === this.beginNode.getIdentifier();
        const moveVec = this.targetNode.getLocalPosition().clone().sub(this.startPosition);
        const dict = moveVec.clone().normalize();
        const scaler = 1.0;

        const reachRadius = this.targetNode.getReachRadius();
        moveVec.sub(dict.clone().multiplyScalar(this.targetNode.getReachRadius()));
        let distanceToTarget = camera.position.clone().sub(this.targetNode.getLocalPosition()).length() - reachRadius;
        let t = 1-distanceToTarget/(moveVec.length()-reachRadius);
        let speed = Math.max(Math.sin(t*Math.PI),0.005) * scaler;
        let increment = moveVec.length() * speed * deltaTime;


        if (increment > distanceToTarget){
            increment = distanceToTarget;
        }

        const displacement = dict.multiplyScalar(this.calcSpeed(this.pathLength - distanceToTarget,camera) * deltaTime);
        camera.position.add(displacement);


        distanceToTarget-=increment;
        t = 1-distanceToTarget/(moveVec.length()-reachRadius);

        if (!sameNode && this.targetNode.getIdentifier() !== appContext.navigator.getFocusNode().getIdentifier() && t > 0.5){
            appContext.navigator.setFocusNode(this.targetNode);
            this.startPosition.add(this.beginNode.getLocalPosition());
        }

        if (t>=0.99){
            this.reset();
        }

    }

    update(camera,deltaTime){
        if (!this.isFlying()){
            return;
        }

        this.rotateCamera(camera,deltaTime);
        this.moveCamera(camera,deltaTime);


    }

}