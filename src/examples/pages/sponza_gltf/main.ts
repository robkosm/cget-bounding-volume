import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import SponzaDemoScene from "./Scene";

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01,
    100
);

const renderer = new THREE.WebGLRenderer();
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.maxDistance = 40;
orbitControls.zoomToCursor = true;

const scene = new SponzaDemoScene();
scene.initialize(sceneLoaded);

camera.position.z = -24;
camera.position.y = 8;
camera.position.x = 16;

orbitControls.update();

function sceneLoaded() {
    animate();
}

function animate() {
    orbitControls.update();
    scene.update();
    renderer.render(scene, camera);
}

function resize() {
    const container = renderer.domElement.parentNode;

    if (container) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        renderer.setSize(width, height);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

window.addEventListener("resize", resize);

resize();
