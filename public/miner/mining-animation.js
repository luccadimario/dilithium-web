// Mining Animation — DLT crystal emblem shooting lasers at asteroids.
// The crystal pulses and fires beams when mining is active.
// Asteroids drift in from edges, shatter into particles when hit.

const CRYSTAL = {
    // 3-face diamond shape (matches favicon.svg)
    color1: '#00bfef',  // top facet
    color2: '#0891b2',  // bottom-left facet
    color3: '#067a8f',  // bottom-right facet
};

export class MiningAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mining = false;
        this.asteroids = [];
        this.lasers = [];
        this.particles = [];
        this.crystalGlow = 0;
        this.crystalAngle = 0;
        this.frame = 0;
        this.hashrate = 0;
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._spawnInitialAsteroids();
        this._loop();
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.ctx.scale(dpr, dpr);
        this.cx = this.w / 2;
        this.cy = this.h * 0.45;
    }

    setMining(active) { this.mining = active; }
    setHashrate(rate) { this.hashrate = rate; }

    _spawnInitialAsteroids() {
        for (let i = 0; i < 8; i++) {
            this._spawnAsteroid();
        }
    }

    _spawnAsteroid() {
        const side = Math.random();
        let x, y;
        if (side < 0.25) { x = -30; y = Math.random() * this.h; }
        else if (side < 0.5) { x = this.w + 30; y = Math.random() * this.h; }
        else if (side < 0.75) { x = Math.random() * this.w; y = -30; }
        else { x = Math.random() * this.w; y = this.h + 30; }

        const angle = Math.atan2(this.cy - y, this.cx - x) + (Math.random() - 0.5) * 1.5;
        const speed = 0.15 + Math.random() * 0.3;
        const size = 6 + Math.random() * 14;
        const rotation = Math.random() * Math.PI * 2;
        const rotSpeed = (Math.random() - 0.5) * 0.02;
        const vertices = 5 + Math.floor(Math.random() * 4);

        // Generate irregular polygon
        const shape = [];
        for (let i = 0; i < vertices; i++) {
            const a = (i / vertices) * Math.PI * 2;
            const r = size * (0.6 + Math.random() * 0.4);
            shape.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }

        this.asteroids.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size, rotation, rotSpeed, shape,
            health: 1,
            hit: false,
        });
    }

    _fireLaser(target) {
        const dx = target.x - this.cx;
        const dy = target.y - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.lasers.push({
            x1: this.cx, y1: this.cy,
            x2: target.x, y2: target.y,
            life: 1.0,
            width: 1.5 + Math.random(),
        });

        // Spawn particles at impact point
        const count = 6 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            this.particles.push({
                x: target.x,
                y: target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: 1 + Math.random() * 2.5,
                color: Math.random() > 0.5 ? '#00bfef' : '#22d3ee',
            });
        }

        target.hit = true;
        target.health -= 0.5;
    }

    _update() {
        this.frame++;
        this.crystalAngle += 0.003;

        if (this.mining) {
            this.crystalGlow = Math.min(1, this.crystalGlow + 0.03);
        } else {
            this.crystalGlow = Math.max(0.15, this.crystalGlow - 0.01);
        }

        // Spawn asteroids
        const spawnRate = this.mining ? 25 : 80;
        if (this.frame % spawnRate === 0 && this.asteroids.length < 20) {
            this._spawnAsteroid();
        }

        // Update asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed;

            // Remove if off-screen or dead
            if (a.health <= 0 || a.x < -80 || a.x > this.w + 80 || a.y < -80 || a.y > this.h + 80) {
                this.asteroids.splice(i, 1);
            }
            a.hit = false;
        }

        // Fire lasers when mining
        if (this.mining && this.frame % 8 === 0 && this.asteroids.length > 0) {
            // Target closest asteroid
            let closest = null;
            let minDist = Infinity;
            for (const a of this.asteroids) {
                const d = Math.sqrt((a.x - this.cx) ** 2 + (a.y - this.cy) ** 2);
                if (d < minDist && d < 400) {
                    minDist = d;
                    closest = a;
                }
            }
            if (closest) {
                this._fireLaser(closest);
            }
        }

        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].life -= 0.08;
            if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.02; // gravity
            p.life -= 0.015;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    _draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);

        // Draw lasers
        for (const l of this.lasers) {
            ctx.save();
            ctx.globalAlpha = l.life * 0.8;
            // Glow
            ctx.strokeStyle = '#00bfef';
            ctx.lineWidth = l.width + 3;
            ctx.shadowColor = '#00bfef';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
            // Core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = l.width * 0.5;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw asteroids
        for (const a of this.asteroids) {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.globalAlpha = a.health;

            ctx.fillStyle = a.hit ? '#ff6b6b' : '#334155';
            ctx.strokeStyle = a.hit ? '#ff5252' : '#4a5568';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.shape[0].x, a.shape[0].y);
            for (let i = 1; i < a.shape.length; i++) {
                ctx.lineTo(a.shape[i].x, a.shape[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw crystal emblem
        this._drawCrystal();
    }

    _drawCrystal() {
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy;
        const scale = 0.7;
        const glow = this.crystalGlow;
        const breathe = Math.sin(this.frame * 0.03) * 2;

        ctx.save();
        ctx.translate(cx, cy + breathe);

        // Outer glow
        if (glow > 0.1) {
            const gradient = ctx.createRadialGradient(0, 10, 5, 0, 10, 60 * glow);
            gradient.addColorStop(0, `rgba(0, 191, 239, ${0.15 * glow})`);
            gradient.addColorStop(1, 'rgba(0, 191, 239, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 10, 60 * glow, 0, Math.PI * 2);
            ctx.fill();
        }

        // Crystal shape (matches the SVG viewBox 0 0 200 280, centered)
        const s = scale;
        // Top facet - bright cyan
        ctx.fillStyle = CRYSTAL.color1;
        ctx.globalAlpha = 0.95 * (0.5 + glow * 0.5);
        ctx.shadowColor = '#00bfef';
        ctx.shadowBlur = 10 + glow * 20;
        ctx.beginPath();
        ctx.moveTo(0 * s, -55 * s);       // top
        ctx.lineTo(-25 * s, -5 * s);      // left
        ctx.lineTo(0 * s, 10 * s);        // center
        ctx.lineTo(25 * s, -5 * s);       // right
        ctx.closePath();
        ctx.fill();

        // Bottom-left facet
        ctx.fillStyle = CRYSTAL.color2;
        ctx.globalAlpha = 0.85 * (0.5 + glow * 0.5);
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(-25 * s, -5 * s);
        ctx.lineTo(0 * s, 10 * s);
        ctx.lineTo(0 * s, 65 * s);
        ctx.closePath();
        ctx.fill();

        // Bottom-right facet
        ctx.fillStyle = CRYSTAL.color3;
        ctx.globalAlpha = 0.75 * (0.5 + glow * 0.5);
        ctx.beginPath();
        ctx.moveTo(25 * s, -5 * s);
        ctx.lineTo(0 * s, 10 * s);
        ctx.lineTo(0 * s, 65 * s);
        ctx.closePath();
        ctx.fill();

        // Highlight line
        ctx.globalAlpha = 0.3 * glow;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0 * s, -55 * s);
        ctx.lineTo(0 * s, 65 * s);
        ctx.stroke();

        // Sparkles when mining
        if (this.mining) {
            const sparkleTime = this.frame * 0.05;
            for (let i = 0; i < 3; i++) {
                const angle = sparkleTime + i * 2.09;
                const r = 18 + Math.sin(angle * 3) * 8;
                const sx = Math.cos(angle) * r * s;
                const sy = Math.sin(angle) * r * s - 5;
                const sparkAlpha = (Math.sin(angle * 5) + 1) * 0.3;
                ctx.globalAlpha = sparkAlpha;
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    _loop() {
        this._update();
        this._draw();
        requestAnimationFrame(() => this._loop());
    }
}
