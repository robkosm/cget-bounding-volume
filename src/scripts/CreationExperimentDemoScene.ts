import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "./DOPHelper";
import DOP from "./DOP14";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

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

        this.subject = obj.children[0];
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

        console.log("starting experiments");

        const repetitions = 10000;

        console.time(
            `BufferGeometry Bounding Sphere Creation Time for ${repetitions} repetitions`
        );
        for (let i = 0; i < repetitions; i++) {
            this.subject.geometry.boundingSphere = null;
            this.subject.geometry.computeBoundingSphere;
        }
        console.timeEnd(
            `BufferGeometry Bounding Sphere Creation Time for ${repetitions} repetitions`
        );

        console.time(
            `BufferGeometry Bounding Box Creation Time for ${repetitions} repetitions`
        );
        for (let i = 0; i < repetitions; i++) {
            this.subject.geometry.boundingBox = null;
            this.subject.geometry.computeBoundingBox;
        }
        console.timeEnd(
            `BufferGeometry Bounding Box Creation Time for ${repetitions} repetitions`
        );

        console.time(`AABB Creation Time for ${repetitions} repetitions`);
        const aabb = new THREE.Box3();
        for (let i = 0; i < repetitions; i++) {
            aabb.makeEmpty();
            aabb.expandByObject(this.subject, false);
        }
        console.timeEnd(`AABB Creation Time for ${repetitions} repetitions`);

        console.time(`14-DOP Creation Time for ${repetitions} repetitions`);
        const dop = new DOP(14);
        for (let i = 0; i < repetitions; i++) {
            dop.makeEmpty();
            dop.expandByObject(this.subject, false);
        }
        console.timeEnd(`14-DOP Creation Time for ${repetitions} repetitions`);
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
