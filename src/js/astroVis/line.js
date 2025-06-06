import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const material = new THREE.LineBasicMaterial({color:0x0000ff});
const points = [new THREE.Vector3( - 10, 0, 0 ),new THREE.Vector3( 0, 10, 0 ),new THREE.Vector3( 10, 0, 0 )];
const geometry = new THREE.BufferGeometry().setFromPoints( points );
const line = new THREE.Line(geometry,material);
scene.add(line);
renderer.render( scene, camera );
