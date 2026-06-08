import { CATALOG_META, labelFor, refFor, iconFor } from '../catalog/catalog.js';

export class UI {
    constructor(handlers) {
        this.handlers = handlers;
        this.renderPalette();
        this._setupViewControls();
        this._setupActionButtons();
        this._setupColorPickers();
        this._setupPalette();
        this._setupDimInputs();
    }

    setLoadingStatus(loaded, total) {
        const el = document.getElementById('asset-loader-status');
        if (!el) return;
        if (loaded < total) {
            el.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cargando modelos: ${loaded} / ${total}`;
        } else {
            el.innerHTML = '<i class="fas fa-check-circle"></i> Modelos listos';
        }
    }

    showSelectionPanel(userData, y = 0) {
        const panel = document.getElementById('selected-item-panel');
        const title = document.getElementById('selected-item-name');
        if (!panel || !title) return;

        title.textContent = userData.catalogLabel || labelFor(userData.type);
        this._setDimInputs(userData.w, userData.h, userData.d, y);
        panel.style.display = 'block';
    }

    hideSelectionPanel() {
        const panel = document.getElementById('selected-item-panel');
        if (panel) panel.style.display = 'none';
    }

    updateSelectionLabel(text) {
        const el = document.getElementById('selected-item-name');
        if (el) el.textContent = text;
    }

    getDimInputs() {
        return {
            w: parseFloat(document.getElementById('obj-w')?.value) / 100,
            h: parseFloat(document.getElementById('obj-h')?.value) / 100,
            d: parseFloat(document.getElementById('obj-d')?.value) / 100,
            y: parseFloat(document.getElementById('obj-y')?.value) / 100,
        };
    }

    setupWizard(onStart) {
        const btn = document.getElementById('start-editor');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const w     = parseFloat(document.getElementById('room-width')?.value)  || 5;
            const d     = parseFloat(document.getElementById('room-depth')?.value)  || 4;
            const h     = parseFloat(document.getElementById('room-height')?.value) || 2.5;
            const email = (document.getElementById('user-email')?.value       || '').trim();
            const desc  = (document.getElementById('user-description')?.value || '').trim();

            onStart(w, d, h, email, desc);

            document.getElementById('setup-wizard').style.display = 'none';
            const app = document.getElementById('app');
            if (app) { app.style.opacity = '1'; app.style.pointerEvents = 'auto'; }
        });
    }

    setupSave(onSave) {
        const btn = document.getElementById('save-project');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            onSave();
        });
    }

    setupReset(onReset) {
        const btn = document.getElementById('reset-design');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            onReset();
        });
    }

    setupSendRequest(onSend) {
        const btn = document.getElementById('send-request');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            onSend();
        });
    }

    updateProjectSummary(summary) {
        const container = document.getElementById('project-summary');
        if (!container) return;

        if (!summary || !summary.dimensions) {
            container.innerHTML = `
                <div class="summary-item">
                    <span>Resumen</span>
                    <strong>Diseña tu cocina para ver los detalles del proyecto.</strong>
                </div>`;
            return;
        }

        const dimensions = `${summary.dimensions.width.toFixed(2)} x ${summary.dimensions.depth.toFixed(2)} x ${summary.dimensions.height.toFixed(2)} m`;
        const emailNote = summary.email ? summary.email : 'No se ha proporcionado correo';
        const descriptionNote = summary.description ? summary.description : 'Sin descripción añadida';
        const moduleRows = summary.modulesSummary.length > 0
            ? summary.modulesSummary.map(line => `
                <div class="summary-item">
                    <span>Elemento</span>
                    <strong>${line}</strong>
                </div>`).join('')
            : `
                <div class="summary-item">
                    <span>Elementos</span>
                    <strong>Aún no hay módulos añadidos</strong>
                </div>`;

        container.innerHTML = `
            <div class="summary-item">
                <span>Cliente</span>
                <strong>${emailNote}</strong>
            </div>
            <div class="summary-item">
                <span>Descripción</span>
                <strong>${descriptionNote}</strong>
            </div>
            <div class="summary-item">
                <span>Dimensiones</span>
                <strong>${dimensions}</strong>
            </div>
            <div class="summary-item summary-colors">
                <span>Acabados</span>
                <div class="summary-chips">
                    <span class="summary-chip" style="background:${summary.wallColor};">Pared: ${summary.wallColor}</span>
                    <span class="summary-chip" style="background:${summary.floorColor};">Suelo: ${summary.floorColor}</span>
                </div>
            </div>
            <div class="summary-item">
                <span>Elementos</span>
                <strong>${summary.itemCount} añadidos</strong>
            </div>
            ${moduleRows}`;
    }

    blockWizardStart(reason) {
        alert(reason);
    }

    _setDimInputs(w, h, d, y = 0) {
        const update = (id, val) => {
            const input = document.getElementById(`obj-${id}`);
            const span  = document.getElementById(`val-${id}`);
            const valCm = Math.round(val * 100);
            if (input) input.value = valCm;
            if (span) span.textContent = `${valCm} cm`;
        };
        update('w', w);
        update('h', h);
        update('d', d);
        update('y', y);
    }

    _setupViewControls() {
        document.getElementById('view-2d')?.addEventListener('click', () => {
            this.handlers.onViewChange?.('2d');
            document.getElementById('view-2d').classList.add('active');
            document.getElementById('view-3d').classList.remove('active');
        });
        document.getElementById('view-3d')?.addEventListener('click', () => {
            this.handlers.onViewChange?.('3d');
            document.getElementById('view-3d').classList.add('active');
            document.getElementById('view-2d').classList.remove('active');
        });
        document.getElementById('reset-camera')?.addEventListener('click', () => this.handlers.onResetCamera?.());
        document.getElementById('fit-item')?.addEventListener('click', () => this.handlers.onFitCamera?.());
    }

    _setupActionButtons() {
        document.getElementById('delete-item')?.addEventListener('click',    () => this.handlers.onDelete?.());
        document.getElementById('rotate-item')?.addEventListener('click',    () => this.handlers.onRotate?.());
        document.getElementById('duplicate-item')?.addEventListener('click', () => this.handlers.onDuplicate?.());
        document.getElementById('load-showroom')?.addEventListener('click',  () => this.handlers.onLoadShowroom?.());
    }

    _setupColorPickers() {
        const hslToHex = (h, s, l) => {
            s /= 100; l /= 100;
            const a = s * Math.min(l, 1 - l);
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        };

        const setupInlinePicker = (triggerBtnId, pickerId, previewId, hexId, onColorChange) => {
            const triggerBtn = document.getElementById(triggerBtnId);
            const picker     = document.getElementById(pickerId);
            const preview    = document.getElementById(previewId);
            const hexDisplay = document.getElementById(hexId);
            if (!triggerBtn || !picker) return;

            const sliderHue   = picker.querySelector('.picker-hue');
            const sliderSat   = picker.querySelector('.picker-sat');
            const sliderLight = picker.querySelector('.picker-light');

            const updateColor = () => {
                const h = parseInt(sliderHue.value);
                const s = parseInt(sliderSat.value);
                const l = parseInt(sliderLight.value);
                const hex = hslToHex(h, s, l);
                if (preview) preview.style.background = `hsl(${h}, ${s}%, ${l}%)`;
                if (hexDisplay) hexDisplay.textContent = hex;
                sliderHue.style.background = `linear-gradient(to right,
                    hsl(0,${s}%,${l}%), hsl(30,${s}%,${l}%), hsl(60,${s}%,${l}%),
                    hsl(120,${s}%,${l}%), hsl(180,${s}%,${l}%), hsl(240,${s}%,${l}%),
                    hsl(300,${s}%,${l}%), hsl(360,${s}%,${l}%))`;
                onColorChange(hex);
            };

            triggerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = picker.style.display !== 'none';
                picker.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) updateColor();
            });

            sliderHue.addEventListener('input', updateColor);
            sliderSat.addEventListener('input', updateColor);
            sliderLight.addEventListener('input', updateColor);
        };

        document.querySelectorAll('.obj-swatch[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const p = document.getElementById('obj-custom-picker');
                if (p) p.style.display = 'none';
                this.handlers.onObjectColor?.(btn.dataset.color);
            });
        });

        setupInlinePicker(
            'obj-custom-btn',
            'obj-custom-picker',
            'obj-picker-preview',
            'obj-picker-hex',
            (hex) => this.handlers.onObjectColor?.(hex)
        );

        document.querySelectorAll('.wall-swatch[data-wall-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const p = document.getElementById('wall-custom-picker');
                if (p) p.style.display = 'none';
                this.handlers.onWallColor?.(btn.dataset.wallColor);
                document.querySelectorAll('.wall-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        setupInlinePicker(
            'wall-custom-btn',
            'wall-custom-picker',
            'wall-picker-preview',
            'wall-picker-hex',
            (hex) => {
                this.handlers.onWallColor?.(hex);
                document.querySelectorAll('.wall-swatch').forEach(b => b.classList.remove('active'));
                document.getElementById('wall-custom-btn')?.classList.add('active');
            }
        );

        document.querySelectorAll('.floor-swatch[data-floor-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const p = document.getElementById('floor-custom-picker');
                if (p) p.style.display = 'none';
                this.handlers.onFloorColor?.(btn.dataset.floorColor);
                document.querySelectorAll('.floor-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        setupInlinePicker(
            'floor-custom-btn',
            'floor-custom-picker',
            'floor-picker-preview',
            'floor-picker-hex',
            (hex) => {
                this.handlers.onFloorColor?.(hex);
                document.querySelectorAll('.floor-swatch').forEach(b => b.classList.remove('active'));
                document.getElementById('floor-custom-btn')?.classList.add('active');
            }
        );
    }

    renderPalette() {
        const sections = {
            kitchen:      document.getElementById('section-kitchen'),
            appliance:    document.getElementById('section-appliance'),
            seating:      document.getElementById('section-seating'),
            architecture: document.getElementById('section-architecture'),
            generic:      document.getElementById('section-generic'),
        };

        Object.values(sections).forEach(s => { if (s) s.innerHTML = ''; });

        Object.entries(CATALOG_META).forEach(([type, meta]) => {
            let sectionKey = meta.category;
            if (sectionKey === 'table' || sectionKey === 'chair') sectionKey = 'seating';
            if (sectionKey === 'door' || sectionKey === 'window') sectionKey = 'architecture';

            const section = sections[sectionKey] || sections.generic;
            if (!section) return;

            const item = document.createElement('div');
            item.className = 'palette-item';
            item.setAttribute('draggable', 'true');
            item.dataset.type = type;
            item.dataset.label = meta.label;
            item.dataset.ref = meta.ref;

            item.innerHTML = `
                <span class="palette-icon">${meta.icon || '📦'}</span>
                <button type="button" class="palette-fav" aria-label="Favorito"><i class="far fa-heart"></i></button>
                <div class="palette-meta">
                    <span class="palette-title">${meta.label}</span>
                    <span class="palette-ref">${meta.ref}</span>
                </div>
            `;
            section.appendChild(item);
        });
    }

    _setupPalette() {
        document.querySelectorAll('.palette-section-header').forEach(header => {
            header.addEventListener('click', () => {
                const body    = document.getElementById(`section-${header.dataset.section}`);
                if (!body) return;
                const isOpen  = body.style.display === 'block';

                document.querySelectorAll('.palette-section-body').forEach(b => b.style.display = 'none');
                document.querySelectorAll('.palette-chevron').forEach(c => c.style.transform = 'rotate(0deg)');

                if (!isOpen) {
                    body.style.display = 'block';
                    header.querySelector('.palette-chevron')?.style.setProperty('transform', 'rotate(180deg)');
                }
            });
        });

        const firstBody    = document.querySelector('.palette-section-body');
        const firstChevron = document.querySelector('.palette-chevron');
        if (firstBody)    firstBody.style.display = 'block';
        if (firstChevron) firstChevron.style.transform = 'rotate(180deg)';

        document.querySelector('.component-palette')?.addEventListener('click', (e) => {
            const fav = e.target.closest('.palette-fav');
            if (!fav) return;
            e.preventDefault();
            e.stopPropagation();
            fav.classList.toggle('is-favorite');
            const icon = fav.querySelector('i');
            icon?.classList.toggle('far');
            icon?.classList.toggle('fas');
        });

        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                if (e.target.closest('.palette-fav')) { e.preventDefault(); return; }
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/json', JSON.stringify({
                    type:  item.dataset.type,
                    label: item.dataset.label || '',
                    ref:   item.dataset.ref   || '',
                }));
                e.dataTransfer.setData('text/plain', item.dataset.type);
            });

            item.addEventListener('click', (e) => {
                if (e.target.closest('.palette-fav')) return;
                e.stopPropagation();
                this.handlers.onAddModule?.(
                    item.dataset.type,
                    0, 0,
                    item.dataset.label || null,
                    item.dataset.ref   || null,
                );
            });
        });
    }

    _setupDimInputs() {
        ['obj-w', 'obj-h', 'obj-d', 'obj-y'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            const handleUpdate = () => {
                const valSpan = document.getElementById(`val-${id.split('-')[1]}`);
                if (valSpan) valSpan.textContent = `${input.value} cm`;
                this.handlers.onDimChange?.();
            };

            input.addEventListener('input', handleUpdate);
            input.addEventListener('change', handleUpdate);
        });
    }
}
