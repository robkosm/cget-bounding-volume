import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();
    private readonly mtlLoader = new MTLLoader();
    private bunny = new THREE.Object3D();

    constructor() {
        super();
    }

    async initialize(callback: Function) {
        const targetMtl = await this.mtlLoader.loadAsync("assets/targetA.mtl");
        targetMtl.preload();

        this.bunny = await this.createBunny(targetMtl);
        // this.bunny.scale.set(10, 10, 10);
        this.add(this.bunny);

        // const bbox = new THREE.Box3().setFromObject(this.bunny);
        // const helper = new THREE.Box3Helper(bbox, 0xffff00);
        // this.add(helper);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 4, 2);
        this.add(light);

        callback();
    }

    private async createBunny(mtl: MTLLoader.MaterialCreator) {
        this.objLoader.setMaterials(mtl);

        const modelRoot = await this.objLoader.loadAsync(
            "assets/stanford-bunny.obj"
        );

        return modelRoot;
    }

    update() {}

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
