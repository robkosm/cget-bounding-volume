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

    applyMatrix4(matrix: THREE.Matrix4): this {
        function getIntersectionLine(
            plane1Normal: THREE.Vector3,
            plane1Distance: number,
            plane2Normal: THREE.Vector3,
            plane2Distance: number
        ) {
            const direction = plane1Normal
                .clone()
                .cross(plane2Normal)
                .normalize();

            // https://matematicainteractivacr.com/practicasapuntes/ArtticuloFormulaInterseccionplanos.pdf
            // https://stackoverflow.com/questions/6408670/line-of-intersection-between-two-planes#:~:text=0-,You,-can%20find%20the
            const n1 = plane1Normal;
            const n2 = plane2Normal;
            const d1 = plane1Normal
                .clone()
                .dot(plane1Normal.clone().multiplyScalar(plane1Distance));
            const d2 = plane2Normal
                .clone()
                .dot(plane2Normal.clone().multiplyScalar(plane2Distance));

            const n12 = n1.clone().cross(n2).length() ** 2;

            if (n12 == 0) {
                console.log("parallel vectors");
            }

            const a1 = (d1 * n2.length() ** 2 - d2 * n1.clone().dot(n2)) / n12;
            const a2 = (d2 * n1.length() ** 2 - d1 * n1.clone().dot(n2)) / n12;
            const p = n1
                .clone()
                .multiplyScalar(a1)
                .add(n2.clone().multiplyScalar(a2));

            // console.log(p);

            return {
                direction: direction,
                start: p,
            };
        }

        function getLinePlaneIntersectionU(
            planeNormal: THREE.Vector3,
            planeDistance: number,
            lineStart: THREE.Vector3,
            lineDirection: THREE.Vector3
        ): number {
            if (
                Math.abs(
                    planeNormal.clone().angleTo(lineDirection) - Math.PI / 2
                ) < 0.001
            ) {
                // console.log('line is parallel to plane')
                return Infinity;
            }

            const planePoint = planeNormal
                .clone()
                .multiplyScalar(planeDistance);
            const u =
                (planeNormal.clone().dot(planePoint.clone()) -
                    planeNormal.clone().dot(lineStart.clone())) /
                planeNormal.clone().dot(lineDirection.clone().normalize());

            return u;
        }

        function pointIsOnLeftPlaneSide(
            normal: THREE.Vector3,
            distanceToOrigin: number,
            point: THREE.Vector3
        ): boolean {
            const pointOnPlane = normal
                .clone()
                .multiplyScalar(distanceToOrigin);
            const d = -normal.clone().dot(pointOnPlane);
            return point.clone().dot(normal) + d > 0;
        }

        const lineSegments = [];
        // for all combinations of planes
        for (let i = 0; i < this.normals.length; i++) {
            for (let j = 0; j < this.normals.length; j++) {
                if (i == j) continue;

                const l1 = getIntersectionLine(
                    this.normals[i],
                    this.min[i],
                    this.normals[j],
                    this.min[j]
                );

                const l2 = getIntersectionLine(
                    this.normals[i],
                    this.min[i],
                    this.normals[j],
                    this.max[j]
                );

                const l3 = getIntersectionLine(
                    this.normals[i],
                    this.max[i],
                    this.normals[j],
                    this.min[j]
                );

                const l4 = getIntersectionLine(
                    this.normals[i],
                    this.max[i],
                    this.normals[j],
                    this.max[j]
                );

                for (const l of [l1, l2, l3, l4]) {
                    // let minU = Number.MIN_VALUE;
                    // let maxU = Number.MAX_VALUE;

                    const bounds = 10000; // temporary
                    let minU = -bounds;
                    let maxU = bounds;
                    for (let k = 0; k < this.normals.length; k++) {
                        if (k == j || k == i) continue;

                        const u1 = getLinePlaneIntersectionU(
                            this.normals[k],
                            this.min[k],
                            l.start,
                            l.direction
                        );

                        const u2 = getLinePlaneIntersectionU(
                            this.normals[k],
                            this.max[k],
                            l.start,
                            l.direction
                        );

                        // if the line is parallel to a slab it has to be inside of the slab
                        if (!isFinite(u1)) {
                            if (
                                !pointIsOnLeftPlaneSide(
                                    this.normals[k],
                                    this.min[k],
                                    l.start
                                )
                            ) {
                                minU = 1; // hacky way to exclude this line
                                maxU = 0;
                                break;
                            }
                        }

                        if (!isFinite(u2)) {
                            if (
                                pointIsOnLeftPlaneSide(
                                    this.normals[k],
                                    this.max[k],
                                    l.start
                                )
                            ) {
                                minU = 1; // hacky way to exclude this line
                                maxU = 0;
                                break;
                            }
                        }

                        if (u1 > u2) {
                            if (isFinite(u1)) {
                                minU = Math.max(minU, u2);
                            }

                            if (isFinite(u2)) {
                                maxU = Math.min(maxU, u1);
                            }
                        } else {
                            if (isFinite(u2)) {
                                minU = Math.max(minU, u1);
                            }

                            if (isFinite(u1)) {
                                maxU = Math.min(maxU, u2);
                            }
                        }
                    }

                    if (minU > maxU) {
                        // line segment is overshortened
                        continue;
                    }

                    const p1 = l.start
                        .clone()
                        .add(l.direction.clone().multiplyScalar(minU));
                    const p2 = l.start
                        .clone()
                        .add(l.direction.clone().multiplyScalar(maxU));

                    lineSegments.push([p1, p2]);
                }
            }
        }

        const representativePoints: THREE.Vector3[] = [];
        for (const ls of lineSegments) {
            representativePoints.push(ls[0], ls[1]);
        }

        const transformedRepresentativePoints: THREE.Vector3[] = [];
        for (const rp of representativePoints) {
            transformedRepresentativePoints.push(rp.applyMatrix4(matrix));
        }

        this.setFromPoints(transformedRepresentativePoints);

        return this;
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

        if (object instanceof THREE.Mesh) {
            const geometry = (object as THREE.Mesh).geometry;

            const positionAttribute = geometry.getAttribute("position");

            // geometry-level bounding box

            const geometryDOP14 = new DOP14().setFromBufferAttribute(
                geometry.getAttribute("position") as THREE.BufferAttribute
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
        this.makeEmpty();

        for (let i = 0; i < attribute.count; i += attribute.itemSize) {
            const x = attribute.array[i + 0];
            const y = attribute.array[i + 1];
            const z = attribute.array[i + 2];

            const v = new THREE.Vector3(x, y, z);

            this.expandByPoint(v);
        }

        return this;
    }

    setFromObject(object: THREE.Object3D, precise: boolean = false): this {
        this.makeEmpty();

        return this.expandByObject(object, precise);
    }

    setFromPoints(points: THREE.Vector3[]): this {
        this.makeEmpty();

        for (const p of points) {
            this.expandByPoint(p);
        }

        return this;
    }

    setFromVertexBuffers(buffers: THREE.Float32BufferAttribute[]) {
        for (const buffer of buffers) {
            this.setFromBufferAttribute(buffer);
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
