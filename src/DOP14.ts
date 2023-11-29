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

    applyMatrix(_matrix: THREE.Matrix4): this {
        throw new Error("not Implemented");
    }

    clone(): DOP14 {
        return new DOP14().copy(this);
    }

    copy(dop14: DOP14): this {
        this.min = dop14.min;
        this.max = dop14.max;

        return this;
    }

    makeEmpty() {
        this.min = Array(7).fill(-INFINITY);
        this.max = Array(7).fill(INFINITY);

        return this;
    }

    containsDOP14(dop14: DOP14): boolean {
        return (
            this.min.every((val, index) => val <= dop14.min[index]) &&
            this.max.every((val, index) => val >= dop14.min[index])
        );
    }

    containsPoint(point: THREE.Vector3): boolean {
        for (let i = 0; i < this.normals.length; i++) {
            const dotProduct = point.dot(this.normals[i]);
            if (!(this.min[i] <= dotProduct && dotProduct <= this.max[i]))
                return false;
        }

        return true;
    }

    equals(dop14: DOP14): boolean {
        return (
            this.min.every((val, index) => val === dop14.min[index]) &&
            this.max.every((val, index) => val === dop14.max[index])
        );
    }

    expandByPoint(point: THREE.Vector3): this {
        for (let j = 0; j < 7; j++) {
            const dotProduct = point.dot(this.normals[j]);

            this.min[j] = Math.min(this.min[j], dotProduct);
            this.min[j] = Math.max(this.max[j], dotProduct);
        }

        return this;
    }

    expandByObject(object: THREE.Object3D, precise: boolean): this {
        // Computes the DOP14 of an object (including its children),
        // accounting for both the object's, and children's, world transforms

        object.updateWorldMatrix(false, false);

        const geometry = (object as THREE.Mesh).geometry;

        if (geometry !== undefined) {
            const positionAttribute = geometry.getAttribute("position");

            // geometry-level bounding box

            const geometryDOP14 = new DOP14().setFromBufferAttribute(
                geometry.getAttribute("position")
            );

            _dop14.copy(geometryDOP14);

            _dop14.applyMatrix4(object.matrixWorld);

            this.union(_dop14);
        }

        const children = object.children;

        for (let i = 0, l = children.length; i < l; i++) {
            this.expandByObject(children[i], precise);
        }

        return this;
    }

    getCenter(target: THREE.Vector3): THREE.Vector3 {
        const x = (this.max[0] + this.min[0]) / 2;
        const y = (this.max[1] + this.min[1]) / 2;
        const z = (this.max[2] + this.min[2]) / 2;

        return target.copy(new THREE.Vector3(x, y, z));
    }

    intersectsDOP14(_dop14: DOP14): boolean {
        throw new Error("not Implemented");
    }

    setFromArray(_array: number[]): this {
        throw new Error("not Implemented");
    }

    setFromBufferAttribute(attribute: THREE.BufferAttribute): this {
        // TODO: reset

        for (let i = 0; i < attribute.count; i += attribute.itemSize) {
            const x = attribute.array[i + 0];
            const y = attribute.array[i + 1];
            const z = attribute.array[i + 2];

            const v = new THREE.Vector3(x, y, z);

            this.expandByPoint(v);
        }

        return this;
    }

    setFromObject(_object: THREE.Object3D, _precise: boolean): this {
        throw new Error("not Implemented");
    }

    setFromPoints(_points: THREE.Vector3): this {
        throw new Error("not Implemented");
    }

    setFromVertexBuffers(buffers: THREE.Float32BufferAttribute[]) {
        for (const buffer of buffers) {
        }
    }

    union(dop14: DOP14): this {
        for (let i = 0; i < this.min.length; i++) {
            this.min[i] = Math.min(this.min[i], dop14.min[i]);
            this.max[i] = Math.max(this.max[i], dop14.max[i]);
        }

        return this;
    }
}

const _dop14 = new DOP14();
