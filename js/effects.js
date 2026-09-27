// Web Audio API Synthesizer & Canvas Particle Slash / Shake Effects
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Procedural Sword Clang Sound for Success
export function playSuccessSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Metallic higher frequency overtone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {
        // Audio context restrictions fallback
    }
}

// Procedural Failure / Death Impact Sound
export function playFailureSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Low sub-bass thud + noise crunch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    } catch (e) {}
}

export function triggerSlash() {
    playSuccessSound();
    document.body.classList.add('success-flash');
    setTimeout(() => document.body.classList.remove('success-flash'), 150);

    // Canvas Slash Particle Effect
    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let alpha = 1.0;
    const particles = [];
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height / 2 + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: Math.random() * 3 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        alpha -= 0.08;
        if (alpha > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

export function triggerErrorFlash() {
    playFailureSound();
    document.body.classList.add('error-flash', 'shake');
    setTimeout(() => {
        document.body.classList.remove('error-flash', 'shake');
    }, 200);
}