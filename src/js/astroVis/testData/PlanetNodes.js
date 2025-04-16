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
        reachRadius:6600000,
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
        reachRadius:4000e3,
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

        reachRadius: 71512000,
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
    },

    {
        identifier: "mars",
        parent: "solarSystem",
        reachRadius: 3416190,
        transformation: {
            position: [2.066e11,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params:{
                radius: 3396190,
                layers: [
                    {
                        type: "color",
                        maxLevel: 13,
                        requestUrlFormat: "http://wms.itn.liu.se/Mars/MDIM/tile/{z}/{y}/{x}",
                        useProxy:true
                    }
                ]
            }
        }
    },
    {
        identifier: "venus",
        parent: "solarSystem",
        reachRadius: 6071900,
        transformation: {
            position: [1.074e11,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params: {
                radius: 6051900,
                layers: [
                    {
                        type: "color",
                        maxLevel: 2,
                        requestUrlFormat: "/data/asset/venus/tile/{z}/{y}/{x}.jpg"
                    }
                ]
            }
        }
    },
    {
        identifier: "neptune",
        parent: "solarSystem",
        reachRadius: 24784000,
        transformation: {
            position: [4498000000000,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params: {
                radius: 24764000,
                layers: [
                    {
                        type: "color",
                        maxLevel: 2,
                        requestUrlFormat: "/data/asset/neptune/tile/{z}/{y}/{x}.jpg"
                    }
                ]
            }
        }
    },
    {
        identifier: "mercury",
        parent: "solarSystem",
        reachRadius: 2440100,
        transformation: {
            position: [57910000e3,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params: {
                radius: 2440e3,
                layers: [
                    {
                        type: "color",
                        maxLevel: 15,
                        useProxy: true,
                        requestUrlFormat: "http://wms.itn.liu.se/Mercury/Messenger_BDR/tile/{z}/{y}/{x}"
                    }
                ]
            }
        }
    },
    {
        identifier: "saturn",
        parent: "solarSystem",
        reachRadius: 58232100,
        transformation: {
            position: [1429000000e3,0,0],
            rotation: [0,0,0],
            scaling: [1,1,1]
        },
        renderableObject: {
            type: "renderablePlanet",
            params: {
                radius: 58232e3,
                layers: [
                    {
                        type: "color",
                        maxLevel: 2,
                        requestUrlFormat: "/data/asset/saturn/{z}/{y}/{x}.jpg"
                    }
                ]
            }
        }
    },
    {
        identifier: "background",
        parent: "root",
        reachRadius: 10,
        renderableObject: {
            type: "renderableBackgroundSphere",
            params: {
                radius: 1e25,
                backgroundUrl: "/data/eso_dark.jpg"
            }
        }
    }
]


export function defaultAssets(){
    return [...planets];
}


export function createStarsTestNode(name,datasourceFormat,requestUrl,magExponent){
    const renderableStars = new RenderableStars({requestUrl:requestUrl, dataFormat:datasourceFormat,magExponent:magExponent});
    //const renderableStars = null;
    const root = appContext.scene.findNodeByIdentifier("root");
    const node = new SceneGraphNode({identifier:name,parentNode:root,renderableObject:renderableStars});
    // node.setupUI(appContext.gui.scene.addFolder(name));
    return node;
}







export function createSolarSystemPlantsOrbitNode(){
    const nodes = []

    const solarSystem = "solarsystem"
    nodes.push(createOrbitTestNode("earthOrbit","earth",solarSystem));
    nodes.push(createOrbitTestNode("jupiterOrbit","jupiter",solarSystem));
    nodes.push(createOrbitTestNode("mercuryOrbit","mercury",solarSystem));
    nodes.push(createOrbitTestNode("saturnOrbit","saturn",solarSystem));
    nodes.push(createOrbitTestNode("neptuneOrbit","neptune",solarSystem));
    nodes.push(createOrbitTestNode("venusOrbit","venus",solarSystem));
    nodes.push(createOrbitTestNode("marsOrbit","mars",solarSystem));

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