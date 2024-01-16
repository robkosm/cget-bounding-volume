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
                this.object.applyMatrix4(_transform);

                this.DOP.setFromObject(object);
                this.DOPhelper = new DOPHelper(this.DOP);
                _callback(this);
            },
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
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

        const newDOPhelper = new DOPHelper(this.DOP);

        // replace line rendered mesh
        this.DOPhelper.add(newDOPhelper);
        this.DOPhelper.parent.attach(newDOPhelper);
        this.DOPhelper.parent.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;

        console.log(_newK, this.DOP);
    }

    addToGUI(_gui: GUI) {
        const DOPFolder = _gui.addFolder(this.name);
        DOPFolder.add(this, "k", [6, 14, 18, 26]).onChange(() => {
            this.changeK(Number(this.k));
        });
        console.log(this.DOPhelper);
        DOPFolder.add(this.DOPhelper, "visible").name("Show DOP Edges");
    }
}

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    containedTester: any;

    // private bunny = new THREE.Object3D();
    // private bunnyDOP: DOP;
    // private bunnyHelper: DOPHelper;

    k: number;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();
    }

    async initialize(callback: Function) {
        const axesHelper = new THREE.AxesHelper(5);
        this.add(axesHelper);

        {
            const translation = new THREE.Vector3(-6, 0, 0);
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
            const translation = new THREE.Vector3(0, -1, 0);
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
            const translation = new THREE.Vector3(6, 2, 0);
            const scale = new THREE.Vector3(0.01, 0.01, 0.01);
            const rotation = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(-90, 0, 0, "XYZ")
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

        // // load a resource
        // this.objLoader.load(
        //     // resource URL
        //     "assets/stanford-bunny.obj",
        //     // called when resource is loaded
        //     (object) => {
        //         this.bunny = object;
        //         this.bunny.scale.set(25, 25, 25)
        //         this.bunny.translateX(-6)
        //         this.bunny.translateY(-.75)
        //         this.add(object);

        //         this.bunnyDOP.setFromObject(this.bunny);
        //         this.bunnyHelper = new DOPHelper(this.bunnyDOP);
        //         this.add(this.bunnyHelper);
        //     },
        //     // called when loading is in progresses
        //     function (xhr) {
        //         console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        //     },
        //     // called when loading has errors
        //     function (error) {
        //         console.log("An error happened");
        //     }
        // );

        // // load a resource
        // this.objLoader.load(
        //     // resource URL
        //     "assets/nefertiti.obj",
        //     // called when resource is loaded
        //     (object) => {
        //         this.nefertiti = object;
        //         this.nefertiti.scale.set(.01, .01, .01);
        //         this.nefertiti.rotateX(-90);
        //         this.nefertiti.translateX(6)
        //         this.nefertiti.translateY(-1)
        //         this.nefertiti.translateZ(2.5)
        //         this.add(object);

        //         this.nefertitiDOP.setFromObject(this.nefertiti);
        //         this.nefertitiHelper = new DOPHelper(this.nefertitiDOP);
        //         this.add(this.nefertitiHelper);

        //         console.log(this.nefertitiDOP)
        //     },
        //     // called when loading is in progresses
        //     function (xhr) {
        //         console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        //     },
        //     // called when loading has errors
        //     function (error) {
        //         console.log("An error happened");
        //     }
        // );

        // // load a resource
        // this.objLoader.load(
        //     // resource URL
        //     "assets/teapot.obj",
        //     // called when resource is loaded
        //     (object) => {
        //         this.teapot = object;
        //         this.add(object);

        //         this.teapotDOP.setFromObject(this.teapot);
        //         this.teapotHelper = new DOPHelper(this.teapotDOP);
        //         this.add(this.teapotHelper);

        //         console.log(this.teapotDOP)
        //     },
        //     // called when loading is in progresses
        //     function (xhr) {
        //         console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        //     },
        //     // called when loading has errors
        //     function (error) {
        //         console.log("An error happened");
        //     }
        // );

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

        // const bunnyFolder = gui.addFolder("Bunny");
        // bunnyFolder.add(this.bunny, "visible");
        // bunnyFolder.open();

        // const DOPFolder = gui.addFolder("DOP");
        // DOPFolder.add(this, "k", [6, 14, 18, 26]).onChange(() => {
        //     this.bunnyDOP = new DOP(Number(this.k));
        //     // console.log(this.bunnyDOP);

        //     this.bunnyDOP.setFromObject(this.bunny);
        //     // console.log(this.bunnyDOP);

        //     // console.log(this.k, this.bunny);

        //     const newBunnyHelper = new DOPHelper(this.bunnyDOP);

        //     this.bunnyHelper.add(newBunnyHelper);
        //     this.bunnyHelper.parent.attach(newBunnyHelper);
        //     this.bunnyHelper.parent.remove(this.bunnyHelper);
        //     this.bunnyHelper = newBunnyHelper;
        // });
        // DOPFolder.add(this.bunnyHelper, "visible").name("Show Edges");
        // DOPFolder.open();

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
