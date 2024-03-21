import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import RapierScene from "./RapierDemoScene";
import Stats from "stats.js";

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const renderer = new THREE.WebGLRenderer();
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.maxDistance = 20;
orbitControls.zoomToCursor = true;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;

const scene = new RapierScene();
await scene.initialize(sceneLoaded);
console.log(scene);

camera.position.z = 8;
camera.position.y = 5;

orbitControls.target = new THREE.Vector3(0, 1, 0);

orbitControls.update();

function sceneLoaded() {
    animate();
}

function animate() {
    stats.begin();
    orbitControls.update();
    scene.update(renderer.info.render.frame);
    renderer.render(scene, camera);
    stats.end();
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
