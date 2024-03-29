import * as THREE from "three";

const DOPnormals = {
    // (±1, 0, 0), (0, ±1, 0), (0, 0, ±1)
    "6": [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
    ],
    // (±1, ±1, ±1)
    "8": [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
    ],
    // (±1, ±1, 0), (±1, 0, ±1), (0, ±1, ±1)
    "12": [
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(0, -1, 1),
    ],
    "14": [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
    ],
    "18": [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 1, -1),
    ],
    "20": [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(0, -1, 1),
    ],
    "26": [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 1, -1),
    ],
};

export default class DOP {
    isDOP: boolean = true;
    k: number;
    min: number[];
    max: number[];
    normals: THREE.Vector3[];

    constructor(
        _k: number,
        _min: number[] = Array(_k / 2).fill(Number.POSITIVE_INFINITY),
        _max: number[] = Array(_k / 2).fill(Number.NEGATIVE_INFINITY)
    ) {
        this.min = _min;
        this.max = _max;
        this.k = _k;

        if (_k in DOPnormals) {
            this.normals = DOPnormals[String(_k) as keyof typeof DOPnormals];
        } else {
            throw new Error("wrong k");
        }

        this.normals.forEach((n) => n.normalize());
    }

    applyMatrix4(matrix: THREE.Matrix4): this {
        if (this.isEmpty()) {
            return this;
        }

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

    clone(): DOP {
        return new DOP(this.k).copy(this);
    }

    copy(DOP: DOP): this {
        this.min = [...DOP.min];
        this.max = [...DOP.max];

        return this;
    }

    isEmpty(): boolean {
        return this.min.every((val) => !isFinite(val));
    }

    makeEmpty(): this {
        this.min = Array(this.k / 2).fill(Number.POSITIVE_INFINITY);
        this.max = Array(this.k / 2).fill(Number.NEGATIVE_INFINITY);

        return this;
    }

    containsDOP(DOP: DOP): boolean {
        return (
            this.min.every((val, index) => val <= DOP.min[index]) &&
            this.max.every((val, index) => val >= DOP.min[index])
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

    equals(DOP: DOP): boolean {
        return (
            this.min.every((val, index) => val === DOP.min[index]) &&
            this.max.every((val, index) => val === DOP.max[index])
        );
    }

    expandByPoint(point: THREE.Vector3): this {
        for (let j = 0; j < this.normals.length; j++) {
            const dotProduct = point.dot(this.normals[j]);

            this.min[j] = Math.min(this.min[j], dotProduct);
            this.max[j] = Math.max(this.max[j], dotProduct);
        }

        return this;
    }

    expandByObject(object: THREE.Object3D, precise: boolean): this {
        // Computes the DOP of an object (including its children),
        // accounting for both the object's, and children's, world transforms

        object.updateWorldMatrix(false, false);

        if (object instanceof THREE.Mesh) {
            const geometry = (object as THREE.Mesh).geometry;

            const positionAttribute = geometry.getAttribute("position");

            // geometry-level bounding box

            if (positionAttribute instanceof THREE.BufferAttribute) {
                const geometryDOP = new DOP(this.k).setFromBufferAttribute(
                    positionAttribute as THREE.BufferAttribute
                );

                const _DOP = new DOP(this.k);
                _DOP.copy(geometryDOP);

                _DOP.applyMatrix4(object.matrixWorld);

                this.union(_DOP);
            }
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

    intersectRay(_ray: THREE.Ray, target: THREE.Vector3): THREE.Vector3 | null {
        let t_min = Number.NEGATIVE_INFINITY;
        let t_max = Number.POSITIVE_INFINITY;

        for (let i = 0; i < this.normals.length; i++) {
            const normal = this.normals[i];

            const minPlane = new THREE.Plane(normal, this.min[i]);
            const maxPlane = new THREE.Plane(normal, this.max[i]);

            const minIntersection = new THREE.Vector3();
            const maxIntersection = new THREE.Vector3();

            _ray.intersectPlane(minPlane, minIntersection);
            _ray.intersectPlane(maxPlane, maxIntersection);

            const t1 = minIntersection.distanceTo(_ray.origin);
            const t2 = maxIntersection.distanceTo(_ray.origin);

            let t_closer, t_further;
            if (t1 < t2) {
                t_closer = t1;
                t_further = t2;
            } else {
                t_closer = t2;
                t_further = t1;
            }

            t_min = Math.max(t_min, t_closer);
            t_max = Math.min(t_max, t_further);
        }

        if (t_max < 0) {
            return null;
        }

        if (t_min > t_max) {
            return null;
        }

        return _ray.at(t_min, target);
    }

    intersectsRay(_ray: THREE.Ray): boolean {
        return this.intersectRay(_ray, new THREE.Vector3()) !== null;
    }

    intersectsBox(_box: THREE.Box3): boolean {
        const boxCorners = [
            new THREE.Vector3(_box.min.x, _box.min.y, _box.min.z),
            new THREE.Vector3(_box.min.x, _box.min.y, _box.max.z),
            new THREE.Vector3(_box.min.x, _box.max.y, _box.min.z),
            new THREE.Vector3(_box.min.x, _box.max.y, _box.max.z),
            new THREE.Vector3(_box.max.x, _box.min.y, _box.min.z),
            new THREE.Vector3(_box.max.x, _box.min.y, _box.max.z),
            new THREE.Vector3(_box.max.x, _box.max.y, _box.min.z),
            new THREE.Vector3(_box.max.x, _box.max.y, _box.max.z),
        ];

        const boxDOP = new DOP(this.k);
        boxDOP.setFromPoints(boxCorners);

        return this.intersectsDOP(boxDOP);
    }

    intersectsDOP(_DOP: DOP): boolean {
        if (this.k != _DOP.k) throw new Error("different k"); // can be abstracted for kdops where normals are subsets

        for (let i = 0; i < this.normals.length; i++) {
            const slabsDisjoint =
                this.max[i] < _DOP.min[i] || this.min[i] > _DOP.max[i];
            if (slabsDisjoint) return false;
        }

        return true;
    }

    intersectsPlane(_plane: THREE.Plane): boolean {
        throw new Error("not Implemented");
    }

    // this intersection is not perfect on the edges
    // technically this intersects the kDOP with the spheres kDOP
    // this can be fixed by checking the distance to the corners
    intersectsSphere(_sphere: THREE.Sphere): boolean {
        for (let i = 0; i < this.normals.length; i++) {
            const dotProduct = _sphere.center.dot(this.normals[i]);
            if (
                !(
                    this.min[i] - _sphere.radius <= dotProduct &&
                    dotProduct <= this.max[i] + _sphere.radius
                )
            )
                return false;
        }

        return true;
    }

    intersectsTriangle(_triangle: THREE.Triangle): boolean {
        throw new Error("not Implemented");
    }

    setFromArray(_array: number[]): this {
        throw new Error("not Implemented");
    }

    setFromBufferAttribute(attribute: THREE.BufferAttribute): this {
        this.makeEmpty();

        for (
            let i = 0;
            i < attribute.count * attribute.itemSize;
            i += attribute.itemSize
        ) {
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

    union(DOP: DOP): this {
        for (let i = 0; i < this.min.length; i++) {
            this.min[i] = Math.min(this.min[i], DOP.min[i]);
            this.max[i] = Math.max(this.max[i], DOP.max[i]);
        }

        return this;
    }

    getGeometry(): THREE.BufferGeometry {
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
            for (let j = i + 1; j < this.normals.length; j++) {
                // if (i == j) continue;

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

                for (let n = 0; n < 4; n++) {
                    const l = [l1, l2, l3, l4][n];
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

                    // lineSegments.push([p1, p2]);
                    lineSegments.push({
                        p1,
                        p2,
                        i,
                        j,
                        imin: n < 2,
                        jmin: n % 2 == 0,
                    });
                }
            }
        }

        const sideVertices: THREE.Vector3[][] = [];

        //init the grid matrix
        for (var i = 0; i < this.k; i++) {
            sideVertices[i] = [];
        }

        // console.log(2 * lineSegments.length);

        // add with duplicates
        for (const ls of lineSegments) {
            if (ls.imin) {
                sideVertices[ls.i].push(ls.p1);
                sideVertices[ls.i].push(ls.p2);
            } else {
                sideVertices[ls.i + this.k / 2].push(ls.p1);
                sideVertices[ls.i + this.k / 2].push(ls.p2);
            }

            if (ls.jmin) {
                sideVertices[ls.j].push(ls.p1);
                sideVertices[ls.j].push(ls.p2);
            } else {
                sideVertices[ls.j + this.k / 2].push(ls.p1);
                sideVertices[ls.j + this.k / 2].push(ls.p2);
            }
        }

        {
            let count = 0;
            for (const side of sideVertices) {
                count += side.length;
            }

            // console.log("before removing duplicates " + count);
        }
        // console.log(sideVertices);

        // remove duplicates
        const minDelta = 0.00001;
        let uniqueSideVertices: THREE.Vector3[][] = sideVertices.map((side) => {
            const uniqueArray: THREE.Vector3[] = [];
            side.forEach((vertex) => {
                const isDuplicate = uniqueArray.some(
                    (uniqueVertex) => vertex.distanceTo(uniqueVertex) < minDelta
                );

                // If not a duplicate, add it to the unique array
                if (!isDuplicate) {
                    uniqueArray.push(vertex);
                }
            });

            // console.log(side, uniqueArray);
            return uniqueArray;
        });

        {
            let count = 0;
            for (const side of uniqueSideVertices) {
                count += side.length;
            }

            // console.log("after removing duplicates " + count);
        }

        // let uniqueSideVertices = [...sideVertices];

        // order by angle
        // https://stackoverflow.com/questions/5188561/signed-angle-between-two-3d-vectors-with-same-origin-within-the-same-plane
        function angleBetweenVectors(
            pointA: THREE.Vector3,
            pointB: THREE.Vector3,
            normal: THREE.Vector3
        ): number {
            return Math.atan2(
                pointB.clone().cross(pointA).dot(normal),
                pointA.clone().dot(pointB)
            );
        }

        // Function to order points on a plane by angle relative to the reference point
        function orderPointsByAngle(
            normal: THREE.Vector3,
            points: THREE.Vector3[]
        ): THREE.Vector3[] {
            const orderedPoints = [...points];

            const referencePoint = points[0];

            orderedPoints.sort((pointA, pointB) => {
                return angleBetweenVectors(
                    pointB.clone().sub(referencePoint),
                    pointA.clone().sub(referencePoint),
                    normal
                );
            });

            return orderedPoints;
        }

        uniqueSideVertices = uniqueSideVertices.map((side, idx) => {
            const normal =
                idx < this.k / 2
                    ? this.normals[idx]
                    : this.normals[idx - this.k / 2].clone().multiplyScalar(-1);
            return orderPointsByAngle(normal, side);
        });

        // test fan
        const tempTriangleArray: THREE.Vector3[] = [];
        uniqueSideVertices.forEach((side) => {
            for (let i = 1; i < side.length - 1; i++) {
                tempTriangleArray.push(side[0]);
                tempTriangleArray.push(side[i]);
                tempTriangleArray.push(side[i + 1]);
            }
        });

        // console.log(tempTriangleArray);
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array(tempTriangleArray.length * 3);

        tempTriangleArray.forEach((vector, i) => {
            vertices[i * 3] = vector.x;
            vertices[i * 3 + 1] = vector.y;
            vertices[i * 3 + 2] = vector.z;
        });

        const positionAttribute = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute("position", positionAttribute);

        return geometry;
    }
}

// const _DOP = new DOP(18); // TODO change this to be generic
