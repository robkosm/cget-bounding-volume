import * as THREE from "three";
import { INFINITY } from "three/examples/jsm/nodes/Nodes.js";

export default class DOP14 {
    isDOP14: boolean = true;
    min: number[];
    max: number[];
    normals = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
    ];

    constructor(
        _min: number[] = Array(7).fill(-INFINITY),
        _max: number[] = Array(7).fill(INFINITY)
    ) {
        this.min = _min;
        this.max = _max;

        this.normals.forEach((n) => n.normalize());
    }

    applyMatrix(matrix: THREE.Matrix4): this {
        throw new Error("not Implemented");
    }

    clone(): DOP14 {
        return new DOP14().copy(this);
    }

    containsDOP14(dop14: DOP14): boolean {
        throw new Error("not Implemented");
    }

    containsPoint(point: THREE.Vector3): boolean {
        throw new Error("not Implemented");
    }

    copy(dop14: DOP14): this {
        this.min = dop14.min;
        this.max = dop14.max;

        return this;
    }

    equals(dop14: DOP14): boolean {
        throw new Error("not Implemented");
    }

    getCenter(target: THREE.Vector3): THREE.Vector3 {
        const x = (this.max[0] + this.min[0]) / 2
        const y = (this.max[1] + this.min[1]) / 2
        const z = (this.max[2] + this.min[2]) / 2

        return target.copy(new THREE.Vector3(x,y,z))
    }

    intersectsDOP14(dop14: DOP14): boolean {
        throw new Error("not Implemented");
    }

    setFromArray(array: number[]): this {
        throw new Error("not Implemented");
    }

    setFromBufferAttribute(attribute: THREE.BufferAttribute): this {
        throw new Error("not Implemented");
    }

    setFromObject(object: THREE.Object3D, precise: boolean): this {
        throw new Error("not Implemented");
    }

    setFromPoints(points: THREE.Vector3): this {
        throw new Error("not Implemented");
    }

    setFromVertexBuffers(buffers: THREE.Float32BufferAttribute[]) {
        // no up to spec, should be replaced
        // iterate vertices
        const minRecord = Array(7).fill(Number.MAX_VALUE);
        const maxRecord = Array(7).fill(Number.MIN_VALUE);

        for (const buffer of buffers) {
            for (let i = 0; i < buffer.count; i += buffer.itemSize) {
                const x = buffer.array[i + 0];
                const y = buffer.array[i + 1];
                const z = buffer.array[i + 2];

                const v = new THREE.Vector3(x, y, z);

                for (let j = 0; j < 7; j++) {
                    // const dotProduct = x * this.normals[j][0] + y * this.normals[j][1] + z * this.normals[j][2]
                    const dotProduct = v.dot(this.normals[j]);

                    minRecord[j] = Math.min(minRecord[j], dotProduct);
                    maxRecord[j] = Math.max(maxRecord[j], dotProduct);
                }
            }
        }

        this.min = minRecord;
        this.max = maxRecord;
    }

    union(dop14: DOP14): this {
        throw new Error("not Implemented");
    }
}
