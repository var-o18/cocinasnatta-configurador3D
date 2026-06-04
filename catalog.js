// ============================================================
//  catalog.js — Definición de todos los assets del catálogo
// ============================================================

export const CATALOG_META = {

    // ── Cocinas completas ──────────────────────────────────────
    cocina: {
        label: 'Cocina Estándar', ref: 'KIT-STD',
        path: '/cocina.glb', format: 'glb', category: 'kitchen', icon: '🍳'
    },
    cocina_doble: {
        label: 'Cocina Doble AA', ref: 'KIT-DBL-AA',
        path: '/cocina_doble_aa.glb', format: 'glb', category: 'kitchen', icon: '👨‍🍳'
    },
    cocina_genova: {
        label: 'Cocina Genova Animación', ref: 'KIT-GEN-ANIM',
        path: '/cocina_genova_animacion.glb', format: 'glb', category: 'kitchen', icon: '✨'
    },
    cocina_silver: {
        label: 'Cocina Silver Pro', ref: 'KIT-SILVER',
        path: '/cocina_silver.glb', format: 'glb', category: 'kitchen', icon: '🥈'
    },
    kitchenette: {
        label: 'Kitchenette Compacta', ref: 'COMP-N180',
        path: '/kitchen.glb', format: 'glb', category: 'kitchen', icon: '🍲'
    },
    full_kitchen: {
        label: 'Cocina Integrada Completa', ref: 'KIT-LINE-500',
        path: '/full_kitchen.glb', format: 'glb', category: 'kitchen', icon: '🏠'
    },
    kitchen_fbx: {
        label: 'Cocina Professional FBX', ref: 'KIT-FBX-PRO',
        path: '/Kitchen_FBX.FBX', format: 'fbx', category: 'kitchen', icon: '🏢'
    },

    // ── Electrodomésticos (Nuevos) ──────────────────────────────
    extractor1: { label: 'Extractor Slim', ref: 'EXT-01', path: '/extractor1.glb', format: 'glb', category: 'appliance', icon: '🔌' },
    extractor2: { label: 'Extractor Industrial', ref: 'EXT-02', path: '/extractor2.glb', format: 'glb', category: 'appliance', icon: '🔌' },
    frigo1: { label: 'Frigorífico Americano', ref: 'FRI-01', path: '/frigo1.glb', format: 'glb', category: 'appliance', icon: '❄️' },
    frigo2: { label: 'Frigorífico Combi', ref: 'FRI-02', path: '/frigo2.glb', format: 'glb', category: 'appliance', icon: '❄️' },
    frigo3: { label: 'Frigorífico Mini', ref: 'FRI-03', path: '/frigo3.glb', format: 'glb', category: 'appliance', icon: '❄️' },
    frigo4: { label: 'Frigorífico Retro', ref: 'FRI-04', path: '/frigo4.glb', format: 'glb', category: 'appliance', icon: '❄️' },
    frigo5: { label: 'Frigorífico Integrado', ref: 'FRI-05', path: '/frigo5.glb', format: 'glb', category: 'appliance', icon: '❄️' },
    fuego1: { label: 'Placa Inducción 4F', ref: 'HOB-01', path: '/fuego1.glb', format: 'glb', category: 'appliance', icon: '🔥' },
    fuego2: { label: 'Placa Gas Pro', ref: 'HOB-02', path: '/fuego2.glb', format: 'glb', category: 'appliance', icon: '🔥' },
    horno1: { label: 'Horno Multifunción', ref: 'OVN-01', path: '/horno1.glb', format: 'glb', category: 'appliance', icon: '🥘' },
    horno2: { label: 'Horno Pirolítico', ref: 'OVN-02', path: '/horno2.glb', format: 'glb', category: 'appliance', icon: '🥘' },
    horno3: { label: 'Horno Compacto', ref: 'OVN-03', path: '/horno3.glb', format: 'glb', category: 'appliance', icon: '🥘' },
    horno4: { label: 'Horno Vapor', ref: 'OVN-04', path: '/horno4.glb', format: 'glb', category: 'appliance', icon: '🥘' },
    lavavajilla1: { label: 'Lavavajillas 60cm', ref: 'DW-01', path: '/lavavajilla1.glb', format: 'glb', category: 'appliance', icon: '🧼' },
    lavavajilla2: { label: 'Lavavajillas 45cm', ref: 'DW-02', path: '/lavavajilla2.glb', format: 'glb', category: 'appliance', icon: '🧼' },
    lavavajilla3: { label: 'Lavavajillas Compacto', ref: 'DW-03', path: '/lavavajilla3.glb', format: 'glb', category: 'appliance', icon: '🧼' },
    microondas1: { label: 'Microondas Grill', ref: 'MW-01', path: '/microondas1.glb', format: 'glb', category: 'appliance', icon: '🍱' },
    microondas2: { label: 'Microondas Digital', ref: 'MW-02', path: '/microondas2.glb', format: 'glb', category: 'appliance', icon: '🍱' },
    microondas3: { label: 'Microondas Inox', ref: 'MW-03', path: '/microondas3.glb', format: 'glb', category: 'appliance', icon: '🍱' },

    // ── Muebles (Nuevos) ────────────────────────────────────────
    mueble1: { label: 'Módulo Base 1P', ref: 'CAB-B1', path: '/mueble1.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble2: { label: 'Módulo Base 2P', ref: 'CAB-B2', path: '/mueble2.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble3: { label: 'Módulo Bajo Cajones', ref: 'CAB-DR', path: '/mueble3.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble4: { label: 'Módulo Alto 1P', ref: 'CAB-H1', path: '/mueble4.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble5: { label: 'Módulo Alto Vitrina', ref: 'CAB-GL', path: '/mueble5.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble6: { label: 'Columna Despensa', ref: 'CAB-COL1', path: '/mueble6.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble7: { label: 'Columna Horno', ref: 'CAB-COL2', path: '/mueble7.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble8: { label: 'Módulo Rincón', ref: 'CAB-CNR', path: '/mueble8.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble9: { label: 'Estante Decorativo', ref: 'CAB-SH1', path: '/mueble9.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble10: { label: 'Módulo Extraíble', ref: 'CAB-EX', path: '/mueble10.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble11: { label: 'Módulo Terminal', ref: 'CAB-TRM', path: '/mueble11.glb', format: 'glb', category: 'kitchen', icon: '📦' },
    mueble_fregadero1: { label: 'Mueble Fregadero Pro', ref: 'SINK-01', path: '/mueble_fregadero1.glb', format: 'glb', category: 'kitchen', icon: '🚰' },
    mueble_fregadero2: { label: 'Mueble Fregadero Inox', ref: 'SINK-02', path: '/mueble_fregadero2.glb', format: 'glb', category: 'kitchen', icon: '🚰' },
    mueble_fregadero3: { label: 'Mueble Fregadero Cerámico', ref: 'SINK-03', path: '/mueble_fregadero3.glb', format: 'glb', category: 'kitchen', icon: '🚰' },
    mueble_fregadero4: { label: 'Mueble Fregadero Doble', ref: 'SINK-04', path: '/mueble_fregadero4.glb', format: 'glb', category: 'kitchen', icon: '🚰' },
    estanteria1: { label: 'Estantería Metal', ref: 'SH-MET', path: '/estanteria1.glb', format: 'glb', category: 'kitchen', icon: '🪜' },
    estanteria2: { label: 'Estantería Madera', ref: 'SH-WD', path: '/estanteria2.glb', format: 'glb', category: 'kitchen', icon: '🪜' },
    estanteria3: { label: 'Librería Cocina', ref: 'SH-BK', path: '/estanteria3.glb', format: 'glb', category: 'kitchen', icon: '🪜' },

    // ── Mesas y Sillas ──────────────────────────────────────────
    mesa1: { label: 'Mesa Redonda', ref: 'TBL-RD', path: '/mesa1.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa2: { label: 'Mesa Familiar', ref: 'TBL-FAM', path: '/mesa2.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa3: { label: 'Mesa Moderna', ref: 'TBL-MOD', path: '/mesa3.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa4: { label: 'Mesa Cristal', ref: 'TBL-GL', path: '/mesa4.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa5: { label: 'Mesa Plegable', ref: 'TBL-FL', path: '/mesa5.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa6: { label: 'Mesa Desayuno', ref: 'TBL-BK', path: '/mesa6.glb', format: 'glb', category: 'table', icon: '🪵' },
    mesa7: { label: 'Mesa Nórdica', ref: 'TBL-NOR', path: '/mesa7.glb', format: 'glb', category: 'table', icon: '🪵' },
    silla1: { label: 'Silla Tapizada', ref: 'CHR-UP', path: '/silla1.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla2: { label: 'Silla Madera', ref: 'CHR-WD', path: '/silla2.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla3: { label: 'Silla Diseño', ref: 'CHR-DS', path: '/silla3.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla4: { label: 'Silla Oficina', ref: 'CHR-OF', path: '/silla4.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla5: { label: 'Silla Vintage', ref: 'CHR-VN', path: '/silla5.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla6: { label: 'Silla Minimal', ref: 'CHR-MN', path: '/silla6.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla7: { label: 'Silla Nórdica', ref: 'CHR-NR', path: '/silla7.glb', format: 'glb', category: 'chair', icon: '🪑' },
    silla8: { label: 'Silla Taburete', ref: 'CHR-ST', path: '/silla8.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete1: { label: 'Taburete Alto 1', ref: 'ST-H1', path: '/taburete1.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete2: { label: 'Taburete Alto 2', ref: 'ST-H2', path: '/taburete2.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete3: { label: 'Taburete Bar', ref: 'ST-BAR', path: '/taburete3.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete4: { label: 'Taburete Madera', ref: 'ST-WD', path: '/taburete4.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete5: { label: 'Taburete Industrial', ref: 'ST-IND', path: '/taburete5.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete6: { label: 'Taburete Bajo', ref: 'ST-LOW', path: '/taburete6.glb', format: 'glb', category: 'chair', icon: '🪑' },
    taburete7: { label: 'Taburete Giratorio', ref: 'ST-ROT', path: '/taburete7.glb', format: 'glb', category: 'chair', icon: '🪑' },

    // ── Arquitectura (Nuevos) ───────────────────────────────────
    puerta1: { label: 'Puerta Standard', ref: 'DOOR-STD', path: '/puerta1.glb', format: 'glb', category: 'door', icon: '🚪' },
    puerta2: { label: 'Puerta Modern', ref: 'DOOR-MOD', path: '/puerta2.glb', format: 'glb', category: 'door', icon: '🚪' },
    puerta3: { label: 'Puerta Clásica', ref: 'DOOR-CLS', path: '/puerta3.glb', format: 'glb', category: 'door', icon: '🚪' },
    puerta_corredera1: { label: 'Puerta Corredera 1', ref: 'DOOR-SL1', path: '/puerta_corredera1.glb', format: 'glb', category: 'door', icon: '↔️' },
    puerta_corredera2: { label: 'Puerta Corredera 2', ref: 'DOOR-SL2', path: '/puerta_corredera2.glb', format: 'glb', category: 'door', icon: '↔️' },
    ventana1: { label: 'Ventana 100x100', ref: 'WIN-100', path: '/ventana1.glb', format: 'glb', category: 'window', icon: '🪟' },
    ventana2: { label: 'Ventana 120x100', ref: 'WIN-120', path: '/ventana2.glb', format: 'glb', category: 'window', icon: '🪟' },
    ventana3: { label: 'Ventana Pro', ref: 'WIN-PRO', path: '/ventana3.glb', format: 'glb', category: 'window', icon: '🪟' },
    ventana4: { label: 'Ventana Oscilo', ref: 'WIN-OSC', path: '/ventana4.glb', format: 'glb', category: 'window', icon: '🪟' },
    ventana5: { label: 'Ventana Grande', ref: 'WIN-GRD', path: '/ventana5.glb', format: 'glb', category: 'window', icon: '🪟' },

    // ── Accesorios y Decoración ────────────────────────────────
    bandeja_te: { label: 'Bandeja de Té', ref: 'ACC-TEA', path: '/bandeja_te.glb', format: 'glb', category: 'generic', icon: '🍵' },
    cafetera: { label: 'Cafetera Espresso', ref: 'ACC-COF', path: '/cafetera.glb', format: 'glb', category: 'generic', icon: '☕' },
    estanteria_comida: { label: 'Organizador Comida', ref: 'ACC-FOOD', path: '/estanteria_comida.glb', format: 'glb', category: 'generic', icon: '🍱' },
    lampara1: { label: 'Lámpara Techo 1', ref: 'LMP-01', path: '/lampara1.glb', format: 'glb', category: 'generic', icon: '💡' },
    lampara2: { label: 'Lámpara Techo 2', ref: 'LMP-02', path: '/lampara2.glb', format: 'glb', category: 'generic', icon: '💡' },
    lampara3: { label: 'Lámpara Colgante', ref: 'LMP-03', path: '/lampara3.glb', format: 'glb', category: 'generic', icon: '💡' },
    lampara4: { label: 'Lámpara Foco', ref: 'LMP-04', path: '/lampara4.glb', format: 'glb', category: 'generic', icon: '💡' },
    lampara5: { label: 'Lámpara Diseño', ref: 'LMP-05', path: '/lampara5.glb', format: 'glb', category: 'generic', icon: '💡' },
    planta1: { label: 'Planta Interior 1', ref: 'PLT-01', path: '/planta1.glb', format: 'glb', category: 'generic', icon: '🌿' },
    planta2: { label: 'Planta Interior 2', ref: 'PLT-02', path: '/planta2.glb', format: 'glb', category: 'generic', icon: '🌿' },
    planta3: { label: 'Planta Suculenta', ref: 'PLT-03', path: '/planta3.glb', format: 'glb', category: 'generic', icon: '🌵' },
    papelera1: { label: 'Papelera Inox', ref: 'BIN-01', path: '/papelera1.glb', format: 'glb', category: 'generic', icon: '🗑️' },
    papelera2: { label: 'Papelera Pedal', ref: 'BIN-02', path: '/papelera2.glb', format: 'glb', category: 'generic', icon: '🗑️' },
};

// ── Helpers ────────────────────────────────────────────────────

/** Nombre visible de un tipo */
export function labelFor(type) {
    return CATALOG_META[type]?.label ?? type;
}

/** Referencia de un tipo */
export function refFor(type) {
    return CATALOG_META[type]?.ref ?? '';
}

/** Categoría de un tipo (para escalado y posicionamiento automático) */
export function categoryFor(type) {
    return CATALOG_META[type]?.category ?? 'generic';
}

/** Icono de un tipo */
export function iconFor(type) {
    return CATALOG_META[type]?.icon ?? '📦';
}

/** Infiere la categoría a partir del nombre de archivo */
export function inferCategoryFromFilename(filename) {
    const n = filename.toLowerCase();
    if (n.includes('cocina') || n.includes('kitchen') || n.includes('mueble') || n.includes('estanteria')) return 'kitchen';
    if (n.includes('frigo') || n.includes('horno') || n.includes('lavavajilla') || n.includes('microondas') || n.includes('extractor') || n.includes('fuego')) return 'appliance';
    if (n.includes('mesa')) return 'table';
    if (n.includes('silla') || n.includes('taburete')) return 'chair';
    if (n.includes('puerta')) return 'door';
    if (n.includes('ventana')) return 'window';
    return 'generic';
}
