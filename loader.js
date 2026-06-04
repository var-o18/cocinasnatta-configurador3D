// ============================================================
//  loader.js — Cargador avanzado de assets 3D
//  Soporta compresión Draco, Meshopt y texturas de GPU KTX2.
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { CATALOG_META, inferCategoryFromFilename } from './catalog.js';
import { normalizeModel } from './scaler.js';

export class AssetLoader {
    /**
     * @param {object} roomDims - Dimensiones de la habitación { width, depth }
     * @param {function} onProgress - Callback de progreso (loaded, total)
     */
    constructor(roomDims, onProgress) {
        this.roomDims = roomDims;
        this.onProgress = onProgress;

        // ── Configuración de GLTFLoader ────────────────────────────
        this.gltfLoader = new GLTFLoader();

        // 1. Draco (Compresión de geometría)
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        // 2. Meshopt (Decodificación rápida y caché de vértices)
        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

        // 3. KTX2 (Texturas comprimidas directamente en GPU)
        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath('/basis/');
        // Nota: La detección de soporte requiere el WebGLRenderer y se inicializa en loadAll()

        // ── Configuración de FBXLoader ─────────────────────────────
        this.fbxLoader = new FBXLoader();
    }

    /**
     * Infiere la categoría a partir del nombre del archivo (Helper estático requerido por el editor)
     */
    static inferTypeFromFilename(filename) {
        return inferCategoryFromFilename(filename);
    }

    /**
     * Carga un archivo arrastrado desde el escritorio (.glb, .gltf o .fbx)
     */
    async loadFile(file, typeName) {
        const url = URL.createObjectURL(file);
        const ext = file.name.split('.').pop().toLowerCase();
        let model;

        try {
            if (ext === 'fbx') {
                model = await this.fbxLoader.loadAsync(url);
            } else {
                const gltf = await this.gltfLoader.loadAsync(url);
                model = gltf.scene;
            }

            // Normalización según dimensiones y categoría
            normalizeModel(model, typeName, typeName, this.roomDims);
        } finally {
            URL.revokeObjectURL(url);
        }

        return model;
    }

    /**
     * Carga secuencialmente en lotes todos los modelos definidos en catalog.js
     */
    async loadAll() {
        const keys = Object.keys(CATALOG_META);
        const total = keys.length;
        let loaded = 0;
        const models = {};

        // Configurar detección de soporte de texturas KTX2 usando el canvas principal
        try {
            const canvas = document.querySelector('#three-canvas') || document.createElement('canvas');
            const tempRenderer = new THREE.WebGLRenderer({ canvas, antialias: false });
            this.ktx2Loader.detectSupport(tempRenderer);
            this.gltfLoader.setKTX2Loader(this.ktx2Loader);
            if (!document.querySelector('#three-canvas')) {
                tempRenderer.dispose();
            }
            console.log('[AssetLoader] KTX2Loader inicializado con éxito');
        } catch (err) {
            console.warn('[AssetLoader] KTX2Loader no se pudo inicializar en este entorno:', err);
        }

        console.log(`[AssetLoader] Iniciando carga de ${total} assets…`);

        // Cargar en lotes de 3 para evitar saturar el navegador y la memoria
        const BATCH_SIZE = 3;
        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const batchKeys = keys.slice(i, i + BATCH_SIZE);

            await Promise.all(batchKeys.map(async (key) => {
                const meta = CATALOG_META[key];
                try {
                    let model;
                    if (meta.format === 'fbx') {
                        model = await this.fbxLoader.loadAsync(meta.path);
                    } else {
                        const gltf = await this.gltfLoader.loadAsync(meta.path);
                        model = gltf.scene;
                    }

                    // Escalar, centrar y apoyar en el suelo
                    normalizeModel(model, key, meta.category, this.roomDims);
                    models[key] = model;

                } catch (err) {
                    console.error(`[AssetLoader] Error cargando "${key}" (${meta.path}):`, err);

                    // Modelo alternativo/fallback (un cubo rojo con rejilla) en caso de fallo para que la app no se rompa
                    const fallback = new THREE.Group();
                    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
                    fallback.add(new THREE.Mesh(geo, mat));

                    normalizeModel(fallback, key, meta.category, this.roomDims);
                    models[key] = fallback;
                } finally {
                    loaded++;
                    if (this.onProgress) {
                        this.onProgress(loaded, total);
                    }
                }
            }));
        }

        console.log('[AssetLoader] Carga completada.');
        return models;
    }
}
