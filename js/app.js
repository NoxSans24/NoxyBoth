// Main Application Logic
    document.addEventListener('DOMContentLoaded', async () => {
        // Migrate any legacy photos from localStorage to IndexedDB
        await window.noxDB.migrateLocalStoragePhotos();
        // Camera page logic initialization
        const allowBtn = document.getElementById('allowCameraBtn');
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
                        // Auto start countdown when camera is ready after 1 second
                        setTimeout(() => {
                            if (window.captureSequencer && !window.captureSequencer.isCapturing) {
                                window.captureSequencer.startCaptureSequence();
                            }
                        }, 1000);
                    }
                } catch (err) {
                    console.error('Camera error:', err);
                    errElem.textContent = 'Camera permission denied or unavailable. Please check browser settings or permissions.';
                    errElem.classList.remove('hidden');
                }
            };

            allowBtn.addEventListener('click', requestCam);
        }

        // Capture control buttons
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                // Manual trigger or skip countdown if needed
            });
        }

        const flipBtn = document.getElementById('flipCameraBtn');
        if (flipBtn) {
            flipBtn.addEventListener('click', async () => {
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
            let previousObjectURLs = [];

            // Load photos from IndexedDB instead of localStorage
            const photoRecords = await window.noxDB.getPhotos();
            const photos = photoRecords.map(rec => URL.createObjectURL(rec.blob));

            if (photos.length === 0) {
                // Fallback placeholder photos if accessed directly (still using blobs)
                const placeholder = 'assets/frames/frame_pria_biru.png';
                photos.push(placeholder, placeholder, placeholder, placeholder);
            }

            const renderer = new window.PhotostripRenderer(editorCanvas);
            let currentFilter = 'normal';
            let currentFrame = null;
            let currentLayout = 'vertical';
            let currentText = 'NOXBOOTH';
            let currentDate = '15 • 09 • 2026';
            let currentFont = 'sans-serif';

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
                        <div class="frame-thumb" style="background-image: url('${f.image || ''}')"></div>
                        <span>${f.name}</span>
                    `;
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.frame-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        currentFrame = f.image ? f : null;
                        updatePreview();
                    });
                    frameGrid.appendChild(card);
                });
                if (frames.length > 0) currentFrame = frames[0].image ? frames[0] : null;
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
                        <div class="filter-thumb" style="filter: ${fil.filterStr}; background-image: url('${photos[0] || ''}')"></div>
                        <span>${fil.name}</span>
                    `;
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        currentFilter = fil.id;
                        updatePreview();
                    });
                    filterGrid.appendChild(card);
                });
            }

            // Layout selection
            document.querySelectorAll('.layout-card').forEach(card => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    currentLayout = card.dataset.layout;
                    updatePreview();
                });
            });

            // Text & Date input bindings
            const textInput = document.getElementById('customText');
            const dateInput = document.getElementById('customDate');
            const fontSelect = document.getElementById('fontSelect');

            if (textInput) textInput.addEventListener('input', (e) => { currentText = e.target.value; updatePreview(); });
            if (dateInput) dateInput.addEventListener('input', (e) => { currentDate = e.target.value; updatePreview(); });
            if (fontSelect) fontSelect.addEventListener('change', (e) => { currentFont = e.target.value; updatePreview(); });

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

            async function updatePreview() {
                const records = await window.noxDB.getPhotos();
                const urls = records.map(r => URL.createObjectURL(r.blob));
                if (urls.length === 0) {
                    const placeholder = 'assets/frames/frame_pria_biru.png';
                    urls.push(placeholder, placeholder, placeholder, placeholder);
                }
                const dataUrl = await renderer.render(urls, {
                    layout: currentLayout,
                    filter: currentFilter,
                    frame: currentFrame,
                    text: currentText,
                    date: currentDate,
                    fontFamily: currentFont
                });
                // Revoke the PREVIOUS set of URLs AFTER render completes
                previousObjectURLs.forEach(url => URL.revokeObjectURL(url));
                previousObjectURLs = urls;
                // Update frame overlay element if needed
                const frameOverlay = document.getElementById('frameOverlay');
                if (frameOverlay && currentFrame && currentFrame.image) {
                    frameOverlay.style.backgroundImage = `url(${currentFrame.image})`;
                } else if (frameOverlay) {
                    frameOverlay.style.backgroundImage = 'none';
                }
                // Store rendered preview (optional) – not persisted now
            }

            // Initial preview render
            await updatePreview();

            // Finish Edit & Create Photostrip
            const finishBtn = document.getElementById('finishEditBtn');
            if (finishBtn) {
                finishBtn.addEventListener('click', async () => {
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

                    // Use latest photos from IndexedDB for final render
                    const finalRecords = await window.noxDB.getPhotos();
                    const finalUrls = finalRecords.map(r => URL.createObjectURL(r.blob));
                    const finalDataUrl = await renderer.render(finalUrls, {
                        layout: currentLayout,
                        filter: currentFilter,
                        frame: currentFrame,
                        text: currentText,
                        date: currentDate,
                        fontFamily: currentFont
                    });
                    // Revoke all URLs after final render completes
                    previousObjectURLs.forEach(url => URL.revokeObjectURL(url));
                    finalUrls.forEach(url => URL.revokeObjectURL(url));
                    previousObjectURLs = [];

                    localStorage.setItem('noxbooth_result', finalDataUrl);
                    window.location.href = 'result.html';
                });
            }
        }
    });

