import {RenderableObject} from "../rendering/base";
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';



export class RenderableModel extends RenderableObject{




    loadModel(url){
        const loader = new FBXLoader();
        loader.load(url,(gltf)=>{
            console.log(gltf);
        });
    }

    constructor({modelUrl=""}) {
        super();
        this.loadModel(modelUrl);
    }
}


new RenderableObject({modelUrl:"/data/EinsteinProbe.fbx"});
