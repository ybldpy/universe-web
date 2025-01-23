import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x11ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
const vertex = new Float32Array([
	3,20,0,
	5,5,50,
	30,2,25
])
const geometry = new THREE.BufferGeometry()
geometry.setAttribute("position",new THREE.BufferAttribute(vertex,3,false));
const material = new THREE.PointsMaterial({color:0x11ff00,size:0.5});
camera.position.x = 15;
camera.position.y = 15;
camera.position.z = 50;

const points = new THREE.Points(geometry,material);
scene.add(points);
camera.lookAt(0,0,0);

function animate() {
    requestAnimationFrame( animate );

	// cube.rotation.x += 0.02;
	// cube.rotation.y += 0.02;


	renderer.render( scene, camera );
}

// animate();
import WebGL from 'three/addons/capabilities/WebGL.js';

if ( WebGL.isWebGLAvailable() ) {

	// Initiate function or other initializations here
	animate();

} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );

}