import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "./DOPHelper";
import DOP from "./DOP14";

class DOPdemoObject {
    name: string;
    object: THREE.Object3D;
    DOP: DOP;
    DOPhelper: DOPHelper;
    k: number;

    constructor(
        _name: string,
        _url: string,
        _objLoader: OBJLoader,
        _transform: THREE.Matrix4,
        _callback: Function
    ) {
        this.name = _name;
        this.k = 14;
        this.DOP = new DOP(this.k);
        this.DOPhelper = new DOPHelper(this.DOP);

        _objLoader.load(
            // resource URL
            _url,
            // called when resource is loaded
            (object: THREE.Object3D) => {
                this.object = object;

                this.object.traverse((mesh) => {
                    if (mesh instanceof THREE.Mesh) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: 0xefd4ca,
                            // color: (Math.random() * 0xFFFFFF << 0),
                            roughness: 0.1,
                        });
                    }
                });

                this.object.applyMatrix4(_transform);

                this.DOP.setFromObject(object);
                this.DOPhelper = new DOPHelper(
                    this.DOP,
                    new THREE.Color(0xffffff)
                );
                _callback(this);
            },
            // called when loading is in progresses
            function (xhr) {
                console.log(
                    _name + " " + (xhr.loaded / xhr.total) * 100 + "% loaded"
                );
            },
            // called when loading has errors
            function (error) {
                console.log(error);
            }
        );
    }

    changeK(_newK: Number) {
        this.DOP = new DOP(Number(this.k));
        this.DOP.setFromObject(this.object);

        const newDOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xffffff));

        // replace line rendered mesh
        this.DOPhelper.add(newDOPhelper);
        this.DOPhelper.parent.attach(newDOPhelper);
        this.DOPhelper.parent.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;
    }

    addToGUI(_gui: GUI) {
        const DOPFolder = _gui.addFolder(this.name);
        DOPFolder.add(this, "k", [6, 14, 18, 26]).onChange(() => {
            this.changeK(Number(this.k));
        });
        DOPFolder.add(this.DOPhelper, "visible").name("Show DOP Edges");
    }
}

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    containedTester: any;

    k: number;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();
    }

    async initialize(callback: Function) {
        // this.background = new THREE.Color(0xf1f1f1);
        this.background = new THREE.Color(0x10101a);

        const gridHelper = new THREE.GridHelper(10, 10);
        this.add(gridHelper);

        {
            const translation = new THREE.Vector3(-4, 0, 0);
            const scale = new THREE.Vector3(0.8, 0.8, 0.8);
            const rotation = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, 0, 0, "XYZ")
            );

            const transform = new THREE.Matrix4().compose(
                translation,
                rotation,
                scale
            );

            new DOPdemoObject(
                "teapot",
                "assets/teapot.obj",
                this.objLoader,
                transform,
                (teapot: DOPdemoObject) => {
                    this.demoObjects.push(teapot);
                    this.add(teapot.object);
                    this.add(teapot.DOPhelper);
                    teapot.addToGUI(this.gui);
                }
            );
        }

        {
            const translation = new THREE.Vector3(1, -0.6, 0);
            const scale = new THREE.Vector3(20, 20, 20);
            const rotation = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, 0, 0, "XYZ")
            );

            const transform = new THREE.Matrix4().compose(
                translation,
                rotation,
                scale
            );

            new DOPdemoObject(
                "bunny",
                "assets/stanford-bunny.obj",
                this.objLoader,
                transform,
                (bunny: DOPdemoObject) => {
                    this.demoObjects.push(bunny);
                    this.add(bunny.object);
                    this.add(bunny.DOPhelper);
                    bunny.addToGUI(this.gui);
                }
            );
        }

        {
            const translation = new THREE.Vector3(4, 2.5, 0);
            const scale = new THREE.Vector3(0.01, 0.01, 0.01);
            const rotation = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ")
            );

            const transform = new THREE.Matrix4().compose(
                translation,
                rotation,
                scale
            );

            new DOPdemoObject(
                "nefertiti",
                "assets/nefertiti.obj",
                this.objLoader,
                transform,
                (nefertiti: DOPdemoObject) => {
                    this.demoObjects.push(nefertiti);
                    this.add(nefertiti.object);
                    this.add(nefertiti.DOPhelper);
                    nefertiti.addToGUI(this.gui);
                }
            );
        }

        {
            const geometry = new THREE.SphereGeometry(0.01, 32, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            this.containedTester = new THREE.Mesh(geometry, material);
            this.add(this.containedTester);
        }

        {
            const light = new THREE.AmbientLight(0x888888); // soft white light
            this.add(light);
        }

        {
            const light = new THREE.DirectionalLight(0xffffee, 1);
            light.position.set(0, 4, 2);
            this.add(light);
        }

        {
            const light = new THREE.DirectionalLight(0x0000ff, 0.1);
            light.position.set(0, -4, -2);
            this.add(light);
        }

        callback();
    }

    update() {
        // if (this.bunnyDOP.containsPoint(this.containedTester.position)) {
        //     (
        //         (this.containedTester as THREE.Mesh)
        //             .material as THREE.MeshBasicMaterial
        //     ).color.setHex(0xff0000);
        // } else {
        //     (
        //         (this.containedTester as THREE.Mesh)
        //             .material as THREE.MeshBasicMaterial
        //     ).color.setHex(0x0000ff);
        // }
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
