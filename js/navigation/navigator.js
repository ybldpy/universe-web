import * as THREE from "three";
import {clamp} from "three/src/math/MathUtils";
import {InteractionHandler} from "../interaction/interactionHandler";

export class Navigator{

    constructor(camera,interactionHandler,focusNode = null) {
        this.camera = camera;
        this.setFocusNode(focusNode);
        this.orbitNavigator = new OrbitNavigator();
        this.interactionHandler = interactionHandler;
    }

    setFocusNode(focusNode){
        this.focusNode = focusNode;
    }

    getFocusNode(){
        return this.focusNode;
    }

    update(deltaTime){
        this.interactionHandler.updateState(deltaTime);
        this.orbitNavigator.updateCamera(this.camera,deltaTime,this.focusNode,this.interactionHandler);
    }

}



class OrbitNavigator{

    constructor(){

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
    decomposeCameraRotation(camera,focus){
        const camRotation = camera.quaternion.clone();
        // const cameraViewWorldSpace = new THREE.Vector3();
        // camera.getWorldDirection(cameraViewWorldSpace);
        // const cameraToCenterDict = focus.getPosition().clone().sub(camera.position).normalize();
        // let localRotation1 = new THREE.Quaternion().setFromUnitVectors(cameraToCenterDict,cameraViewWorldSpace.normalize());
        // //localRotation.copy(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))));
        // const globalRotation = camRotation.clone().multiply(localRotation1);

        const globalRotation = this.calculateGlobalRotation(camera,focus);
        const localRotation = globalRotation.clone().invert().multiply(camRotation);
        return {localRotation,globalRotation};
    }
    calculateGlobalRotation(camera,focus){
        const cameraToCenterDict = focus.getWorldPosition().clone().sub(camera.position).normalize();
        const cameraUp = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
        const cameraViewDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraViewDirection);
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,cameraViewDirection.add(cameraUp).normalize());
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
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1).applyQuaternion(localRotation),new THREE.Vector3(0,1,0).applyQuaternion(localRotation))
    }
    rotateGlobally(camera,anchor,globalRotation){
        const cameraToCenterDict = anchor.getWorldPosition().clone().sub(camera.position).normalize();
        //const lookAtMat = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
        // return new THREE.Quaternion().setFromRotationMatrix(lookAtMat).invert();
        return this.calcLookAtQuaternion(new THREE.Vector3(0,0,0),cameraToCenterDict,new THREE.Vector3(0,1,0).applyQuaternion(globalRotation));
    }
    rotateAroundAnchor(camera,deltaTime,globalRotation,focusNode,interactionHandler){
        const globalRotate = interactionHandler.getGlobalRotate();
        const centerToCameraVecWorldSpace = camera.position.clone().sub(focusNode.getWorldPosition());
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

    rotate(camera,deltaTime,focusNode,interactionHandler){
        let {localRotation,globalRotation} = this.decomposeCameraRotation(camera,focusNode);
        localRotation = this.rotateLocally(camera,localRotation,deltaTime,interactionHandler);
        this.rotateAroundAnchor(camera,deltaTime,globalRotation,focusNode,interactionHandler);
        globalRotation = this.rotateGlobally(camera,focusNode,globalRotation);
        camera.quaternion.copy(globalRotation.multiply(localRotation));
    }
    updateCamera(camera,deltaTime,focusNode,interactionHandler){
        deltaTime = Math.min(deltaTime,0.01);
        this.rotate(camera,deltaTime,focusNode,interactionHandler);
        this.pushToSurface(camera,deltaTime,focusNode,interactionHandler);
    }
}