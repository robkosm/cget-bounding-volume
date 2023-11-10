import * as THREE from 'three'

import { OBJLoader } from 'three/examples/jsm/Addons.js';
import { MTLLoader } from 'three/examples/jsm/Addons.js';

export default class DemoScene extends THREE.Scene
{
    private readonly objLoader = new OBJLoader()
    private readonly mtlLoader = new MTLLoader()

    async initialize()
    {
        const targetMtl = await this.mtlLoader.loadAsync('assets/targetA.mtl')
        targetMtl.preload()

        const bunny = await this.createBunny(targetMtl)
        bunny.scale.set(10, 10, 10)
        this.add(bunny)

        const light = new THREE.DirectionalLight(0xFFFFFF, 1)
        light.position.set(0, 4, 2)
        this.add(light)
    }

    private async createBunny(mtl: MTLLoader.MaterialCreator) {
        this.objLoader.setMaterials(mtl)

        const modelRoot = await this.objLoader.loadAsync('assets/stanford-bunny.obj')

        return modelRoot
    }

    update() {
    }
}