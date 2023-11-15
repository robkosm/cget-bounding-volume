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

                const v = new THREE.Vector3(x, y, z)

                for (let j = 0; j < 7; j++) {
                    // const dotProduct = x * this.normals[j][0] + y * this.normals[j][1] + z * this.normals[j][2]
                    const dotProduct = v.dot(this.normals[j].normalize());
                    
                    minRecord[j] = Math.min(minRecord[j], dotProduct);
                    maxRecord[j] = Math.max(maxRecord[j], dotProduct);
                }
            }
        }

        this.min = minRecord;
        this.max = maxRecord;

        console.log(minRecord, maxRecord);
    }

    planes() {
        const PLANE_SIZE = .2

        const planes = [];

        for (let i = 0; i < 7; i++) {
            const n = this.normals[i].normalize();
            console.log(n);

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
            const lookAtMatrix = new THREE.Matrix4().lookAt(p1Mesh.position, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
            const rotation = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
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
            const lookAtMatrix2 = new THREE.Matrix4().lookAt(p2Mesh.position, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
            const rotation2 = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix2);
            p2Mesh.setRotationFromQuaternion(rotation2);

            // const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
            // p1.translate(0, 0, -1);
            // p1.applyQuaternion(q1);
            // p1.translate(0, 0, this.min[i]);

            // const translationMatrix1 = new THREE.Matrix4();
            // translationMatrix1.makeTranslation(n.x * this.min[i], n.y * this.min[i], n.z * this.min[i])
            // p1.applyMatrix4(translationMatrix1)

            // const p2 = new THREE.PlaneGeometry(2, 2, 1, 1);
            // const q2 = new THREE.Quaternion().setFromUnitVectors(
            //     new THREE.Vector3(0, 1, 0),
            //     n
            // );
            // p2.translate(0, this.max[i], 0);
            // // p2.translate(0, 0, 1);
            // p2.applyQuaternion(q2);

            // const translationMatrix2 = new THREE.Matrix4();
            // translationMatrix1.makeTranslation(n.x * this.max[i], n.y * this.max[i], n.z * this.max[i])
            // p2.applyMatrix4(translationMatrix2)

            planes.push(p1Mesh);
            planes.push(p2Mesh);
        }

        return planes;
    }
}
