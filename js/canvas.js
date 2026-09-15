// Canvas Photostrip Generator
class PhotostripRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    async render(photos, options) {
        const {
            layout = 'vertical',
            filter = 'normal',
            frame = null,
            text = 'NOXBOOTH',
            date = '15 • 09 • 2026',
            fontFamily = 'sans-serif'
        } = options;

        const config = LAYOUT_CONFIGS[layout] || LAYOUT_CONFIGS.vertical;
        this.canvas.width = config.width;
        this.canvas.height = config.height;

        // 1. Render Background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Render Photos with Filter
        for (let i = 0; i < photos.length; i++) {
            if (i >= config.photos.length) break;
            const pos = config.photos[i];
            const img = await this.loadImage(photos[i]);

            this.ctx.save();
            applyFilterToContext(this.ctx, filter);

            // Draw image covering slot
            this.drawImageCover(this.ctx, img, pos.x, pos.y, pos.w, pos.h);
            this.ctx.restore();
        }

        // 3. Render Selected Custom Frame (Overlay)
        if (frame && frame.image) {
            try {
                const frameImg = await this.loadImage(frame.image);
                this.ctx.drawImage(frameImg, 0, 0, this.canvas.width, this.canvas.height);
            } catch (e) {
                console.warn('Frame image could not be loaded:', e);
            }
        }

        // 4. Render Text & Date
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';

        // Title/Caption
        this.ctx.font = `bold 28px ${fontFamily}`;
        try { this.ctx.letterSpacing = '2px'; } catch(e) { /* not supported */ }
        this.ctx.fillText(text.toUpperCase(), config.textPos.x, config.textPos.y);

        // Date
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = `18px ${fontFamily}`;
        try { this.ctx.letterSpacing = '1px'; } catch(e) { /* not supported */ }
        this.ctx.fillText(date, config.datePos.x, config.datePos.y);
        this.ctx.restore();

        return this.canvas.toDataURL('image/png');
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
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
}

window.PhotostripRenderer = PhotostripRenderer;
