// Capture Sequencer
class CaptureSequencer {
    constructor() {
        this.photos = [];
        this.maxPhotos = 4;
        this.currentIndex = 0;
        this.isCapturing = false;
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.flashOverlay = document.getElementById('flashOverlay');
        this.photoCounter = document.getElementById('photoCounter');
        this.miniPreviews = document.getElementById('miniPreviews');
        this.progressDots = document.querySelectorAll('.progress-dot');
    }

    async startCaptureSequence() {
        if (this.isCapturing) return;
        this.isCapturing = true;
        while (this.photos.length < this.maxPhotos) {
            await this.runCountdown();
            await this.capturePhoto();
            this.updateProgress();
        }
        this.finishCapture();
    }

    async runCountdown() {
        this.countdownOverlay.classList.remove('hidden');
        const numberElem = document.getElementById('countdownNumber');
        for (let i = 3; i > 0; i--) {
            numberElem.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert canvas to Blob (PNG) to avoid base64 storage
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        this.photos.push(blob);
        const previewUrl = URL.createObjectURL(blob);
        this.updateMiniPreview(previewUrl, this.photos.length - 1);
        this.flashOverlay.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 120));
        this.flashOverlay.classList.remove('active');
        this.photoCounter.textContent = `PHOTO ${this.photos.length} / ${this.maxPhotos}`;
    }

    updateMiniPreview(dataUrl, index) {
        const thumb = document.createElement('div');
        thumb.className = 'mini-preview-thumb filled';
        thumb.style.backgroundImage = `url(${dataUrl})`;
        this.miniPreviews.appendChild(thumb);
    }

    updateProgress() {
        this.progressDots.forEach((dot, idx) => {
            if (idx < this.photos.length) {
                dot.classList.add('completed');
            }
            if (idx === this.photos.length) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    async finishCapture() {
        await window.noxDB.savePhotos(this.photos);
        if (window.cameraController) {
            window.cameraController.stopCamera();
        }
        window.location.href = 'editor.html';
    }
}

window.captureSequencer = new CaptureSequencer();
