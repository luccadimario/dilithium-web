// Starfield Background — 400 parallax stars drifting toward the viewer.
// Matches dilithiumcoin.com's StarfieldBackground component exactly.

const STAR_COUNT = 400;
const SPEED = 0.1;
const BG_COLOR = '#030712';

export class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._initStars();
        this._loop();
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.ctx.scale(dpr, dpr);
        this.cx = this.w / 2;
        this.cy = this.h / 2;
        // Full clear on resize
        this.ctx.fillStyle = BG_COLOR;
        this.ctx.fillRect(0, 0, this.w, this.h);
    }

    _initStars() {
        for (let i = 0; i < STAR_COUNT; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * this.w * 2,
                y: (Math.random() - 0.5) * this.h * 2,
                z: Math.random() * 1000,
                size: Math.random() * 1.5 + 0.5,
                prevX: 0,
                prevY: 0,
            });
        }
    }

    _loop() {
        const ctx = this.ctx;
        // Semi-transparent clear for trail effect
        ctx.fillStyle = 'rgba(3, 7, 18, 0.15)';
        ctx.fillRect(0, 0, this.w, this.h);

        for (const star of this.stars) {
            // Save previous position for trail
            const pz = star.z;
            const px = (star.x / pz) * 500 + this.cx;
            const py = (star.y / pz) * 500 + this.cy;
            star.prevX = px;
            star.prevY = py;

            // Move star toward viewer
            star.z -= SPEED;

            if (star.z <= 0) {
                star.x = (Math.random() - 0.5) * this.w * 2;
                star.y = (Math.random() - 0.5) * this.h * 2;
                star.z = 1000;
                star.prevX = (star.x / star.z) * 500 + this.cx;
                star.prevY = (star.y / star.z) * 500 + this.cy;
            }

            // Project to screen
            const sx = (star.x / star.z) * 500 + this.cx;
            const sy = (star.y / star.z) * 500 + this.cy;

            // Depth factor (0 = far, 1 = close)
            const depth = 1 - star.z / 1000;
            const alpha = Math.min(0.25, depth * 0.4);
            const size = star.size * depth * 1.2;

            // Blue-tinted star color
            const r = 180 + depth * 40;
            const g = 200 + depth * 30;
            const b = 200 + depth * 55;

            // Trail line
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`;
            ctx.lineWidth = size * 0.5;
            ctx.beginPath();
            ctx.moveTo(star.prevX, star.prevY);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Star dot
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(() => this._loop());
    }
}
