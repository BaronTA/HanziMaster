// Play swordhit.wav with slight randomized pitch/speed shift on each swing
export function playSwordSound() {
    const audio = new Audio('assets/swordhit.wav');
    audio.volume = 0.65;
    // Randomize playback rate between 0.85 (deeper/slower) and 1.20 (higher/faster)
    audio.playbackRate = 0.85 + Math.random() * 0.35;
    audio.play().catch(() => {});
}

export function playDeathSound() {
    const audio = new Audio('assets/death.wav');
    audio.volume = 0.75;
    audio.play().catch(() => {});
}

// Clean single-pass Web Speech API TTS helper (Echo removed completely)
export function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}