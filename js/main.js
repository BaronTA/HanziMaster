// State Engine & Core Loop (Horizontal Options & 100-Dot Progress Track Integration)
import { speak } from './audio.js';
import { triggerSlash, triggerErrorFlash } from './effects.js';

let stageData = [];
let currentIndex = 0;
let startTime = null;
let timerInterval = null;
let currentMode = null; 
let activeKeyHandler = null;

const UI = {
    counter: document.getElementById('counter'),
    timer: document.getElementById('timer'),
    pb: document.getElementById('pb'),
    progressTrack: document.getElementById('progress-track'),
    promptTypeIndicator: document.getElementById('prompt-type-indicator'),
    promptDisplay: document.getElementById('prompt-display'),
    interactionBox: document.getElementById('interaction-box')
};

async function init() {
    try {
        const response = await fetch('data/stage_01.json');
        stageData = await response.json();
        buildProgressTrack();
        loadPersonalBest();
        startStage();
    } catch (e) {
        console.error("Failed to load stage data:", e);
    }
}

function buildProgressTrack() {
    UI.progressTrack.innerHTML = '';
    for (let i = 0; i < stageData.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        dot.id = `dot-${i}`;
        if (i === 0) dot.classList.add('active');
        UI.progressTrack.appendChild(dot);
    }
}

function updateProgressTrack() {
    for (let i = 0; i < stageData.length; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (!dot) continue;
        dot.className = 'progress-dot';
        if (i < currentIndex) {
            dot.classList.add('completed');
        } else if (i === currentIndex) {
            dot.classList.add('active');
        }
    }
}

function startStage() {
    currentIndex = 0;
    startTime = null;
    clearInterval(timerInterval);
    UI.timer.textContent = "0.0s";
    buildProgressTrack();
    loadWord();
}

function startTimerIfNeeded() {
    if (!startTime) {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            UI.timer.textContent = `${elapsed.toFixed(1)}s`;
        }, 100);
    }
}

function cleanupListeners() {
    if (activeKeyHandler) {
        document.removeEventListener('keydown', activeKeyHandler, true);
        activeKeyHandler = null;
    }
}

function loadWord() {
    cleanupListeners();

    if (currentIndex >= stageData.length) {
        stageComplete();
        return;
    }

    updateProgressTrack();
    const word = stageData[currentIndex];
    UI.counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${stageData.length}`;

    const modes = ['A', 'B', 'C', 'D'];
    currentMode = modes[Math.floor(Math.random() * modes.length)];

    renderMatrixStep(word, 1);
}

function renderMatrixStep(word, step) {
    cleanupListeners();
    UI.interactionBox.innerHTML = '';

    switch (currentMode) {
        case 'A':
            if (step === 1) {
                UI.promptTypeIndicator.innerHTML = `Mode A <span style="color:#38bdf8;">[INPUT: PINYIN]</span>`;
                UI.promptDisplay.textContent = word.hanzi;
                speak(word.hanzi);

                createTextInput("Type Pinyin (e.g. wo3)...", (val) => {
                    if (val.trim().toLowerCase() === word.pinyin.toLowerCase()) {
                        renderMatrixStep(word, 2);
                    } else {
                        handleError(word, "Hanzi Prompt", "Step 1: Pinyin Mismatch", val, word.pinyin);
                    }
                }, "pinyin");
            } else if (step === 2) {
                UI.promptTypeIndicator.innerHTML = `Mode A <span style="color:#f43f5e;">[INPUT: ENGLISH]</span>`;
                UI.promptDisplay.textContent = word.hanzi;

                createTextInput("Type English meaning...", (val) => {
                    const userInputs = val.trim().toLowerCase().split(',').map(s => s.trim());
                    const isValid = word.english.some(eng => userInputs.includes(eng.toLowerCase()));
                    if (isValid) {
                        handleSuccess();
                    } else {
                        handleError(word, "Hanzi Prompt", "Finisher: English Mismatch", val, word.english.join('/'));
                    }
                }, "english");
            }
            break;

        case 'B':
            if (step === 1) {
                UI.promptTypeIndicator.innerHTML = `Mode B <span style="color:#a855f7;">[SELECT: HANZI]</span>`;
                UI.promptDisplay.textContent = word.english.join(' / ');
                speak(word.hanzi);

                renderHanziOptions(word, (selectedHanzi) => {
                    if (selectedHanzi === word.hanzi) {
                        renderMatrixStep(word, 2);
                    } else {
                        handleError(word, "English Prompt", "Step 1: Wrong Character Selected", selectedHanzi, word.hanzi);
                    }
                });
            } else if (step === 2) {
                UI.promptTypeIndicator.innerHTML = `Mode B <span style="color:#38bdf8;">[INPUT: PINYIN]</span>`;
                UI.promptDisplay.textContent = word.hanzi;

                createTextInput("Type Pinyin...", (val) => {
                    if (val.trim().toLowerCase() === word.pinyin.toLowerCase()) {
                        handleSuccess();
                    } else {
                        handleError(word, "English Prompt", "Finisher: Pinyin Mismatch", val, word.pinyin);
                    }
                }, "pinyin");
            }
            break;

        case 'C':
            if (step === 1) {
                UI.promptTypeIndicator.innerHTML = `Mode C <span style="color:#a855f7;">[SELECT: HANZI]</span>`;
                UI.promptDisplay.textContent = word.pinyin;
                speak(word.hanzi);

                renderHanziOptions(word, (selectedHanzi) => {
                    if (selectedHanzi === word.hanzi) {
                        renderMatrixStep(word, 2);
                    } else {
                        handleError(word, "Pinyin Prompt", "Step 1: Wrong Character Selected", selectedHanzi, word.hanzi);
                    }
                });
            } else if (step === 2) {
                UI.promptTypeIndicator.innerHTML = `Mode C <span style="color:#f43f5e;">[INPUT: ENGLISH]</span>`;
                UI.promptDisplay.textContent = word.hanzi;

                createTextInput("Type English meaning...", (val) => {
                    const userInputs = val.trim().toLowerCase().split(',').map(s => s.trim());
                    const isValid = word.english.some(eng => userInputs.includes(eng.toLowerCase()));
                    if (isValid) {
                        handleSuccess();
                    } else {
                        handleError(word, "Pinyin Prompt", "Finisher: English Mismatch", val, word.english.join('/'));
                    }
                }, "english");
            }
            break;

        case 'D':
            if (step === 1) {
                UI.promptTypeIndicator.innerHTML = `Mode D (Audio Boss) <span style="color:#38bdf8;">[INPUT: PINYIN]</span>`;
                UI.promptDisplay.textContent = "🔊 [Audio Only]";
                speak(word.hanzi);

                createTextInput("Type Pinyin from audio...", (val) => {
                    if (val.trim().toLowerCase() === word.pinyin.toLowerCase()) {
                        renderMatrixStep(word, 2);
                    } else {
                        handleError(word, "Audio Boss", "Step 1: Pinyin Mismatch", val, word.pinyin);
                    }
                }, "pinyin");
            } else if (step === 2) {
                UI.promptTypeIndicator.innerHTML = `Mode D (Audio Boss) <span style="color:#a855f7;">[SELECT: HANZI]</span>`;
                UI.promptDisplay.textContent = "🔊 [Select Hanzi]";
                
                renderHanziOptions(word, (selectedHanzi) => {
                    if (selectedHanzi === word.hanzi) {
                        renderMatrixStep(word, 3);
                    } else {
                        handleError(word, "Audio Boss", "Step 2: Wrong Character Selected", selectedHanzi, word.hanzi);
                    }
                });
            } else if (step === 3) {
                UI.promptTypeIndicator.innerHTML = `Mode D (Audio Boss) <span style="color:#f43f5e;">[INPUT: ENGLISH]</span>`;
                UI.promptDisplay.textContent = word.hanzi;

                createTextInput("Type English meaning...", (val) => {
                    const userInputs = val.trim().toLowerCase().split(',').map(s => s.trim());
                    const isValid = word.english.some(eng => userInputs.includes(eng.toLowerCase()));
                    if (isValid) {
                        handleSuccess();
                    } else {
                        handleError(word, "Audio Boss", "Finisher: English Mismatch", val, word.english.join('/'));
                    }
                }, "english");
            }
            break;
    }
}

function createTextInput(placeholder, onSubmit, typeHint) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = `text-input input-${typeHint}`;
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;

    input.addEventListener('keydown', (e) => {
        startTimerIfNeeded();
        if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(input.value);
        }
    });

    UI.interactionBox.appendChild(input);
    requestAnimationFrame(() => input.focus());
}

function renderHanziOptions(word, onSelect) {
    UI.interactionBox.innerHTML = '';
    
    const options = [...word.distractors.slice(0, 3), word.hanzi]
        .sort(() => Math.random() - 0.5);

    // Horizontal Row matching keyboard keys [1] [2] [3] [4]
    const row = document.createElement('div');
    row.className = 'options-row';

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `${opt} <span>[${idx + 1}]</span>`;
        btn.onclick = (e) => {
            e.preventDefault();
            startTimerIfNeeded();
            cleanupListeners();
            onSelect(opt);
        };
        row.appendChild(btn);
    });

    UI.interactionBox.appendChild(row);

    activeKeyHandler = (e) => {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
        if (keyMap.hasOwnProperty(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            startTimerIfNeeded();
            const selectedOpt = options[keyMap[e.key]];
            cleanupListeners();
            onSelect(selectedOpt);
        }
    };
    document.addEventListener('keydown', activeKeyHandler, true);
}

function handleSuccess() {
    triggerSlash();
    currentIndex++;
    loadWord();
}

function handleError(word, modeName, failReason, userEntry, correctEntry) {
    triggerErrorFlash();
    clearInterval(timerInterval);
    cleanupListeners();

    UI.promptTypeIndicator.textContent = "💀 GAME OVER";
    UI.promptDisplay.innerHTML = `<span style="color: var(--danger);">你死了</span>`;

    UI.interactionBox.innerHTML = `
        <div style="background: var(--surface); border: 1px solid #27272a; padding: 1.5rem; width: 100%; display: flex; flex-direction: column; gap: 0.75rem; text-align: left; font-family: var(--font-mono); font-size: 0.85rem;">
            <div style="color: var(--text-secondary); border-bottom: 1px solid #27272a; padding-bottom: 0.5rem; margin-bottom: 0.25rem;">FATAL ENCOUNTER RECAP</div>
            <div>Mode: <span style="color: var(--text-primary);">${modeName}</span></div>
            <div>Failed At: <span style="color: var(--danger);">${failReason}</span></div>
            <div style="font-size: 1.25rem; font-family: var(--font-sans); padding: 0.25rem 0;">
                Character: <strong>${word.hanzi}</strong> (${word.pinyin}) — <em>${word.english.join(', ')}</em>
            </div>
            <div>Your Input: <span style="color: var(--danger);">${userEntry || '[None/Skipped]'}</span></div>
            <div>Expected: <span style="color: #10b981;">${correctEntry}</span></div>
        </div>
        <button class="option-btn" style="justify-content: center; margin-top: 0.5rem; flex-direction: row;" id="restart-btn">
            <span>[Press Any Key or Click to Restart Run]</span>
        </button>
    `;

    setTimeout(() => {
        const restartHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', restartHandler, true);
            location.reload();
        };
        document.addEventListener('keydown', restartHandler, true);

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.onclick = (e) => {
                e.preventDefault();
                location.reload();
            };
        }
    }, 500);
}

function stageComplete() {
    clearInterval(timerInterval);
    const finalTime = (Date.now() - startTime) / 1000;
    savePersonalBest(finalTime);
    
    UI.promptTypeIndicator.textContent = "STAGE COMPLETE";
    UI.promptDisplay.textContent = `${finalTime.toFixed(1)}s`;
    UI.interactionBox.innerHTML = `<button class="option-btn" style="justify-content:center; flex-direction:row;" onclick="location.reload()">Restart Stage</button>`;
}

function loadPersonalBest() {
    const pb = localStorage.getItem('mandarin_100_pb');
    if (pb) {
        UI.pb.textContent = `PB: ${parseFloat(pb).toFixed(1)}s`;
    }
}

function savePersonalBest(time) {
    const currentPb = localStorage.getItem('mandarin_100_pb');
    if (!currentPb || time < parseFloat(currentPb)) {
        localStorage.setItem('mandarin_100_pb', time);
        UI.pb.textContent = `PB: ${time.toFixed(1)}s`;
    }
}

init();