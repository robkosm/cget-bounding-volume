import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "./DOPHelper";
import DOP from "./DOP14";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";
import { getKernel } from "./Kernel.js";

export default class ExperimentDemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    k: number;

    subject: THREE.Mesh;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI({ closed: true });
        this.subject = new THREE.Mesh();
    }

    async initialize() {
        // this.background = new THREE.Color(0xf1f1f1);
        this.background = new THREE.Color(0x10101a);

        // {
        //     const gridHelper = new THREE.GridHelper(
        //         1,
        //         100,
        //         new THREE.Color(0x555566),
        //         new THREE.Color(0x303040)
        //     );
        //     this.add(gridHelper);
        // }
        // {
        //     const gridHelper = new THREE.GridHelper(
        //         1,
        //         10,
        //         new THREE.Color(0x555566),
        //         new THREE.Color(0x484858)
        //     );
        //     this.add(gridHelper);
        // }

        // this.initializeGUI();

        // Load a glTF resource
        const obj = await this.objLoader.loadAsync(
            // resource URL
            "assets/monkey.obj",
            // called while loading is progressing
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            }
        );

        console.log(obj);

        this.add(obj);

        // this.initializeLights();

        this.subject = obj;
        this.experiment();
    }

    initializeGUI() {
        const folder = this.gui.addFolder("general settings");
        const self = this;
        folder
            .add(
                {
                    add: function () {
                        self.traverse(function (o) {
                            if (
                                o instanceof THREE.Mesh ||
                                o instanceof DOPHelper
                            ) {
                                o.visible = false;
                            }
                        });
                    },
                },
                "add"
            )
            .name("hide all ");
    }

    initializeLights() {
        {
            const light = new THREE.AmbientLight(0xeeeeee); // soft white light
            // const light = new THREE.AmbientLight(0x888888); // soft white light
            // const light = new THREE.AmbientLight(0x444444); // soft white light
            this.add(light);
        }

        {
            const light = new THREE.PointLight(0xffaa44, 20);
            light.position.set(5, 2, 0);
            this.add(light);
        }

        {
            const light = new THREE.PointLight(0xffaa44, 20);
            light.position.set(-5, 2, 0);
            this.add(light);
        }

        // {
        //     const light = new THREE.DirectionalLight(0xffffee, 1);
        //     light.position.set(0, 4, 2);
        //     this.add(light);
        // }

        // {
        //     const light = new THREE.DirectionalLight(0x0000ff, 0.1);
        //     light.position.set(0, -4, -2);
        //     this.add(light);
        // }
    }

    update() {}

    experiment() {
        // const geometry = new THREE.SphereGeometry(0.5, 32, 16);
        // const material = new THREE.MeshBasicMaterial({
        //     color: 0xffff00,
        //     transparent: true,
        //     opacity: 0.2,
        // });
        // const sphere = new THREE.Mesh(geometry, material);
        // this.add(sphere);

        const VERBOSE = false;

        console.log("starting experiments");

        const repetitions = 100;
        const kernelSize = 1000;

        // const kernel = [];

        (
            this.subject.children[0] as THREE.Mesh
        ).geometry.computeBoundingSphere();
        const bs = (this.subject.children[0] as THREE.Mesh).geometry
            .boundingSphere;

        // for (let i = 0; i < kernelSize; i++) {
        //     const origin = new THREE.Vector3();
        //     origin.randomDirection();
        //     origin.multiplyScalar(2 * bs.radius);
        //     origin.add(bs.center);

        //     const direction = new THREE.Vector3();
        //     direction.randomDirection();

        //     const ray = new THREE.Ray(origin, direction);

        //     kernel.push(ray);
        // }

        // // converting the JSON object to a string
        // const kernelData = JSON.stringify(kernel);

        // // writing the JSON string content to a file
        // fs.writeFile("kernel.json", kernelData, () => {
        // });

        const kernel = getKernel(kernelSize, bs);

        // console.log(kernel);

        // const ks = [6, 8, 12, 14, 18, 20, 26];

        // intersection execution time

        if (VERBOSE) {
            console.time(
                `intersection test time for 14-DOP with kernel size ${kernel.length} and ${repetitions} repetitions`
            );
        } else {
            console.time("14");
        }

        for (const ray of kernel) {
            for (let i = 0; i < repetitions; i++) {
                const rc = new THREE.Raycaster(ray.origin, ray.direction);
                const intersects = [];

                (this.subject.children[0] as THREE.Mesh).raycast(
                    rc,
                    intersects
                );
            }
        }

        if (VERBOSE) {
            console.timeEnd(
                `intersection test time for 14-DOP with kernel size ${kernel.length} and ${repetitions} repetitions`
            );
        } else {
            console.timeEnd("14");
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
