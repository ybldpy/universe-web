import {SceneGraphNode} from "../rendering/scene";
import {RenderableStars} from "../renderable/stars";
import {appContext} from "../applicationContext";
import {RenderableOrbit} from "../renderable/renderableOrbit";


const testFlag =false;

const planets = [


    {
        identifier: "solarSystem",
        parent: "root",
        transformation: {
            position: [0,0,0],
            rotation: [0,0,0],
            scaling:[1,1,1]
        }
    },

    {
        identifier: "sunCenter",
        parent: "solarSystem",
        transformation: {
            position: [0,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        }
    },
    {
        identifier: "sun",
        parent: "sunCenter",
        reachRadius:7000e3,
        transformation: {
            position: [0,0,0],
            rotation:[0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params:{
                radius: 6950e5,
                layers: [
                    {
                        type: "color",
                        maxLevel: 2,
                        requestUrlFormat: "/data/asset/sun/tile/0/0/0.jpg"
                    }
                ]
            }
        }
    },


    {
        identifier:"earth",
        parent:"solarSystem",
        reachRadius:6540e3,
        transformation:{
            position:[1.5e11,0,0],
            rotation:[0,0,0],
            scaling:[1,1,1]
        },
        renderableObject:{
            type:"renderablePlanet",
            params:{
                radius: 6538e3,
                layers: [
                    {
                        type: "color",
                        maxLevel: 17,
                        // requestUrlFormat: testFlag ? "http://localhost:8001/color/{z}/{y}/{x}.jpg" : "http://121.40.212.118:5000/data/tile/earth_uploadedTile/color/{z}/{y}/{x}.jpg"
                        requestUrlFormat: "https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg",
                        useProxy:true
                    },
                    {
                        type: "height",
                        maxLevel: 7,
                        requestUrlFormat: testFlag ? "http://localhost:8001/height2/built/{z}/{y}/{x}.tif" : "http://121.40.212.118:5000/data/tile/earth/height/{z}/{y}/{x}.tif",
                        // requestUrlFormat: "/data/t.jpg",
                        heightMultiplier: 20
                    }
                ],
                shadow:{
                    isShadow: true,
                    shadowSource: "sun"
                }
            },
        }
    },

    {
        identifier: "moon",
        parent:"earth",
        reachRadius:3850e3,
        transformation: {
            position:[1000e5,1000e5,2050e5],
            rotation: [0,0,0],
            scaling: [1,1,1],
        },
        renderableObject:{
            type:"renderablePlanet",
            params:{
                radius: 3830e3,
                layers: [
                    {
                        type: "color",
                        maxLevel: 8,
                        requestUrlFormat: testFlag ? "http://localhost:8002/color2/{z}/{y}/{x}.jpg" : "http://121.40.212.118:5000/data/tile/moon/color2/{z}/{y}/{x}.jpg"
                    },
                    {
                        type: "height",
                        maxLevel: 7,
                        heightMultiplier: 2,
                        requestUrlFormat: testFlag ? "http://localhost:8002/height/{z}/{y}/{x}.png" : "http://121.40.212.118:5000/data/tile/moon/height/{z}/{y}/{x}.png"
                    }
                ],
                shadow:{
                    isShadow:true,
                    shadowSource:"sun"
                }
            }
        }
    },




    {
        identifier: "jupiter",

        reachRadius: 1000e3,
        parent: "solarSystem",
        transformation: {
            position: [7.8e11,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type:"renderablePlanet",
            params:{
                layers: [
                    {
                        type: "color",
                        maxLevel: 2,
                        requestUrlFormat: "/data/asset/jupiter/tile/{z}/{y}/{x}.png"
                    }
                ],
                radius:71492000,

            }
        }
    },

    {
        identifier: "earthAtmosphere",
        parent: "earth",
        renderableObject: {
            type: "planetAtmosphere",
            params:{
                radius:6600e3,
                planetRadius:6538e3,
                intensity:17,
                scatteringtregh:8,
                falloff:6,
                density:4,
                redWave:857,
                blueWave:619,
                greenWave:778
            }
        }
    }

    // {
    //     identifier: "mars",
    //     parent: "solarSystem",
    //     reachRadius: 1000e3,
    //     transformation: {
    //         position: [2.066e11,0,0],
    //         rotation: [0,0,0],
    //         scaling: [1,1,1]
    //     },
    //     renderableObject: {
    //         type: "renderableGlobe",
    //         radius: 3396190,
    //         layers: [
    //             {
    //                 type: "color",
    //                 maxLevel: 2,
    //                 requestUrlFormat: "/data/asset/mars/tile/{z}/{y}/{x}.png"
    //             }
    //         ]
    //     }
    // },
    // {
    //     identifier: "venus",
    //     parent: "solarSystem",
    //     reachRadius: 1000e3,
    //     transformation: {
    //         position: [1.074e11,0,0],
    //         rotation: [0,0,0],
    //         scaling: [1,1,1]
    //     },
    //     renderableObject: {
    //         type: "renderableGlobe",
    //         radius: 6051900,
    //         layers: [
    //             {
    //                 type: "color",
    //                 maxLevel: 2,
    //                 requestUrlFormat: "/data/asset/venus/tile/{z}/{y}/{x}.jpg"
    //             }
    //         ]
    //     }
    // },
    // {
    //     identifier: "neptune",
    //     parent: "solarSystem",
    //     reachRadius: 1000e3,
    //     transformation: {
    //         position: [0,0,4.054e12],
    //         rotation: [0,0,0],
    //         scaling: [1,1,1]
    //     },
    //     renderableObject: {
    //         type: "renderableGlobe",
    //         radius: 24764000,
    //         layers: [
    //             {
    //                 type: "color",
    //                 maxLevel: 2,
    //                 requestUrlFormat: "/data/asset/neptune/tile/{z}/{y}/{x}.jpg"
    //             }
    //         ]
    //     }
    // }
]


export function defaultAssets(){
    return [...planets];
}


export function createStarsTestNode(name,datasourceFormat,requestUrl,magExponent){
    const renderableStars = new RenderableStars({requestUrl:requestUrl, dataFormat:datasourceFormat,magExponent:magExponent});
    //const renderableStars = null;
    const root = appContext.scene.findNodeByIdentifier("root");
    const node = new SceneGraphNode({identifier:name,parentNode:root,renderableObject:renderableStars});
    node.setupUI(appContext.gui.scene.addFolder(name));
    return node;
}







export function createSolarSystemPlantsOrbitNode(){
    const nodes = []

    const solarSystem = "solarsystem"
    nodes.push(createOrbitTestNode("earthOrbit","earth",solarSystem))
    nodes.push(createOrbitTestNode("jupiterOrbit","jupiter",solarSystem))
    // nodes.push(createOrbitTestNode("marsOrbit","mars",solarSystem))
    // nodes.push(createOrbitTestNode("venusOrbit","venus",solarSystem))
    // nodes.push(createOrbitTestNode("neptuneOrbit","neptune",solarSystem))
    return nodes



}

export function createOrbitTestNode(nodeIdentifier,orbitTarget,parent){
    const renderableStars = new RenderableOrbit(orbitTarget);
    const root = appContext.scene.findNodeByIdentifier(parent);
    const node = new SceneGraphNode({identifier:nodeIdentifier,parentNode:root,renderableObject:renderableStars});
    return node;
}