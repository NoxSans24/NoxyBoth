// Main Application Logic
function getFormattedCurrentDate() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd} • ${mm} • ${yyyy}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Migrate any legacy photos from localStorage to IndexedDB
    await window.noxDB.migrateLocalStoragePhotos();

    const mockupFooter = document.querySelector('.mockup-footer');
    if (mockupFooter) {
        mockupFooter.textContent = getFormattedCurrentDate();
    }
    // Camera page logic initialization
    const allowBtn = document.getElementById('allowCameraBtn');
    const countSelector = document.getElementById('countSelector');
    if (allowBtn) {
        const permissionState = document.getElementById('permissionState');
        const errElem = document.getElementById('permissionError');

        const requestCam = async () => {
            try {
                console.log('Requesting camera...');
                const success = await window.cameraController.initCamera();
                if (success) {
                    // Wait for video metadata to be ready before starting capture
                    const video = document.getElementById('cameraVideo');
                    await new Promise(resolve => {
                        if (video.readyState >= 2) {
                            resolve();
                        } else {
                            video.onloadedmetadata = () => resolve();
                        }
                    });

                    permissionState.classList.add('hidden');
                    if (countSelector) {
                        // Show count selector and default to 4 photos — no auto-start
                        countSelector.classList.remove('hidden');
                        const defaultBtn = countSelector.querySelector('.count-btn[data-count="4"]');
                        if (defaultBtn) defaultBtn.classList.add('active');
                        window.captureSequencer = new CaptureSequencer({ maxPhotos: 4 });
                        console.log('Camera ready — waiting for user to start capture');
                    } else {
                        window.captureSequencer = new CaptureSequencer({ maxPhotos: 4 });
                    }
                }
            } catch (err) {
                console.error('Camera error:', err);
                errElem.textContent = 'Camera permission denied or unavailable. Please check browser settings or permissions.';
                errElem.classList.remove('hidden');
            }
        };

        allowBtn.addEventListener('click', requestCam);
    }

    // Flash toggle button
    const flashToggle = document.getElementById('flashToggle');
    if (flashToggle) {
        flashToggle.addEventListener('click', () => {
            if (window.cameraController) {
                const enabled = window.cameraController.toggleFlash();
                flashToggle.classList.toggle('flash-off', !enabled);
                flashToggle.setAttribute('aria-label', enabled ? 'Disable Flash' : 'Enable Flash');
            }
        });
    }

    // Count selector buttons — parametrize the capture sequencer per selection
    if (countSelector) {
        countSelector.querySelectorAll('.count-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.captureSequencer && window.captureSequencer.isCapturing) return;
                countSelector.querySelectorAll('.count-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const count = parseInt(btn.dataset.count, 10);
                if (window.captureSequencer) {
                    window.captureSequencer.setMaxPhotos(count);
                }
            });
        });
    }

    // Capture control buttons (shutter button starts sequence)
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            if (window.captureSequencer && !window.captureSequencer.isCapturing) {
                window.captureSequencer.startCaptureSequence();
            }
        });
    }

    const flipBtn = document.getElementById('flipCameraBtn');
    if (flipBtn) {
        flipBtn.addEventListener('click', async () => {
            if (window.captureSequencer && window.captureSequencer.isCapturing) return;
            try {
                await window.cameraController.flipCamera();
            } catch (err) {
                console.error('Failed to flip camera:', err);
            }
        });
    }

        // Editor page logic initialization
        const editorCanvas = document.getElementById('editorCanvas');
        if (editorCanvas) {
            // Track object URLs for cleanup to prevent memory leaks
            let poolUrls = [];

            const renderer = new window.PhotostripRenderer(editorCanvas);
            let currentFilter = 'normal';
            let currentFrame = null;
            let currentText = 'NOXBOOTH';
            let currentDate = getFormattedCurrentDate();
            let currentFont = 'sans-serif';

            // Template/slot state
            let currentCount = 4;
            let currentTemplate = 'strip';
            let selectedPhotos = [null, null, null, null];
            let pool = [];
            let manualSlots = new Set();
            let previewTimer = null;

            // Load photos from IndexedDB into the pool
            const photoRecords = await window.noxDB.getPhotos();
            pool = photoRecords.map(rec => ({ id: rec.id, url: URL.createObjectURL(rec.blob) }));
            poolUrls = pool.map(p => p.url);
            for (let i = 0; i < currentCount; i++) {
                selectedPhotos[i] = pool[i] || null;
            }

            function enableKeyboardActivation(card) {
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        card.click();
                    }
                });
            }

            // Load frames dynamically
            const frames = await window.frameLoader.loadFrames();
            const frameGrid = document.getElementById('frameGrid');
            if (frameGrid) {
                frameGrid.innerHTML = '';
                frames.forEach((f, idx) => {
                    const card = document.createElement('div');
                    card.className = `frame-card ${idx === 0 ? 'active' : ''}`;
                    card.dataset.id = f.id;
                    card.innerHTML = `
                        <div class="frame-thumb" style="background-image: url('${f.thumb || ''}')"></div>
                        <span>${f.name}</span>
                    `;
                    enableKeyboardActivation(card);
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.frame-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        currentFrame = f;
                        updatePreview();
                    });
                    frameGrid.appendChild(card);
                });
                if (frames.length > 0) currentFrame = frames[0];
            }

            // Load filters
            const filterGrid = document.getElementById('filterGrid');
            if (filterGrid) {
                filterGrid.innerHTML = '';
                FILTERS.forEach((fil, idx) => {
                    const card = document.createElement('div');
                    card.className = `filter-card ${idx === 0 ? 'active' : ''}`;
                    card.dataset.id = fil.id;
                    card.innerHTML = `
                        <div class="filter-thumb" style="filter: ${fil.filterStr}; background-image: url('${pool[0]?.url || ''}')"></div>
                        <span>${fil.name}</span>
                    `;
                    enableKeyboardActivation(card);
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        currentFilter = fil.id;
                        updatePreview();
                    });
                    filterGrid.appendChild(card);
                });
            }

            // Template cards (strip / grid2 / grid3)
            function buildMiniVisual(style, count) {
                if (style === 'strip') {
                    return new Array(count).fill('<span></span>').join('');
                }
                const cols = style === 'grid2' ? 2 : 3;
                const rows = Math.ceil(count / cols);
                let html = '';
                for (let r = 0; r < rows; r++) {
                    html += '<div>';
                    for (let c = 0; c < cols; c++) {
                        if (r * cols + c < count) html += '<span></span>';
                    }
                    html += '</div>';
                }
                return html;
            }

            function renderTemplateCards() {
                const grid = document.getElementById('templateGrid');
                if (!grid) return;
                grid.innerHTML = '';
                const templates = [
                    { style: 'strip', label: 'Strip' },
                    { style: 'grid2', label: 'Grid 2 Kolom' },
                    { style: 'grid3', label: 'Grid 3 Kolom' }
                ];
                templates.forEach(({ style, label }) => {
                    const card = document.createElement('div');
                    card.className = 'template-card';
                    card.dataset.style = style;
                    if (style === currentTemplate) card.classList.add('active');
                    const isGrid = style !== 'strip';
                    card.innerHTML = `
                        <div class="layout-icon ${isGrid ? 'grid-mockup' : 'vertical-mockup'}" ${style === 'grid3' ? 'style="grid-template-columns: repeat(3, 1fr)"' : ''}>
                            ${buildMiniVisual(style, currentCount)}
                        </div>
                        <span>${label}</span>
                    `;
                    enableKeyboardActivation(card);
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        currentTemplate = style;
                        updatePreview();
                    });
                    grid.appendChild(card);
                });
            }

            // Slot grid
            function renderSlotGrid() {
                const grid = document.getElementById('slotGrid');
                if (!grid) return;
                grid.innerHTML = '';
                for (let i = 0; i < currentCount; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'slot-card';
                    slot.dataset.slotIndex = i;
                    const entry = selectedPhotos[i];
                    if (entry) {
                        slot.style.backgroundImage = `url('${entry.url}')`;
                        slot.classList.add('filled');
                    } else {
                        slot.innerHTML = '<span class="slot-plus">+</span>';
                    }
                    enableKeyboardActivation(slot);
                    slot.addEventListener('click', () => openPicker(i));
                    grid.appendChild(slot);
                }
            }

            // Count selector
            document.querySelectorAll('.count-btn').forEach(btn => {
                if (parseInt(btn.dataset.count, 10) === currentCount) btn.classList.add('active');
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentCount = parseInt(btn.dataset.count, 10);
                    manualSlots.clear();
                    selectedPhotos = [];
                    for (let i = 0; i < currentCount; i++) {
                        selectedPhotos[i] = pool[i] || null;
                    }
                    renderTemplateCards();
                    renderSlotGrid();
                    updateGuard();
                    updatePreview();
                });
            });

            // Text & Date input bindings
            const textInput = document.getElementById('customText');
            const dateInput = document.getElementById('customDate');
            const fontSelect = document.getElementById('fontSelect');

            if (textInput) textInput.addEventListener('input', (e) => { currentText = e.target.value; clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 200); });
            if (dateInput) {
                dateInput.value = currentDate;
                dateInput.addEventListener('input', (e) => { currentDate = e.target.value; clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 200); });
            }
            if (fontSelect) fontSelect.addEventListener('change', (e) => { currentFont = e.target.value; clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 200); });

            // Tabs switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const target = document.getElementById(`pane-${btn.dataset.tab}`);
                    if (target) target.classList.add('active');
                });
            });

            // Photo picker modal
            let pickerSlotIndex = null;
            let pickerTrigger = null;

            function openPicker(slotIndex) {
                pickerSlotIndex = slotIndex;
                pickerTrigger = document.querySelector(`.slot-card[data-slot-index="${slotIndex}"]`);
                const modal = document.getElementById('photoPickerModal');
                const grid = document.getElementById('pickerGrid');
                if (!modal || !grid) return;
                grid.innerHTML = '';
                if (pool.length === 0) {
                    const empty = document.createElement('p');
                    empty.className = 'picker-empty';
                    empty.textContent = 'Belum ada foto. Ambil di kamera atau impor dari galeri.';
                    grid.appendChild(empty);
                } else {
                    pool.forEach((entry, i) => {
                        const item = document.createElement('div');
                        item.className = 'picker-item';
                        item.dataset.url = entry.url;
                        item.dataset.index = i;
                        item.style.backgroundImage = `url('${entry.url}')`;
                        enableKeyboardActivation(item);
                        item.addEventListener('click', () => {
                            selectedPhotos[pickerSlotIndex] = pool[i];
                            manualSlots.add(pickerSlotIndex);
                            closePicker();
                            renderSlotGrid();
                            updatePreview();
                        });
                        grid.appendChild(item);
                    });
                }
                modal.classList.remove('hidden');
                modal.setAttribute('tabindex', '-1');
                modal.focus();
            }

            function closePicker() {
                const modal = document.getElementById('photoPickerModal');
                if (modal) modal.classList.add('hidden');
                pickerSlotIndex = null;
                if (pickerTrigger) {
                    pickerTrigger.focus();
                    pickerTrigger = null;
                }
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && pickerSlotIndex !== null) closePicker();
            });

            const pickerCloseBtn = document.getElementById('pickerCloseBtn');
            if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', closePicker);
            const pickerCancelBtn = document.getElementById('pickerCancelBtn');
            if (pickerCancelBtn) pickerCancelBtn.addEventListener('click', closePicker);
            const pickerModal = document.getElementById('photoPickerModal');
            if (pickerModal) {
                pickerModal.addEventListener('click', (e) => {
                    if (e.target === pickerModal) closePicker();
                });
            }

            // Show a message in the guard area, creating the element if it does not exist yet
            function showGuardMessage(text) {
                let guardMessage = document.getElementById('guardMessage');
                if (!guardMessage) {
                    guardMessage = document.createElement('p');
                    guardMessage.id = 'guardMessage';
                    const sidebar = document.querySelector('.editor-sidebar');
                    if (sidebar) {
                        sidebar.appendChild(guardMessage);
                    } else {
                        const finishBtn = document.getElementById('finishEditBtn');
                        if (finishBtn && finishBtn.parentNode) {
                            finishBtn.parentNode.insertBefore(guardMessage, finishBtn);
                        }
                    }
                }
                guardMessage.textContent = text;
                guardMessage.classList.remove('hidden');
            }

            // Gallery import
            const importPhotosBtn = document.getElementById('importPhotosBtn');
            const fileInput = document.getElementById('fileInput');
            if (importPhotosBtn && fileInput) {
                importPhotosBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    // Validate each file: MIME type OR known extension, size ≤ 15 MB, pre-decode
                    const MAX_SIZE = 15 * 1024 * 1024;
                    const KNOWN_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
                    const rejected = [];
                    const validFiles = [];

                    for (const file of files) {
                        const isImageMime = file.type.startsWith('image/');
                        const ext = (file.name.split('.').pop() || '').toLowerCase();
                        const isKnownExt = KNOWN_EXTS.includes(ext);
                        const isSizeOk = file.size <= MAX_SIZE;

                        if ((!isImageMime && !isKnownExt) || !isSizeOk) {
                            const reason = !isSizeOk && (isImageMime || isKnownExt)
                                ? 'terlalu besar'
                                : (isImageMime || isKnownExt) ? 'format tidak didukung' : 'bukan gambar';
                            rejected.push({ file: file.name, reason });
                            continue;
                        }

                        // Pre-decode: verify the browser can actually decode this image
                        try {
                            await createImageBitmap(file);
                        } catch (_) {
                            rejected.push({ file: file.name, reason: 'format tidak didukung' });
                            continue;
                        }

                        validFiles.push(file);
                    }

                    if (validFiles.length === 0) {
                        if (rejected.length > 0) {
                            const reasons = [...new Set(rejected.map(r => r.reason))];
                            showGuardMessage(`${rejected.length} file dilewati: ${reasons.join(' / ')}`);
                        }
                        fileInput.value = '';
                        return;
                    }

                    const blobs = await Promise.all(validFiles.map(file => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(new Blob([reader.result], { type: file.type || 'image/png' }));
                        reader.onerror = () => reject(reader.error);
                        reader.readAsArrayBuffer(file);
                    })));

                    try {
                        await window.noxDB.appendPhotos(blobs);
                    } catch (err) {
                        console.error('Failed to append photos:', err);
                        showGuardMessage('Gagal menyimpan foto ke penyimpanan lokal. Periksa ruang penyimpanan browser dan coba lagi.');
                        fileInput.value = '';
                        return;
                    }

                    if (rejected.length > 0) {
                        const reasons = [...new Set(rejected.map(r => r.reason))];
                        showGuardMessage(`${rejected.length} file dilewati: ${reasons.join(' / ')}`);
                    }

                    await refreshPool();
                    renderSlotGrid();
                    updateGuard();
                    updatePreview();
                    fileInput.value = '';
                });
            }

            // Refresh pool from IndexedDB, revoking old ObjectURLs
            async function refreshPool() {
                let records;
                try {
                    records = await window.noxDB.getPhotos();
                } catch (err) {
                    console.error('refreshPool: getPhotos failed:', err);
                    showGuardMessage('Gagal memuat ulang foto dari penyimpanan. Pool tetap menggunakan data sebelumnya.');
                    return;
                }
                const newPool = records.map(rec => ({ id: rec.id, url: URL.createObjectURL(rec.blob) }));
                const newIdMap = new Map(newPool.map((entry, idx) => [entry.id, idx]));
                // Revoke old pool URLs
                pool.forEach(p => { if (p && p.url) URL.revokeObjectURL(p.url); });
                // Remap selectedPhotos preserving manual assignments
                for (let i = 0; i < selectedPhotos.length; i++) {
                    if (manualSlots.has(i) && selectedPhotos[i]) {
                        const foundIdx = newIdMap.get(selectedPhotos[i].id);
                        if (foundIdx !== undefined) {
                            selectedPhotos[i] = newPool[foundIdx];
                        } else {
                            selectedPhotos[i] = null;
                        }
                    } else if (i < newPool.length) {
                        selectedPhotos[i] = newPool[i];
                    } else {
                        selectedPhotos[i] = null;
                    }
                }
                pool = newPool;
                poolUrls = pool.map(p => p.url);
            }

            // Guard clause: disable finish when pool < count or null slots exist
            function updateGuard() {
                const finishBtn = document.getElementById('finishEditBtn');
                let guardMessage = document.getElementById('guardMessage');
                const poolTooSmall = pool.length < currentCount;
                const poolHasNull = selectedPhotos.some(s => s === null);
                if (poolTooSmall || poolHasNull) {
                    if (finishBtn) finishBtn.disabled = true;
                    if (!guardMessage) {
                        guardMessage = document.createElement('p');
                        guardMessage.id = 'guardMessage';
                        const sidebar = document.querySelector('.editor-sidebar');
                        if (sidebar) {
                            sidebar.appendChild(guardMessage);
                        } else if (finishBtn && finishBtn.parentNode) {
                            finishBtn.parentNode.insertBefore(guardMessage, finishBtn);
                        }
                    }
                    let msg = '';
                    if (poolTooSmall) {
                        msg += `Foto belum cukup. Butuh ${currentCount} foto, tersedia ${pool.length}. ` +
                            `<button id="guardImportBtn">Tambah dari Galeri</button> ` +
                            `<a href="camera.html">Ambil Ulang</a>`;
                    } else if (poolHasNull) {
                        msg += 'Ada slot foto kosong. Pilih ulang foto untuk slot tersebut.';
                    }
                    guardMessage.innerHTML = msg;
                    const guardImportBtn = document.getElementById('guardImportBtn');
                    if (guardImportBtn) {
                        guardImportBtn.addEventListener('click', () => {
                            const fileInput = document.getElementById('fileInput');
                            if (fileInput) fileInput.click();
                        });
                    }
                    guardMessage.classList.remove('hidden');
                } else {
                    if (finishBtn) finishBtn.disabled = false;
                    if (guardMessage) guardMessage.classList.add('hidden');
                }
            }

            async function updatePreview() {
                const generatedConfig = generateLayouts(currentCount, currentTemplate);
                await renderer.render(selectedPhotos.map(s => s?.url ?? null), {
                    layoutConfig: generatedConfig,
                    filter: currentFilter,
                    frame: currentFrame,
                    text: currentText,
                    date: currentDate,
                    fontFamily: currentFont
                });
                const previewDim = document.getElementById('previewDim');
                if (previewDim && generatedConfig) previewDim.textContent = `${generatedConfig.width} × ${generatedConfig.height} px`;
            }

            // Initial render
            renderTemplateCards();
            renderSlotGrid();
            updateGuard();
            await updatePreview();

            // Finish Edit & Create Photostrip
            const finishBtn = document.getElementById('finishEditBtn');
            if (finishBtn) {
                finishBtn.addEventListener('click', async () => {
                    if (pool.length < currentCount || selectedPhotos.some(s => s === null)) return;
                    const modal = document.getElementById('processingModal');
                    const progressBar = document.getElementById('processingProgress');
                    const progressText = document.getElementById('processingText');
                    modal.classList.remove('hidden');

                    const steps = [
                        { text: 'Preparing photos...', progress: '20%' },
                        { text: 'Applying filter...', progress: '45%' },
                        { text: 'Adding custom frame...', progress: '70%' },
                        { text: 'Rendering final photostrip...', progress: '90%' },
                        { text: 'Done!', progress: '100%' }
                    ];

                    for (let step of steps) {
                        progressText.textContent = step.text;
                        progressBar.style.width = step.progress;
                        await new Promise(r => setTimeout(r, 400));
                    }

                    // Render final photostrip from selectedPhotos with the generated layout config
                    let finalDataUrl;
                    try {
                        finalDataUrl = await renderer.render(selectedPhotos.map(s => s?.url ?? null), {
                            layoutConfig: generateLayouts(currentCount, currentTemplate),
                            filter: currentFilter,
                            frame: currentFrame,
                            text: currentText,
                            date: currentDate,
                            fontFamily: currentFont,
                            strict: true
                        });
                    } catch (err) {
                        console.error('Final render failed:', err);
                        modal.classList.add('hidden');
                        showGuardMessage('Foto gagal diproses. Periksa format file dan coba lagi.');
                        return;
                    }
                    // Revoke all pool URLs after final render completes
                    poolUrls.forEach(url => URL.revokeObjectURL(url));
                    poolUrls = [];

                    try {
                        await window.noxDB.saveResult(finalDataUrl);
                    } catch (err) {
                        console.error('Failed to save result:', err);
                        modal.classList.add('hidden');
                        showGuardMessage('Gagal menyimpan hasil ke penyimpanan lokal. Periksa ruang penyimpanan browser dan coba lagi.');
                        return;
                    }
                    window.location.href = 'result.html';
                });
            }
        }
    });

