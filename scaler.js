// ============================================================
//  scaler.js — Normalización inteligente de modelos 3D
//  Usa la 'category' del catálogo para escalar correctamente.
//  Detecta unidades (mm, cm, m) automáticamente.
// ============================================================

import * as THREE from 'three';

// ── Medidas de referencia reales (metros) ──────────────────────
export const SCALE_TARGETS = {
    kitchen:   { high: 2.15, base: 0.90 }, // Columna vs Mueble bajo
    appliance: { large: 1.85, standard: 0.60, small: 0.35 }, // Frigo vs Horno vs Cafetera
    table:     { value: 0.75 },
    chair:     { value: 0.85 },
    door:      { value: 2.10 },
    window:    { value: 1.20 },
    generic:   null,
};

// Profundidad estándar para muebles bajos
const KITCHEN_LOW_DEPTH = 0.60;

// ── Detección de unidades ──────────────────────────────────────

function detectUnitFactor(rawHeight) {
    if (rawHeight > 500) { console.log('[Scaler] Unidades: MM'); return 0.001; }
    if (rawHeight > 40)  { console.log('[Scaler] Unidades: CM'); return 0.01;  }
    return 1.0;
}

// ── Normalización principal ────────────────────────────────────

/**
 * Normaliza un modelo 3D en cuatro pasos:
 *   1. Corrección de unidades (mm/cm → m)
 *   2. Escala según categoría a medidas reales
 *   3. Tope de seguridad para que quepa en la habitación
 *   4. Centra en XZ y apoya en el suelo (y = 0)
 */
export function normalizeModel(model, type, category, roomDims) {
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);

    let box  = new THREE.Box3().setFromObject(model);
    let size = box.getSize(new THREE.Vector3());

    // Paso 1: corrección de unidades
    const unitFactor = detectUnitFactor(size.y);
    if (unitFactor !== 1.0) {
        model.scale.multiplyScalar(unitFactor);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    // Paso 2: escala inteligente a medidas reales
    const scaleFactor = _calcScaleFactor(size, category);
    if (Math.abs(1.0 - scaleFactor) > 0.01) {
        console.log(`[Scaler] "${type}" (${category}) → Factor x${scaleFactor.toFixed(3)}`);
        model.scale.multiplyScalar(scaleFactor);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    // Paso 3: tope de seguridad (que no sea más grande que la habitación)
    const maxRoom  = Math.max(roomDims.width, roomDims.depth) * 0.98;
    const modelMax = Math.max(size.x, size.z);
    if (modelMax > maxRoom && maxRoom > 0) {
        const safety = maxRoom / modelMax;
        model.scale.multiplyScalar(safety);
        box.setFromObject(model);
        size = box.getSize(new THREE.Vector3());
    }

    // Paso 4: centrar y apoyar en suelo
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

    console.log(`[Scaler] "${type}" finalizado → ${size.x.toFixed(2)}m × ${size.y.toFixed(2)}m × ${size.z.toFixed(2)}m`);
}

/**
 * Lógica de decisión de escala basada en la categoría y las proporciones del objeto.
 */
function _calcScaleFactor(size, category) {
    const targets = SCALE_TARGETS[category];
    if (!targets) return 1.0;

    const h = size.y;

    if (category === 'kitchen') {
        // Distinguir entre módulos altos/columnas y módulos bajos
        if (h > 1.2) {
            return targets.high / h; // Escalar columna a 2.15m
        } else {
            // Para muebles bajos, el factor de altura es más fiable que el de profundidad
            // a menos que el objeto sea extremadamente plano.
            return targets.base / h; // Escalar mueble bajo a 0.90m
        }
    }

    if (category === 'appliance') {
        // Gran electrodoméstico (frigorífico)
        if (h > 1.2) return targets.large / h;
        // Pequeño electrodoméstico (cafetera, microondas de mesa)
        if (h < 0.45) return targets.small / h;
        // Electrodoméstico estándar (horno, lavavajillas)
        return targets.standard / h;
    }

    // Categorías con un único target fijo
    if (targets.value) {
        return h > 0.05 ? targets.value / h : 1.0;
    }

    return 1.0;
}
