import { RANDOM_NORMALIZED_VECTORS } from "./RawKernel.js";
import * as THREE from "three";

export function getKernel(
    size: number,
    boundingSphere: THREE.Sphere
): THREE.Ray[] {
    size = Math.min(size, RANDOM_NORMALIZED_VECTORS.length / 2);

    const preciseKernel = [];
    for (let i = 0; i < size; i++) {
        const randomVector1 = RANDOM_NORMALIZED_VECTORS[i];
        const randomVector2 = RANDOM_NORMALIZED_VECTORS[i + size];

        const origin = new THREE.Vector3(
            randomVector1.x,
            randomVector1.y,
            randomVector1.z
        )
            .multiplyScalar(2 * boundingSphere.radius)
            .add(boundingSphere.center);

        const target = new THREE.Vector3(
            randomVector2.x,
            randomVector2.y,
            randomVector2.z
        )
            .multiplyScalar(1.5 * boundingSphere.radius)
            .add(boundingSphere.center);

        const direction = target.sub(origin).normalize();

        preciseKernel.push(new THREE.Ray(origin, direction));
    }

    return preciseKernel;
}
