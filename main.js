// ============================================================
//  main.js — Orquestador principal del Configurador de Cocinas
//  Dependencias: Three.js, OrbitControls, UI, Room, AssetLoader
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { CATALOG_META, labelFor, refFor, categoryFor } from './catalog.js';
import { AssetLoader }                    from './loader.js';
import { Room }                           from './room.js';
import { UI }                             from './ui.js';

console.log('[KitchenEditor] main.js cargando…');

// ─────────────────────────────────────────────────────────────────
//  Clase principal
// ─────────────────────────────────────────────────────────────────

class KitchenEditor {
    constructor() {
        this.canvas = document.querySelector('#three-canvas');
        if (!this.canvas) { console.error('Canvas no encontrado'); return; }

        // Estado
        this.modules        = [];     // THREE.Group[] de objetos en escena
        this.selectedModule = null;
        this.draggingModule = false;
        this.viewMode       = '3d';
        this.isLoadingAssets = true;

        // Helpers Three.js
        this.scene    = new THREE.Scene();
        this.scene.background = new THREE.Color('#f5f5f7');
        this.raycaster = new THREE.Raycaster();
        this.mouse     = new THREE.Vector2();
        this.dimLines  = new THREE.Group();
        this.scene.add(this.dimLines);

        // Sistemas core
        this._setupRenderer();
        this._setupCameras();
        this._setupLights();
        this._setupOrbitControls();

        // Subsistemas
        this.room = new Room(this.scene);

        this.ui = new UI({
            onViewChange:    (mode)      => this._onViewChange(mode),
            onResetCamera:   ()          => this._resetCamera(),
            onFitCamera:     ()          => this._fitCameraToSelected(),
            onDelete:        ()          => this._deleteSelected(),
            onRotate:        ()          => this._rotateSelected(),
            onDuplicate:     ()          => this._duplicateSelected(),
            onLoadShowroom:  ()          => this._loadShowroom(),
            onObjectColor:   (hex)       => this._applyColorToSelected(hex),
            onWallColor:     (hex)       => this.room.setWallColor(hex),
            onFloorColor:    (hex)       => this.room.setFloorColor(hex),
            onAddModule:     (t,x,z,l,r) => this.createModule(t, x, z, l, r),
            onDimChange:     ()          => this._applyDimInputs(),
        });

        this.ui.setupWizard((w, d, h) => {
            if (this.isLoadingAssets) {
                this.ui.blockWizardStart('Espera a que los modelos terminen de cargar.');
                return;
            }
            this.room.build(w, d, h);
            this._updateOrthoCamera();
            this.orbitControls.target.set(0, 1, 0);
            this.orbitControls.update();
        });

        // Carga de assets
        this.assetLoader = new AssetLoader(
            { width: 5, depth: 4 },
            (loaded, total) => {
                this.ui.setLoadingStatus(loaded, total);
                if (loaded === total) this.isLoadingAssets = false;
            }
        );
        this.assetLoader.loadAll().then(models => {
            this.models = models;
            console.log('[KitchenEditor] Todos los assets listos:', Object.keys(models));
        });

        // Eventos
        this._setupPointerEvents();
        this._setupDragAndDrop();
        window.addEventListener('resize', () => this._onWindowResize());

        this._animate();
    }

    // ── Configuración Three.js ────────────────────────────────

    _setupRenderer() {
        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: false,
                alpha: true,
                precision: 'mediump',
                powerPreference: 'default',
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = true;
        } catch (err) {
            console.error('WebGL falló:', err);
            alert('Error crítico: No se pudo iniciar WebGL.\nActiva la aceleración por hardware en tu navegador.');
            throw err;
        }
    }

    _setupCameras() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(6, 4, 6);

        this.orthoCamera = new THREE.OrthographicCamera(-5 * aspect, 5 * aspect, 5, -5, 0.1, 1000);
        this.orthoCamera.position.set(0, 15, 0);
        this.orthoCamera.lookAt(0, 0, 0);
    }

    _setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const sun = new THREE.DirectionalLight(0xffffff, 2.0);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        this.scene.add(sun);
    }

    _setupOrbitControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
    }

    _updateOrthoCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const size   = Math.max(this.room.dims.width, this.room.dims.depth) * 0.7;
        Object.assign(this.orthoCamera, {
            left:   -size * aspect,
            right:   size * aspect,
            top:     size,
            bottom: -size,
        });
        this.orthoCamera.updateProjectionMatrix();
    }

    get _activeCamera() {
        return this.viewMode === '3d' ? this.camera : this.orthoCamera;
    }

    // ── Eventos de puntero ────────────────────────────────────

    _setupPointerEvents() {
        window.addEventListener('pointerdown', (e) => {
            if (this._isUITarget(e.target)) return;

            this._updateMouse(e);
            this.raycaster.setFromCamera(this.mouse, this._activeCamera);
            const hits = this.raycaster.intersectObjects(this.modules, true);

            if (hits.length > 0) {
                const obj = this._findModule(hits[0].object);
                if (obj) {
                    this.selectItem(obj);
                    this.draggingModule = true;
                    this.orbitControls.enabled = false;
                    // Feedback visual de selección
                    obj.scale.multiplyScalar(1.05);
                    setTimeout(() => obj.scale.divideScalar(1.05), 100);
                }
            } else {
                this.draggingModule = false;
                if (!e.target.closest('.glass-panel, .component-palette, .ui-container')) {
                    this.deselect();
                }
            }
        });

        window.addEventListener('pointermove', (e) => {
            this._updateMouse(e);
            if (!this.draggingModule || !this.selectedModule || !(e.buttons & 1)) return;

            this.raycaster.setFromCamera(this.mouse, this._activeCamera);
            const type = this.selectedModule.userData.type;
            const isWallBound = type === 'door' || type === 'window';

            if (isWallBound) {
                const hits = this.raycaster.intersectObjects(this.room.walls);
                if (hits.length > 0) {
                    this.room.snapToWall(this.selectedModule, hits[0].object, hits[0].point, type);
                    this._updateDimLines();
                }
            } else if (this.room.floor) {
                const hits = this.raycaster.intersectObject(this.room.floor);
                if (hits.length > 0) {
                    const p = hits[0].point;
                    this.selectedModule.position.x = p.x;
                    this.selectedModule.position.z = p.z;
                    this.room.keepInside(this.selectedModule);
                    this._updateDimLines();
                }
            }
        });

        window.addEventListener('pointerup', () => {
            if (this.draggingModule && this.selectedModule) {
                this.room.keepInside(this.selectedModule);
                this._updateDimLines();
            }
            this.draggingModule = false;
            this.orbitControls.enabled = true;
        });
    }

    /** Devuelve true si el evento ocurrió sobre un elemento de la UI */
    _isUITarget(target) {
        if (target.closest('#setup-wizard')) return true;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'A') return true;
        if (target.closest('button, input, a')) return true;
        return false;
    }

    /** Actualiza this.mouse desde un PointerEvent */
    _updateMouse(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    }

    /** Sube por la jerarquía del objeto hasta encontrar el wrapper en this.modules */
    _findModule(obj) {
        while (obj && !this.modules.includes(obj)) obj = obj.parent;
        return this.modules.includes(obj) ? obj : null;
    }

    // ── Drag & Drop desde paleta y desde escritorio ───────────

    _setupDragAndDrop() {
        const canvas     = this.canvas;
        const dropZone   = document.getElementById('drop-zone-overlay');

        canvas.addEventListener('dragover',  (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        canvas.addEventListener('dragenter', (e) => { if (e.dataTransfer.types.includes('Files')) dropZone?.classList.add('active'); });
        canvas.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget || !canvas.contains(e.relatedTarget)) dropZone?.classList.remove('active');
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone?.classList.remove('active');

            // Archivo externo (GLB/GLTF desde escritorio)
            if (e.dataTransfer.files?.length > 0) {
                const file = e.dataTransfer.files[0];
                const name = file.name.toLowerCase();
                if (name.endsWith('.glb') || name.endsWith('.gltf')) {
                    this._handleFileImport(file, e);
                    return;
                }
            }

            // Ítem de paleta (drag interno)
            let payload = null;
            try { payload = JSON.parse(e.dataTransfer.getData('application/json')); } catch { /* ok */ }
            const type = payload?.type || e.dataTransfer.getData('text/plain');
            if (!type) return;

            const { x, z } = this._dropPosition(e);
            this.createModule(type, x, z, payload?.label, payload?.ref);
        });
    }

    /** Importa un archivo GLB soltado desde el escritorio */
    async _handleFileImport(file, event) {
        const status = document.getElementById('asset-loader-status');
        const name   = file.name.replace(/\.[^/.]+$/, '');
        if (status) status.innerHTML = `<i class="fas fa-magic fa-spin"></i> Procesando: ${name}…`;

        try {
            const typeName = AssetLoader.inferTypeFromFilename(file.name);
            const model    = await this.assetLoader.loadFile(file, typeName);
            const { x, z } = this._dropPosition(event);

            const wrapper = this._wrapModel(model, typeName, name, 'IMPORTED');
            wrapper.position.set(x, 0, z);
            this.scene.add(wrapper);
            this.modules.push(wrapper);
            this.selectItem(wrapper);

            if (status) {
                status.innerHTML = `<i class="fas fa-check-circle"></i> "${name}" añadido`;
                setTimeout(() => { status.innerHTML = ''; }, 4000);
            }
        } catch (err) {
            console.error('[Import] Error:', err);
            alert('Error al procesar el archivo GLB. ¿Es un archivo 3D válido?');
        }
    }

    /** Convierte coordenadas de drop en posición 3D en el suelo */
    _dropPosition(event) {
        this._updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this._activeCamera);
        const hits = this.room.floor ? this.raycaster.intersectObject(this.room.floor) : [];
        return hits.length > 0 ? { x: hits[0].point.x, z: hits[0].point.z } : { x: 0, z: 0 };
    }

    // ── Creación de módulos ───────────────────────────────────

    /**
     * Crea e instancia un módulo en la escena.
     */
    createModule(type, x = 0, z = 0, catalogLabel = null, catalogRef = null) {
        const model = this.models?.[type];

        if (!model) {
            if (this.isLoadingAssets) {
                alert('Los modelos aún se están descargando. Por favor, espera unos segundos.');
            } else {
                console.warn(`[Editor] Tipo "${type}" no disponible.`);
            }
            return null;
        }

        const label   = catalogLabel || labelFor(type);
        const ref     = catalogRef   || refFor(type);
        const wrapper = this._wrapModel(model.clone(), type, label, ref);

        // Escalar si excede la habitación
        this._clampToRoom(wrapper);

        // Posicionamiento automático según category del catálogo.
        // Al añadir productos nuevos en catalog.js esto funciona sin cambiar nada aquí.
        this._autoPlace(wrapper, x, z);

        this.scene.add(wrapper);
        this.modules.push(wrapper);
        this.selectItem(wrapper);
        console.log(`[Editor] Módulo "${type}" creado en`, wrapper.position);
        return wrapper;
    }

    /** Envuelve un modelo en un Group con userData unificado */
    _wrapModel(model, type, catalogLabel, catalogRef) {
        const wrapper = new THREE.Group();
        wrapper.add(model);
        wrapper.userData = {
            ...model.userData,
            id: Date.now(),
            type,
            catalogLabel,
            catalogRef,
        };
        return wrapper;
    }

    /** Reduce la escala de un grupo para que quepa en la habitación */
    _clampToRoom(group) {
        const ud      = group.userData;
        const maxW    = this.room.dims.width  * 0.95;
        const maxD    = this.room.dims.depth  * 0.95;
        if (ud.w > maxW || ud.d > maxD) {
            const safety = Math.min(maxW / ud.w, maxD / ud.d);
            group.scale.multiplyScalar(safety);
            ud.w *= safety; ud.h *= safety; ud.d *= safety;
        }
    }

    // ── Selección y manipulación ──────────────────────────────

    /**
     * Posiciona automáticamente un módulo según su category:
     *   - 'door' / 'window'  → snap a la pared más cercana al punto de drop
     *   - 'kitchen'/'appliance' → pegado a la pared trasera (z negativo máximo)
     *   - 'chair'            → cerca de la mesa más cercana, si existe
     *   - 'table' / resto    → centro de la habitación o punto de drop
     *
     * Si el punto de drop está ocupado, busca el hueco libre más cercano.
     */
    _autoPlace(wrapper, dropX, dropZ) {
        const category = wrapper.userData.category ?? 'generic';

        const type = wrapper.userData.type || '';
        const isWallBound = category === 'door' || category === 'window' || type.includes('extractor');

        if (isWallBound) {
            const targetPos   = new THREE.Vector3(dropX, 0, dropZ);
            const nearestWall = this.room.nearestWall(targetPos);
            this.room.snapToWall(wrapper, nearestWall, nearestWall.position.clone(), category);
            
            // Si es extractor, subirlo un poco por defecto (ej. 1.5m)
            if (type.includes('extractor')) {
                wrapper.position.y = 1.5;
            }
            return;
        }


        if (category === 'kitchen' || category === 'appliance') {
            // Pegar a la pared trasera, centrado en X si no hay un drop explícito
            const z   = -this.room.dims.depth / 2 + (wrapper.userData.d ?? 0.6) / 2 + 0.01;
            const x   = (dropX !== 0) ? dropX : this._nextWallX(wrapper.userData.w ?? 0.6);
            wrapper.position.set(x, 0, z);
            this.room.keepInside(wrapper);
            return;
        }

        if (category === 'chair') {
            // Colocar cerca de la primera mesa que haya en escena
            const mesa = this.modules.find(m => m.userData.category === 'table');
            if (mesa) {
                const offset = (mesa.userData.d ?? 0.75) / 2 + (wrapper.userData.d ?? 0.45) / 2 + 0.05;
                wrapper.position.set(mesa.position.x, 0, mesa.position.z + offset);
                this.room.keepInside(wrapper);
                return;
            }
            // Sin mesa: caer al centro
        }

        // Default: punto de drop o centro
        const freePos = this._findFreeSpot(dropX, dropZ, wrapper.userData.w ?? 0.5, wrapper.userData.d ?? 0.5);
        wrapper.position.set(freePos.x, 0, freePos.z);
        this.room.keepInside(wrapper);
    }

    /**
     * Calcula la siguiente posición X libre junto a la pared trasera,
     * considerando los módulos ya colocados allí.
     */
    _nextWallX(newWidth) {
        const wallModules = this.modules.filter(m =>
            (m.userData.category === 'kitchen' || m.userData.category === 'appliance') &&
            m.position.z < -this.room.dims.depth / 2 + 1.5
        );
        if (wallModules.length === 0) return 0;

        // Ordenar por X y colocar a la derecha del último
        wallModules.sort((a, b) => a.position.x - b.position.x);
        const last = wallModules[wallModules.length - 1];
        return last.position.x + (last.userData.w ?? 0.6) / 2 + newWidth / 2 + 0.02;
    }

    /**
     * Encuentra la primera posición libre cerca de (x, z) sin solapar
     * con módulos existentes. Busca en espiral con paso de 0.5 m.
     */
    _findFreeSpot(x, z, w, d) {
        const PAD  = 0.1;
        const STEP = 0.5;
        const MAX  = 20; // iteraciones máximas

        const occupied = (cx, cz) => this.modules.some(m => {
            const dx = Math.abs(m.position.x - cx);
            const dz = Math.abs(m.position.z - cz);
            return dx < (m.userData.w ?? 0.5) / 2 + w / 2 + PAD &&
                   dz < (m.userData.d ?? 0.5) / 2 + d / 2 + PAD;
        });

        if (!occupied(x, z)) return { x, z };

        // Espiral cuadrada
        let cx = x, cz = z, step = STEP, dir = 0;
        for (let i = 0; i < MAX; i++) {
            const moves = [[STEP, 0], [0, STEP], [-STEP, 0], [0, -STEP]];
            for (const [dx, dz] of moves) {
                cx += dx; cz += dz;
                if (!occupied(cx, cz)) return { x: cx, z: cz };
            }
            step += STEP;
        }
        return { x, z }; // fallback al punto original
    }

    selectItem(obj) {
        this.deselect();
        this.selectedModule = obj;
        this.ui.showSelectionPanel(obj.userData, obj.position.y);
        this._updateDimLines();
    }


    deselect() {
        this.draggingModule = false;
        this.selectedModule = null;
        this.dimLines.clear();
        this.ui.hideSelectionPanel();
    }

    _deleteSelected() {
        if (!this.selectedModule) return;
        this.scene.remove(this.selectedModule);
        this.modules = this.modules.filter(m => m !== this.selectedModule);
        this.deselect();
    }

    _rotateSelected() {
        if (!this.selectedModule) return;
        this.selectedModule.rotation.y += Math.PI / 2;
        this.room.keepInside(this.selectedModule);
        this._updateDimLines();
    }

    _duplicateSelected() {
        if (!this.selectedModule) return;
        const src = this.selectedModule;
        this.createModule(
            src.userData.type,
            src.position.x + 0.4,
            src.position.z + 0.4,
            src.userData.catalogLabel,
            src.userData.catalogRef,
        );
    }

    _loadShowroom() {
        this.modules.forEach(m => this.scene.remove(m));
        this.modules = [];
        this.createModule('cocina_genova', 0, 0);
    }

    // ── Colores ───────────────────────────────────────────────

    _applyColorToSelected(hexColor) {
        if (!this.selectedModule) return;
        const color = new THREE.Color(hexColor);
        this.selectedModule.traverse(child => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => { mat.color.set(color); mat.needsUpdate = true; });
        });
    }

    // ── Dimensiones desde inputs ──────────────────────────────

    _applyDimInputs() {
        if (!this.selectedModule) return;
        const { w, h, d, y } = this.ui.getDimInputs();
        if ([w, h, d].some(v => isNaN(v) || v < 0.01)) return;

        const ud = this.selectedModule.userData;
        if (!ud.naturalSize) ud.naturalSize = { w: ud.w, h: ud.h, d: ud.d };

        this.selectedModule.scale.set(
            w / ud.naturalSize.w,
            h / ud.naturalSize.h,
            d / ud.naturalSize.d,
        );
        Object.assign(ud, { w, h, d });
        
        // Actualizar elevación (Y)
        this.selectedModule.position.y = y;

        this.room.keepInside(this.selectedModule);
        this._updateDimLines();
    }


    // ── Líneas de dimensión ───────────────────────────────────

    _updateDimLines() {
        this.dimLines.clear();
        if (!this.selectedModule) return;

        const pos    = this.selectedModule.position;
        const { width, depth } = this.room.dims;
        const lineMat = new THREE.LineBasicMaterial({ color: 0x0071e3, transparent: true, opacity: 0.6 });

        const targets = [
            new THREE.Vector3(pos.x,         0.1, -depth / 2),
            new THREE.Vector3(-width / 2,    0.1,  pos.z),
            new THREE.Vector3( width / 2,    0.1,  pos.z),
        ];

        targets.forEach(target => {
            const geo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pos.x, 0.1, pos.z), target]);
            this.dimLines.add(new THREE.Line(geo, lineMat));
        });

        // Actualizar etiqueta con distancia a la pared trasera
        const distToBack = Math.round(new THREE.Vector3(pos.x, 0, pos.z).distanceTo(targets[0]) * 1000);
        if (distToBack > 50) {
            const ud    = this.selectedModule.userData;
            const title = ud.catalogLabel ?? labelFor(ud.type);
            this.ui.updateSelectionLabel(`${title} · ${distToBack} mm`);
        }
    }

    // ── Cámara ────────────────────────────────────────────────

    _onViewChange(mode) {
        this.viewMode = mode;
        if (mode === '2d') {
            this.orbitControls.object = this.orthoCamera;
            this.orbitControls.enableRotate = false;
        } else {
            this.orbitControls.object = this.camera;
            this.orbitControls.enableRotate = true;
        }
        this.orbitControls.update();
    }

    _resetCamera() {
        this.camera.position.set(6, 4, 6);
        this.orbitControls.target.set(0, 1, 0);
        this.orbitControls.update();
    }

    _fitCameraToSelected() {
        const obj = this.selectedModule;
        if (!obj) return;
        const box    = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const d      = Math.max(size.x, size.y, size.z);
        this.orbitControls.target.copy(center);
        this.camera.position.copy(center).add(new THREE.Vector3(d, d, d));
        this.orbitControls.update();
    }

    // ── Loop de render ────────────────────────────────────────

    _animate() {
        requestAnimationFrame(() => this._animate());
        this.orbitControls.update();
        this.renderer.render(this.scene, this._activeCamera);
    }

    _onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this._updateOrthoCamera();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// ─────────────────────────────────────────────────────────────────
//  Arranque
// ─────────────────────────────────────────────────────────────────
window.onload = () => new KitchenEditor();
