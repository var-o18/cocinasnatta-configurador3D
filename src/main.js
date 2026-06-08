import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { CATALOG_META, labelFor, refFor, categoryFor, priceFor } from './catalog/catalog.js';
import { AssetLoader }                    from './core/loader.js';
import { Room }                           from './core/room.js';
import { UI }                             from './ui/ui.js';

class KitchenEditor {
    constructor() {
        this.canvas = document.querySelector('#three-canvas');
        if (!this.canvas) { return; }

        this.modules        = [];
        this.selectedModule = null;
        this.draggingModule = false;
        this.viewMode       = '3d';
        this.isLoadingAssets = true;
        this.userEmail      = '';
        this.userDescription = '';
        this.roomColors     = { wall: '#ffffff', floor: '#c19a6b' };
        this.nightMode      = false;
        this.atmosphereLights = {}; // stores references to dynamic lights

        this.scene    = new THREE.Scene();
        this.scene.background = new THREE.Color('#ffffff');
        this.raycaster = new THREE.Raycaster();
        this.mouse     = new THREE.Vector2();
        this.dimLines  = new THREE.Group();
        this.scene.add(this.dimLines);

        this._setupRenderer();
        this._setupCameras();
        this._setupLights();
        this._setupOrbitControls();

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
            onWallColor:     (hex)       => { this.room.setWallColor(hex); this.roomColors.wall = hex; this._updateProjectSummary(); },
            onFloorColor:    (hex)       => { this.room.setFloorColor(hex); this.roomColors.floor = hex; this._updateProjectSummary(); },
            onAddModule:     (t,x,z,l,r) => this.createModule(t, x, z, l, r),
            onDimChange:     ()          => this._applyDimInputs(),
            onOpenBudgetDetails: ()      => this._onOpenBudgetDetails(),
            onSendRequest:   ()          => this._sendDesignRequest(),
        });

        this.ui.setupWizard((w, d, h, email, desc) => {
            if (this.isLoadingAssets) {
                this.ui.blockWizardStart('Espera a que los modelos terminen de cargar.');
                return;
            }
            this.userEmail       = email;
            this.userDescription = desc;
            this.room.build(w, d, h);
            this._updateOrthoCamera();
            this.orbitControls.target.set(0, 1, 0);
            this.orbitControls.update();
            this._updateProjectSummary();
            // Set initial sky color and rebuild atmosphere lights for new room size
            this.scene.background = new THREE.Color(this.nightMode ? 0x080c14 : 0xd8e8f0);
            this._buildAtmosphereLights();
            if (this.nightMode) this._setNightMode();
        });

        this.ui.setupSave(() => this._saveProject());
        this.ui.setupSendRequest(() => this._sendDesignRequest());
        this.ui.setupReset(() => this._resetDesign());
        this.ui.updateProjectSummary(null);

        this._setupAtmosphereControls();

        this.assetLoader = new AssetLoader(
            { width: 5, depth: 4 },
            (loaded, total) => {
                this.ui.setLoadingStatus(loaded, total);
                if (loaded === total) this.isLoadingAssets = false;
            }
        );
        this.assetLoader.loadAll().then(models => {
            this.models = models;
        });

        this._setupPointerEvents();
        this._setupDragAndDrop();
        window.addEventListener('resize', () => this._onWindowResize());

        this._animate();
    }

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
            console.error(err);
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
        // --- Day ambient + directional (sun) ---
        this.ambientLight = new THREE.AmbientLight(0xfff5e0, 1.5);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
        this.sunLight.position.set(8, 18, 8);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width  = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far  = 50;
        this.sunLight.shadow.camera.left = -10;
        this.sunLight.shadow.camera.right = 10;
        this.sunLight.shadow.camera.top   = 10;
        this.sunLight.shadow.camera.bottom= -10;
        this.scene.add(this.sunLight);
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

    // =========================================================================
    //  SISTEMA DE ATMÓSFERA Y MODO DÍA / NOCHE
    // =========================================================================

    _setupAtmosphereControls() {
        const toggle   = document.getElementById('toggle-day-night');
        const ledChk   = document.getElementById('toggle-led-strip');
        const spotChk  = document.getElementById('toggle-spots');
        const warmth   = document.getElementById('light-warmth');

        if (toggle) {
            toggle.addEventListener('change', () => {
                this.nightMode = toggle.checked;
                if (this.nightMode) {
                    this._setNightMode();
                } else {
                    this._setDayMode();
                }
            });
        }

        if (ledChk) {
            ledChk.addEventListener('change', () => {
                const al = this.atmosphereLights;
                const on = ledChk.checked;
                [al.ledBack, al.ledLeft, al.ledRight].forEach(l => { if (l) l.visible = on; });
            });
        }

        if (spotChk) {
            spotChk.addEventListener('change', () => {
                const al = this.atmosphereLights;
                const on = spotChk.checked;
                [al.spot1, al.spot2, al.spot3].forEach(l => { if (l) l.visible = on; });
            });
        }

        if (warmth) {
            warmth.addEventListener('input', () => {
                this._updateAtmosphereLightColor(parseInt(warmth.value));
            });
        }
    }

    _buildAtmosphereLights() {
        // Remove previous atmosphere lights if they exist
        Object.values(this.atmosphereLights).forEach(l => { if (l) this.scene.remove(l); });
        this.atmosphereLights = {};

        const { width, depth, height } = this.room.dims;
        const warmHex = 0xff9c3a;

        // ---- LED Strips bajo armarios (línea trasera de la cocina) ----
        // Back wall LED strip
        const ledBack = new THREE.PointLight(warmHex, 0, 4, 1.5);
        ledBack.position.set(0, height * 0.55, -depth / 2 + 0.15);
        ledBack.castShadow = false;
        this.scene.add(ledBack);
        this.atmosphereLights.ledBack = ledBack;

        // Left wall LED strip
        const ledLeft = new THREE.PointLight(warmHex, 0, 4, 1.5);
        ledLeft.position.set(-width / 2 + 0.15, height * 0.55, 0);
        ledLeft.castShadow = false;
        this.scene.add(ledLeft);
        this.atmosphereLights.ledLeft = ledLeft;

        // Right wall LED strip
        const ledRight = new THREE.PointLight(warmHex, 0, 4, 1.5);
        ledRight.position.set(width / 2 - 0.15, height * 0.55, 0);
        ledRight.castShadow = false;
        this.scene.add(ledRight);
        this.atmosphereLights.ledRight = ledRight;

        // ---- Ceiling Spots (SpotLights) ----
        const spotColor = 0xfff5e8;
        const spotY     = height - 0.05;

        const spot1 = new THREE.SpotLight(spotColor, 0, 5, Math.PI / 6, 0.25, 1.0);
        spot1.position.set(-width / 4, spotY, -depth / 4);
        spot1.target.position.set(-width / 4, 0, -depth / 4);
        spot1.castShadow = true;
        spot1.shadow.mapSize.width  = 512;
        spot1.shadow.mapSize.height = 512;
        this.scene.add(spot1);
        this.scene.add(spot1.target);
        this.atmosphereLights.spot1 = spot1;

        const spot2 = new THREE.SpotLight(spotColor, 0, 5, Math.PI / 6, 0.25, 1.0);
        spot2.position.set(0, spotY, 0);
        spot2.target.position.set(0, 0, 0);
        spot2.castShadow = true;
        spot2.shadow.mapSize.width  = 512;
        spot2.shadow.mapSize.height = 512;
        this.scene.add(spot2);
        this.scene.add(spot2.target);
        this.atmosphereLights.spot2 = spot2;

        const spot3 = new THREE.SpotLight(spotColor, 0, 5, Math.PI / 6, 0.25, 1.0);
        spot3.position.set(width / 4, spotY, depth / 4);
        spot3.target.position.set(width / 4, 0, depth / 4);
        spot3.castShadow = true;
        spot3.shadow.mapSize.width  = 512;
        spot3.shadow.mapSize.height = 512;
        this.scene.add(spot3);
        this.scene.add(spot3.target);
        this.atmosphereLights.spot3 = spot3;

        // Start all invisible; they activate when night mode is toggled
        Object.values(this.atmosphereLights).forEach(l => { if (l) l.visible = false; });
    }

    _setDayMode() {
        // Sky: bright warm white
        this.scene.background = new THREE.Color(0xd8e8f0);
        this.ambientLight.color.set(0xfff5e0);
        this.ambientLight.intensity = 1.5;
        this.sunLight.intensity = 2.0;
        this.sunLight.color.set(0xfff5e0);

        // Turn off all atmosphere lights
        Object.values(this.atmosphereLights).forEach(l => { if (l) { l.intensity = 0; l.visible = false; } });

        // UI feedback
        document.body.classList.remove('night-mode');
        const label = document.getElementById('atmosphere-mode-label');
        const dayIcon = document.getElementById('atm-icon-day');
        const nightIcon = document.getElementById('atm-icon-night');
        if (label) label.textContent = 'Modo Día activo';
        dayIcon?.classList.remove('dimmed');
        nightIcon?.classList.remove('active');

        // Restore checkbox-driven visibility state
        const ledOn  = document.getElementById('toggle-led-strip')?.checked ?? true;
        const spotOn = document.getElementById('toggle-spots')?.checked ?? true;
        const al = this.atmosphereLights;
        [al.ledBack, al.ledLeft, al.ledRight].forEach(l => { if (l) l.visible = ledOn; });
        [al.spot1, al.spot2, al.spot3].forEach(l => { if (l) l.visible = spotOn; });
    }

    _setNightMode() {
        // Build lights if room exists and they haven't been built yet
        if (this.room?.dims && Object.keys(this.atmosphereLights).length === 0) {
            this._buildAtmosphereLights();
        }

        // Sky: deep midnight blue
        this.scene.background = new THREE.Color(0x080c14);
        this.ambientLight.color.set(0x1a1f30);
        this.ambientLight.intensity = 0.15;
        this.sunLight.intensity = 0.0;

        const warmth = parseInt(document.getElementById('light-warmth')?.value ?? 70);
        this._updateAtmosphereLightColor(warmth);

        // Turn on atmosphere lights with nice intensity
        const ledOn  = document.getElementById('toggle-led-strip')?.checked ?? true;
        const spotOn = document.getElementById('toggle-spots')?.checked ?? true;
        const al = this.atmosphereLights;

        [al.ledBack, al.ledLeft, al.ledRight].forEach(l => {
            if (l) { l.visible = ledOn; l.intensity = ledOn ? 1.8 : 0; }
        });
        [al.spot1, al.spot2, al.spot3].forEach(l => {
            if (l) { l.visible = spotOn; l.intensity = spotOn ? 2.5 : 0; }
        });

        // UI feedback
        document.body.classList.add('night-mode');
        const label = document.getElementById('atmosphere-mode-label');
        const dayIcon = document.getElementById('atm-icon-day');
        const nightIcon = document.getElementById('atm-icon-night');
        if (label) label.textContent = 'Modo Noche activo';
        dayIcon?.classList.add('dimmed');
        nightIcon?.classList.add('active');
    }

    _updateAtmosphereLightColor(warmthPct) {
        // 0 = cool blue-white, 100 = warm amber
        const t = warmthPct / 100;
        const r = Math.round(210 + t * 45);   // 210 → 255
        const g = Math.round(220 + t * -60);  // 220 → 160
        const b = Math.round(255 + t * -175); // 255 → 80
        const hex = (r << 16) | (g << 8) | b;

        Object.values(this.atmosphereLights).forEach(l => {
            if (l) l.color.setHex(hex);
        });
    }

    get _activeCamera() {
        return this.viewMode === '3d' ? this.camera : this.orthoCamera;
    }

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

    _isUITarget(target) {
        if (target.closest('#setup-wizard')) return true;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'A') return true;
        if (target.closest('button, input, a')) return true;
        return false;
    }

    _updateMouse(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    }

    _findModule(obj) {
        while (obj && !this.modules.includes(obj)) obj = obj.parent;
        return this.modules.includes(obj) ? obj : null;
    }

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

            if (e.dataTransfer.files?.length > 0) {
                const file = e.dataTransfer.files[0];
                const name = file.name.toLowerCase();
                if (name.endsWith('.glb') || name.endsWith('.gltf')) {
                    this._handleFileImport(file, e);
                    return;
                }
            }

            let payload = null;
            try { payload = JSON.parse(e.dataTransfer.getData('application/json')); } catch { }
            const type = payload?.type || e.dataTransfer.getData('text/plain');
            if (!type) return;

            const { x, z } = this._dropPosition(e);
            this.createModule(type, x, z, payload?.label, payload?.ref);
        });
    }

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
            console.error(err);
            alert('Error al procesar el archivo GLB. ¿Es un archivo 3D válido?');
        }
    }

    _dropPosition(event) {
        this._updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this._activeCamera);
        const hits = this.room.floor ? this.raycaster.intersectObject(this.room.floor) : [];
        return hits.length > 0 ? { x: hits[0].point.x, z: hits[0].point.z } : { x: 0, z: 0 };
    }

    createModule(type, x = 0, z = 0, catalogLabel = null, catalogRef = null) {
        const model = this.models?.[type];

        if (!model) {
            if (this.isLoadingAssets) {
                alert('Los modelos aún se están descargando. Por favor, espera unos segundos.');
            }
            return null;
        }

        const label   = catalogLabel || labelFor(type);
        const ref     = catalogRef   || refFor(type);
        const wrapper = this._wrapModel(model.clone(), type, label, ref);

        this._clampToRoom(wrapper);
        this._autoPlace(wrapper, x, z);

        this.scene.add(wrapper);
        this.modules.push(wrapper);
        this.selectItem(wrapper);
        this._updateProjectSummary();
        return wrapper;
    }

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

    _autoPlace(wrapper, dropX, dropZ) {
        const category = wrapper.userData.category ?? 'generic';

        const type = wrapper.userData.type || '';
        const isWallBound = category === 'door' || category === 'window' || type.includes('extractor');

        if (isWallBound) {
            const targetPos   = new THREE.Vector3(dropX, 0, dropZ);
            const nearestWall = this.room.nearestWall(targetPos);
            this.room.snapToWall(wrapper, nearestWall, nearestWall.position.clone(), category);
            
            if (type.includes('extractor')) {
                wrapper.position.y = 1.5;
            }
            return;
        }

        if (category === 'kitchen' || category === 'appliance') {
            const z   = -this.room.dims.depth / 2 + (wrapper.userData.d ?? 0.6) / 2 + 0.01;
            const x   = (dropX !== 0) ? dropX : this._nextWallX(wrapper.userData.w ?? 0.6);
            wrapper.position.set(x, 0, z);
            this.room.keepInside(wrapper);
            return;
        }

        if (category === 'chair') {
            const mesa = this.modules.find(m => m.userData.category === 'table');
            if (mesa) {
                const offset = (mesa.userData.d ?? 0.75) / 2 + (wrapper.userData.d ?? 0.45) / 2 + 0.05;
                wrapper.position.set(mesa.position.x, 0, mesa.position.z + offset);
                this.room.keepInside(wrapper);
                return;
            }
        }

        const freePos = this._findFreeSpot(dropX, dropZ, wrapper.userData.w ?? 0.5, wrapper.userData.d ?? 0.5);
        wrapper.position.set(freePos.x, 0, freePos.z);
        this.room.keepInside(wrapper);
    }

    _nextWallX(newWidth) {
        const wallModules = this.modules.filter(m =>
            (m.userData.category === 'kitchen' || m.userData.category === 'appliance') &&
            m.position.z < -this.room.dims.depth / 2 + 1.5
        );
        if (wallModules.length === 0) return 0;

        wallModules.sort((a, b) => a.position.x - b.position.x);
        const last = wallModules[wallModules.length - 1];
        return last.position.x + (last.userData.w ?? 0.6) / 2 + newWidth / 2 + 0.02;
    }

    _findFreeSpot(x, z, w, d) {
        const PAD  = 0.1;
        const STEP = 0.5;
        const MAX  = 20;

        const occupied = (cx, cz) => this.modules.some(m => {
            const dx = Math.abs(m.position.x - cx);
            const dz = Math.abs(m.position.z - cz);
            return dx < (m.userData.w ?? 0.5) / 2 + w / 2 + PAD &&
                   dz < (m.userData.d ?? 0.5) / 2 + d / 2 + PAD;
        });

        if (!occupied(x, z)) return { x, z };

        let cx = x, cz = z, step = STEP;
        for (let i = 0; i < MAX; i++) {
            const moves = [[STEP, 0], [0, STEP], [-STEP, 0], [0, -STEP]];
            for (const [dx, dz] of moves) {
                cx += dx; cz += dz;
                if (!occupied(cx, cz)) return { x: cx, z: cz };
            }
            step += STEP;
        }
        return { x, z };
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
        this._updateProjectSummary();
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

    _applyColorToSelected(hexColor) {
        if (!this.selectedModule) return;
        const color = new THREE.Color(hexColor);
        this.selectedModule.traverse(child => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => { mat.color.set(color); mat.needsUpdate = true; });
        });
    }

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
        
        this.selectedModule.position.y = y;

        this.room.keepInside(this.selectedModule);
        this._updateDimLines();
        this._updateProjectSummary();
    }

    _updateDimLines() {
        this.dimLines.clear();
        if (!this.selectedModule) return;

        const pos    = this.selectedModule.position;
        const { width, depth } = this.room.dims;
        const lineMat = new THREE.LineBasicMaterial({ color: 0xc99a6b, transparent: true, opacity: 0.6 });

        const targets = [
            new THREE.Vector3(pos.x,         0.1, -depth / 2),
            new THREE.Vector3(-width / 2,    0.1,  pos.z),
            new THREE.Vector3( width / 2,    0.1,  pos.z),
        ];

        targets.forEach(target => {
            const geo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pos.x, 0.1, pos.z), target]);
            this.dimLines.add(new THREE.Line(geo, lineMat));
        });

        const distToBack = Math.round(new THREE.Vector3(pos.x, 0, pos.z).distanceTo(targets[0]) * 1000);
        if (distToBack > 50) {
            const ud    = this.selectedModule.userData;
            const title = ud.catalogLabel ?? labelFor(ud.type);
            this.ui.updateSelectionLabel(`${title} · ${distToBack} mm`);
        }
    }

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

    _saveProject() {
        const fecha = new Date().toLocaleString('es-ES');

        const modulosGuardados = this.modules.map(m => {
            const ud = m.userData;
            // Intenta obtener el color del primer material del primer mesh
            let colorHex = null;
            m.traverse(child => {
                if (!colorHex && child.isMesh && child.material) {
                    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                    if (mat && mat.color) colorHex = '#' + mat.color.getHexString();
                }
            });
            return {
                tipo:       ud.type        || '',
                etiqueta:   ud.catalogLabel || ud.type || '',
                referencia: ud.catalogRef  || '',
                posicion:   { x: +m.position.x.toFixed(3), y: +m.position.y.toFixed(3), z: +m.position.z.toFixed(3) },
                rotacion_y: +(m.rotation.y * (180 / Math.PI)).toFixed(1) + '°',
                escala:     { x: +m.scale.x.toFixed(3), y: +m.scale.y.toFixed(3), z: +m.scale.z.toFixed(3) },
                dimensiones_cm: {
                    ancho: ud.w ? Math.round(ud.w * 100) : null,
                    alto:  ud.h ? Math.round(ud.h * 100) : null,
                    fondo: ud.d ? Math.round(ud.d * 100) : null,
                },
                color: colorHex,
            };
        });

        const proyecto = {
            meta: {
                generado:   fecha,
                aplicacion: 'Cocinas Natta – Configurador 3D',
                version:    '1.0',
            },
            cliente: {
                correo:      this.userEmail      || '—',
                descripcion: this.userDescription || '—',
            },
            espacio: {
                ancho_m: this.room.dims.width,
                fondo_m: this.room.dims.depth,
                alto_m:  this.room.dims.height,
            },
            acabados: {
                color_paredes: this.roomColors.wall,
                color_suelo:   this.roomColors.floor,
            },
            modulos: modulosGuardados,
        };

        const json    = JSON.stringify(proyecto, null, 2);
        const blob    = new Blob([json], { type: 'application/json' });
        const url     = URL.createObjectURL(blob);
        const a       = document.createElement('a');
        a.href        = url;
        a.download    = `proyecto-cocina-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    _resetDesign() {
        if (!confirm('¿Resetear el diseño? Esta acción eliminará todos los módulos y volverá a valores iniciales.')) return;

        // Remove all modules from scene
        this.modules.forEach(m => this.scene.remove(m));
        this.modules = [];

        // Clear selection and dim lines
        this.deselect();

        // Reset user info
        this.userEmail = '';
        this.userDescription = '';

        // Reset room to sensible defaults
        const DEFAULTS = { width: 5, depth: 4, height: 2.5 };
        this.room.build(DEFAULTS.width, DEFAULTS.depth, DEFAULTS.height);
        this.room.setWallColor('#ffffff');
        this.room.setFloorColor('#c19a6b');
        this.roomColors = { wall: '#ffffff', floor: '#c19a6b' };

        // Reset camera and UI
        this._updateOrthoCamera();
        this._resetCamera();
        this.ui.updateProjectSummary(null);
    }

    _sendDesignRequest() {
        const email = this.userEmail || 'Sin correo';
        const description = this.userDescription || 'Sin descripción';
        alert(
            'Solicitud de diseño personalizada enviada.\n\n' +
            'Tu proyecto ha sido registrado con los siguientes datos:\n' +
            `Correo: ${email}\n` +
            `Descripción: ${description}`
        );
    }

    _updateProjectSummary() {
        const summary = {
            email: this.userEmail,
            description: this.userDescription,
            dimensions: this.room?.dims,
            wallColor: this.roomColors.wall,
            floorColor: this.roomColors.floor,
            itemCount: this.modules.length,
            modulesSummary: this._summarizeModules(),
        };
        this.ui.updateProjectSummary(summary);

        const { total } = this._calculateBudget();
        this.ui.updateBudgetTotal(total);
    }

    _calculateBudget() {
        const items = [];
        let total = 0;

        // 1. Acabados de Suelo
        if (this.room && this.room.dims) {
            const areaSuelo = this.room.dims.width * this.room.dims.depth;
            const floorPrices = {
                '#c19a6b': 45, // Madera roble
                '#6b4423': 55, // Madera oscura
                '#9e9e9e': 35, // Gris cemento
                '#e8e4df': 95  // Mármol
            };
            const floorLabels = {
                '#c19a6b': 'Madera Roble',
                '#6b4423': 'Madera Oscura',
                '#9e9e9e': 'Gris Cemento',
                '#e8e4df': 'Mármol premium'
            };
            const floorCostPerM2 = floorPrices[this.roomColors.floor] || 50;
            const floorLabel = floorLabels[this.roomColors.floor] || 'Personalizado';
            const priceFloor = Math.round(areaSuelo * floorCostPerM2);
            items.push({
                label: 'Revestimiento de Suelo',
                details: `${areaSuelo.toFixed(1)} m² · Acabado ${floorLabel} (${floorCostPerM2}€/m²)`,
                price: priceFloor
            });
            total += priceFloor;

            // 2. Acabados de Pared
            const areaParedes = (this.room.dims.width * this.room.dims.height * 2) + (this.room.dims.depth * this.room.dims.height * 2);
            const priceWalls = Math.round(areaParedes * 15); // 15€/m² por pintar
            items.push({
                label: 'Pintura de Paredes',
                details: `${areaParedes.toFixed(1)} m² · Tono ${this.roomColors.wall} (15€/m²)`,
                price: priceWalls
            });
            total += priceWalls;
        }

        // 3. Módulos y electrodomésticos
        this.modules.forEach(m => {
            const ud = m.userData;
            const basePrice = priceFor(ud.type);
            let finalPrice = basePrice;

            const isKitchenCabinet = ud.category === 'kitchen' && ud.type.startsWith('mueble') && !ud.type.includes('cocina');
            const wCm = Math.round((ud.w ?? 0.6) * 100);
            const hCm = Math.round((ud.h ?? 0.8) * 100);
            const dCm = Math.round((ud.d ?? 0.6) * 100);
            
            let details = '';
            if (isKitchenCabinet) {
                const volumeScale = m.scale.x * m.scale.y * m.scale.z;
                finalPrice = Math.round(basePrice * volumeScale);
                details = `Dimensiones a medida: ${wCm}x${hCm}x${dCm} cm`;
            } else {
                details = ud.catalogRef ? `Ref: ${ud.catalogRef}` : 'Accesorio decorativo';
            }

            items.push({
                label: ud.catalogLabel || labelFor(ud.type),
                details: details,
                price: finalPrice
            });
            total += finalPrice;
        });

        return { total, items };
    }

    _onOpenBudgetDetails() {
        const { total, items } = this._calculateBudget();
        const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const roomDimsText = `${this.room.dims.width.toFixed(2)} x ${this.room.dims.depth.toFixed(2)} x ${this.room.dims.height.toFixed(2)} m`;
        this.ui.showBudgetModal(
            this.userEmail,
            dateStr,
            roomDimsText,
            items,
            total
        );
    }

    _summarizeModules() {
        const counts = {};
        this.modules.forEach((module) => {
            const label = module.userData.catalogLabel || labelFor(module.userData.type);
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, amount]) => `${amount}x ${label}`);
    }

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

window.onload = () => new KitchenEditor();
