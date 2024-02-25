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
    mesh: THREE.Mesh;
    meshSegments: THREE.LineSegments;

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
        this.mesh = new THREE.Mesh();
        this.meshSegments = new THREE.LineSegments();

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

                {
                    const geometry = this.DOP.getGeometry();

                    this.mesh = new THREE.Mesh(
                        geometry,
                        new THREE.MeshBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 0.2,
                        })
                    );

                    this.meshSegments = new THREE.LineSegments(
                        new THREE.WireframeGeometry(geometry),
                        new THREE.LineBasicMaterial({ color: 0xffffff })
                    );
                }

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
        this.DOPhelper.parent?.attach(newDOPhelper);
        this.DOPhelper.parent?.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;

        {
            const geometry = this.DOP.getGeometry();

            const newMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.2,
                })
            );

            this.mesh.add(newMesh);
            this.mesh.parent?.attach(newMesh);
            this.mesh.parent?.remove(this.mesh);
            this.mesh = newMesh;

            const newMeshSegments = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry),
                new THREE.LineBasicMaterial({ color: 0xffffff })
            );

            this.meshSegments.add(newMeshSegments);
            this.meshSegments.parent?.attach(newMeshSegments);
            this.meshSegments.parent?.remove(this.meshSegments);
            this.meshSegments = newMeshSegments;
        }
    }

    addToGUI(_gui: GUI) {
        const DOPFolder = _gui.addFolder(this.name);
        DOPFolder.add(this, "k", [6, 8, 12, 14, 18, 20, 26]).onChange(() => {
            this.changeK(Number(this.k));
        });
        DOPFolder.add(this.DOPhelper, "visible").name("Show DOP Edges");
    }
}

export default class MeshScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

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

    async initialize(callback: () => void) {
        // this.background = new THREE.Color(0xf1f1f1);
        this.background = new THREE.Color(0x10101a);

        {
            const gridHelper = new THREE.GridHelper(
                10,
                100,
                new THREE.Color(0x555566),
                new THREE.Color(0x303040)
            );
            this.add(gridHelper);
        }
        {
            const gridHelper = new THREE.GridHelper(
                10,
                10,
                new THREE.Color(0x555566),
                new THREE.Color(0x484858)
            );
            this.add(gridHelper);
        }

        this.initializeDemoObjects();

        this.initializeLights();

        this.initializeGUI();

        callback();
    }

    initializeDemoObjects() {
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
                    this.add(bunny.mesh);
                    this.add(bunny.meshSegments);
                    bunny.addToGUI(this.gui);
                }
            );
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
