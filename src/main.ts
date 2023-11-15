// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import DemoScene from "./DemoScene";

const scene = new DemoScene();
scene.initialize(sceneLoaded);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.z = 5;
controls.update();

function sceneLoaded() {
    console.log(scene.getVertices());
    animate();
}

function animate() {
    controls.update();
    scene.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
