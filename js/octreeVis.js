import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xffffff); // Set background to white
//
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(3, 3, 5);
//
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
//
// const controls = new OrbitControls(camera, renderer.domElement);
//
// // Cube positions based on your description
// const cubePositions = [
//     [-0.5, -0.5, -0.5], // 0: Bottom-left far
//     [0.5, -0.5, -0.5],  // 1: Bottom-right far
//     [-0.5, -0.5, 0.5],  // 2: Bottom-left near
//     [0.5, -0.5, 0.5],   // 3: Bottom-right near
//     [-0.5, 0.5, -0.5],  // 4: Top-left far
//     [0.5, 0.5, -0.5],   // 5: Top-right far
//     [-0.5, 0.5, 0.5],   // 6: Top-left near
//     [0.5, 0.5, 0.5],    // 7: Top-right near
// ];
//
// // Cube material for black semi-transparent cubes
// const cubeMaterial = new THREE.MeshBasicMaterial({
//     color: 0x555555, // Black
//     transparent: true,
//     opacity: 0.2,
//     depthWrite: false,
// });
//
// // Font loader for labels
// const fontLoader = new FontLoader();
// fontLoader.load(
//     'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
//     (font) => {
//         cubePositions.forEach((pos, index) => {
//             // Create cube
//             const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
//             const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//             cube.position.set(pos[0], pos[1], pos[2]);
//             scene.add(cube);
//
//             // Create label
//             const textGeometry = new TextGeometry(index.toString(), {
//                 font: font,
//                 size: 0.2, // Adjust label size
//                 height: 0.05, // Thickness of the text
//             });
//             const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,transparent:true,opacity:1,depthWrite:true}); // White labels
//             const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//
//             // Center label inside the cube
//             textGeometry.computeBoundingBox();
//             const textOffset = textGeometry.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
//             textMesh.position.set(pos[0] - textOffset.x, pos[1] - textOffset.y, pos[2] - textOffset.z);
//             scene.add(textMesh);
//         });
//     }
// );
//
// // Add ambient light for visibility
// const ambientLight = new THREE.AmbientLight(0x404040, 2); // Softer light
// scene.add(ambientLight);
//
// const axesHelper = new THREE.AxesHelper(3); // Length of each axis
// scene.add(axesHelper);
//
// // Render loop
// function animate() {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
// }
// animate();





const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for interaction
const controls = new OrbitControls(camera, renderer.domElement);

// Axes Helper
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// Simulated Perspective Frustum
const frustumGroup = new THREE.Group();

const near = 1;  // Near plane distance
const far = 4;   // Far plane distance
const fov = 50 * (Math.PI / 180); // Field of view in radians
const aspect = 1.5; // Aspect ratio

const nearHeight = 2 * Math.tan(fov / 2) * near;
const nearWidth = nearHeight * aspect;
const farHeight = 2 * Math.tan(fov / 2) * far;
const farWidth = farHeight * aspect;

const frustumVertices = [
    // Near plane corners
    new THREE.Vector3(-nearWidth / 2, nearHeight / 2, -near),  // Top-left
    new THREE.Vector3(nearWidth / 2, nearHeight / 2, -near),   // Top-right
    new THREE.Vector3(-nearWidth / 2, -nearHeight / 2, -near), // Bottom-left
    new THREE.Vector3(nearWidth / 2, -nearHeight / 2, -near),  // Bottom-right
    // Far plane corners
    new THREE.Vector3(-farWidth / 2, farHeight / 2, -far),     // Top-left
    new THREE.Vector3(farWidth / 2, farHeight / 2, -far),      // Top-right
    new THREE.Vector3(-farWidth / 2, -farHeight / 2, -far),    // Bottom-left
    new THREE.Vector3(farWidth / 2, -farHeight / 2, -far)      // Bottom-right
];

const frustumEdges = [
    // Near plane
    [0, 1], [1, 3], [3, 2], [2, 0],
    // Far plane
    [4, 5], [5, 7], [7, 6], [6, 4],
    // Connections between near and far planes
    [0, 4], [1, 5], [2, 6], [3, 7]
];

// Add frustum edges
frustumEdges.forEach(edge => {
    const geometry = new THREE.BufferGeometry().setFromPoints([frustumVertices[edge[0]], frustumVertices[edge[1]]]);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(geometry, material);
    frustumGroup.add(line);
});

// Add extended lines to the origin (0,0,0) from near plane vertices
for (let i = 0; i < 4; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([frustumVertices[i], new THREE.Vector3(0, 0, 0)]);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(geometry, material);
    frustumGroup.add(line);
}

scene.add(frustumGroup);

// Add cubes
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000});
const cube1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial);
cube1.position.set(0.5, -2.5, -2.5); // Intersecting frustum
scene.add(cube1)
const delayCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xF6C6AD});
const cube11 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), delayCubeMaterial);
cube11.position.set(2.5, -2.5, -2.5); // Intersecting frustum
scene.add(cube11);
const cubeMaterial2 = new THREE.MeshBasicMaterial({ color:  0xD2D6F9});
const cube2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial2);
cube2.position.set(-1.2, 1.5, -3.5); // Intersecting frustum
scene.add(cube2);
const cubeMaterial3 = new THREE.MeshBasicMaterial({ color:  0xb4e5a2});
const cube3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial3);
cube3.position.set(1.8, 2.5, -2.5); // Intersecting frustum
scene.add(cube3);

// Frustum transformation controls
frustumGroup.position.set(0, 0, 0); // Place frustum at origin
frustumGroup.rotation.x = Math.PI / 8; // Tilt for better visualization

// Camera positioning
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();




