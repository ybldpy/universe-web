import {SceneGraphNode} from "../rendering/scene";
import {RenderableStars} from "../renderable/stars";
import {appContext} from "../applicationContext";
import {RenderableOrbit} from "../renderable/renderableOrbit";

export const planets = [


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
            radius: 6950e5,
            layers:[
                {
                    type:"color",
                    maxLevel: 2,
                    requestUrlFormat: "/data/asset/sun/tile/0/0/0.jpg"
                }
            ]
        }
    },


    {
        identifier:"earth",
        parent:"solarSystem",
        reachRadius:6550e3,
        transformation:{
            position:[1.5e11,0,0],
            rotation:[0,0,0],
            scaling:[1,1,1]
        },
        renderableObject:{
            type:"renderableGlobe",
            radius:6538e3,
            layers:[
                {
                    type:"color",
                    maxLevel:13,
                    requestUrlFormat:"http://localhost:8001/color/{z}/{y}/{x}.jpg"
                }
            ]
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
            type:"renderableGlobe",
            radius:3830e3,
            layers:[
                {
                    type:"color",
                    maxLevel:13,
                    requestUrlFormat:"http://localhost:8002/color/{z}/{y}/{x}.jpg"
                }
            ]
        }
    }
]





export function createStarsTestNode(){
    const renderableStars = new RenderableStars("http://localhost:8000/3.bin");
    const root = appContext.scene.findNodeByIdentifier("root");
    const node = new SceneGraphNode({identifier:"testStars",parentNode:root,renderableObject:renderableStars});
    return node;
}

export function createOrbitTestNode(){
    const renderableStars = new RenderableOrbit("earth");
    const root = appContext.scene.findNodeByIdentifier("root");
    const node = new SceneGraphNode({identifier:"earthOrbit",parentNode:root,renderableObject:renderableStars});
    return node;



}