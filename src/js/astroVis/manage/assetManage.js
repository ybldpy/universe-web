import {BACKEND_API, PARAMETERS} from "../../api";
import {get} from "../../utils/networkUtil"
import {SceneGraphNodeFactory} from "../rendering/scene";
import {appContext} from "../applicationContext";


export class AssetManager{
    constructor() {

        this.sceneGraphNodeFactory = new SceneGraphNodeFactory();
    }


    /**
     *
     * @param nodes nodes json object
     * @param scene scene object
     */
    loadAssets(nodes,scene){
        const nodeTree = {
            "root":[]
        }
        for(let i = 0;i<nodes.length;i++){
            const node = nodes[i];
            const nodeParent = node.parent || "root";
            if (nodeTree[nodeParent]===undefined){continue;}
            nodeTree[nodeParent].push(node);
            nodeTree[node.identifier] = [];
        }
        const buildQueue = [];
        nodeTree.root.forEach((value)=>{buildQueue.push(value)});
        while (buildQueue.length>0){
            const node = buildQueue.shift();
            nodeTree[node.identifier].forEach((value)=>{buildQueue.push(value)});
            const sceneGraphNode = this.sceneGraphNodeFactory.createNode(node,scene);
            scene.addNode(sceneGraphNode);
            sceneGraphNode.setupUI(appContext.gui.scene.addFolder(sceneGraphNode.getIdentifier()));
        }
    }

    async loadUserAssets(url,params,scene) {
        const assetList = []
        const result = await get(url,params);
        if (result.requestSuccess && result.response.data.code===200&&result.response.data.data.status===1){
            const fileList = result.response.data.data.data;
            for(let i = 0;i<fileList.length;i++){
                const category = fileList[i].category;
                const identifier = fileList[i].filename;
                const transformation = {
                    position:[0,0,0],
                    rotation:[0,0,0],
                    scaling:[0,0,0]
                };
                const node = {};
                if (category === PARAMETERS.FILE.CATEGORY.CATALOG){
                    node.identifier = identifier;
                    node.transformation = transformation;
                    node.parent = "root";
                    const type = "renderableStars";
                    node.renderableObject = {
                        type:type,
                        params:{
                            dataFormat: "streamOctree",
                            requestUrl: `${BACKEND_API.FILE_FETCH}/${fileList[i].fileid}`,
                        }
                    }
                    assetList.push(node);
                }
            }
        }
        this.loadAssets(assetList,scene);
    }


}