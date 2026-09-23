/**
 * Main Game Controller for CITY PLANNER — Misi Menata Kota & Lab Eksperimen
 */

class CityPlannerApp {
    constructor() {
        this.canvas = document.getElementById('cityCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');

        // State
        this.currentMissionIndex = 0;
        this.isSandbox = true; // Default to Sandbox / Lab for creative exploration
        this.activeLabTab = 'lab-line';
        this.placedItems = [];
        this.activeLines = [];
        this.activeZones = [];
        this.selectedTool = null;
        this.hoverCoord = { x: 0, y: 0 };
        this.isHoveringCanvas = false;

        // Viewport / Camera
        this.unitSize = 48; // pixels per math unit
        this.offsetX = 0;   // pixel pan offset
        this.offsetY = 0;
        this.isDraggingViewport = false;
        this.dragStart = { x: 0, y: 0 };

        // Distance Measuring Mode
        this.isMeasuring = false;
        this.measurePointA = null;
        this.measurePointB = null;

        // Live Road Slider State
        this.sliderLine = { m: 1.0, c: 0.0, color: '#3B82F6', type: 'road' };

        // Vehicle & Environment Animations
        this.vehicles = [];
        this.animTime = 0;

        // Missions & Sound
        this.missions = window.CITY_MISSIONS || [];
        this.sound = window.soundManager;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupEventListeners();
        this.setupLabControls();
        this.renderTemplatesList();
        this.renderLabInventory();

        // Load Sandbox Lab by default or Mission 0
        this.loadSandbox();

        // Start Animation Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
        if (!this.container) return;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.centerOrigin();
    }

    centerOrigin() {
        if (this.currentMission && this.currentMission.gridRange) {
            const gr = this.currentMission.gridRange;
            const midX = (gr.minX + gr.maxX) / 2;
            const midY = (gr.minY + gr.maxY) / 2;
            this.offsetX = this.canvas.width / 2 - midX * this.unitSize;
            this.offsetY = this.canvas.height / 2 + midY * this.unitSize;
        } else {
            this.offsetX = this.canvas.width / 2;
            this.offsetY = this.canvas.height / 2;
        }
    }

    get currentMission() {
        return this.isSandbox ? null : this.missions[this.currentMissionIndex];
    }

    // Coordinate Transformations
    mathToScreen(mx, my) {
        return {
            x: this.offsetX + mx * this.unitSize,
            y: this.offsetY - my * this.unitSize
        };
    }

    screenToMath(sx, sy) {
        return {
            x: (sx - this.offsetX) / this.unitSize,
            y: (this.offsetY - sy) / this.unitSize
        };
    }

    snapToGrid(sx, sy) {
        const m = this.screenToMath(sx, sy);
        return {
            x: Math.round(m.x),
            y: Math.round(m.y)
        };
    }

    setupEventListeners() {
        // Mouse Move on Canvas
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;

            if (this.isDraggingViewport) {
                this.offsetX += sx - this.dragStart.x;
                this.offsetY += sy - this.dragStart.y;
                this.dragStart = { x: sx, y: sy };
                return;
            }

            this.hoverCoord = this.snapToGrid(sx, sy);
            this.isHoveringCanvas = true;
            this.updateTooltip(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseenter', () => {
            this.isHoveringCanvas = true;
            document.getElementById('coord-tooltip').style.opacity = '1';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isHoveringCanvas = false;
            this.isDraggingViewport = false;
            document.getElementById('coord-tooltip').style.opacity = '0';
        });

        // Mouse Down / Click
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.shiftKey || (e.button === 0 && e.altKey)) { // Middle click or Shift+Click = Pan
                this.isDraggingViewport = true;
                this.dragStart = { x: e.clientX, y: e.clientY };
                return;
            }

            if (e.button === 0) { // Left click
                if (this.isMeasuring) {
                    this.handleMeasureClick();
                } else {
                    this.handleCanvasClick();
                }
            } else if (e.button === 2) { // Right click = Remove item
                e.preventDefault();
                this.removeItemAt(this.hoverCoord.x, this.hoverCoord.y);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDraggingViewport = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Zoom with Wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newUnitSize = Math.min(90, Math.max(24, this.unitSize * zoomFactor));

            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;

            const mathPos = this.screenToMath(sx, sy);
            this.unitSize = newUnitSize;

            this.offsetX = sx - mathPos.x * this.unitSize;
            this.offsetY = sy + mathPos.y * this.unitSize;
        }, { passive: false });

        // Inventory click handlers
        const handleInventoryClick = (e) => {
            const itemEl = e.target.closest('.inventory-item');
            if (!itemEl || itemEl.classList.contains('disabled')) return;
            const type = itemEl.dataset.type;
            this.selectTool(type);
        };

        const invList = document.getElementById('inventory-list');
        if (invList) invList.addEventListener('click', handleInventoryClick);

        const labInvList = document.getElementById('lab-inventory-list');
        if (labInvList) labInvList.addEventListener('click', handleInventoryClick);

        // Sidebar Main Mode Switch Tabs
        const missionTabBtn = document.getElementById('tab-btn-mission');
        const labTabBtn = document.getElementById('tab-btn-lab');

        if (missionTabBtn && labTabBtn) {
            missionTabBtn.addEventListener('click', () => {
                this.loadMission(this.currentMissionIndex || 0);
            });

            labTabBtn.addEventListener('click', () => {
                this.loadSandbox();
            });
        }

        // Action Buttons
        document.getElementById('btn-validate').addEventListener('click', () => this.validateCity());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetCurrentLevel());
        document.getElementById('btn-theory').addEventListener('click', () => this.openTheoryModal());
        document.getElementById('btn-export-png').addEventListener('click', () => this.exportCityPNG());
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('btn-recenter').addEventListener('click', () => this.centerOrigin());

        // Sound Toggle
        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const muted = this.sound.toggleMute();
                soundBtn.innerHTML = muted ? '🔇' : '🔊';
                soundBtn.title = muted ? 'Aktifkan Suara' : 'Bisukan Suara';
            });
        }

        // Mode / Mission Selector Dropdown
        const missionSelect = document.getElementById('mission-selector');
        if (missionSelect) {
            missionSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'sandbox') {
                    this.loadSandbox();
                } else {
                    this.loadMission(parseInt(val, 10));
                }
            });
        }
    }

    setupLabControls() {
        // Lab Sub-tabs navigation
        const tabBtns = document.querySelectorAll('.lab-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetTab = btn.dataset.tab;
                this.activeLabTab = targetTab;

                document.querySelectorAll('.lab-tab-view').forEach(view => {
                    view.classList.add('hidden');
                });

                const targetView = document.getElementById(`lab-tab-content-${targetTab.replace('lab-', '')}`);
                if (targetView) targetView.classList.remove('hidden');

                if (targetTab === 'lab-spldv') {
                    this.updateSPLDVDropdowns();
                }
            });
        });

        // 1. Live Line Slider controls
        const sliderM = document.getElementById('slider-m');
        const sliderC = document.getElementById('slider-c');
        const mValLabel = document.getElementById('slider-m-val');
        const cValLabel = document.getElementById('slider-c-val');
        const liveEqBadge = document.getElementById('live-eq-badge');

        const updateLiveSliderPreview = () => {
            if (!sliderM || !sliderC) return;
            const m = parseFloat(sliderM.value);
            const c = parseFloat(sliderC.value);
            this.sliderLine.m = m;
            this.sliderLine.c = c;
            this.sliderLine.type = document.getElementById('lab-line-type').value;
            this.sliderLine.color = document.getElementById('lab-line-color').value;

            if (mValLabel) mValLabel.innerText = m >= 0 ? `+${m.toFixed(2)}` : m.toFixed(2);
            if (cValLabel) cValLabel.innerText = c >= 0 ? `+${c.toFixed(1)}` : c.toFixed(1);

            let eqStr = "y = ";
            if (m === 0) eqStr += `${c}`;
            else {
                eqStr += `${m === 1 ? '' : m === -1 ? '-' : m}x`;
                if (c > 0) eqStr += ` + ${c}`;
                else if (c < 0) eqStr += ` - ${Math.abs(c)}`;
            }
            if (liveEqBadge) liveEqBadge.innerText = eqStr;
        };

        if (sliderM && sliderC) {
            sliderM.addEventListener('input', updateLiveSliderPreview);
            sliderC.addEventListener('input', updateLiveSliderPreview);
        }

        const lineTypeSel = document.getElementById('lab-line-type');
        const lineColorSel = document.getElementById('lab-line-color');
        if (lineTypeSel) lineTypeSel.addEventListener('change', updateLiveSliderPreview);
        if (lineColorSel) lineColorSel.addEventListener('change', updateLiveSliderPreview);

        // Add Line to map button
        const addLineBtn = document.getElementById('btn-lab-add-line');
        if (addLineBtn) {
            addLineBtn.addEventListener('click', () => {
                const m = this.sliderLine.m;
                const c = this.sliderLine.c;
                const isRiver = this.sliderLine.type === 'river';

                let raw = `y = ${m}x + ${c}`;
                if (m === 0) raw = `y = ${c}`;

                const newLine = {
                    id: 'line_' + Date.now(),
                    name: `${isRiver ? 'Sungai' : 'Jalan'}: ${raw}`,
                    m: m,
                    c: c,
                    isRiver: isRiver,
                    color: this.sliderLine.color,
                    raw: raw,
                    A: m,
                    B: -1,
                    C: -c
                };

                this.activeLines.push(newLine);
                this.initVehicles();
                this.sound.playRoadBuild();
                this.updateSPLDVDropdowns();
                this.showToast(`Berhasil memasang ${newLine.name}!`, "success");
            });
        }

        // Clear all lines
        const clearLinesBtn = document.getElementById('btn-lab-clear-lines');
        if (clearLinesBtn) {
            clearLinesBtn.addEventListener('click', () => {
                if (confirm("Hapus semua garis jalan & sungai di kanvas?")) {
                    this.activeLines = [];
                    this.vehicles = [];
                    this.updateSPLDVDropdowns();
                    this.sound.playRemove();
                }
            });
        }

        // 2. DHP Zonasi Lab Controls
        const inputA = document.getElementById('zone-input-a');
        const inputB = document.getElementById('zone-input-b');
        const inputOp = document.getElementById('zone-input-op');
        const inputC = document.getElementById('zone-input-c');
        const inputTheme = document.getElementById('zone-input-theme');
        const zoneFormulaPreview = document.getElementById('live-zone-formula-preview');

        const updateZoneFormula = () => {
            if (!inputA || !inputB || !inputOp || !inputC) return;
            const a = inputA.value || 1;
            const b = inputB.value || 1;
            const op = inputOp.value;
            const c = inputC.value || 0;
            const opChar = op === '<=' ? '≤' : op === '>=' ? '≥' : op;
            if (zoneFormulaPreview) {
                zoneFormulaPreview.innerText = `${a}x + ${b}y ${opChar} ${c}`;
            }
        };

        [inputA, inputB, inputOp, inputC].forEach(el => {
            if (el) el.addEventListener('input', updateZoneFormula);
        });

        // Add DHP Zone
        const addZoneBtn = document.getElementById('btn-lab-add-zone');
        if (addZoneBtn) {
            addZoneBtn.addEventListener('click', () => {
                const a = inputA.value || 1;
                const b = inputB.value || 1;
                const op = inputOp.value;
                const c = inputC.value || 0;
                const themeVal = inputTheme.value.split('|');
                const color = themeVal[0];
                const label = themeVal[1] || "DHP Zona";

                const ineqStr = `${a}x + ${b}y ${op} ${c}`;
                this.activeZones.push({
                    id: 'zone_' + Date.now(),
                    name: label,
                    ineqs: [ineqStr, "x >= -10", "y >= -10"],
                    color: color,
                    label: label
                });

                this.sound.playPlace();
                this.showToast(`Berhasil menambahkan ${label} (${ineqStr})!`, "success");
            });
        }

        // Clear all zones
        const clearZonesBtn = document.getElementById('btn-lab-clear-zones');
        if (clearZonesBtn) {
            clearZonesBtn.addEventListener('click', () => {
                if (confirm("Hapus semua arsiran zonasi DHP?")) {
                    this.activeZones = [];
                    this.sound.playRemove();
                }
            });
        }

        // Test Point quick evaluator
        const testPtBtn = document.getElementById('btn-run-test-pt');
        if (testPtBtn) {
            testPtBtn.addEventListener('click', () => {
                const tx = parseFloat(document.getElementById('test-pt-x').value || 0);
                const ty = parseFloat(document.getElementById('test-pt-y').value || 0);
                const a = parseFloat(inputA.value || 1);
                const b = parseFloat(inputB.value || 1);
                const op = inputOp.value;
                const c = parseFloat(inputC.value || 0);

                const ineqObj = MathEngine.parseInequality(`${a}x + ${b}y ${op} ${c}`);
                const resultDiv = document.getElementById('test-pt-result');
                if (ineqObj && resultDiv) {
                    const pass = ineqObj.test(tx, ty);
                    const val = a * tx + b * ty;
                    const opChar = op === '<=' ? '≤' : op === '>=' ? '≥' : op;
                    resultDiv.innerHTML = `Uji (${tx},${ty}): ${a}(${tx}) + ${b}(${ty}) = <b>${val}</b> ${opChar} ${c} ➔ <span class="${pass ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${pass ? 'BENAR (Termasuk DHP)' : 'SALAH (Di luar DHP)'}</span>`;
                }
            });
        }

        // 3. SPLDV Controls
        const spldvLine1 = document.getElementById('spldv-line-1');
        const spldvLine2 = document.getElementById('spldv-line-2');
        if (spldvLine1 && spldvLine2) {
            spldvLine1.addEventListener('change', () => this.calculateSPLDV());
            spldvLine2.addEventListener('change', () => this.calculateSPLDV());
        }

        // Build Mall at SPLDV intersection point
        const btnBuildMall = document.getElementById('btn-spldv-build-mall');
        if (btnBuildMall) {
            btnBuildMall.addEventListener('click', () => {
                const pt = this.currentIntersectionPt;
                if (!pt) {
                    this.sound.playError();
                    this.showToast("Tidak ada titik potong yang valid.", "error");
                    return;
                }
                this.placedItems.push({
                    id: 'mall_' + Date.now(),
                    type: 'building',
                    name: 'Mall Simpang Pusat Bisnis 🏢',
                    icon: '🏢',
                    color: '#8B5CF6',
                    x: Math.round(pt.x),
                    y: Math.round(pt.y)
                });
                this.sound.playPlace();
                this.updateCityStats();
                this.showToast(`Berhasil mendirikan Mall Simpang di koordinat (${Math.round(pt.x)}, ${Math.round(pt.y)})!`, "success");
            });
        }

        // Generate Perpendicular line
        const btnMakePerp = document.getElementById('btn-spldv-make-perp');
        if (btnMakePerp) {
            btnMakePerp.addEventListener('click', () => {
                if (this.activeLines.length === 0) {
                    this.showToast("Buat minimal 1 jalan terlebih dahulu.", "info");
                    return;
                }
                const l1 = this.activeLines[0];
                const perp = MathEngine.getPerpendicularLine(l1, { x: 0, y: 0 });
                this.activeLines.push({
                    id: 'perp_' + Date.now(),
                    name: perp.name,
                    m: perp.m,
                    c: perp.c,
                    color: '#EC4899',
                    raw: perp.raw,
                    A: perp.m,
                    B: -1,
                    C: -perp.c
                });
                this.initVehicles();
                this.sound.playRoadBuild();
                this.updateSPLDVDropdowns();
                this.showToast(`Berhasil membuat garis tegak lurus: ${perp.raw}!`, "success");
            });
        }

        // Generate Parallel line
        const btnMakeParallel = document.getElementById('btn-spldv-make-parallel');
        if (btnMakeParallel) {
            btnMakeParallel.addEventListener('click', () => {
                if (this.activeLines.length === 0) {
                    this.showToast("Buat minimal 1 jalan terlebih dahulu.", "info");
                    return;
                }
                const l1 = this.activeLines[0];
                const par = MathEngine.getParallelLine(l1, 3);
                this.activeLines.push({
                    id: 'par_' + Date.now(),
                    name: par.name,
                    m: par.m,
                    c: par.c,
                    color: '#10B981',
                    raw: par.raw,
                    A: par.m,
                    B: -1,
                    C: -par.c
                });
                this.initVehicles();
                this.sound.playRoadBuild();
                this.updateSPLDVDropdowns();
                this.showToast(`Berhasil membuat jalan kembar sejajar: ${par.raw}!`, "success");
            });
        }

        // 4. Distance Measurement Toggle
        const btnToggleMeasure = document.getElementById('btn-toggle-measure');
        if (btnToggleMeasure) {
            btnToggleMeasure.addEventListener('click', () => {
                this.isMeasuring = !this.isMeasuring;
                this.measurePointA = null;
                this.measurePointB = null;

                const badge = document.getElementById('measure-mode-badge');
                const btnText = document.getElementById('measure-btn-text');
                const overlay = document.getElementById('measure-canvas-overlay');

                if (this.isMeasuring) {
                    badge.innerText = "Aktif";
                    badge.className = "badge-tag bg-amber-900/60 text-amber-300 border border-amber-600/50";
                    btnText.innerText = "Matikan Mistar Ukur";
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        document.getElementById('measure-overlay-text').innerText = "Klik Titik Pertama (Titik A)...";
                    }
                    this.showToast("Mistar ukur aktif! Klik 2 titik di kanvas.", "info");
                } else {
                    badge.innerText = "Non-Aktif";
                    badge.className = "badge-tag bg-slate-800 text-slate-400";
                    btnText.innerText = "Aktifkan Mistar Ukur Jarak";
                    if (overlay) overlay.classList.add('hidden');
                }
            });
        }

        const closeMeasureOverlay = document.getElementById('btn-close-measure-overlay');
        if (closeMeasureOverlay) {
            closeMeasureOverlay.addEventListener('click', () => {
                this.isMeasuring = false;
                document.getElementById('measure-canvas-overlay').classList.add('hidden');
            });
        }
    }

    updateSPLDVDropdowns() {
        const sel1 = document.getElementById('spldv-line-1');
        const sel2 = document.getElementById('spldv-line-2');
        if (!sel1 || !sel2) return;

        if (this.activeLines.length < 2) {
            sel1.innerHTML = `<option value="">-- Butuh minimal 2 jalan --</option>`;
            sel2.innerHTML = `<option value="">-- Butuh minimal 2 jalan --</option>`;
            document.getElementById('spldv-point-output').innerText = "Tambahkan minimal 2 jalan di kanvas.";
            this.currentIntersectionPt = null;
            return;
        }

        sel1.innerHTML = this.activeLines.map((l, i) => `<option value="${i}">${l.name || l.raw}</option>`).join('');
        sel2.innerHTML = this.activeLines.map((l, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${l.name || l.raw}</option>`).join('');

        this.calculateSPLDV();
    }

    calculateSPLDV() {
        const sel1 = document.getElementById('spldv-line-1');
        const sel2 = document.getElementById('spldv-line-2');
        const outputEl = document.getElementById('spldv-point-output');
        if (!sel1 || !sel2 || !outputEl) return;

        const idx1 = parseInt(sel1.value, 10);
        const idx2 = parseInt(sel2.value, 10);

        if (isNaN(idx1) || isNaN(idx2) || idx1 === idx2 || !this.activeLines[idx1] || !this.activeLines[idx2]) {
            outputEl.innerText = "Pilih dua garis yang berbeda.";
            this.currentIntersectionPt = null;
            return;
        }

        const l1 = this.activeLines[idx1];
        const l2 = this.activeLines[idx2];

        const res = MathEngine.solveSPLDV(l1, l2);
        if (res.hasIntersection) {
            this.currentIntersectionPt = res.point;
            outputEl.innerHTML = `🎯 Titik Potong Simpang = <span class="text-amber-400 font-bold text-base">(${res.point.x}, ${res.point.y})</span>`;
        } else {
            this.currentIntersectionPt = null;
            outputEl.innerHTML = `<span class="text-rose-400">${res.explanation}</span>`;
        }
    }

    handleMeasureClick() {
        const x = this.hoverCoord.x;
        const y = this.hoverCoord.y;

        if (!this.measurePointA) {
            this.measurePointA = { x, y };
            this.measurePointB = null;
            this.sound.playClick();
            document.getElementById('measure-overlay-text').innerText = `Titik A (${x}, ${y}) terpilih. Klik Titik B...`;
        } else if (!this.measurePointB) {
            this.measurePointB = { x, y };
            this.sound.playPlace();

            const p1 = this.measurePointA;
            const p2 = this.measurePointB;
            const res = MathEngine.distanceWithSteps(p1, p2);

            const details = document.getElementById('measure-details');
            if (details) {
                details.classList.remove('hidden');
                document.getElementById('measure-pt1').innerText = `• Titik A: (${p1.x}, ${p1.y})`;
                document.getElementById('measure-pt2').innerText = `• Titik B: (${p2.x}, ${p2.y})`;
                document.getElementById('measure-calc').innerText = `• d = √(${res.dx}² + ${res.dy}²) = √${res.sum} = ${res.distance}`;
                document.getElementById('measure-final').innerText = `Jarak Nyata = ${res.distance} Satuan`;
            }

            document.getElementById('measure-overlay-text').innerHTML = `Jarak A(${p1.x},${p1.y}) ➔ B(${p2.x},${p2.y}) = <b class="text-emerald-400 text-sm">${res.distance}</b> satuan`;
        } else {
            // Reset to new point A
            this.measurePointA = { x, y };
            this.measurePointB = null;
            this.sound.playClick();
            document.getElementById('measure-overlay-text').innerText = `Titik A (${x}, ${y}) terpilih. Klik Titik B...`;
        }
    }

    renderTemplatesList() {
        const list = document.getElementById('templates-list');
        if (!list) return;

        const templates = MathEngine.getSandboxTemplates();
        list.innerHTML = templates.map(t => `
            <div class="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 hover:border-blue-500 transition-all cursor-pointer group" onclick="window.cityApp.loadTemplate('${t.id}')">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-white group-hover:text-blue-400">${t.name}</span>
                    <span class="text-[10px] text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800">Muat ➔</span>
                </div>
                <p class="text-[10px] text-slate-400">${t.description}</p>
            </div>
        `).join('');
    }

    loadTemplate(templateId) {
        const templates = MathEngine.getSandboxTemplates();
        const t = templates.find(item => item.id === templateId);
        if (!t) return;

        if (confirm(`Muat desain cetak biru "${t.name}" ke kanvas?`)) {
            this.activeLines = JSON.parse(JSON.stringify(t.lines || []));
            this.activeZones = JSON.parse(JSON.stringify(t.zones || []));
            this.placedItems = JSON.parse(JSON.stringify(t.items || []));
            this.initVehicles();
            this.updateSPLDVDropdowns();
            this.updateCityStats();
            this.sound.playSuccess();
            this.showToast(`Berhasil memuat template "${t.name}"!`, "success");
        }
    }

    renderLabInventory() {
        const list = document.getElementById('lab-inventory-list');
        if (!list) return;

        const items = [
            { type: "school", name: "Sekolah", icon: "🏫", color: "#3B82F6" },
            { type: "hospital", name: "RS", icon: "🏥", color: "#EF4444" },
            { type: "house", name: "Rumah", icon: "🏠", color: "#F59E0B" },
            { type: "park", name: "Taman", icon: "🌳", color: "#10B981" },
            { type: "building", name: "Mall", icon: "🏢", color: "#8B5CF6" },
            { type: "factory", name: "Pabrik", icon: "🏭", color: "#64748B" }
        ];

        list.innerHTML = items.map(item => `
            <button class="inventory-item glass-card p-2 flex flex-col items-center justify-center border hover:border-blue-500 rounded-lg text-center" data-type="${item.type}">
                <span class="text-xl mb-0.5">${item.icon}</span>
                <span class="text-[10px] font-bold text-slate-200">${item.name}</span>
            </button>
        `).join('');
    }

    zoom(factor) {
        this.unitSize = Math.min(90, Math.max(24, this.unitSize * factor));
        this.centerOrigin();
    }

    updateTooltip(clientX, clientY) {
        const tooltip = document.getElementById('coord-tooltip');
        if (!tooltip) return;
        const quad = MathEngine.getQuadrant(this.hoverCoord.x, this.hoverCoord.y);
        tooltip.innerHTML = `(${this.hoverCoord.x}, ${this.hoverCoord.y}) <span class="text-slate-400 text-[10px] font-normal">| ${quad}</span>`;
        tooltip.style.left = `${clientX}px`;
        tooltip.style.top = `${clientY}px`;
    }

    selectTool(type) {
        if (this.selectedTool && this.selectedTool.type === type) {
            this.selectedTool = null;
        } else {
            const mission = this.currentMission;
            let itemDef = null;
            if (mission) {
                itemDef = mission.starterItems.find(i => i.type === type);
            } else {
                itemDef = this.getSandboxItemDef(type);
            }
            this.selectedTool = itemDef ? { ...itemDef } : null;
        }

        this.sound.playClick();
        this.renderInventory();
    }

    getSandboxItemDef(type) {
        const allDefs = {
            school: { type: "school", name: "Sekolah 🏫", icon: "🏫", count: 99, color: "#3B82F6" },
            hospital: { type: "hospital", name: "Rumah Sakit 🏥", icon: "🏥", count: 99, color: "#EF4444" },
            house: { type: "house", name: "Perumahan 🏠", icon: "🏠", count: 99, color: "#F59E0B" },
            park: { type: "park", name: "Taman 🌳", icon: "🌳", count: 99, color: "#10B981" },
            building: { type: "building", name: "Gedung Komersial 🏢", icon: "🏢", count: 99, color: "#8B5CF6" },
            factory: { type: "factory", name: "Pabrik Industri 🏭", icon: "🏭", count: 99, color: "#64748B" }
        };
        return allDefs[type] || null;
    }

    handleCanvasClick() {
        if (!this.selectedTool) return;

        const x = this.hoverCoord.x;
        const y = this.hoverCoord.y;

        const existingIdx = this.placedItems.findIndex(i => i.x === x && i.y === y);
        if (existingIdx !== -1) {
            this.removeItemAt(x, y);
        }

        if (!this.isSandbox && this.currentMission) {
            const placedCount = this.placedItems.filter(i => i.type === this.selectedTool.type).length;
            const starter = this.currentMission.starterItems.find(i => i.type === this.selectedTool.type);
            if (starter && placedCount >= starter.count) {
                this.sound.playError();
                this.showToast(`Stok ${this.selectedTool.name} sudah habis (${starter.count}/${starter.count})!`, "error");
                return;
            }
        }

        this.placedItems.push({
            id: 'item_' + Date.now() + Math.random().toString(36).substring(2, 5),
            type: this.selectedTool.type,
            name: this.selectedTool.name,
            icon: this.selectedTool.icon,
            color: this.selectedTool.color,
            x: x,
            y: y
        });

        this.sound.playPlace();
        this.renderInventory();
        this.updateCityStats();
    }

    removeItemAt(x, y) {
        const idx = this.placedItems.findIndex(i => i.x === x && i.y === y);
        if (idx !== -1) {
            const removed = this.placedItems.splice(idx, 1)[0];
            this.sound.playRemove();
            this.renderInventory();
            this.updateCityStats();
            this.showToast(`Menghapus ${removed.name} dari (${x}, ${y})`, "info");
        }
    }

    loadMission(index) {
        this.isSandbox = false;
        this.currentMissionIndex = Math.max(0, Math.min(this.missions.length - 1, index));
        const m = this.missions[this.currentMissionIndex];

        this.placedItems = [];
        this.activeLines = m.lines ? JSON.parse(JSON.stringify(m.lines)) : [];
        this.activeZones = m.zones ? JSON.parse(JSON.stringify(m.zones)) : [];
        this.selectedTool = null;
        this.isMeasuring = false;
        this.measurePointA = null;
        this.measurePointB = null;

        this.initVehicles();

        // Switch panels
        document.getElementById('panel-mission-mode').classList.remove('hidden');
        document.getElementById('panel-lab-mode').classList.add('hidden');

        document.getElementById('tab-btn-mission').className = "flex-1 py-1.5 px-2 rounded-md text-xs font-bold text-center transition-all bg-blue-600/30 text-blue-400 border border-blue-500/40";
        document.getElementById('tab-btn-lab').className = "flex-1 py-1.5 px-2 rounded-md text-xs font-bold text-center transition-all bg-transparent text-slate-400 hover:text-white";

        // Update UI Text
        document.getElementById('mission-title').innerText = m.title;
        document.getElementById('mission-badge').innerText = m.badge;
        document.getElementById('mission-topic').innerText = m.mathTopic;
        document.getElementById('mission-summary').innerText = m.summary;

        const rulesList = document.getElementById('mission-rules');
        rulesList.innerHTML = m.rules.map((r, i) => `
            <li class="flex items-start gap-2 p-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs text-slate-200">
                <span class="text-blue-400 font-bold mt-0.5">#${i + 1}</span>
                <span>${r.text}</span>
            </li>
        `).join('');

        const roadBtn = document.getElementById('btn-add-road');
        if (roadBtn) roadBtn.style.display = m.requireLineInput ? 'inline-flex' : 'none';

        const select = document.getElementById('mission-selector');
        if (select) select.value = this.currentMissionIndex;

        const validateLabel = document.getElementById('btn-validate-label');
        if (validateLabel) validateLabel.innerText = "Validasi Tata Kota";

        this.renderInventory();
        this.centerOrigin();
        this.updateCityStats();
    }

    loadSandbox() {
        this.isSandbox = true;
        this.selectedTool = null;

        // Switch panels
        document.getElementById('panel-mission-mode').classList.add('hidden');
        document.getElementById('panel-lab-mode').classList.remove('hidden');

        document.getElementById('tab-btn-lab').className = "flex-1 py-1.5 px-2 rounded-md text-xs font-bold text-center transition-all bg-blue-600/30 text-blue-400 border border-blue-500/40";
        document.getElementById('tab-btn-mission').className = "flex-1 py-1.5 px-2 rounded-md text-xs font-bold text-center transition-all bg-transparent text-slate-400 hover:text-white";

        const select = document.getElementById('mission-selector');
        if (select) select.value = 'sandbox';

        const validateLabel = document.getElementById('btn-validate-label');
        if (validateLabel) validateLabel.innerText = "Analisis Tata Kota";

        this.renderInventory();
        this.updateSPLDVDropdowns();
        this.centerOrigin();
        this.updateCityStats();
    }

    resetCurrentLevel() {
        if (confirm("Bersihkan semua bangunan dan konfigurasi di kanvas?")) {
            if (this.isSandbox) {
                this.placedItems = [];
                this.activeLines = [];
                this.activeZones = [];
                this.vehicles = [];
                this.updateSPLDVDropdowns();
            } else {
                this.loadMission(this.currentMissionIndex);
            }
            this.sound.playRemove();
            this.updateCityStats();
        }
    }

    renderInventory() {
        const listEl = document.getElementById('inventory-list');
        if (!listEl) return;

        let items = [];
        if (this.currentMission) {
            items = this.currentMission.starterItems;
        }

        listEl.innerHTML = items.map(item => {
            const placedCount = this.placedItems.filter(i => i.type === item.type).length;
            const remaining = Math.max(0, item.count - placedCount);
            const isSelected = this.selectedTool && this.selectedTool.type === item.type;
            const isDisabled = remaining === 0;

            return `
                <div class="inventory-item glass-card p-3 flex items-center justify-between border ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-type="${item.type}">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${item.icon}</span>
                        <div>
                            <div class="text-xs font-bold text-slate-200">${item.name}</div>
                        </div>
                    </div>
                    <div class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-900/80 ${remaining === 0 ? 'text-rose-400' : 'text-blue-400'}">
                        ${placedCount}/${item.count}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCityStats() {
        const pop = this.placedItems.filter(i => i.type === 'house').length * 250;
        const parks = this.placedItems.filter(i => i.type === 'park').length;
        const factories = this.placedItems.filter(i => i.type === 'factory').length;

        const popEl = document.getElementById('stat-population');
        const greenEl = document.getElementById('stat-green');
        const scoreEl = document.getElementById('stat-items');

        if (popEl) popEl.innerText = pop.toLocaleString();
        if (greenEl) {
            const greenIndex = Math.max(0, Math.min(100, 50 + parks * 15 - factories * 20));
            greenEl.innerText = `${greenIndex}%`;
        }
        if (scoreEl) scoreEl.innerText = this.placedItems.length;
    }

    initVehicles() {
        this.vehicles = [];
        this.activeLines.forEach((line, idx) => {
            if (!line.isRiver && !line.isVertical) {
                this.vehicles.push({
                    lineId: line.id || idx,
                    m: line.m,
                    c: line.c,
                    x: -5 + (idx * 3),
                    speed: 0.02 + Math.random() * 0.015,
                    direction: idx % 2 === 0 ? 1 : -1,
                    color: ['#FACC15', '#F43F5E', '#38BDF8', '#4ADE80'][idx % 4]
                });
            }
        });
    }

    // Main Render Loop
    loop(timestamp) {
        this.animTime = timestamp * 0.001;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Grid & Cartesian Axes
        this.renderGrid();

        // 2. DHP Inequality Zones
        this.renderZones();

        // 3. Active Lines (Roads, Rivers)
        this.renderLines();

        // 4. Live Slider Ghost Preview Line (in Lab mode)
        if (this.isSandbox && this.activeLabTab === 'lab-line') {
            this.renderSliderLinePreview();
        }

        // 5. Vehicles
        this.renderVehicles();

        // 6. Fixed Landmarks
        this.renderFixedDecorations();

        // 7. Placed Buildings
        this.renderPlacedItems();

        // 8. Distance Measurement Visualizer
        if (this.isMeasuring && this.measurePointA) {
            this.renderMeasurementVisualizer();
        }

        // 9. Ghost Building Preview
        if (this.isHoveringCanvas && this.selectedTool && !this.isMeasuring) {
            this.renderPlacementPreview();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    renderGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const unit = this.unitSize;

        const topLeft = this.screenToMath(0, 0);
        const bottomRight = this.screenToMath(width, height);

        const minX = Math.floor(topLeft.x) - 1;
        const maxX = Math.ceil(bottomRight.x) + 1;
        const minY = Math.floor(bottomRight.y) - 1;
        const maxY = Math.ceil(topLeft.y) + 1;

        // Subgrid lines
        ctx.strokeStyle = "rgba(59, 130, 246, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x += 0.5) {
            const p = this.mathToScreen(x, 0);
            ctx.moveTo(p.x, 0);
            ctx.lineTo(p.x, height);
        }
        for (let y = minY; y <= maxY; y += 0.5) {
            const p = this.mathToScreen(0, y);
            ctx.moveTo(0, p.y);
            ctx.lineTo(width, p.y);
        }
        ctx.stroke();

        // Main Grid Lines
        ctx.strokeStyle = "rgba(59, 130, 246, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x += 1) {
            const p = this.mathToScreen(x, 0);
            ctx.moveTo(p.x, 0);
            ctx.lineTo(p.x, height);
        }
        for (let y = minY; y <= maxY; y += 1) {
            const p = this.mathToScreen(0, y);
            ctx.moveTo(0, p.y);
            ctx.lineTo(width, p.y);
        }
        ctx.stroke();

        // Cartesian Axes (X & Y)
        const origin = this.mathToScreen(0, 0);

        ctx.strokeStyle = "rgba(96, 165, 250, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
        ctx.stroke();

        // Axis Labels
        ctx.fillStyle = "#60A5FA";
        ctx.font = "bold 12px Inter, monospace";
        ctx.fillText("X →", width - 28, origin.y - 8);
        ctx.fillText("Y ↑", origin.x + 8, 18);

        // Coordinate Numbers
        ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        for (let x = minX; x <= maxX; x += 1) {
            if (x === 0) continue;
            const p = this.mathToScreen(x, 0);
            ctx.fillText(x.toString(), p.x, origin.y + 5);
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let y = minY; y <= maxY; y += 1) {
            if (y === 0) continue;
            const p = this.mathToScreen(0, y);
            ctx.fillText(y.toString(), origin.x - 6, p.y);
        }

        // Origin Label
        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "right";
        ctx.fillText("(0,0)", origin.x - 6, origin.y + 14);

        // Subtle Quadrant Indicators
        ctx.fillStyle = "rgba(59, 130, 246, 0.04)";
        ctx.font = "bold 32px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const qOffset = 4 * unit;
        ctx.fillText("KUADRAN I (+,+)", origin.x + qOffset, origin.y - qOffset);
        ctx.fillText("KUADRAN II (-,+)", origin.x - qOffset, origin.y - qOffset);
        ctx.fillText("KUADRAN III (-,-)", origin.x - qOffset, origin.y + qOffset);
        ctx.fillText("KUADRAN IV (+,-)", origin.x + qOffset, origin.y + qOffset);
    }

    renderZones() {
        if (!this.activeZones || this.activeZones.length === 0) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const step = 8;

        this.activeZones.forEach(zone => {
            const parsedIneqs = zone.ineqs.map(str => MathEngine.parseInequality(str)).filter(Boolean);
            if (parsedIneqs.length === 0) return;

            ctx.fillStyle = zone.color || "rgba(16, 185, 129, 0.2)";

            for (let px = 0; px < width; px += step) {
                for (let py = 0; py < height; py += step) {
                    const mathPt = this.screenToMath(px + step / 2, py + step / 2);
                    if (MathEngine.isPointInSystem(mathPt, parsedIneqs)) {
                        ctx.fillRect(px, py, step, step);
                    }
                }
            }

            if (zone.label) {
                ctx.fillStyle = "#10B981";
                ctx.font = "bold 11px Inter, sans-serif";
                ctx.textAlign = "left";
                const p = this.mathToScreen(1, 1);
                ctx.fillText(`📐 ${zone.label}`, p.x, p.y);
            }
        });
    }

    renderLines() {
        const ctx = this.ctx;
        const width = this.canvas.width;

        this.activeLines.forEach((line) => {
            ctx.save();
            const topLeft = this.screenToMath(0, 0);
            const bottomRight = this.screenToMath(width, this.canvas.height);

            const xMin = topLeft.x - 2;
            const xMax = bottomRight.x + 2;

            if (line.isVertical) {
                const p1 = this.mathToScreen(line.xVal, topLeft.y + 2);
                const p2 = this.mathToScreen(line.xVal, bottomRight.y - 2);

                ctx.strokeStyle = line.color || "#3B82F6";
                ctx.lineWidth = line.width || 3;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            } else {
                const y1 = line.m * xMin + line.c;
                const y2 = line.m * xMax + line.c;

                const p1 = this.mathToScreen(xMin, y1);
                const p2 = this.mathToScreen(xMax, y2);

                if (line.isRiver) {
                    ctx.strokeStyle = "#0284C7";
                    ctx.lineWidth = 14;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    ctx.strokeStyle = "#38BDF8";
                    ctx.lineWidth = 4;
                    ctx.setLineDash([8, 8]);
                    ctx.lineDashOffset = -this.animTime * 20;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = "#334155";
                    ctx.lineWidth = 10;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    ctx.strokeStyle = line.color || "#3B82F6";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.strokeStyle = "#FACC15";
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Line text badge
                const midX = (topLeft.x + bottomRight.x) / 2;
                const midY = line.m * midX + line.c;
                const midP = this.mathToScreen(midX, midY);

                if (midP.x > 50 && midP.x < width - 100 && midP.y > 50 && midP.y < this.canvas.height - 50) {
                    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
                    ctx.strokeStyle = line.color || "#3B82F6";
                    ctx.lineWidth = 1;
                    const text = line.name || `y = ${line.m}x + ${line.c}`;
                    ctx.font = "bold 10px monospace";
                    const textWidth = ctx.measureText(text).width;

                    ctx.fillRect(midP.x - textWidth / 2 - 6, midP.y - 18, textWidth + 12, 18);
                    ctx.strokeRect(midP.x - textWidth / 2 - 6, midP.y - 18, textWidth + 12, 18);

                    ctx.fillStyle = line.color || "#60A5FA";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(text, midP.x, midP.y - 9);
                }
            }
            ctx.restore();
        });
    }

    renderSliderLinePreview() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const topLeft = this.screenToMath(0, 0);
        const bottomRight = this.screenToMath(width, this.canvas.height);

        const xMin = topLeft.x - 2;
        const xMax = bottomRight.x + 2;
        const y1 = this.sliderLine.m * xMin + this.sliderLine.c;
        const y2 = this.sliderLine.m * xMax + this.sliderLine.c;

        const p1 = this.mathToScreen(xMin, y1);
        const p2 = this.mathToScreen(xMax, y2);

        ctx.save();
        ctx.strokeStyle = this.sliderLine.color || "#38BDF8";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.restore();
    }

    renderVehicles() {
        const ctx = this.ctx;
        this.vehicles.forEach(v => {
            v.x += v.speed * v.direction;
            if (v.x > 8) v.direction = -1;
            if (v.x < -8) v.direction = 1;

            const y = v.m * v.x + v.c;
            const p = this.mathToScreen(v.x, y);

            ctx.save();
            ctx.translate(p.x, p.y);
            const angle = -Math.atan(v.m) * (v.direction > 0 ? 1 : -1);
            ctx.rotate(angle);

            ctx.fillStyle = v.color;
            ctx.fillRect(-6, -3, 12, 6);

            ctx.fillStyle = "#0F172A";
            ctx.fillRect(-5, -4, 3, 2);
            ctx.fillRect(2, -4, 3, 2);
            ctx.fillRect(-5, 2, 3, 2);
            ctx.fillRect(2, 2, 3, 2);

            ctx.restore();
        });
    }

    renderFixedDecorations() {
        const ctx = this.ctx;
        const decorations = (this.currentMission && this.currentMission.fixedDecorations) || [];

        decorations.forEach(dec => {
            const p = this.mathToScreen(dec.x, dec.y);

            ctx.fillStyle = dec.color || "#3B82F6";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + Math.sin(this.animTime * 4) * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
            ctx.strokeStyle = dec.color || "#3B82F6";
            ctx.lineWidth = 1.5;
            ctx.font = "bold 10px Inter, sans-serif";
            const textWidth = ctx.measureText(dec.label).width;

            ctx.fillRect(p.x - textWidth / 2 - 4, p.y - 24, textWidth + 8, 16);
            ctx.strokeRect(p.x - textWidth / 2 - 4, p.y - 24, textWidth + 8, 16);

            ctx.fillStyle = "#F8FAFC";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(dec.label, p.x, p.y - 16);
        });
    }

    renderPlacedItems() {
        const ctx = this.ctx;
        this.placedItems.forEach(item => {
            const p = this.mathToScreen(item.x, item.y);

            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 12, 14, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "28px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.icon, p.x, p.y - 4);

            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.strokeStyle = item.color || "#3B82F6";
            ctx.lineWidth = 1;
            ctx.font = "bold 9px monospace";
            const coordText = `(${item.x}, ${item.y})`;
            const textWidth = ctx.measureText(coordText).width;

            ctx.fillRect(p.x - textWidth / 2 - 3, p.y + 12, textWidth + 6, 12);
            ctx.strokeRect(p.x - textWidth / 2 - 3, p.y + 12, textWidth + 6, 12);

            ctx.fillStyle = "#60A5FA";
            ctx.fillText(coordText, p.x, p.y + 18);
        });
    }

    renderMeasurementVisualizer() {
        const ctx = this.ctx;
        const p1 = this.mathToScreen(this.measurePointA.x, this.measurePointA.y);
        const p2 = this.measurePointB ? this.mathToScreen(this.measurePointB.x, this.measurePointB.y) : this.mathToScreen(this.hoverCoord.x, this.hoverCoord.y);

        ctx.save();

        // Point A Pulse Marker
        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 6 + Math.sin(this.animTime * 6) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Right-Triangle Projections (Δx and Δy)
        const cornerP = this.mathToScreen(this.measurePointB ? this.measurePointB.x : this.hoverCoord.x, this.measurePointA.y);

        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(cornerP.x, cornerP.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Main Euclidean Hypotenuse Line
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Distance Tag at midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dist = MathEngine.distance(this.measurePointA, this.measurePointB || this.hoverCoord);
        const tagText = `d = ${dist.toFixed(2)}`;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 1;
        ctx.font = "bold 11px monospace";
        const tw = ctx.measureText(tagText).width;

        ctx.fillRect(midX - tw / 2 - 4, midY - 10, tw + 8, 20);
        ctx.strokeRect(midX - tw / 2 - 4, midY - 10, tw + 8, 20);

        ctx.fillStyle = "#FBBF24";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, midX, midY);

        ctx.restore();
    }

    renderPlacementPreview() {
        const ctx = this.ctx;
        const p = this.mathToScreen(this.hoverCoord.x, this.hoverCoord.y);

        ctx.save();
        ctx.globalAlpha = 0.65;

        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "28px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.selectedTool.icon, p.x, p.y - 4);

        ctx.restore();
    }

    // Modal & Theory Guide
    openTheoryModal() {
        const modal = document.getElementById('theory-modal');
        if (modal) modal.classList.remove('hidden');
    }

    closeTheoryModal() {
        const modal = document.getElementById('theory-modal');
        if (modal) modal.classList.add('hidden');
    }

    openRoadModal() {
        const modal = document.getElementById('road-modal');
        if (modal) modal.classList.remove('hidden');
    }

    closeRoadModal() {
        const modal = document.getElementById('road-modal');
        if (modal) modal.classList.add('hidden');
    }

    addCustomLine(equationStr) {
        const parsed = MathEngine.parseLinearEquation(equationStr);
        if (!parsed) {
            this.sound.playError();
            this.showToast("Format persamaan tidak valid.", "error");
            return false;
        }

        const newLine = {
            id: 'line_' + Date.now(),
            name: `Jalan: ${parsed.raw}`,
            m: parsed.m,
            c: parsed.c,
            isVertical: parsed.isVertical,
            xVal: parsed.xVal,
            A: parsed.A,
            B: parsed.B,
            C: parsed.C,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][this.activeLines.length % 5],
            raw: parsed.raw
        };

        this.activeLines.push(newLine);
        this.initVehicles();
        this.updateSPLDVDropdowns();
        this.sound.playRoadBuild();
        this.closeRoadModal();
        this.showToast(`Berhasil membangun ${newLine.name}!`, "success");
        return true;
    }

    // Export Blueprint Snapshot PNG
    exportCityPNG() {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        const expCtx = exportCanvas.getContext('2d');

        // Draw current frame
        expCtx.drawImage(this.canvas, 0, 0);

        // Add Blueprint Title Banner Watermark
        expCtx.fillStyle = "rgba(15, 23, 42, 0.85)";
        expCtx.fillRect(16, 16, 360, 60);
        expCtx.strokeStyle = "#3B82F6";
        expCtx.lineWidth = 1.5;
        expCtx.strokeRect(16, 16, 360, 60);

        expCtx.fillStyle = "#60A5FA";
        expCtx.font = "bold 14px Inter, sans-serif";
        expCtx.fillText("🏙️ CETAK BIRU TATA KOTA", 30, 40);

        expCtx.fillStyle = "#94A3B8";
        expCtx.font = "10px monospace";
        expCtx.fillText(`CITY PLANNER LAB | Total Bangunan: ${this.placedItems.length}`, 30, 60);

        // Download PNG
        const link = document.createElement('a');
        link.download = `Cetak_Biru_Kota_${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        this.sound.playSuccess();
        this.showToast("Cetak biru kota berhasil diunduh (PNG)!", "success");
    }

    // City Validator
    validateCity() {
        if (this.isSandbox) {
            // Provide Rich City Analytics in Sandbox
            const houses = this.placedItems.filter(i => i.type === 'house').length;
            const parks = this.placedItems.filter(i => i.type === 'park').length;
            const buildings = this.placedItems.filter(i => i.type === 'building').length;
            const factories = this.placedItems.filter(i => i.type === 'factory').length;

            const analysisSteps = [
                `📊 Total Fasilitas: ${this.placedItems.length} unit (${houses} Rumah, ${parks} Taman, ${buildings} Mall, ${factories} Pabrik)`,
                `🛣️ Jaringan Jalan & Batas: ${this.activeLines.length} jalur aktif`,
                `🎨 Zonasi DHP Aktif: ${this.activeZones.length} wilayah pertidaksamaan`,
                `🌿 Indeks Kualitas Lingkungan: ${Math.max(0, Math.min(100, 50 + parks * 15 - factories * 20))}%`,
                `🌟 Kota Anda telah terstruktur dengan koordinat matematika yang presisi!`
            ];

            this.showValidationModal({
                isComplete: true,
                score: 100,
                steps: analysisSteps,
                errors: []
            });
            return;
        }

        const mission = this.currentMission;
        if (!mission) return;

        const result = mission.validate(this.placedItems, this.activeLines);
        if (result.isComplete) {
            this.sound.playSuccess();
        } else {
            this.sound.playError();
        }

        this.showValidationModal(result);
    }

    showValidationModal(result) {
        const modal = document.getElementById('validation-modal');
        const titleEl = document.getElementById('val-title');
        const scoreEl = document.getElementById('val-score');
        const starsEl = document.getElementById('val-stars');
        const stepsEl = document.getElementById('val-steps');
        const nextBtn = document.getElementById('btn-next-mission');

        if (result.isComplete) {
            titleEl.innerHTML = `<span class="text-emerald-400">🎉 RENCANA TATA KOTA DISETUJUI!</span>`;
            starsEl.innerHTML = `⭐⭐⭐`;
            if (nextBtn) {
                nextBtn.style.display = (!this.isSandbox && this.currentMissionIndex < this.missions.length - 1) ? 'inline-flex' : 'none';
            }
        } else {
            titleEl.innerHTML = `<span class="text-rose-400">⚠️ PERLU REVISI TATA KOTA</span>`;
            const starCount = result.score >= 70 ? "⭐⭐" : result.score >= 40 ? "⭐" : "❌";
            starsEl.innerHTML = starCount;
            if (nextBtn) nextBtn.style.display = 'none';
        }

        scoreEl.innerText = `${result.score}%`;

        let html = '';
        if (result.steps && result.steps.length > 0) {
            html += `<div class="mb-3"><h4 class="text-xs font-bold text-emerald-400 mb-1">Evaluasi Aturan Terpenuhi:</h4>`;
            html += result.steps.map(s => `<div class="text-xs text-slate-200 bg-emerald-950/40 border border-emerald-800/40 p-1.5 rounded mb-1">${s}</div>`).join('');
            html += `</div>`;
        }

        if (result.errors && result.errors.length > 0) {
            html += `<div><h4 class="text-xs font-bold text-rose-400 mb-1">Pelanggaran / Kekurangan:</h4>`;
            html += result.errors.map(e => `<div class="text-xs text-slate-200 bg-rose-950/40 border border-rose-800/40 p-1.5 rounded mb-1">${e}</div>`).join('');
            html += `</div>`;
        }

        stepsEl.innerHTML = html;
        modal.classList.remove('hidden');
    }

    closeValidationModal() {
        const modal = document.getElementById('validation-modal');
        if (modal) modal.classList.add('hidden');
    }

    nextMission() {
        this.closeValidationModal();
        if (this.currentMissionIndex < this.missions.length - 1) {
            this.loadMission(this.currentMissionIndex + 1);
        }
    }

    showToast(message, type = "info") {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;

        const colors = {
            info: 'bg-blue-600 border-blue-400',
            success: 'bg-emerald-600 border-emerald-400',
            error: 'bg-rose-600 border-rose-400'
        };

        toast.className = `fixed bottom-20 right-6 z-50 px-4 py-2.5 rounded-lg text-white font-medium text-xs shadow-xl border ${colors[type] || colors.info} transition-all duration-300 transform translate-y-0 opacity-100`;
        toast.innerText = message;

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.className += ' opacity-0 translate-y-4 pointer-events-none';
        }, 3000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.cityApp = new CityPlannerApp();

    const roadForm = document.getElementById('road-form');
    if (roadForm) {
        roadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('road-equation-input');
            if (input && input.value.trim()) {
                window.cityApp.addCustomLine(input.value.trim());
                input.value = '';
            }
        });
    }
});
