import {reactive} from "vue";


export class UIManager{


    constructor() {
        this.sceneUi = reactive([]);
    }

    addSceneNodeUi(prop){
        this.sceneUi.push(reactive(prop));
    }

    getSceneNodesUi(){
        return this.sceneUi;
    }

}