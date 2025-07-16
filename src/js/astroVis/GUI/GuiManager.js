import {reactive} from "vue";
import Stats from "three/examples/jsm/libs/stats.module.js";


export class UIManager{


    constructor(app,stat) {
        this.sceneUi = reactive([]);
        this.nodeNames = reactive([])
        this.bindApp = app;
        this.stat = stat
        document.body.appendChild(this.stat.dom);
        this.statShow = true

    }
    addSceneNodeUi(prop,nodeName,selectable){
        this.sceneUi.push(reactive(prop));

        if (!selectable){return}
        this.nodeNames.push(nodeName);
    }

    showStat(){
        if (!this.statShow){
            this.statShow = true
            document.body.appendChild(this.stat.dom);
        }
    }

    hideStat(){
        if (this.statShow){
            this.statShow = false
            document.removeChild(this.stat.dom);
        }
    }

    getSceneNodesUi(){
        return this.sceneUi;
    }
    getFocusNodeName(){
        return this.bindApp.getFocusNodeName();
    }

    getNodeIdentifiers(){
        return this.nodeNames;
    }


    flyTo(newFocusNodeName){
        this.bindApp.flyTo(newFocusNodeName);
    }

}