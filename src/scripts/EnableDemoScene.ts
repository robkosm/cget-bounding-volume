// import * as THREE from "three";

import { AmmoPhysicsObject, OBJLoader } from "three/examples/jsm/Addons.js";

import { GUI } from "dat.gui";

import DOPHelper from "./DOPHelper";
import DOP from "./DOP14";
import { Clock } from "three";
import { AmmoPhysics } from "three/addons/physics/AmmoPhysics.js";
import * as THREE from "three";

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

export default class EnableScene extends THREE.Scene {
    private readonly objLoader = new OBJLoader();

    gui: GUI;

    demoObjects: DOPdemoObject[] = [];

    k: number;

    clock: THREE.Clock;
    physics: AmmoPhysicsObject;

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI({ closed: true });
        this.clock = new THREE.Clock();
    }

    async initialize(callback: () => void) {
        this.initializeWorld();

        await this.initializeCannon();

        // await this.addOneMonkey();
        // await this.addOneMonkey();

        this.initializeLights();

        this.initializeGUI();

        this.physics.addScene(this);

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

    async initializeCannon() {
        this.physics = await AmmoPhysics();

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(10, 5, 10),
            new THREE.ShadowMaterial({ color: 0x444444 })
        );
        floor.position.y = 0;
        floor.receiveShadow = true;
        floor.userData.physics = { mass: 0 };
        this.add(floor);

        // for (const demoObject of this.demoObjects) {
        //     this.addDemoObjectToPhysics(demoObject);
        // }
    }

    addDemoObjectToPhysics(demoObject: DOPdemoObject) {
        const rawVerts = demoObject.mesh.geometry.attributes.position.array;
        // const rawVerts =
        //     demoObject.object.children[0].geometry.attributes.position.array;

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
        // this.physics.add.existing(monkeyBody);
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
        monkey.mesh.userData.physics = { mass: 1 };
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
        // 5 sek
        // if (frameCount % 300 == 0) {
        //     this.addOneMonkey();
        // }

        const timeStep = 1 / 60; // change this

        // Copy coordinates from Cannon.js to Three.js
        // for (let i = 0; i < this.demoObjects.length; i++) {
        // const demoObject = this.demoObjects[i];
        // const body = this.bodies[i];

        // if (body == undefined) {
        //     continue;
        // }

        // demoObject.object.position.copy(body.position);
        // demoObject.object.quaternion.copy(body.quaternion);
        // }

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