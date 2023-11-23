// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import DemoScene from "./DemoScene";

const scene = new DemoScene();
scene.initialize(sceneLoaded);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01,
    10
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.z = .2;
camera.position.y = .2;

controls.target = new THREE.Vector3(0, .1, 0);

controls.update();

function sceneLoaded() {
    animate();
}

function animate() {
    controls.update();
    scene.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
