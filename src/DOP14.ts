import * as THREE from "three";

export default class DOP14 {
    private min: number[];
    private max: number[];
    // private normals = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1], [1, -1, 1], [1, 1, -1], [1, -1, -1]]
    private normals = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(1, -1, -1),
    ];

    constructor() {
        this.min = Array(7).fill(0);
        this.max = Array(7).fill(0);

        this.normals.forEach((n) => n.normalize());
    }

    fromVertexBuffers(buffers: THREE.Float32BufferAttribute[]) {
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

    planes() {
        const PLANE_SIZE = 0.2;

        const planes = [];

        for (let i = 0; i < 7; i++) {
            const n = this.normals[i].normalize();

            const p1 = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);
            const p1Mesh = new THREE.Mesh(
                p1,
                new THREE.MeshBasicMaterial({
                    color: 0x0000ff,
                    side: THREE.DoubleSide,
                    opacity: 0.2,
                    transparent: true,
                })
            );
            p1Mesh.position.copy(n.clone().multiplyScalar(this.min[i]));
            const lookAtMatrix = new THREE.Matrix4().lookAt(
                p1Mesh.position,
                new THREE.Vector3(),
                new THREE.Vector3(0, 1, 0)
            );
            const rotation = new THREE.Quaternion().setFromRotationMatrix(
                lookAtMatrix
            );
            p1Mesh.setRotationFromQuaternion(rotation);

            const p2 = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);
            const p2Mesh = new THREE.Mesh(
                p2,
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    side: THREE.DoubleSide,
                    opacity: 0.2,
                    transparent: true,
                })
            );
            p2Mesh.position.copy(n.clone().multiplyScalar(this.max[i]));
            const lookAtMatrix2 = new THREE.Matrix4().lookAt(
                p2Mesh.position,
                new THREE.Vector3(),
                new THREE.Vector3(0, 1, 0)
            );
            const rotation2 = new THREE.Quaternion().setFromRotationMatrix(
                lookAtMatrix2
            );
            p2Mesh.setRotationFromQuaternion(rotation2);

            planes.push(p1Mesh);
            planes.push(p2Mesh);
        }

        return planes;
    }

    edges() {
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
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
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
                    for (let k = 0; k < 7; k++) {
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

        const lines = [];
        for (const segment of lineSegments) {
            const points = [segment[0], segment[1]];

            const color = new THREE.Color(0xffffff);
            // color.setHex(Math.random() * 0xffffff);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color });

            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        return lines;
    }
}
