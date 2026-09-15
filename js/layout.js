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
