// Camera Handler
class CameraController {
    constructor() {
        this.video = document.getElementById('cameraVideo');
        console.log('Camera video element:', this.video);
        this.stream = null;
        this.facingMode = 'user';
        this.flashEnabled = true;
    }

    async initCamera() {
        console.log('Initializing camera with constraints...');
        try {
            if (this.stream) {
                this.stopCamera();
            }

            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const getUserMedia = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ?
                navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) :
                function(constraints) {
                    const getImg = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                    if (!getImg) {
                        return Promise.reject(new Error('getUserMedia is not supported in this browser'));
                    }
                    return new Promise((resolve, reject) => {
                        getImg.call(navigator, constraints, resolve, reject);
                    });
                };

            this.stream = await getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.video.classList.toggle('mirrored', this.facingMode === 'user');
            console.log('Camera stream obtained');
            return true;
        } catch (err) {
            console.error('Camera access error:', err);
            throw err;
        }
    }


    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    flipCamera() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        return this.initCamera();
    }

    toggleFlash() {
        this.flashEnabled = !this.flashEnabled;
        return this.flashEnabled;
    }
}

window.cameraController = new CameraController();
