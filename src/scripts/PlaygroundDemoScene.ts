import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "../pages/DOPHelper";
import DOP from "../pages/DOP14";

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
        this.object = new THREE.Object3D();
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
                            // color: 0xffa996,
                            // color: (Math.random() * 0xFFFFFF << 0),
                            roughness: 0.1,
                        });
                        mesh.castShadow = true;
                    }
                });

                this.object.applyMatrix4(_transform);

                this.DOP.setFromObject(object);
                this.DOPhelper = new DOPHelper(
                    this.DOP,
                    new THREE.Color(0xff00ff)
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

        const newDOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xff00ff));

        // replace line rendered mesh
        this.DOPhelper.add(newDOPhelper);
        this.DOPhelper.parent?.attach(newDOPhelper);
        this.DOPhelper.parent?.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;
    }

    addToGUI(_gui: GUI) {
        const DOPFolder = _gui.addFolder(this.name);
        DOPFolder.add(this, "k", [6, 8, 12, 14, 18, 20, 26]).onChange(() => {
            this.changeK(Number(this.k));
        });
        DOPFolder.add(this.DOPhelper, "visible").name("Show DOP Edges");
    }
}

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();
    private readonly gltfLoader = new GLTFLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    containsPointTester: THREE.Object3D;
    intersectsBoxTester: THREE.Object3D;
    intersectsSphereTester: THREE.Object3D;

    k: number;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();

        this.containsPointTester = new THREE.Object3D();
        this.intersectsBoxTester = new THREE.Object3D();
        this.intersectsSphereTester = new THREE.Object3D();
    }

    async initialize(callback: Function) {
        // this.background = new THREE.Color(0xf1f1f1);
        // this.background = new THREE.Color(0x10101a);
        this.background = new THREE.Color(0xa0a0a0);
        this.fog = new THREE.Fog(0xa0a0a0, 10, 50);

        {
            const geometry = new THREE.PlaneGeometry(1000, 1000);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                roughness: 0.6,
            });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotateX(Math.PI / 2);
            plane.receiveShadow = true;
            this.add(plane);
        }

        // {
        //     const geometry = new THREE.PlaneGeometry( 100, 100 );
        //     const material = new THREE.MeshStandardMaterial( {color: 0xffffff, side: THREE.DoubleSide, roughness: .6} );
        //     const plane = new THREE.Mesh( geometry, material );
        //     plane.translateZ(-5)
        //     this.add( plane );
        // }

        // {
        //     const geometry = new THREE.PlaneGeometry( 100,5 );
        //     const material = new THREE.MeshStandardMaterial( {color: 0xffffff, side: THREE.DoubleSide, roughness: .6} );
        //     const plane = new THREE.Mesh( geometry, material );
        //     plane.translateZ(-4)
        //     plane.rotateX(-Math.PI/16)

        //     this.add( plane );
        // }

        {
            const gridHelper = new THREE.GridHelper(
                10,
                100,
                new THREE.Color(0xeeeeee),
                new THREE.Color(0xeeeeee)
            );
            gridHelper.translateY(0.01);
            this.add(gridHelper);
        }
        {
            const gridHelper = new THREE.GridHelper(
                10,
                10,
                new THREE.Color(0xdddddd),
                new THREE.Color(0xdddddd)
            );
            gridHelper.translateY(0.01);
            this.add(gridHelper);
        }

        this.initializeDemoObjects();

        this.initializeLights();

        this.initializeGUI();

        callback();
    }

    initializeDemoObjects() {
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
            const geometry = new THREE.SphereGeometry(0.1, 32, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
            });
            this.containsPointTester = new THREE.Mesh(geometry, material);
            this.containsPointTester.translateX(-4);
            this.containsPointTester.translateZ(4);
            this.add(this.containsPointTester);
        }

        {
            const geometry = new THREE.SphereGeometry(0.5, 32, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
            });
            this.intersectsSphereTester = new THREE.Mesh(geometry, material);
            this.intersectsSphereTester.translateX(-2);
            this.intersectsSphereTester.translateY(0.5);
            this.intersectsSphereTester.translateZ(4);
            this.add(this.intersectsSphereTester);
        }

        {
            const geometry = new THREE.BoxGeometry(2, 1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
            });
            this.intersectsBoxTester = new THREE.Mesh(geometry, material);
            this.intersectsBoxTester.translateX(0);
            this.intersectsBoxTester.translateY(0.5);
            this.intersectsBoxTester.translateZ(4);
            this.add(this.intersectsBoxTester);
        }
    }

    initializeGUI() {
        // // TODO: toggle transform controls
        // const shapeFolder = this.gui.addFolder("intersection test shapes");
        // shapeFolder.add(this.containsPointTester, "visible").name("Show containsPointTester");
        // shapeFolder.add(this.intersectsSphereTester, "visible").name("Show intersectsSphereTester");
        // shapeFolder.add(this.intersectsBoxTester, "visible").name("Show intersectsBoxTester");
    }

    initializeLights() {
        // {
        //     const light = new THREE.AmbientLight(0x888888); // soft white light
        //     this.add(light);
        // }

        // {
        //     const light = new THREE.DirectionalLight(0xffffee, 2);
        //     light.position.set(0, 4, 1);
        //     this.add(light);
        // }

        // {
        //     const light = new THREE.DirectionalLight(0xffffee, .8);
        //     light.position.set(2, .5, 1);
        //     this.add(light);
        // }

        // {
        //     const light = new THREE.DirectionalLight(0xffffee, .7);
        //     light.position.set(-2, .5, 1);
        //     this.add(light);
        // }

        // {
        //     const light = new THREE.DirectionalLight(0xffffee, .8);
        //     light.position.set(0, 1, 1);
        //     this.add(light);
        // }

        {
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 2);
            hemiLight.position.set(0, 100, 0);
            this.add(hemiLight);
        }

        {
            const dirLight = new THREE.DirectionalLight(0xffffff, 2);
            dirLight.position.set(0, 20, 20);
            dirLight.castShadow = true;
            dirLight.shadow.camera.top = 8;
            dirLight.shadow.camera.bottom = -8;
            dirLight.shadow.camera.left = -8;
            dirLight.shadow.camera.right = 8;
            dirLight.shadow.camera.near = 0.1;
            dirLight.shadow.camera.far = 40;
            this.add(dirLight);
        }

        // {
        //     const light = new THREE.DirectionalLight(0x0000ff, 0.1);
        //     light.position.set(0, -4, -2);
        //     this.add(light);
        // }
    }

    update() {
        if (
            this.demoObjects.some((obj) =>
                obj.DOP.containsPoint(this.containsPointTester.position)
            )
        ) {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0xff00ff);
            (
                (this.containsPointTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0x00ffff);
            (
                (this.containsPointTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
        }

        if (
            this.demoObjects.some((obj) =>
                obj.DOP.intersectsSphere(
                    new THREE.Sphere(
                        this.intersectsSphereTester.position,
                        (
                            (this.intersectsSphereTester as THREE.Mesh)
                                .geometry as THREE.SphereGeometry
                        ).parameters.radius
                    )
                )
            )
        ) {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0xff00ff);
            (
                (this.intersectsSphereTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0x00ffff);
            (
                (this.intersectsSphereTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
        }

        // this.intersectsBoxTester.geometry.computeBoundingBox()
        if (
            this.demoObjects.some((obj) =>
                // obj.DOP.intersectsBox(this.intersectsBoxTester.geometry.boundingBox)
                obj.DOP.intersectsBox(
                    new THREE.Box3().setFromObject(this.intersectsBoxTester)
                )
            )
        ) {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0xff00ff);
            (
                (this.intersectsBoxTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            // (
            //     (this.containsPointTester as THREE.Mesh)
            //         .material as THREE.MeshStandardMaterial
            // ).color.setHex(0x00ffff);
            (
                (this.intersectsBoxTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
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
