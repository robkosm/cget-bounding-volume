// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import DemoScene from "./DemoScene";

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    .1,
    100
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);

const scene = new DemoScene();
scene.initialize(sceneLoaded);

camera.position.z = 10;
camera.position.y = 10;

orbitControls.target = new THREE.Vector3(0, 0, 0);

orbitControls.update();

function sceneLoaded() {
    const transformControls = new TransformControls(camera, renderer.domElement)
    transformControls.attach(scene.containedTester)

    transformControls.addEventListener( 'dragging-changed', function ( event ) {
        orbitControls.enabled = ! event.value;
    });
    transformControls.addEventListener('mouseDown', function () {
        orbitControls.enabled = false;
    });
    transformControls.addEventListener('mouseUp', function () {
        orbitControls.enabled = true;
    });

    scene.add(transformControls)

    animate();
}

function animate() {
    orbitControls.update();
    scene.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
