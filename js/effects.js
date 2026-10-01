import { playSwordSound, playDeathSound } from './audio.js';

export { playSwordSound, playDeathSound };

// Tactile Health Bar Impact & Particle Sparks on Boss Hit
export function triggerCombatParticles(bossElement) {
    playSwordSound();

    // Tactile Health Bar Impact Flash & Shake
    const hudBar = document.getElementById('arena-hud');
    if (hudBar) {
        hudBar.classList.add('hud-hit-flash');
        setTimeout(() => hudBar.classList.remove('hud-hit-flash'), 150);
    }

    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rect = bossElement ? bossElement.getBoundingClientRect() : { x: window.innerWidth * 0.75, y: window.innerHeight * 0.5 };
    const originX = rect.x + rect.width / 2;
    const originY = rect.y + rect.height / 2;

    let alpha = 1.0;
    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: originX,
            y: originY,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            size: Math.random() * 5 + 2,
            color: Math.random() > 0.2 ? '#ef4444' : '#fbbf24'
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        alpha -= 0.05;
        if (alpha > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

// Fatal Death Particles on Hero
export function triggerDeathParticles(heroElement) {
    playDeathSound();

    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rect = heroElement ? heroElement.getBoundingClientRect() : { x: window.innerWidth * 0.2, y: window.innerHeight * 0.7 };
    const originX = rect.x + rect.width / 2;
    const originY = rect.y + rect.height / 2;

    let alpha = 1.0;
    const particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: originX,
            y: originY,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14 - 2,
            size: Math.random() * 6 + 3,
            color: '#7f1d1d'
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity effect
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        alpha -= 0.04;
        if (alpha > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

export function triggerErrorFlash() {
    document.body.classList.add('error-flash', 'shake');
    setTimeout(() => {
        document.body.classList.remove('error-flash', 'shake');
    }, 200);
}