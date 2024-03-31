import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { GUI } from "dat.gui";

import DOPHelper from "../../../DOPHelper";
import DOP from "../../../DOP";

export default class ChessDemoScene extends THREE.Scene {
    private readonly gltfLoader = new GLTFLoader();

    gui: GUI;

    k: number;
    DOPHelpers: DOPHelper[];

    constructor() {
        super();
        this.k = 26;
        this.gui = new GUI();
        this.DOPHelpers = [];
    }

    async initialize(callback: () => void) {
        this.background = new THREE.Color(0xa0a0a0);
        this.fog = new THREE.Fog(0xa0a0a0, 1, 5);

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
                1,
                100,
                new THREE.Color(0xeeeeee),
                new THREE.Color(0xeeeeee)
            );
            gridHelper.translateY(0.01);
            this.add(gridHelper);
        }
        {
            const gridHelper = new THREE.GridHelper(
                1,
                10,
                new THREE.Color(0xdddddd),
                new THREE.Color(0xdddddd)
            );
            gridHelper.translateY(0.01);
            this.add(gridHelper);
        }

        this.initializeGUI();

        const piecesFolder = this.gui.addFolder("pieces");

        this.gltfLoader.load(
            "assets/chess/glTF/ABeautifulGame.gltf",
            (gltf) => {
                console.log(gltf.scene);
                gltf.scene.traverse((o) => {
                    if (o instanceof THREE.Mesh) {
                        const dop = new DOP(26);
                        dop.setFromObject(o);
                        const dopHelper = new DOPHelper(dop);
                        const folder = piecesFolder.addFolder(o.userData.name);
                        folder.add(o, "visible").name("mesh visible");
                        folder.add(dopHelper, "visible").name("helper visible");
                        this.add(dopHelper);
                        this.DOPHelpers.push(dopHelper);
                    } else {
                        const dop = new DOP(26);
                        dop.setFromObject(o);
                        const dopHelper = new DOPHelper(
                            dop,
                            new THREE.Color(0xff00ff)
                        );
                        const folder = this.gui.addFolder(
                            "group " + Math.random().toString(36).slice(2, 5)
                        );
                        folder.add(dopHelper, "visible").name("mesh visible");
                        folder.add(dopHelper, "visible").name("helper visible");
                        this.add(dopHelper);
                    }
                });

                this.add(gltf.scene);

                gltf.animations;
                gltf.scene;
                gltf.scenes;
                gltf.cameras;
                gltf.asset;
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            function (error) {
                throw error;
            }
        );

        this.initializeLights();

        callback();
    }

    initializeGUI() {
        this.gui
            .add(
                {
                    add: () => {
                        this.traverse(function (o) {
                            if (o instanceof THREE.Mesh) {
                                o.visible = false;
                            }
                        });
                    },
                },
                "add"
            )
            .name("hide all meshes");
        this.gui
            .add(
                {
                    add: () => {
                        this.traverse(function (o) {
                            if (o instanceof THREE.Mesh) {
                                o.visible = true;
                            }
                        });
                    },
                },
                "add"
            )
            .name("show all meshes");
        this.gui
            .add(
                {
                    add: () => {
                        for (const dh of this.DOPHelpers) {
                            dh.visible = false;
                        }
                    },
                },
                "add"
            )
            .name("hide all k-DOP helpers");
        this.gui
            .add(
                {
                    add: () => {
                        for (const dh of this.DOPHelpers) {
                            dh.visible = true;
                        }
                    },
                },
                "add"
            )
            .name("show all k-DOP helpers");
    }

    initializeLights() {
        {
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 2);
            hemiLight.position.set(0, 100, 0);
            this.add(hemiLight);
        }

        {
            const dirLight = new THREE.DirectionalLight(0xffffff, 2);
            dirLight.position.set(0, 20, 20);
            this.add(dirLight);
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
