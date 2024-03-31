import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "../../../DOPHelper";
import DOP from "../../../DOP14";

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
        _callback: (obj: DOPdemoObject) => void
    ) {
        this.name = _name;
        this.object = new THREE.Object3D();
        this.k = 14;
        this.DOP = new DOP(this.k);
        this.DOPhelper = new DOPHelper(this.DOP);

        _objLoader.load(
            _url,
            (object: THREE.Object3D) => {
                this.object = object;

                this.object.traverse((mesh) => {
                    if (mesh instanceof THREE.Mesh) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: 0xefd4ca,
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
            function (xhr) {
                console.log(
                    _name + " " + (xhr.loaded / xhr.total) * 100 + "% loaded"
                );
            },
            function (error) {
                console.log(error);
            }
        );
    }

    changeK(_newK: number) {
        this.k = _newK;
        this.DOP = new DOP(Number(_newK));
        this.DOP.setFromObject(this.object);

        const newDOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xff00ff));

        this.DOPhelper.add(newDOPhelper);
        this.DOPhelper.parent?.attach(newDOPhelper);
        this.DOPhelper.parent?.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;
    }

    addToGUI(_gui: GUI) {
        const DOPFolder = _gui.addFolder(this.name);
        DOPFolder.open();
        DOPFolder.add(this, "k", [6, 8, 12, 14, 18, 20, 26]).onChange(() => {
            this.changeK(Number(this.k));
        });
        DOPFolder.add(this.DOPhelper, "visible").name("Show DOP Edges");
    }
}

export default class DemoScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    containsPointTester: THREE.Object3D;
    intersectsBoxTester: THREE.Object3D;
    intersectsSphereTester: THREE.Object3D;
    intersectsRayTesterStart: THREE.Object3D;
    intersectsRayTesterEnd: THREE.Object3D;

    k: number;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();

        this.containsPointTester = new THREE.Object3D();
        this.intersectsBoxTester = new THREE.Object3D();
        this.intersectsSphereTester = new THREE.Object3D();
        this.intersectsRayTesterStart = new THREE.Object3D();
        this.intersectsRayTesterEnd = new THREE.Object3D();
    }

    async initialize(callback: () => void) {
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

        this.initializeGUI();

        this.initializeDemoObjects();

        this.initializeTesters();

        this.initializeLights();

        callback();
    }

    initializeDemoObjects() {
        const demoObjectFolder = this.gui.addFolder("demo objects");
        demoObjectFolder.open();

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
                    teapot.addToGUI(demoObjectFolder);
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
                    bunny.addToGUI(demoObjectFolder);
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
                    nefertiti.addToGUI(demoObjectFolder);
                }
            );
        }
    }

    initializeTesters() {
        const testerFolder = this.gui.addFolder("intersection testers");

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

            const folder = testerFolder.addFolder("contains point tester");
            folder.open();
            folder.add(this.containsPointTester, "visible").name("show/hide");
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

            const folder = testerFolder.addFolder("intersects sphere tester");
            folder.open();
            folder
                .add(this.intersectsSphereTester, "visible")
                .name("show/hide");
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

            const folder = testerFolder.addFolder("intersects box tester");
            folder.open();
            folder
                .add(this.intersectsSphereTester, "visible")
                .name("show/hide");
        }

        {
            const geometry = new THREE.SphereGeometry(0.1, 32, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
            });
            this.intersectsRayTesterStart = new THREE.Mesh(geometry, material);
            this.intersectsRayTesterStart.translateX(3);
            this.intersectsRayTesterStart.translateY(0.5);
            this.intersectsRayTesterStart.translateZ(3.5);
            this.add(this.intersectsRayTesterStart);

            this.intersectsRayTesterEnd = new THREE.Mesh(geometry, material);
            this.intersectsRayTesterEnd.translateX(4);
            this.intersectsRayTesterEnd.translateY(0.5);
            this.intersectsRayTesterEnd.translateZ(4.5);
            this.add(this.intersectsRayTesterEnd);

            const folder = testerFolder.addFolder("intersects ray tester");
            folder.open();
            folder
                .add(this.intersectsRayTesterStart, "visible")
                .name("show/hide");

            folder
                .add(this.intersectsRayTesterEnd, "visible")
                .name("show/hide");
        }
    }

    initializeGUI() {}

    initializeLights() {
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
    }

    update() {
        if (
            this.demoObjects.some((obj) =>
                obj.DOP.containsPoint(this.containsPointTester.position)
            )
        ) {
            (
                (this.containsPointTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
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
            (
                (this.intersectsSphereTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            (
                (this.intersectsSphereTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
        }

        if (
            this.demoObjects.some((obj) =>
                obj.DOP.intersectsBox(
                    new THREE.Box3().setFromObject(this.intersectsBoxTester)
                )
            )
        ) {
            (
                (this.intersectsBoxTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            (
                (this.intersectsBoxTester as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
        }

        if (
            this.demoObjects.some((obj) =>
                obj.DOP.intersectsRay(
                    new THREE.Ray(
                        this.intersectsRayTesterStart.position,
                        this.intersectsRayTesterEnd.position
                            .clone()
                            .sub(this.intersectsRayTesterStart.position)
                    )
                )
            )
        ) {
            (
                (this.intersectsRayTesterStart as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
            (
                (this.intersectsRayTesterEnd as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0xff00ff);
        } else {
            (
                (this.intersectsRayTesterStart as THREE.Mesh)
                    .material as THREE.MeshStandardMaterial
            ).emissive.setHex(0x00ffff);
            (
                (this.intersectsRayTesterEnd as THREE.Mesh)
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
