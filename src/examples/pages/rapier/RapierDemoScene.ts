import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

// import wasm from "vite-plugin-wasm";

const RAPIER = await import("@dimforge/rapier3d");

import DOPHelper from "../../../DOPHelper";
import DOP from "../../../DOP14";

class DOPdemoObject {
    name: string;
    object: THREE.Object3D;
    DOP: DOP;
    DOPhelper: DOPHelper;
    k: number;
    mesh: THREE.Mesh;
    meshSegments: THREE.LineSegments;

    private constructor(
        _name: string,
        _url: string,
        _objLoader: OBJLoader,
        _transform: THREE.Matrix4,
        _object: THREE.Object3D
    ) {
        this.name = _name;
        this.object = new THREE.Object3D();
        this.k = 20;
        this.DOP = new DOP(this.k);
        this.DOPhelper = new DOPHelper(this.DOP);
        this.mesh = new THREE.Mesh();
        this.meshSegments = new THREE.LineSegments();

        this.object = _object;

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

        this.DOP.setFromObject(this.object);
        this.DOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xff00ff));

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
                new THREE.LineBasicMaterial({ color: 0xff00ff })
            );

            // this.object.attach(this.mesh);
            // this.object.attach(this.meshSegments);
        }
    }

    static async initialize(
        _name: string,
        _url: string,
        _objLoader: OBJLoader,
        _transform: THREE.Matrix4
    ) {
        const object = await _objLoader.loadAsync(
            // resource URL
            _url,
            // called when resource is loaded

            // called when loading is in progresses
            function (xhr) {
                console.log(
                    _name + " " + (xhr.loaded / xhr.total) * 100 + "% loaded"
                );
            }
        );

        return new DOPdemoObject(_name, _url, _objLoader, _transform, object);
    }

    changeK(_newK: number) {
        this.DOP = new DOP(Number(this.k));
        this.DOP.setFromObject(this.object);

        const newDOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xffffff));

        // replace line rendered mesh
        this.DOPhelper.add(newDOPhelper);
        this.DOPhelper.parent?.attach(newDOPhelper);
        this.DOPhelper.parent?.remove(this.DOPhelper);
        this.DOPhelper = newDOPhelper;

        {
            // const geometry = this.DOP.getGeometry();
            // const newMesh = new THREE.Mesh(
            //     geometry,
            //     new THREE.MeshBasicMaterial({
            //         color: 0xffffff,
            //         transparent: true,
            //         opacity: 0.2,
            //     })
            // );
            // this.mesh.add(newMesh);
            // this.mesh.parent?.attach(newMesh);
            // this.mesh.parent?.remove(this.mesh);
            // this.mesh = newMesh;
            // const newMeshSegments = new THREE.LineSegments(
            //     new THREE.WireframeGeometry(geometry),
            //     new THREE.LineBasicMaterial({ color: 0xffffff })
            // );
            // this.meshSegments.add(newMeshSegments);
            // this.meshSegments.parent?.attach(newMeshSegments);
            // this.meshSegments.parent?.remove(this.meshSegments);
            // this.meshSegments = newMeshSegments;
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

export default class RapierScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    world;
    gravity;
    bodies;

    k: number;

    constructor() {
        super();
        this.k = 20;
        this.gui = new GUI({ closed: true });
        this.bodies = [];

        this.gravity = { x: 0.0, y: -9.81, z: 0.0 };
        this.world = new RAPIER.World(this.gravity);
    }

    async initialize(callback: () => void) {
        this.initializeWorld();

        this.initializeCannon();

        await this.addOneMonkey();
        // await this.addOneMonkey();

        this.initializeLights();

        this.initializeGUI();

        callback();
    }

    initializeWorld() {
        // this.background = new THREE.Color(0xf1f1f1);
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
    }

    initializeCannon() {
        // Create the ground
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
            100.0,
            0.1,
            100.0
        );
        this.world.createCollider(groundColliderDesc);
    }

    addDemoObjectToPhysics(demoObject: DOPdemoObject) {
        const indices: Uint32Array[] = [];
        for (
            let i = 0;
            i <
            demoObject.object.children[0].geometry.getAttribute("position")
                .array.length /
                3;
            i++
        ) {
            indices.push(i);
        }

        const cp = new RAPIER.ConvexPolyhedron(
            demoObject.mesh.geometry.getAttribute("position").array
        );

        // const tm = new RAPIER.TriMesh(
        //     demoObject.object.children[0].geometry.getAttribute(
        //         "position"
        //     ).array,
        //     indices
        // );

        // Create a dynamic rigid-body.
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            0.0,
            10.0,
            0.0
        );
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        rigidBody.addTorque(
            new RAPIER.Vector3(
                Math.random() * 20 - 10,
                Math.random() * 20 - 10,
                Math.random() * 20 - 10
            ),
            true
        );

        // Create a cuboid collider attached to the dynamic rigidBody.
        // const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        const colliderDesc = new RAPIER.ColliderDesc(cp);
        const collider = this.world.createCollider(colliderDesc, rigidBody);

        this.bodies.push(rigidBody);
    }

    async getMonkey() {
        const translation = new THREE.Vector3(0, 0, 0); // cannot be negative, because face orientation breaks?
        const scale = new THREE.Vector3(1, 1, 1);
        const rotation = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, 0, 0, "XYZ")
        );

        const transform = new THREE.Matrix4().compose(
            translation,
            rotation,
            scale
        );

        const monkey = await DOPdemoObject.initialize(
            "monkey",
            "assets/monkey.obj",
            this.objLoader,
            transform
        );

        return monkey;
    }

    async addOneMonkey() {
        const monkey = await this.getMonkey();

        this.demoObjects.push(monkey);
        this.add(monkey.object);
        this.addDemoObjectToPhysics(monkey);
        // this.add(monkey.DOPhelper);
        // this.add(monkey.mesh);
        // this.add(monkey.meshSegments);
        // monkey.addToGUI(this.gui);
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

        // {
        //     const light = new THREE.AmbientLight(0x888888); // soft white light
        //     this.add(light);
        // }

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

    async update(_frameCount: number) {
        if (_frameCount > 300 && _frameCount % 20 == 0) {
            this.addOneMonkey();
        }

        this.world.step();

        // Copy coordinates from Cannon.js to Three.js
        for (let i = 0; i < this.demoObjects.length; i++) {
            const demoObject = this.demoObjects[i];
            const body = this.bodies[i];

            if (body == undefined) {
                continue;
            }

            const v = body.translation();
            const q = body.rotation();

            demoObject.object.position.copy(new THREE.Vector3(v.x, v.y, v.z));
            demoObject.object.quaternion.copy(
                new THREE.Quaternion(q.x, q.y, q.z, q.w)
            );
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
