/**
 * DotGrid Background - Vanilla JS Version
 * Ported from React logic provided by the user.
 */

class DotGrid {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) return;

        this.dotSize = options.dotSize || 2;
        this.gap = options.gap || 25;
        this.baseColor = options.baseColor || '#2F293A';
        this.activeColor = options.activeColor || '#EAB308';
        this.proximity = options.proximity || 100;
        this.speedTrigger = options.speedTrigger || 100;
        this.shockRadius = options.shockRadius || 250;
        this.shockStrength = options.shockStrength || 3;
        this.maxSpeed = options.maxSpeed || 5000;
        this.resistance = options.resistance || 1100;
        this.returnDuration = options.returnDuration || 1.5;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'dot-grid__canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.dots = [];
        this.pointer = {
            x: -1000,
            y: -1000,
            vx: 0,
            vy: 0,
            speed: 0,
            lastTime: 0,
            lastX: 0,
            lastY: 0
        };

        this.baseRgb = this.hexToRgb(this.baseColor);
        this.activeRgb = this.hexToRgb(this.activeColor);

        this.dotPath = new Path2D();
        this.dotPath.arc(0, 0, this.dotSize / 2, 0, Math.PI * 2);

        console.log("DotGrid instance created on:", this.container);
        this.init();
    }

    init() {
        this.buildGrid();
        this.addEventListeners();
        this.animate();
    }

    hexToRgb(hex) {
        const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!m) return { r: 0, g: 0, b: 0 };
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16)
        };
    }

    buildGrid() {
        const rect = this.container.getBoundingClientRect();
        const { width, height } = rect;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
        this.ctx.scale(dpr, dpr);

        const cell = this.dotSize + this.gap;
        const cols = Math.floor((width + this.gap) / cell);
        const rows = Math.floor((height + this.gap) / cell);

        const gridW = cell * cols - this.gap;
        const gridH = cell * rows - this.gap;

        const startX = (width - gridW) / 2 + this.dotSize / 2;
        const startY = (height - gridH) / 2 + this.dotSize / 2;

        this.dots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.dots.push({
                    cx: startX + x * cell,
                    cy: startY + y * cell,
                    xOffset: 0,
                    yOffset: 0,
                    _inertiaApplied: false
                });
            }
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.buildGrid());

        const throttle = (func, limit) => {
            let lastCall = 0;
            return (...args) => {
                const now = performance.now();
                if (now - lastCall >= limit) {
                    lastCall = now;
                    func.apply(this, args);
                }
            };
        };

        const handleMove = (e) => {
            const now = performance.now();
            const pr = this.pointer;
            const dt = pr.lastTime ? now - pr.lastTime : 16;
            const dx = e.clientX - pr.lastX;
            const dy = e.clientY - pr.lastY;

            let vx = (dx / dt) * 1000;
            let vy = (dy / dt) * 1000;
            let speed = Math.hypot(vx, vy);

            if (speed > this.maxSpeed) {
                const scale = this.maxSpeed / speed;
                vx *= scale;
                vy *= scale;
                speed = this.maxSpeed;
            }

            pr.lastTime = now;
            pr.lastX = e.clientX;
            pr.lastY = e.clientY;
            pr.vx = vx;
            pr.vy = vy;
            pr.speed = speed;

            const rect = this.canvas.getBoundingClientRect();
            pr.x = e.clientX - rect.left;
            pr.y = e.clientY - rect.top;

            // Mouse speed-based push
            for (const dot of this.dots) {
                const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
                if (speed > this.speedTrigger && dist < this.proximity && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    if (window.gsap) {
                        gsap.killTweensOf(dot);
                        const pushX = (dot.cx - pr.x) * 0.5 + vx * 0.01;
                        const pushY = (dot.cy - pr.y) * 0.5 + vy * 0.01;

                        // Standard GSAP physics fallback since InertiaPlugin is paid
                        gsap.to(dot, {
                            xOffset: pushX,
                            yOffset: pushY,
                            duration: 0.3,
                            ease: "power2.out",
                            onComplete: () => {
                                gsap.to(dot, {
                                    xOffset: 0,
                                    yOffset: 0,
                                    duration: this.returnDuration,
                                    ease: "elastic.out(1, 0.75)"
                                });
                                dot._inertiaApplied = false;
                            }
                        });
                    }
                }
            }
        };

        window.addEventListener('mousemove', throttle(handleMove, 20), { passive: true });

        window.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            for (const dot of this.dots) {
                const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
                if (dist < this.shockRadius && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    if (window.gsap) {
                        gsap.killTweensOf(dot);
                        const falloff = Math.max(0, 1 - dist / this.shockRadius);
                        const pushX = (dot.cx - cx) * this.shockStrength * falloff;
                        const pushY = (dot.cy - cy) * this.shockStrength * falloff;

                        gsap.to(dot, {
                            xOffset: pushX,
                            yOffset: pushY,
                            duration: 0.4,
                            ease: "power3.out",
                            onComplete: () => {
                                gsap.to(dot, {
                                    xOffset: 0,
                                    yOffset: 0,
                                    duration: this.returnDuration,
                                    ease: "elastic.out(1, 0.75)"
                                });
                                dot._inertiaApplied = false;
                            }
                        });
                    }
                }
            }
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const proxSq = this.proximity * this.proximity;
        const px = this.pointer.x;
        const py = this.pointer.y;

        for (const dot of this.dots) {
            const ox = dot.cx + dot.xOffset;
            const oy = dot.cy + dot.yOffset;
            const dx = dot.cx - px;
            const dy = dot.cy - py;
            const dsq = dx * dx + dy * dy;

            let fillStyle = this.baseColor;

            if (dsq <= proxSq) {
                const dist = Math.sqrt(dsq);
                const t = 1 - dist / this.proximity;
                const r = Math.round(this.baseRgb.r + (this.activeRgb.r - this.baseRgb.r) * t);
                const g = Math.round(this.baseRgb.g + (this.activeRgb.g - this.baseRgb.g) * t);
                const b = Math.round(this.baseRgb.b + (this.activeRgb.b - this.baseRgb.b) * t);
                fillStyle = `rgb(${r},${g},${b})`;
            }

            this.ctx.save();
            this.ctx.translate(ox, oy);
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill(this.dotPath);
            this.ctx.restore();
        }
    }
}
