import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { CATALOG_META, inferCategoryFromFilename } from '../catalog/catalog.js';
import { normalizeModel } from './scaler.js';

export class AssetLoader {
    constructor(roomDims, onProgress) {
        this.roomDims = roomDims;
        this.onProgress = onProgress;

        this.gltfLoader = new GLTFLoader();

        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath('/basis/');

        this.fbxLoader = new FBXLoader();
    }

    static inferTypeFromFilename(filename) {
        return inferCategoryFromFilename(filename);
    }

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

            normalizeModel(model, typeName, typeName, this.roomDims);
        } finally {
            URL.revokeObjectURL(url);
        }

        return model;
    }

    async loadAll() {
        const keys = Object.keys(CATALOG_META);
        const total = keys.length;
        let loaded = 0;
        const models = {};

        try {
            const canvas = document.querySelector('#three-canvas') || document.createElement('canvas');
            const tempRenderer = new THREE.WebGLRenderer({ canvas, antialias: false });
            this.ktx2Loader.detectSupport(tempRenderer);
            this.gltfLoader.setKTX2Loader(this.ktx2Loader);
            if (!document.querySelector('#three-canvas')) {
                tempRenderer.dispose();
            }
        } catch (err) {
            console.warn(err);
        }

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

                    normalizeModel(model, key, meta.category, this.roomDims);
                    models[key] = model;

                } catch (err) {
                    console.error(err);

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

        return models;
    }
}
