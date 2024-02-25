// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import DemoScene from "./PlaygroundDemoScene";

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true;
// document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);

const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.enableDamping = true
orbitControls.maxDistance = 20;
orbitControls.zoomToCursor = true;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;

const scene = new DemoScene();
scene.initialize(sceneLoaded);

camera.position.z = 8;
camera.position.y = 5;

orbitControls.target = new THREE.Vector3(0, 1, 0);

orbitControls.update();

function createTansformControl(_obj: THREE.Object3D) {
    const transformControls = new TransformControls(
        camera,
        renderer.domElement
    );
    transformControls.attach(_obj);
    transformControls.setSize(0.5);

    transformControls.addEventListener("dragging-changed", function (event) {
        orbitControls.enabled = !event.value;
    });
    transformControls.addEventListener("mouseDown", function () {
        orbitControls.enabled = false;
    });
    transformControls.addEventListener("mouseUp", function () {
        orbitControls.enabled = true;
    });

    scene.add(transformControls);
}

function sceneLoaded() {
    createTansformControl(scene.containsPointTester);
    createTansformControl(scene.intersectsSphereTester);
    createTansformControl(scene.intersectsBoxTester);

    animate();
}

function animate() {
    orbitControls.update();
    scene.update();
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

export function mount(container) {
    if (container) {
        container.insertBefore(renderer.domElement, container.firstChild);
        resize();
    } else {
        renderer.domElement.remove();
    }
}
