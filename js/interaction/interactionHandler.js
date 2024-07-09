import * as THREE from "three";


export class InteractionHandler{



    static BUTTON = {
        LEFT:0,
        MIDDLE:1,
        RIGHT:2
    }

    initState(){
        this.leftInteractionHappen = false;
        this.rightInteractionHappen = false;

        this.rotationVelocity = 0;
        this.globalRotateStart = new THREE.Vector2();
        this.globalRotate = new THREE.Vector2();

        this.localRotateStart = new THREE.Vector2();
        this.localRotation = new THREE.Vector2();
        this.ctrl = "Control";
        this.ctrlDown = false;

        this.translateVelocity = 0;

        this.rollStartX = 0;
    }


    initMouseInteraction(renderDomElement){
        renderDomElement.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
        })
        renderDomElement.addEventListener("mousedown",(e)=>{
            if(e.button == InteractionHandler.BUTTON.RIGHT){
                this.handleRightClick(e);
            }
            else {
                this.handleLeftClick(e);
            }
        });
        renderDomElement.addEventListener("mousemove",(e)=>{
            this.handleLeftMove(e);
            this.handleRightMove(e);

        });
        renderDomElement.addEventListener("mouseup",(e)=>{
            if(e.button == InteractionHandler.BUTTON.RIGHT){
                this.handleRightUp(e);
            }
            else if(e.button == InteractionHandler.BUTTON.LEFT){
                this.handleLeftUp(e);
            }
        })
    }

    initKeyboardInteraction(renderDomElement){

        window.addEventListener("keydown",(e)=>{
            if(e.key === this.ctrl){
                this.ctrlDown = true;
            }
        });

        window.addEventListener("keyup",(e)=>{
            if(e.key === this.ctrl){
                this.ctrlDown = false;
            }
        })

    }
    constructor(renderDomElement){
        this.initState();
        this.initMouseInteraction(renderDomElement);
        this.initKeyboardInteraction(renderDomElement);
    }


    getLocalRotate(){
        return this.localRotation.clone();
    }
    getGlobalRotate(){
        return this.globalRotate.clone();
    }
    handleLeftClick(event){
        this.leftInteractionHappen = true;
        this.globalRotateStart.set(event.clientX,event.clientY);
        this.localRotateStart.set(event.clientX,event.clientY);
    }

    handleLeftMove(event){
        if(!this.leftInteractionHappen){return;}
        let rotate = this.globalRotate;
        let rotateStart = this.globalRotateStart;
        if(this.ctrlDown){rotate = this.localRotation;rotateStart = this.localRotateStart;}
        rotate.set(event.clientX,event.clientY);
        rotate.sub(rotateStart).multiplyScalar(0.075);
    }
    handleLeftUp(event){
        this.leftInteractionHappen = false;
    }
    handleRightClick(event){
        this.rightInteractionHappen = true;
        this.rightStartY = event.clientY;
    }
    handleRightMove(event){
        if(!this.rightInteractionHappen){return;}
        this.translateVelocity = (this.rightStartY - event.clientY) / window.innerHeight/2;
    }
    handleRightUp(event){
        this.rightInteractionHappen = false;
    }
    updateTranslateVelocity(deltaTime){
        if(this.rightInteractionHappen || Math.abs(this.translateVelocity)<=1e-5){return;}
        this.translateVelocity-=this.translateVelocity*deltaTime;
    }
    updateGlobalRotate(deltaTime){
        if(this.leftInteractionHappen || this.globalRotate.length()<=1e-5){return;}
        const angleScale = 1/2;
        const decreaseX = this.globalRotate.x*angleScale*deltaTime;
        const decreaseY = this.globalRotate.y*angleScale*deltaTime;
        this.globalRotate.sub(new THREE.Vector2(decreaseX,decreaseY));
    }
    updateLocalRotateState(deltaTime){
        if(!this.ctrlDown){this.localRotation.set(0,0);}
    }
    updateState(deltaTime){
        this.updateTranslateVelocity(deltaTime);
        this.updateGlobalRotate(deltaTime);
        this.updateLocalRotateState(deltaTime);
    }
    getTranslateVelocity(){
        return this.translateVelocity;
    }
    resetTranslateVelocity(){
        this.translateVelocity = 0;
    }
}