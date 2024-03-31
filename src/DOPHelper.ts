import * as THREE from "three";
import DOP from "./DOP";

export default class DOPHelper extends THREE.LineSegments {
    dop: DOP;
    color: THREE.Color;
    type: string;

    constructor(_dop: DOP, _color: THREE.Color = new THREE.Color(0xffff00)) {
        const geometry = new THREE.BufferGeometry();
        super(
            geometry,
            new THREE.LineBasicMaterial({ color: _color, toneMapped: false })
        );

        this.dop = _dop;
        this.color = _color;

        const lineSegments = this.edges();

        // const tempIndices = []
        const indices = new Uint16Array(2 * lineSegments.length);
        const positions = [];
        let indexCounter = 0;

        for (const segment of lineSegments) {
            positions.push(
                segment[0].x,
                segment[0].y,
                segment[0].z,
                segment[1].x,
                segment[1].y,
                segment[1].z
            );
            indices[indexCounter] = indexCounter;
            indices[indexCounter + 1] = indexCounter + 1;
            indexCounter += 2;
        }

        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );

        this.type = "DOPHelper";

        this.geometry.computeBoundingSphere();
    }

    // updateMatrixWorld( force ) {

    // 	const dop = this.dop;

    // 	if ( dop.isEmpty() ) return;

    // 	dop.getCenter( this.position );

    // 	dop.getSize( this.scale );

    // 	this.scale.multiplyScalar( 0.5 );

    // 	super.updateMatrixWorld( force );

    // }

    dispose() {
        this.geometry.dispose();
    }

    private edges() {
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
        for (let i = 0; i < this.dop.normals.length; i++) {
            for (let j = i + 1; j < this.dop.normals.length; j++) {
                // if (i == j) continue;

                const l1 = getIntersectionLine(
                    this.dop.normals[i],
                    this.dop.min[i],
                    this.dop.normals[j],
                    this.dop.min[j]
                );

                const l2 = getIntersectionLine(
                    this.dop.normals[i],
                    this.dop.min[i],
                    this.dop.normals[j],
                    this.dop.max[j]
                );

                const l3 = getIntersectionLine(
                    this.dop.normals[i],
                    this.dop.max[i],
                    this.dop.normals[j],
                    this.dop.min[j]
                );

                const l4 = getIntersectionLine(
                    this.dop.normals[i],
                    this.dop.max[i],
                    this.dop.normals[j],
                    this.dop.max[j]
                );

                for (const l of [l1, l2, l3, l4]) {
                    // let minU = Number.MIN_VALUE;
                    // let maxU = Number.MAX_VALUE;

                    const bounds = 10000; // temporary
                    let minU = -bounds;
                    let maxU = bounds;
                    for (let k = 0; k < this.dop.normals.length; k++) {
                        if (k == j || k == i) continue;

                        const u1 = getLinePlaneIntersectionU(
                            this.dop.normals[k],
                            this.dop.min[k],
                            l.start,
                            l.direction
                        );

                        const u2 = getLinePlaneIntersectionU(
                            this.dop.normals[k],
                            this.dop.max[k],
                            l.start,
                            l.direction
                        );

                        // if the line is parallel to a slab it has to be inside of the slab
                        if (!isFinite(u1)) {
                            if (
                                !pointIsOnLeftPlaneSide(
                                    this.dop.normals[k],
                                    this.dop.min[k],
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
                                    this.dop.normals[k],
                                    this.dop.max[k],
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

        return lineSegments;
    }
}
