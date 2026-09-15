// Dynamic Frame Loader System
class FrameLoader {
    constructor() {
        this.frames = [];
    }

    async loadFrames() {
        try {
            const res = await fetch('assets/frames/frames.json');
            if (!res.ok) throw new Error('Failed to load frames manifest');
            this.frames = await res.json();
        } catch (err) {
            console.warn('Using fallback frames config:', err);
            // Fallback config if fetch fails (e.g. running directly via file://)
            this.frames = [
                { id: "frame-none", name: "No Frame", image: "" },
                { id: "frame-01", name: "Cyber Glow", image: "assets/frames/frame_pria_biru.png" },
                { id: "frame-02", name: "Neon Gradient", image: "assets/frames/frame_pria_hitam.png" },
                { id: "frame-03", name: "Minimalist White", image: "assets/frames/frame_wanita_pink.png" },
                { id: "frame-04", name: "Retro Wave", image: "assets/frames/frame_wanita_ungu.png" }
            ];
        }
        return this.frames;
    }

    getFrameById(id) {
        return this.frames.find(f => f.id === id) || null;
    }
}

window.frameLoader = new FrameLoader();
