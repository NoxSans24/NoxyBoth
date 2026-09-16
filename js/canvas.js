function getDefaultDateString() {
    if (typeof getFormattedCurrentDate === 'function') {
        return getFormattedCurrentDate();
    }
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd} • ${mm} • ${yyyy}`;
}

// Canvas Photostrip Generator
class PhotostripRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    async render(photos, options = {}) {
        try {
            const {
                layout = 'vertical',
                filter = 'normal',
                frame = null,
                text = 'NOXBOOTH',
                date = getDefaultDateString(),
                fontFamily = 'sans-serif',
                layoutConfig = null
            } = options;

            const strict = options.strict === true;

            const config = layoutConfig || (typeof LAYOUT_CONFIGS !== 'undefined' ? (LAYOUT_CONFIGS[layout] || LAYOUT_CONFIGS.vertical) : null);
            if (!config) {
                console.error('No layout configuration found');
                return this.canvas.toDataURL('image/png');
            }

            this.canvas.width = config.width;
            this.canvas.height = config.height;

            // 1. Render Frame Background (Default dark navy or custom theme background)
            const bgColor = (frame && frame.background) ? frame.background : '#0f172a';
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 2. Render Photos with Filter
            for (let i = 0; i < config.photos.length; i++) {
                const pos = config.photos[i];
                if (photos[i]) {
                    const img = await this.loadImage(photos[i]);

                    this.ctx.save();
                    if (typeof applyFilterToContext === 'function') {
                        applyFilterToContext(this.ctx, filter);
                    }

                    // Draw image covering slot
                    this.drawImageCover(this.ctx, img, pos.x, pos.y, pos.w, pos.h);
                    this.ctx.restore();
                } else {
                    // Empty slot placeholder
                    this.ctx.save();
                    const emptySlotBg = (bgColor === '#f8fafc' || bgColor === '#fdf2f8') ? '#e2e8f0' : '#1e293b';
                    const emptySlotBorder = (bgColor === '#f8fafc' || bgColor === '#fdf2f8') ? '#cbd5e1' : '#334155';
                    const plusColor = (bgColor === '#f8fafc' || bgColor === '#fdf2f8') ? '#94a3b8' : '#64748b';

                    this.ctx.fillStyle = emptySlotBg;
                    this.ctx.strokeStyle = emptySlotBorder;
                    this.ctx.lineWidth = 1.5;
                    this.roundRect(this.ctx, pos.x, pos.y, pos.w, pos.h, 8);
                    this.ctx.fill();
                    this.ctx.stroke();

                    this.ctx.fillStyle = plusColor;
                    this.ctx.font = 'bold 28px sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('+', pos.x + pos.w / 2, pos.y + pos.h / 2);
                    this.ctx.restore();
                }
            }

            // 3. Render Custom Frame Overlays & Vector Accents
            if (frame) {
                if (typeof frame.draw === 'function') {
                    // Modern vector frame renderer (adapts dynamically to strip, grid2, grid3)
                    frame.draw(this.ctx, config, this.canvas, { text, date, fontFamily });
                }
            }

            // 4. Render Text & Date with Theme-Adaptive Colors
            this.ctx.save();
            this.ctx.textAlign = 'center';

            // Adaptive colors based on active frame
            const textColor = (frame && frame.textColor) ? frame.textColor : '#ffffff';
            const dateColor = (frame && frame.dateColor) ? frame.dateColor : '#94a3b8';

            // Title / Caption
            this.ctx.fillStyle = textColor;
            this.ctx.font = `bold 28px ${fontFamily}`;
            try { this.ctx.letterSpacing = '2px'; } catch(e) { /* fallback */ }
            this.ctx.fillText(text.toUpperCase(), config.textPos.x, config.textPos.y);

            // Date
            this.ctx.fillStyle = dateColor;
            this.ctx.font = `18px ${fontFamily}`;
            try { this.ctx.letterSpacing = '1px'; } catch(e) { /* fallback */ }
            this.ctx.fillText(date, config.datePos.x, config.datePos.y);
            this.ctx.restore();

            return this.canvas.toDataURL('image/png');
        } catch (e) {
            console.error('Render error:', e);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (strict) throw e;
            return this.canvas.toDataURL('image/png');
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            if (src instanceof HTMLImageElement) {
                if (src.complete) return resolve(src);
                src.onload = () => resolve(src);
                src.onerror = (e) => reject(e);
                return;
            }
            const img = new Image();
            // Only set crossOrigin for remote HTTP/HTTPS resources to prevent file:/// CORS failures
            if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
                img.crossOrigin = 'anonymous';
            }
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }

    drawImageCover(ctx, img, x, y, w, h) {
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
        } else {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
        }

        // Save and clip rounded corners
        ctx.save();
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

window.PhotostripRenderer = PhotostripRenderer;
