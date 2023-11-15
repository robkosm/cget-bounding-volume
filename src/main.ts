// import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import DemoScene from "./DemoScene";
import DOP14 from "./DOP14";

const scene = new DemoScene();
scene.initialize(sceneLoaded);

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

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

camera.position.z = 1;
controls.update();

function sceneLoaded() {
    const testDOP14 = new DOP14();
    testDOP14.fromVertexBuffers(scene.getVertices());
    const planes = testDOP14.planes();

    planes.forEach((p) => {
        scene.add(p);
    });

    animate();
}

function animate() {
    controls.update();
    scene.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
