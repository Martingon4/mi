document.addEventListener('DOMContentLoaded', () => {
    // === Scroll Animations ===
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(element => {
        observer.observe(element);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // === Multi-Species Garden Canvas ===
    const canvas = document.getElementById('garden-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        // High DPI for crispness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse Interaction
    let mouseX = width / 2;
    let targetSway = 0;
    canvas.addEventListener('mousemove', (e) => {
        targetSway = ((e.clientX / width) - 0.5) * 0.3; // -0.15 to 0.15
    });
    canvas.addEventListener('mouseleave', () => {
        targetSway = 0;
    });

    // Math Utils
    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
    function easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    // Colors
    const pinks = {
        peony: ['#ff8cbe', '#e54b8b'],
        tulip: ['#ff9eb5', '#ff1493'],
        orchid: ['#ffb6c1', '#c71585'],
        cherry: ['#ffe4e1', '#ffb6c1'],
        carnation: ['#ff69b4', '#ff1493'],
        lotus: ['#ffd6e8', '#ff69b4']
    };

    // Flower Class
    class Flower {
        constructor(type, x, startDelay, scale) {
            this.type = type;
            this.x = x;
            this.startDelay = startDelay; // seconds
            this.scale = scale;
            this.heightOffset = Math.random() * (height * 0.3); // Random height variations
            this.swayOffset = Math.random() * Math.PI * 2;
            
            // Randomize color slightly based on palette
            this.colors = pinks[this.type];
        }

        draw(ctx, globalTime, globalSway) {
            const localTime = globalTime - this.startDelay;
            if (localTime < 0) return;

            const wind = Math.sin(globalTime * 1.5 + this.swayOffset) * 0.03;
            const sway = globalSway + wind;

            // Progress tracking (0 to 1)
            let stemP = Math.min(Math.max(localTime / 1.5, 0), 1);
            let leafP = Math.min(Math.max((localTime - 1.0) / 1.5, 0), 1);
            let bloomP = Math.min(Math.max((localTime - 2.0) / 2.0, 0), 1);

            const eStem = easeOutCubic(stemP);
            const eLeaf = easeOutElastic(leafP);
            const eBloom = easeOutElastic(bloomP);

            const startY = height + 50;
            const endY = height * 0.4 + this.heightOffset; // Where flower blooms
            
            // 1. Draw Stem
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, startY);
            
            const currentHeight = startY - ((startY - endY) * eStem);
            const cp1x = this.x + (Math.sin(sway * 3) * 30 * this.scale);
            const cp1y = startY - ((startY - endY) * 0.3 * eStem);
            const cp2x = this.x + (Math.sin(sway * 4) * 50 * this.scale) + (sway * 300);
            const cp2y = startY - ((startY - endY) * 0.7 * eStem);
            const topX = this.x + (sway * 400); 
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, topX, currentHeight);
            
            const grad = ctx.createLinearGradient(this.x-10, 0, this.x+10, 0);
            grad.addColorStop(0, '#2e4d3a');
            grad.addColorStop(1, '#1f3829');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 8 * this.scale;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

            // 2. Draw Leaves (Basic for all)
            if (eLeaf > 0) {
                const l1y = startY - ((startY - endY) * 0.4);
                this.drawLeaf(ctx, topX - (sway*100) - 5, l1y, Math.PI + 0.4, eLeaf * this.scale);
                
                const l2y = startY - ((startY - endY) * 0.7);
                this.drawLeaf(ctx, topX - (sway*200) + 5, l2y, -0.4, eLeaf * this.scale);
            }

            // 3. Draw Bloom
            if (eBloom > 0) {
                ctx.save();
                ctx.translate(topX, currentHeight);
                ctx.scale(this.scale, this.scale);
                
                // Slight continuous rotation/sway of flower head
                const headTilt = sway + Math.sin(globalTime + this.swayOffset) * 0.1;
                ctx.rotate(headTilt);

                this.drawBloom(ctx, eBloom);
                
                ctx.restore();
            }
        }

        drawLeaf(ctx, x, y, angle, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.scale(size, size);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(40, -15, 80, 0);
            ctx.quadraticCurveTo(40, 15, 0, 0);
            ctx.fillStyle = '#2e4d3a';
            ctx.fill();
            ctx.restore();
        }

        drawBloom(ctx, p) {
            const c1 = this.colors[0];
            const c2 = this.colors[1];
            
            if (this.type === 'peony') this.drawPeony(ctx, p, c1, c2);
            else if (this.type === 'tulip') this.drawTulip(ctx, p, c1, c2);
            else if (this.type === 'orchid') this.drawOrchid(ctx, p, c1, c2);
            else if (this.type === 'cherry') this.drawCherry(ctx, p, c1, c2);
            else if (this.type === 'carnation') this.drawCarnation(ctx, p, c1, c2);
            else if (this.type === 'lotus') this.drawLotus(ctx, p, c1, c2);
        }

        // --- SPECIFIC FLOWER DRAWING FUNCTIONS ---

        drawPeony(ctx, p, c1, c2) {
            const layers = 4;
            const radius = 60 * p;
            for (let l = 0; l < layers; l++) {
                const petals = 12;
                const layerRadius = radius * (1 - (l * 0.2));
                for (let i = 0; i < petals; i++) {
                    const angle = (i * (Math.PI * 2) / petals) + (l * 0.2);
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(layerRadius * 0.5, -layerRadius * 0.3, layerRadius, -layerRadius * 0.5, layerRadius, 0);
                    ctx.bezierCurveTo(layerRadius, layerRadius * 0.5, layerRadius * 0.5, layerRadius * 0.3, 0, 0);
                    const grad = ctx.createRadialGradient(0,0,0, layerRadius,0, layerRadius);
                    grad.addColorStop(0, c2); grad.addColorStop(1, c1);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.restore();
                }
            }
            this.drawCenter(ctx, p);
        }

        drawTulip(ctx, p, c1, c2) {
            const r = 60 * p;
            // Draw cup shape pointing UP
            ctx.save();
            ctx.rotate(-Math.PI/2); // Point up
            // Back petals
            ctx.fillStyle = c2;
            ctx.beginPath();
            ctx.ellipse(r*0.6, 0, r*0.8, r*0.6, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Front petals
            ctx.fillStyle = c1;
            ctx.beginPath();
            ctx.moveTo(0, -r*0.4);
            ctx.quadraticCurveTo(r, -r*0.8, r*1.2, 0); // Tip
            ctx.quadraticCurveTo(r, r*0.8, 0, r*0.4); // Bottom
            ctx.fill();
            
            // Central overlap
            ctx.fillStyle = '#ff1493';
            ctx.beginPath();
            ctx.moveTo(0, -r*0.2);
            ctx.quadraticCurveTo(r*0.8, -r*0.3, r, 0);
            ctx.quadraticCurveTo(r*0.8, r*0.3, 0, r*0.2);
            ctx.fill();
            ctx.restore();
        }

        drawOrchid(ctx, p, c1, c2) {
            const r = 70 * p;
            ctx.save();
            // 3 Sepals (star shape)
            ctx.fillStyle = c1;
            for(let i=0; i<3; i++){
                ctx.save();
                ctx.rotate((i * Math.PI*2/3) - Math.PI/2);
                ctx.beginPath();
                ctx.ellipse(r*0.6, 0, r*0.6, r*0.2, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
            // 2 large petals (wings)
            ctx.fillStyle = c2;
            for(let i=0; i<2; i++){
                ctx.save();
                ctx.rotate(i === 0 ? -0.5 : 3.6);
                ctx.beginPath();
                ctx.ellipse(r*0.5, 0, r*0.5, r*0.4, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
            // Central Lip (labellum)
            ctx.fillStyle = '#c71585';
            ctx.beginPath();
            ctx.ellipse(0, r*0.3, r*0.3, r*0.4, 0, 0, Math.PI*2);
            ctx.fill();
            // Center dot
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, r*0.1, r*0.1, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        drawCherry(ctx, p, c1, c2) {
            const r = 40 * p; // Smaller
            const petals = 5;
            ctx.fillStyle = c1;
            for(let i=0; i<petals; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI*2/petals);
                ctx.beginPath();
                ctx.moveTo(0,0);
                // Draw petal with a cleft
                ctx.quadraticCurveTo(r*0.5, -r*0.5, r, -r*0.2);
                ctx.lineTo(r*0.8, 0); // Cleft
                ctx.lineTo(r, r*0.2);
                ctx.quadraticCurveTo(r*0.5, r*0.5, 0, 0);
                ctx.fill();
                ctx.restore();
            }
            // Center stamens
            ctx.fillStyle = '#c71585';
            ctx.beginPath();
            ctx.arc(0,0, r*0.15, 0, Math.PI*2);
            ctx.fill();
        }

        drawCarnation(ctx, p, c1, c2) {
            const r = 55 * p;
            ctx.fillStyle = c1;
            ctx.strokeStyle = c2;
            ctx.lineWidth = 1;
            // Draw many ruffled layers
            for(let l=0; l<5; l++) {
                const lr = r * (1 - l*0.15);
                ctx.beginPath();
                // Jagged circle
                for(let a=0; a<Math.PI*2; a+=0.1) {
                    const jitter = lr + (Math.random() * 15 * p);
                    const x = Math.cos(a) * jitter;
                    const y = Math.sin(a) * jitter;
                    if(a===0) ctx.moveTo(x,y);
                    else ctx.lineTo(x,y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        drawLotus(ctx, p, c1, c2) {
            const r = 70 * p;
            ctx.save();
            ctx.rotate(-Math.PI/2); // Point up
            // Layers of pointed petals
            const layers = [12, 10, 8];
            layers.forEach((petals, lIndex) => {
                const lr = r * (1 - lIndex*0.2);
                for(let i=0; i<petals; i++) {
                    const angle = (i * Math.PI*2/petals) + (lIndex*0.1);
                    // Only draw petals pointing "up" (between -pi/2 and pi/2 relative to the bloom)
                    // Wait, lotus is symmetric. Let's draw it as a full starburst but slightly squashed
                    ctx.save();
                    ctx.scale(0.8, 1); // squash horizontally
                    ctx.rotate(angle);
                    ctx.fillStyle = (lIndex%2===0)? c1 : c2;
                    ctx.beginPath();
                    ctx.moveTo(0,0);
                    ctx.quadraticCurveTo(lr*0.5, -lr*0.2, lr, 0);
                    ctx.quadraticCurveTo(lr*0.5, lr*0.2, 0, 0);
                    ctx.fill();
                    ctx.restore();
                }
            });
            ctx.restore();
            this.drawCenter(ctx, p);
        }

        drawCenter(ctx, p) {
            ctx.beginPath();
            ctx.arc(0, 0, 15 * p, 0, Math.PI * 2);
            ctx.fillStyle = '#2a111a';
            ctx.fill();
            for (let i = 0; i < 12; i++) {
                const a = i * Math.PI*2/12;
                ctx.beginPath();
                ctx.arc(Math.cos(a)*10*p, Math.sin(a)*10*p, 2*p, 0, Math.PI*2);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
            }
        }
    }

    // Create the Garden
    const garden = [];
    const types = ['peony', 'tulip', 'orchid', 'cherry', 'carnation', 'lotus'];
    
    // We want enough flowers to fill the screen width
    const flowerCount = Math.min(window.innerWidth / 80, 25); 

    for (let i = 0; i < flowerCount; i++) {
        // Distribute X evenly with some randomness
        const segment = window.innerWidth / flowerCount;
        const x = (i * segment) + (Math.random() * segment);
        const type = types[Math.floor(Math.random() * types.length)];
        const delay = Math.random() * 4; // Spawn over 4 seconds
        const scale = (Math.random() * 0.5) + 0.8; // 0.8x to 1.3x size
        
        garden.push(new Flower(type, x, delay, scale));
    }

    // Animation Loop
    let time = 0;
    let currentSway = 0;

    function render() {
        // Soft clear for trail effect or hard clear
        ctx.clearRect(0, 0, width, height);
        
        time += 0.016; // ~60fps
        currentSway += (targetSway - currentSway) * 0.05;

        // Sort garden by scale so smaller ones are in back
        garden.sort((a,b) => a.scale - b.scale);

        garden.forEach(flower => {
            flower.draw(ctx, time, currentSway);
        });

        requestAnimationFrame(render);
    }

    // Start
    setTimeout(() => {
        render();
    }, 500);
});
