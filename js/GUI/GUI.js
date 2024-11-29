import * as dat from 'dat.gui';
import init from "three/addons/offscreen/scene";



class DigitalUniverseGUI{


    constructor(appContext) {
        this.appContext = appContext
        this.ui = new dat.GUI()
    }


    createFocusUI(nodeIDs){
        this.focusNodeUI = this.ui.add(focus,"focusNode",nodeIDs).onChange(value=>{
            const nextFocusNode = this.appContext.scene.findNodeByIdentifier(value);
            this.appContext.navigator.pathNavigator.flyTo(nextFocusNode,this.appContext.camera);
        });
    }






}