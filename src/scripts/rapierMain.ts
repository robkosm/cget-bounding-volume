// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import RapierScene from "./RapierDemoScene";

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.getElementById("root")?.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);

const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.enableDamping = true
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
    orbitControls.update();
    scene.update(renderer.info.render.frame);
    // requestAnimationFrame(animate);
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

export function mount(container: Node) {
    if (container) {
        container.insertBefore(renderer.domElement, container.firstChild);
        resize();
    } else {
        renderer.domElement.remove();
    }
}
