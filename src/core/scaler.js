import * as THREE from 'three';

export const SCALE_TARGETS = {
    kitchen:   { high: 2.15, base: 0.90 },
    appliance: { large: 1.85, standard: 0.60, small: 0.35 },
    table:     { value: 0.75 },
    chair:     { value: 0.85 },
    door:      { value: 2.10 },
    window:    { value: 1.20 },
    generic:   null,
};

const KITCHEN_LOW_DEPTH = 0.60;

function detectUnitFactor(rawHeight) {
    if (rawHeight > 500) { return 0.001; }
    if (rawHeight > 40)  { return 0.01;  }
    return 1.0;
}

export function normalizeModel(model, type, category, roomDims) {
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);

    let box  = new THREE.Box3().setFromObject(model);
    let size = box.getSize(new THREE.Vector3());

    const unitFactor = detectUnitFactor(size.y);
    if (unitFactor !== 1.0) {
        model.scale.multiplyScalar(unitFactor);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    const scaleFactor = _calcScaleFactor(size, category);
    if (Math.abs(1.0 - scaleFactor) > 0.01) {
        model.scale.multiplyScalar(scaleFactor);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    const maxRoom  = Math.max(roomDims.width, roomDims.depth) * 0.98;
    const modelMax = Math.max(size.x, size.z);
    if (modelMax > maxRoom && maxRoom > 0) {
        const safety = maxRoom / modelMax;
        model.scale.multiplyScalar(safety);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);

    model.userData = {
        ...model.userData,
        type,
        category,
        w: size.x,
        h: size.y,
        d: size.z,
        isModule: true,
        naturalSize: { w: size.x, h: size.y, d: size.z },
    };
}

function _calcScaleFactor(size, category) {
    const targets = SCALE_TARGETS[category];
    if (!targets) return 1.0;

    const h = size.y;

    if (category === 'kitchen') {
        if (h > 1.2) {
            return targets.high / h;
        } else {
            return targets.base / h;
        }
    }

    if (category === 'appliance') {
        if (h > 1.2) return targets.large / h;
        if (h < 0.45) return targets.small / h;
        return targets.standard / h;
    }

    if (targets.value) {
        return h > 0.05 ? targets.value / h : 1.0;
    }

    return 1.0;
}
