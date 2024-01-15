import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "./DOPHelper";
import DOP from "./DOP14";

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();
    private readonly mtlLoader = new MTLLoader();
    private bunny = new THREE.Object3D();
    private bunnyDOP = new DOP(14);
    containedTester = new THREE.Object3D();

    constructor() {
        super();
    }

    async initialize(callback: Function) {
        const targetMtl = await this.mtlLoader.loadAsync("assets/targetA.mtl");
        targetMtl.preload();

        this.bunny = await this.createBunny(targetMtl);
        // this.bunny.scale.set(10, 10, 10);
        this.add(this.bunny);

        // const bunnyBuffer = this.getVertices();
        // this.bunnyDOP.setFromVertexBuffers(bunnyBuffer);
        this.bunnyDOP.setFromObject(this.bunny);
        const bunnyHelper = new DOPHelper(this.bunnyDOP);
        this.add(bunnyHelper);

        const bunnyCenter = new THREE.Vector3();
        this.bunnyDOP.getCenter(bunnyCenter);

        const geometry = new THREE.SphereGeometry(0.01, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const centerSphere = new THREE.Mesh(geometry, material);
        centerSphere.position.copy(bunnyCenter);
        this.add(centerSphere);

        {
            const geometry = new THREE.SphereGeometry(0.01, 32, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            this.containedTester = new THREE.Mesh(geometry, material);
            this.add(this.containedTester);
        }

        // const bbox = new THREE.Box3().setFromObject(this.bunny);
        // const helper = new THREE.Box3Helper(bbox, 0xffff00);
        // this.add(helper);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 4, 2);
        this.add(light);

        const gui = new GUI();

        const bunnyFolder = gui.addFolder("Bunny");
        bunnyFolder.add(this.bunny, "visible");
        bunnyFolder.open();

        const DOPFolder = gui.addFolder("14-DOP");
        DOPFolder.add(bunnyHelper, "visible").name("Show Edges");
        DOPFolder.add(centerSphere, "visible").name("Show Center Point");
        DOPFolder.open();

        callback();
    }

    private async createBunny(mtl: MTLLoader.MaterialCreator) {
        this.objLoader.setMaterials(mtl);

        const modelRoot = await this.objLoader.loadAsync(
            "assets/stanford-bunny.obj"
        );

        return modelRoot;
    }

    update() {
        if (this.bunnyDOP.containsPoint(this.containedTester.position)) {
            (
                (this.containedTester as THREE.Mesh)
                    .material as THREE.MeshBasicMaterial
            ).color.setHex(0xff0000);
        } else {
            (
                (this.containedTester as THREE.Mesh)
                    .material as THREE.MeshBasicMaterial
            ).color.setHex(0x0000ff);
        }
    }

    getVertices(): THREE.Float32BufferAttribute[] {
        const buffers: THREE.Float32BufferAttribute[] = [];
        this.traverse(function (o) {
            if (o instanceof THREE.Mesh) {
                buffers.push(o.geometry.getAttribute("position"));
            }
        });

        return buffers;
    }
}
