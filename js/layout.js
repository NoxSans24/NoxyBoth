// Layout Calculation and Configurations
const LAYOUT_CONFIGS = {
    vertical: {
        width: 600,
        height: 1800,
        photos: [
            { x: 50, y: 50, w: 500, h: 375 },
            { x: 50, y: 450, w: 500, h: 375 },
            { x: 50, y: 850, w: 500, h: 375 },
            { x: 50, y: 1250, w: 500, h: 375 }
        ],
        textPos: { x: 300, y: 1680 },
        datePos: { x: 300, y: 1730 }
    },
    grid: {
        width: 1100,
        height: 1000,
        photos: [
            { x: 40, y: 40, w: 490, h: 370 },
            { x: 570, y: 40, w: 490, h: 370 },
            { x: 40, y: 450, w: 490, h: 370 },
            { x: 570, y: 450, w: 490, h: 370 }
        ],
        textPos: { x: 550, y: 880 },
        datePos: { x: 550, y: 930 }
    },
    polaroid: {
        width: 700,
        height: 1900,
        photos: [
            { x: 75, y: 60, w: 550, h: 360 },
            { x: 75, y: 460, w: 550, h: 360 },
            { x: 75, y: 860, w: 550, h: 360 },
            { x: 75, y: 1260, w: 550, h: 360 }
        ],
        textPos: { x: 350, y: 1720 },
        datePos: { x: 350, y: 1770 }
    }
};

// generateLayouts: programmatically computes slot positions for a photo frame
// template. Supports {4,6,8,10} photos x {strip, grid2, grid3} styles.
// Returns { width, height, photos: [{x,y,w,h}], textPos: {x,y}, datePos: {x,y} }
// or null when count is not a positive integer. Unknown styles fall back to 'strip'.
// Canvas limits: width <= 1200px, height <= 3600px, gap between slots >= 10px.
function generateLayouts(count, style) {
    if (!Number.isInteger(count) || count <= 0) {
        return null;
    }

    const validStyles = ['strip', 'grid2', 'grid3'];
    if (validStyles.indexOf(style) === -1) {
        style = 'strip';
    }

    const MAX_HEIGHT = 3600;
    const TEXT_AREA = 150;

    if (style === 'strip') {
        // Vertical stack: photo width 500 centered in a 600px canvas,
        // photo height shrinks for large counts so total height stays <= 3600.
        const width = 600;
        const photoW = 500;
        const x = 50;
        const topMargin = 50;
        const gap = 10;
        const photoH = Math.min(
            375,
            Math.floor((MAX_HEIGHT - TEXT_AREA - topMargin - (count - 1) * gap) / count)
        );
        const photos = [];
        for (let i = 0; i < count; i++) {
            photos.push({ x: x, y: topMargin + i * (photoH + gap), w: photoW, h: photoH });
        }
        const height = topMargin + count * (photoH + gap) - gap + TEXT_AREA;
        return {
            width: width,
            height: height,
            photos: photos,
            textPos: { x: 300, y: height - 100 },
            datePos: { x: 300, y: height - 50 }
        };
    }

    if (style === 'grid2') {
        // 2 columns, ceil(count / 2) rows, 490x370 photos in a 1100px canvas.
        const width = 1100;
        const margin = 40;
        const gap = 20;
        const photoW = 490;
        const photoH = 370;
        const cols = 2;
        const rows = Math.ceil(count / cols);
        const photos = [];
        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            photos.push({
                x: margin + col * (photoW + gap),
                y: margin + row * (photoH + gap),
                w: photoW,
                h: photoH
            });
        }
        const contentBottom = margin + rows * (photoH + gap);
        const textPos = { x: width / 2, y: contentBottom + 40 };
        const datePos = { x: width / 2, y: contentBottom + 90 };
        return {
            width: width,
            height: contentBottom + 140,
            photos: photos,
            textPos: textPos,
            datePos: datePos
        };
    }

    // grid3: 3 columns, ceil(count / 3) rows, 360x270 photos in a 1200px canvas.
    const width = 1200;
    const margin = 40;
    const gap = 20;
    const photoW = 360;
    const photoH = 270;
    const cols = 3;
    const rows = Math.ceil(count / cols);
    const photos = [];
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        photos.push({
            x: margin + col * (photoW + gap),
            y: margin + row * (photoH + gap),
            w: photoW,
            h: photoH
        });
    }
    const contentBottom = margin + rows * (photoH + gap);
    const textPos = { x: width / 2, y: contentBottom + 40 };
    const datePos = { x: width / 2, y: contentBottom + 90 };
    return {
        width: width,
        height: contentBottom + 140,
        photos: photos,
        textPos: textPos,
        datePos: datePos
    };
}

if (typeof window !== 'undefined') {
    window.generateLayouts = generateLayouts;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateLayouts, LAYOUT_CONFIGS };
}
