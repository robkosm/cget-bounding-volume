// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import MeshScene from "./MeshScene";

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.enableDamping = true
orbitControls.maxDistance = 20
orbitControls.zoomToCursor = true

const scene = new MeshScene();
scene.initialize(sceneLoaded);

camera.position.z = 8;
camera.position.y = 5;

orbitControls.target = new THREE.Vector3(0, 1, 0);

orbitControls.update();

function sceneLoaded() {
    animate();
}

function animate() {
    orbitControls.update();
    scene.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
