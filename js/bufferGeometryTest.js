import * as THREE from 'three';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array([
    0, 0, 0, // 第一个点的位置
    1, 1, 0, // 第二个点的位置
    -1, 1, 0 // 第三个点的位置
]);
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setDrawRange(0, 3);

const material = new THREE.PointsMaterial({color: 0x00ff11});
const points = new THREE.Points(geometry, material);
scene.add(points);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

