// Capture Sequencer
class CaptureSequencer {
    constructor(options = {}) {
        this.photos = [];
        this.maxPhotos = options.maxPhotos || 4;
        this.currentIndex = 0;
        this.isCapturing = false;
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.flashOverlay = document.getElementById('flashOverlay');
        this.photoCounter = document.getElementById('photoCounter');
        this.miniPreviews = document.getElementById('miniPreviews');
        this.progressIndicator = document.querySelector('.progress-indicator');
        this.setupProgressDots();
    }

    setupProgressDots() {
        if (!this.progressIndicator) return;
        this.progressIndicator.innerHTML = '';
        for (let i = 0; i < this.maxPhotos; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot' + (i === 0 ? ' active' : '');
            this.progressIndicator.appendChild(dot);
            if (i < this.maxPhotos - 1) {
                const line = document.createElement('div');
                line.className = 'progress-line';
                this.progressIndicator.appendChild(line);
            }
        }
        this.progressDots = this.progressIndicator.querySelectorAll('.progress-dot');
    }

    setMaxPhotos(count) {
        if (this.isCapturing) return;
        this.maxPhotos = count;
        this.photos = [];
        if (this.miniPreviews) this.miniPreviews.innerHTML = '';
        this.setupProgressDots();
        if (this.photoCounter) {
            this.photoCounter.textContent = `PHOTO 0 / ${this.maxPhotos}`;
        }
    }

    async startCaptureSequence() {
        if (this.isCapturing) return;
        this.isCapturing = true;

        const captureBtn = document.getElementById('captureBtn');
        const countSelector = document.getElementById('countSelector');
        const flipBtn = document.getElementById('flipCameraBtn');
        if (captureBtn) captureBtn.disabled = true;
        if (flipBtn) flipBtn.disabled = true;
        if (countSelector) countSelector.classList.add('hidden');

        try {
            this.setupProgressDots();
            while (this.photos.length < this.maxPhotos) {
                this.updateProgress();
                await this.runCountdown();
                await this.capturePhoto();
                this.updateProgress();
            }
            await this.finishCapture();
        } catch (err) {
            console.error('Capture sequence error:', err);

            this._clearCountdown();

            if (this.countdownOverlay) this.countdownOverlay.classList.add('hidden');

            if (countSelector) countSelector.classList.remove('hidden');

            if (captureBtn) captureBtn.disabled = false;
            if (flipBtn) flipBtn.disabled = false;

            const counterEl = document.getElementById('photoCounter');
            if (counterEl) counterEl.textContent = `PHOTO 0 / ${this.maxPhotos}`;

            this.photos = [];

            const captureError = document.getElementById('captureError');
            if (captureError) {
                captureError.textContent = 'Terjadi error saat mengambil foto. Silakan coba lagi.';
                captureError.classList.remove('hidden');
            }

            this.isCapturing = false;
        }
    }

    _clearCountdown() {
        if (this._countdownInterval) {
            clearTimeout(this._countdownInterval);
            this._countdownInterval = null;
        }
    }

    async runCountdown() {
        this.countdownOverlay.classList.remove('hidden');
        const numberElem = document.getElementById('countdownNumber');
        for (let i = 3; i > 0; i--) {
            numberElem.textContent = i;
            await new Promise(resolve => {
                this._countdownInterval = setTimeout(() => {
                    this._countdownInterval = null;
                    resolve();
                }, 1000);
            });
        }
        this.countdownOverlay.classList.add('hidden');
    }

    async capturePhoto() {
        const video = document.getElementById('cameraVideo');
        // Ensure video metadata is available
        if (!video.videoWidth || !video.videoHeight) {
            await new Promise(resolve => {
                if (video.readyState >= 2) {
                    resolve();
                } else {
                    video.onloadedmetadata = () => resolve();
                }
            });
        }
        const canvas = document.createElement('canvas');
        // Downscale to max 1080px on the longest side (IndexedDB quota mitigation on mobile)
        const MAX_DIM = 1080;
        let drawW = video.videoWidth;
        let drawH = video.videoHeight;
        const longest = Math.max(drawW, drawH);
        if (longest > MAX_DIM) {
            const scale = MAX_DIM / longest;
            drawW = Math.round(drawW * scale);
            drawH = Math.round(drawH * scale);
        }
        canvas.width = drawW;
        canvas.height = drawH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert canvas to Blob (PNG) to avoid base64 storage
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        this.photos.push(blob);
        const previewUrl = URL.createObjectURL(blob);
        this.updateMiniPreview(previewUrl, this.photos.length - 1);

        // Trigger flash only if enabled
        const isFlashOn = !window.cameraController || window.cameraController.flashEnabled !== false;
        if (isFlashOn && this.flashOverlay) {
            this.flashOverlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 120));
            this.flashOverlay.classList.remove('active');
        }

        this.photoCounter.textContent = `PHOTO ${this.photos.length} / ${this.maxPhotos}`;
    }

    updateMiniPreview(dataUrl, index) {
        const thumb = document.createElement('div');
        thumb.className = 'mini-preview-thumb filled';
        thumb.style.backgroundImage = `url(${dataUrl})`;
        this.miniPreviews.appendChild(thumb);
    }

    updateProgress() {
        if (!this.progressDots) return;
        this.progressDots.forEach((dot, idx) => {
            if (idx < this.photos.length) {
                dot.classList.remove('active');
                dot.classList.add('completed');
            } else if (idx === this.photos.length) {
                dot.classList.add('active');
                dot.classList.remove('completed');
            } else {
                dot.classList.remove('active', 'completed');
            }
        });
    }

    async finishCapture() {
        try {
            await window.noxDB.savePhotos(this.photos);
        } catch (err) {
            const captureError = document.getElementById('captureError');
            if (captureError) {
                captureError.textContent = 'Gagal menyimpan foto ke penyimpanan lokal. Periksa ruang penyimpanan browser dan coba lagi.';
                captureError.classList.remove('hidden');
            }
            throw err;
        }
        if (window.cameraController) {
            window.cameraController.stopCamera();
        }
        window.location.href = 'editor.html';
    }
}

window.captureSequencer = new CaptureSequencer();

