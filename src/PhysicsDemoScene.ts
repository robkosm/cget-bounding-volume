import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import * as CANNON from "cannon";

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

    private constructor(
        _name: string,
        _url: string,
        _objLoader: OBJLoader,
        _transform: THREE.Matrix4,
        _object: THREE.Object3D
    ) {
        this.name = _name;
        this.object = new THREE.Object3D();
        this.k = 14;
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
        this.DOPhelper = new DOPHelper(this.DOP, new THREE.Color(0xffffff));

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

            this.object.attach(this.mesh);
            this.object.attach(this.meshSegments);
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

export default class PhysicsScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    world: CANNON.World;
    bodies: CANNON.Body[];
    collisionMesh: THREE.Mesh;

    k: number;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();
        this.bodies = [];
    }

    async initialize(callback: Function) {
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

        await this.initializeDemoObjects();

        this.initializeCannon();

        this.initializeLights();

        this.initializeGUI();

        callback();
    }

    initializeCannon() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.81, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        const plane = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(plane);
        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        this.world.addBody(groundBody);

        // const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        // const mass = 1;
        // this.body = new CANNON.Body({
        //     mass: 1,
        // });
        // this.body.addShape(shape);
        // this.body.angularVelocity.set(0, 10, 0);
        // this.body.angularDamping = 0.5;
        // this.world.addBody(this.body);

        for (const demoObject of this.demoObjects) {
            this.addDemoObjectToPhysics(demoObject);
        }
    }

    addDemoObjectToPhysics(demoObject: DOPdemoObject) {
        const monkeyBody = new CANNON.Body({
            mass: 10,
        });

        const rawVerts = demoObject.mesh.geometry.attributes.position.array;

        const verts = [],
            faces = [];

        // Get vertices
        for (let j = 0; j < rawVerts.length; j += 3) {
            verts.push(
                new CANNON.Vec3(rawVerts[j], rawVerts[j + 1], rawVerts[j + 2])
            );
        }

        // Get faces
        for (let j = 0; j < rawVerts.length / 3; j += 3) {
            // hack because of mesh generation mistake
            if ([81].includes(j)) {
                faces.push([j + 1, j, j + 2]);
                continue;
            }
            faces.push([j, j + 1, j + 2]);
        }

        // console.log(verts, faces)

        // Get offset
        // offset = new CANNON.Vec3(0, 0, 0);

        // Construct polyhedron
        const monkeyPart = new CANNON.ConvexPolyhedron(verts, faces);

        // Add to    compound
        monkeyBody.addShape(monkeyPart);
        monkeyBody.position = new CANNON.Vec3(0, 10, 0);
        monkeyBody.angularVelocity.set(
            Math.random() * 1,
            Math.random() * 1,
            Math.random() * 1
        );
        monkeyBody.angularDamping = 0.1;
        this.world.addBody(monkeyBody);

        this.bodies.push(monkeyBody);
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

    async initializeDemoObjects() {
        {
            const monkey = await this.getMonkey();

            this.demoObjects.push(monkey);
            this.add(monkey.object);
            // this.add(monkey.DOPhelper);
            // this.add(monkey.mesh);
            // this.add(monkey.meshSegments);
            monkey.addToGUI(this.gui);
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

    async update(frameCount: number) {
        const timeStep = 1 / 60; // change this
        this.world.step(timeStep);

        // Copy coordinates from Cannon.js to Three.js
        for (let i = 0; i < this.demoObjects.length; i++) {
            const demoObject = this.demoObjects[i];
            const body = this.bodies[i];

            if (body == undefined) {
                console.log("not initialised yet");
                continue;
            }

            demoObject.object.position.copy(body.position);
            demoObject.object.quaternion.copy(body.quaternion);
        }

        // console.log(this.body.position);
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
