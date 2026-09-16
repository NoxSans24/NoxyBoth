// Dynamic Frame Loader & Frame Engine System
// Provides responsive vector-rendered photobooth frames that adapt
// to any photo count (4, 6, 8, 10) and layout (strip, grid2, grid3).
// Guarantees zero CORS failures and zero canvas tainting on file:/// and http://.

const FRAME_DEFINITIONS = [
    {
        id: "frame-none",
        name: "No Frame",
        theme: "clean",
        background: "#0f172a",
        textColor: "#ffffff",
        dateColor: "#94a3b8",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%230f172a' rx='6'/><rect x='15' y='12' width='40' height='26' rx='3' fill='%231e293b' stroke='%23334155' stroke-width='1.5'/><rect x='65' y='12' width='40' height='26' rx='3' fill='%231e293b' stroke='%23334155' stroke-width='1.5'/><rect x='15' y='44' width='40' height='24' rx='3' fill='%231e293b' stroke='%23334155' stroke-width='1.5'/><rect x='65' y='44' width='40' height='24' rx='3' fill='%231e293b' stroke='%23334155' stroke-width='1.5'/></svg>",
        draw: (ctx, config, canvas) => {
            // Clean subtle photo slot outlines
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 2;
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 8);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    {
        id: "frame-01",
        name: "Cyber Glow",
        theme: "cyber",
        background: "#080c16",
        textColor: "#00f0ff",
        dateColor: "#38bdf8",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%23080c16' rx='6'/><rect x='6' y='6' width='108' height='68' rx='4' fill='none' stroke='%2300f0ff' stroke-width='2'/><path d='M12 18 L12 12 L18 12 M102 12 L108 12 L108 18 M12 62 L12 68 L18 68 M102 68 L108 68 L108 62' stroke='%2338bdf8' stroke-width='2.5' fill='none'/><rect x='20' y='18' width='36' height='22' rx='2' fill='%230e1e38' stroke='%2300f0ff' stroke-width='1'/><rect x='64' y='18' width='36' height='22' rx='2' fill='%230e1e38' stroke='%2300f0ff' stroke-width='1'/><text x='60' y='60' font-size='7' font-family='monospace' fill='%2300f0ff' text-anchor='middle' font-weight='bold'>[ CYBER // 60FPS ]</text></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. Glowing outer border
            const inset = 16;
            ctx.strokeStyle = "#00f0ff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 14;
            drawRoundedRect(ctx, inset, inset, w - inset * 2, h - inset * 2, 6);
            ctx.stroke();

            // 2. Corner tech brackets on canvas outer frame
            ctx.shadowBlur = 18;
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 4;
            const bLen = Math.min(40, w * 0.08);
            // Top-left
            ctx.beginPath();
            ctx.moveTo(inset, inset + bLen);
            ctx.lineTo(inset, inset);
            ctx.lineTo(inset + bLen, inset);
            ctx.stroke();
            // Top-right
            ctx.beginPath();
            ctx.moveTo(w - inset - bLen, inset);
            ctx.lineTo(w - inset, inset);
            ctx.lineTo(w - inset, inset + bLen);
            ctx.stroke();
            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(inset, h - inset - bLen);
            ctx.lineTo(inset, h - inset);
            ctx.lineTo(inset + bLen, h - inset);
            ctx.stroke();
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(w - inset - bLen, h - inset);
            ctx.lineTo(w - inset, h - inset);
            ctx.lineTo(w - inset, h - inset - bLen);
            ctx.stroke();

            // 3. Slot corner brackets & neon outlines
            ctx.shadowBlur = 8;
            ctx.lineWidth = 2;
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 8);
                ctx.stroke();

                // Tech brackets at 4 corners of each photo slot
                ctx.strokeStyle = "#00f0ff";
                const cSize = 14;
                // TL
                ctx.beginPath(); ctx.moveTo(p.x, p.y + cSize); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x + cSize, p.y); ctx.stroke();
                // TR
                ctx.beginPath(); ctx.moveTo(p.x + p.w - cSize, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w, p.y + cSize); ctx.stroke();
                // BL
                ctx.beginPath(); ctx.moveTo(p.x, p.y + p.h - cSize); ctx.lineTo(p.x, p.y + p.h); ctx.lineTo(p.x + cSize, p.y + p.h); ctx.stroke();
                // BR
                ctx.beginPath(); ctx.moveTo(p.x + p.w - cSize, p.y + p.h); ctx.lineTo(p.x + p.w, p.y + p.h); ctx.lineTo(p.x + p.w, p.y + p.h - cSize); ctx.stroke();
            }

            // 4. Subtle Cyber Header & Footer Watermarks
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(0, 240, 255, 0.75)";
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText("[ NOX // CYBERBOOTH ]", w / 2, Math.max(34, inset + 18));

            ctx.restore();
        }
    },
    {
        id: "frame-02",
        name: "Neon Gradient",
        theme: "gradient",
        background: "#0a0a14",
        textColor: "#f472b6",
        dateColor: "#c084fc",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><defs><linearGradient id='g1' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23ec4899'/><stop offset='50%25' stop-color='%238b5cf6'/><stop offset='100%25' stop-color='%2306b6d4'/></linearGradient></defs><rect width='120' height='80' fill='%230a0a14' rx='6'/><rect x='8' y='8' width='104' height='64' rx='6' fill='none' stroke='url(%23g1)' stroke-width='3'/><rect x='20' y='18' width='36' height='22' rx='3' fill='%231f132e' stroke='url(%23g1)' stroke-width='1.5'/><rect x='64' y='18' width='36' height='22' rx='3' fill='%231f132e' stroke='url(%23g1)' stroke-width='1.5'/><polygon points='16,14 17,17 20,18 17,19 16,22 15,19 12,18 15,17' fill='%23f472b6'/><polygon points='104,66 105,69 108,70 105,71 104,74 103,71 100,70 103,69' fill='%2306b6d4'/></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // Gradient stroke
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, "#ec4899");
            grad.addColorStop(0.5, "#8b5cf6");
            grad.addColorStop(1, "#06b6d4");

            // 1. Outer gradient border
            const inset = 18;
            ctx.strokeStyle = grad;
            ctx.lineWidth = 5;
            ctx.shadowColor = "#ec4899";
            ctx.shadowBlur = 16;
            drawRoundedRect(ctx, inset, inset, w - inset * 2, h - inset * 2, 12);
            ctx.stroke();

            // 2. Photo slot gradient borders
            ctx.shadowBlur = 10;
            ctx.lineWidth = 3;
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 8);
                ctx.stroke();
            }

            // 3. Star sparkle accents
            drawSparkleStar(ctx, inset + 20, inset + 20, 10, "#f472b6");
            drawSparkleStar(ctx, w - inset - 20, inset + 20, 10, "#06b6d4");
            drawSparkleStar(ctx, inset + 20, h - inset - 20, 10, "#a855f7");
            drawSparkleStar(ctx, w - inset - 20, h - inset - 20, 10, "#f43f5e");

            ctx.restore();
        }
    },
    {
        id: "frame-03",
        name: "Minimalist White",
        theme: "white",
        background: "#f8fafc",
        textColor: "#0f172a",
        dateColor: "#64748b",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%23f8fafc' rx='6'/><rect x='8' y='8' width='104' height='64' rx='4' fill='none' stroke='%23cbd5e1' stroke-width='1.5'/><rect x='20' y='16' width='36' height='24' rx='2' fill='%23e2e8f0' stroke='%2394a3b8' stroke-width='1'/><rect x='64' y='16' width='36' height='24' rx='2' fill='%23e2e8f0' stroke='%2394a3b8' stroke-width='1'/><line x1='35' y1='58' x2='85' y2='58' stroke='%230f172a' stroke-width='1.5'/><circle cx='60' cy='58' r='3' fill='%230f172a'/></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. Double minimalist outer frame
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, 20, 20, w - 40, h - 40, 8);
            ctx.stroke();

            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, 28, 28, w - 56, h - 56, 6);
            ctx.stroke();

            // 2. Photo slot frames with clean borders
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                // Subtle dark border around each photo
                ctx.strokeStyle = "#334155";
                ctx.lineWidth = 2;
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 8);
                ctx.stroke();
            }

            // 3. Minimalist studio divider above caption
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1;
            const divY = config.textPos.y - 35;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 80, divY);
            ctx.lineTo(w / 2 + 80, divY);
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(w / 2, divY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        id: "frame-04",
        name: "Retro Wave",
        theme: "retrowave",
        background: "#0f0728",
        textColor: "#ff007f",
        dateColor: "#ffb703",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%230f0728' rx='6'/><rect x='8' y='8' width='104' height='64' rx='4' fill='none' stroke='%23ff007f' stroke-width='2'/><rect x='12' y='12' width='96' height='56' rx='3' fill='none' stroke='%23ffb703' stroke-width='1'/><rect x='22' y='18' width='34' height='22' rx='2' fill='%2324103f' stroke='%23ff007f' stroke-width='1.5'/><rect x='64' y='18' width='34' height='22' rx='2' fill='%2324103f' stroke='%23ff007f' stroke-width='1.5'/><line x1='20' y1='56' x2='100' y2='56' stroke='%23ff007f' stroke-width='1'/><line x1='25' y1='62' x2='95' y2='62' stroke='%23ffb703' stroke-width='1'/></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. Dual retro stripes outer border
            // Pink stripe
            ctx.strokeStyle = "#ff007f";
            ctx.lineWidth = 4;
            ctx.shadowColor = "#ff007f";
            ctx.shadowBlur = 12;
            drawRoundedRect(ctx, 16, 16, w - 32, h - 32, 10);
            ctx.stroke();

            // Gold inner stripe
            ctx.strokeStyle = "#ffb703";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#ffb703";
            ctx.shadowBlur = 8;
            drawRoundedRect(ctx, 24, 24, w - 48, h - 48, 8);
            ctx.stroke();

            // 2. Photo slot retro frames
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                ctx.strokeStyle = "#ff007f";
                ctx.lineWidth = 3;
                ctx.shadowColor = "#ff007f";
                ctx.shadowBlur = 8;
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 6);
                ctx.stroke();

                // Gold corner accent marks
                ctx.strokeStyle = "#ffb703";
                ctx.lineWidth = 2;
                const cs = 10;
                ctx.strokeRect(p.x - 2, p.y - 2, cs, cs);
                ctx.strokeRect(p.x + p.w - cs + 2, p.y + p.h - cs + 2, cs, cs);
            }

            // 3. Synthwave grid accent lines above text
            ctx.shadowBlur = 0;
            const gridY = config.textPos.y - 45;
            ctx.strokeStyle = "rgba(255, 0, 127, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 120, gridY);
            ctx.lineTo(w / 2 + 120, gridY);
            ctx.stroke();

            ctx.strokeStyle = "rgba(255, 183, 3, 0.6)";
            ctx.beginPath();
            ctx.moveTo(w / 2 - 80, gridY + 6);
            ctx.lineTo(w / 2 + 80, gridY + 6);
            ctx.stroke();

            ctx.restore();
        }
    },
    {
        id: "frame-05",
        name: "Elegant Navy-Gold",
        theme: "gold",
        background: "#070d1e",
        textColor: "#fef08a",
        dateColor: "#d4af37",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%23070d1e' rx='6'/><rect x='8' y='8' width='104' height='64' rx='3' fill='none' stroke='%23d4af37' stroke-width='2'/><rect x='13' y='13' width='94' height='54' rx='2' fill='none' stroke='%23fef08a' stroke-width='1'/><polygon points='11,11 15,7 19,11 15,15' fill='%23d4af37'/><polygon points='109,11 105,7 101,11 105,15' fill='%23d4af37'/><polygon points='11,69 15,65 19,69 15,73' fill='%23d4af37'/><polygon points='109,69 105,65 101,69 105,73' fill='%23d4af37'/><rect x='22' y='18' width='34' height='22' rx='2' fill='%23131c38' stroke='%23d4af37' stroke-width='1'/><rect x='64' y='18' width='34' height='22' rx='2' fill='%23131c38' stroke='%23d4af37' stroke-width='1'/></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // Gold gradient
            const goldGrad = ctx.createLinearGradient(0, 0, w, h);
            goldGrad.addColorStop(0, "#d4af37");
            goldGrad.addColorStop(0.3, "#fef08a");
            goldGrad.addColorStop(0.7, "#b8860b");
            goldGrad.addColorStop(1, "#fef08a");

            // 1. Double Gold Frame
            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = "rgba(212, 175, 55, 0.4)";
            ctx.shadowBlur = 10;
            drawRoundedRect(ctx, 18, 18, w - 36, h - 36, 4);
            ctx.stroke();

            ctx.lineWidth = 1.5;
            drawRoundedRect(ctx, 26, 26, w - 52, h - 52, 2);
            ctx.stroke();

            // 2. Art Deco Corner Diamonds
            const dSize = 9;
            drawDiamond(ctx, 18, 18, dSize, "#fef08a");
            drawDiamond(ctx, w - 18, 18, dSize, "#fef08a");
            drawDiamond(ctx, 18, h - 18, dSize, "#fef08a");
            drawDiamond(ctx, w - 18, h - 18, dSize, "#fef08a");

            // 3. Photo slot gold frames
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                ctx.strokeStyle = goldGrad;
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 6;
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 6);
                ctx.stroke();
            }

            // 4. Deco Divider above caption
            ctx.shadowBlur = 0;
            const divY = config.textPos.y - 35;
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 90, divY);
            ctx.lineTo(w / 2 - 15, divY);
            ctx.moveTo(w / 2 + 15, divY);
            ctx.lineTo(w / 2 + 90, divY);
            ctx.stroke();

            drawDiamond(ctx, w / 2, divY, 6, "#fef08a");

            ctx.restore();
        }
    },
    {
        id: "frame-06",
        name: "Vintage Film 35mm",
        theme: "film",
        background: "#0b0b0e",
        textColor: "#f8fafc",
        dateColor: "#f59e0b",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%230b0b0e' rx='6'/><rect x='4' y='6' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='4' y='20' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='4' y='34' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='4' y='48' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='4' y='62' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='110' y='6' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='110' y='20' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='110' y='34' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='110' y='48' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='110' y='62' width='6' height='9' rx='1.5' fill='%23e2e8f0'/><rect x='20' y='14' width='36' height='26' rx='2' fill='%231c1c24' stroke='%23475569' stroke-width='1'/><rect x='64' y='14' width='36' height='26' rx='2' fill='%231c1c24' stroke='%23475569' stroke-width='1'/><text x='60' y='60' font-size='6' font-family='monospace' fill='%23f59e0b' text-anchor='middle'>NOX PAN 400</text></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. Film Sprocket Perforations along left & right borders
            const spWidth = 14;
            const spHeight = 22;
            const spGap = 16;
            const step = spHeight + spGap;
            const count = Math.floor(h / step);
            const startY = (h - (count * step - spGap)) / 2;

            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4;

            for (let i = 0; i < count; i++) {
                const py = startY + i * step;
                // Left perforation
                drawRoundedRect(ctx, 12, py, spWidth, spHeight, 3);
                ctx.fill();
                // Right perforation
                drawRoundedRect(ctx, w - 12 - spWidth, py, spWidth, spHeight, 3);
                ctx.fill();
            }

            // 2. Analog Film Markings
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#f59e0b"; // Kodak amber/orange text
            ctx.font = "bold 13px monospace";

            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                // Frame number stamp
                const frameNum = String(i + 1).padStart(2, "0");
                ctx.fillText(`• ${frameNum}A •`, p.x, p.y - 10);

                // Slot border (authentic film window)
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 2;
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 4);
                ctx.stroke();
            }

            // Top and bottom stock branding
            ctx.font = "bold 14px monospace";
            ctx.fillStyle = "#f59e0b";
            ctx.textAlign = "center";
            ctx.fillText("▶ NOX PAN 400 SAFETY FILM ◀", w / 2, 34);

            ctx.restore();
        }
    },
    {
        id: "frame-07",
        name: "Pastel Romance",
        theme: "pastel",
        background: "#fdf2f8",
        textColor: "#be185d",
        dateColor: "#9333ea",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%23fdf2f8' rx='6'/><rect x='8' y='8' width='104' height='64' rx='8' fill='none' stroke='%23f472b6' stroke-width='2.5'/><rect x='20' y='18' width='36' height='22' rx='4' fill='%23fce7f3' stroke='%23c084fc' stroke-width='1.5'/><rect x='64' y='18' width='36' height='22' rx='4' fill='%23fce7f3' stroke='%23c084fc' stroke-width='1.5'/><text x='16' y='22' font-size='10' fill='%23f43f5e'>♥</text><text x='104' y='22' font-size='10' fill='%23f43f5e'>♥</text><text x='16' y='68' font-size='10' fill='%23f43f5e'>♥</text><text x='104' y='68' font-size='10' fill='%23f43f5e'>♥</text></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. Soft pastel pink & lavender outer borders
            ctx.strokeStyle = "#f472b6";
            ctx.lineWidth = 4;
            drawRoundedRect(ctx, 18, 18, w - 36, h - 36, 16);
            ctx.stroke();

            ctx.strokeStyle = "#c084fc";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            drawRoundedRect(ctx, 26, 26, w - 52, h - 52, 12);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Cute corner hearts
            ctx.fillStyle = "#f43f5e";
            ctx.font = "18px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("♥", 36, 36);
            ctx.fillText("♥", w - 36, 36);
            ctx.fillText("♥", 36, h - 36);
            ctx.fillText("♥", w - 36, h - 36);

            // 3. Photo slot rounded pastel frames
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                ctx.strokeStyle = "#f472b6";
                ctx.lineWidth = 2.5;
                drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 10);
                ctx.stroke();
            }

            ctx.restore();
        }
    },
    {
        id: "frame-08",
        name: "Futuristic HUD",
        theme: "hud",
        background: "#09121d",
        textColor: "#10b981",
        dateColor: "#34d399",
        thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' fill='%2309121d' rx='6'/><rect x='8' y='8' width='104' height='64' rx='3' fill='none' stroke='%2310b981' stroke-width='2'/><path d='M16 8 L8 16 M104 8 L112 16 M8 64 L16 72 M104 72 L112 64' stroke='%2334d399' stroke-width='2.5'/><rect x='20' y='18' width='36' height='22' rx='2' fill='%230e2333' stroke='%2310b981' stroke-width='1'/><rect x='64' y='18' width='36' height='22' rx='2' fill='%230e2333' stroke='%2310b981' stroke-width='1'/><text x='60' y='60' font-size='6' font-family='monospace' fill='%2310b981' text-anchor='middle'>[ SYS.HUD // 4K ]</text></svg>",
        draw: (ctx, config, canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();

            // 1. High-tech tactical HUD border
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#10b981";
            ctx.shadowBlur = 10;
            drawRoundedRect(ctx, 16, 16, w - 32, h - 32, 4);
            ctx.stroke();

            // 2. Corner chamfer lines
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 4;
            const ch = 20;
            ctx.beginPath();
            ctx.moveTo(16, 16 + ch); ctx.lineTo(16 + ch, 16);
            ctx.moveTo(w - 16 - ch, 16); ctx.lineTo(w - 16, 16 + ch);
            ctx.moveTo(16, h - 16 - ch); ctx.lineTo(16 + ch, h - 16);
            ctx.moveTo(w - 16 - ch, h - 16); ctx.lineTo(w - 16, h - 16 - ch);
            ctx.stroke();

            // 3. Photo slot HUD brackets
            for (let i = 0; i < config.photos.length; i++) {
                const p = config.photos[i];
                ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(p.x, p.y, p.w, p.h);

                // HUD crosshair ticks
                ctx.strokeStyle = "#10b981";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x + p.w / 2 - 8, p.y); ctx.lineTo(p.x + p.w / 2 + 8, p.y);
                ctx.moveTo(p.x + p.w / 2 - 8, p.y + p.h); ctx.lineTo(p.x + p.w / 2 + 8, p.y + p.h);
                ctx.moveTo(p.x, p.y + p.h / 2 - 8); ctx.lineTo(p.x, p.y + p.h / 2 + 8);
                ctx.moveTo(p.x + p.w, p.y + p.h / 2 - 8); ctx.lineTo(p.x + p.w, p.y + p.h / 2 + 8);
                ctx.stroke();
            }

            // 4. Header telemetry readouts
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "left";
            ctx.fillText("[REC // UHD 4K]", 28, 38);
            ctx.textAlign = "right";
            ctx.fillText("[ISO 200 // 60FPS]", w - 28, 38);

            ctx.restore();
        }
    }
];

// Helper drawing utilities
function drawRoundedRect(ctx, x, y, w, h, r) {
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

function drawSparkleStar(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawDiamond(ctx, cx, cy, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx + radius, cy);
    ctx.lineTo(cx, cy + radius);
    ctx.lineTo(cx - radius, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

class FrameLoader {
    constructor() {
        this.frames = FRAME_DEFINITIONS;
    }

    async loadFrames() {
        // Returns the rich dynamic frame list
        // Guaranteed to work in both file:// and http:// environments without CORS errors
        return this.frames;
    }
}

window.frameLoader = new FrameLoader();
window.FRAME_DEFINITIONS = FRAME_DEFINITIONS;

