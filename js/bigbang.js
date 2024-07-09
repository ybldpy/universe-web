import * as THREE from 'three';
import {GlobularEvolution} from './globularEvolution.js';
import * as dat from 'dat.gui';

class Planet{

    constructor(position,velocity,radius,density){
        this.position = position;
        this.velocity = velocity;
        this.acceleration = new THREE.Vector3();

        this.radius = radius
        this.density = density
        this.volume = 4 / 3 * Math.PI * Math.pow(radius, 3)
        this.mass = this.volume * this.density
        this.trace = []
    }

    calcForce(otherPlanet){
        if(this == otherPlanet){
            return new THREE.Vector3();
        }

        
    }



}