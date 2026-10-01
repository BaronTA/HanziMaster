import { speak } from './audio.js';
import { triggerCombatParticles, triggerDeathParticles, triggerErrorFlash } from './effects.js';

let stageData = [];
let currentPhase = 1; 
let currentIndex = 0; 
let startTime = null;
let timerInterval = null;
let activeKeyHandler = null;

const UI = {
    viewContainer: document.getElementById('view-container')
};

async function init() {
    try {
        const response = await fetch('data/stage_01.json');
        stageData = await response.json();
        renderMainMenu();
    } catch (e) {
        console.error("Failed to load stage data:", e);
    }
}

// ==================== MAIN MENU VIEW ====================
function renderMainMenu() {
    UI.viewContainer.innerHTML = `
        <div id="menu-view">
            <div class="menu-title">MANDARIN 100</div>
            <div class="menu-buttons">
                <button class="menu-btn" id="btn-play-stage1">Start Stage 01 Gauntlet</button>
                <button class="menu-btn" id="btn-codex">Hanzi Codex (Bestiary)</button>
            </div>
        </div>
    `;

    document.getElementById('btn-play-stage1').onclick = () => startGauntlet();
    document.getElementById('btn-codex').onclick = () => renderCodexView();
}

// ==================== COLLECTION CODEX VIEW (BESTIARY) ====================
function renderCodexView() {
    let cardsHtml = stageData.map((word, idx) => `
        <div class="codex-card" data-index="${idx}" title="Click to hear pronunciation">
            <div class="codex-card-hanzi">${word.hanzi}</div>
            <div class="codex-card-pinyin">${word.pinyin}</div>
            <div class="codex-card-eng">${word.english[0]}</div>
        </div>
    `).join('');

    UI.viewContainer.innerHTML = `
        <div id="codex-view">
            <div class="codex-header">
                <span style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--text-secondary);">Captured Character Database (${stageData.length} Entries)</span>
                <button class="menu-btn" id="btn-back-menu" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Back to Menu</button>
            </div>
            <div class="codex-grid">
                ${cardsHtml}
            </div>
        </div>
    `;

    document.getElementById('btn-back-menu').onclick = () => renderMainMenu();

    document.querySelectorAll('.codex-card').forEach(card => {
        const idx = card.getAttribute('data-index');
        card.onclick = () => {
            speak(stageData[idx].hanzi);
            card.style.borderColor = 'var(--text-primary)';
            setTimeout(() => card.style.borderColor = '#27272a', 300);
        };
    });
}

// ==================== COMBAT ARENA VIEW ====================
function startGauntlet() {
    currentPhase = 1;
    currentIndex = 0;
    startTime = null;
    clearInterval(timerInterval);

    renderArenaLayout();
    loadEncounter();
}

function renderArenaLayout() {
    let hpSegmentsHtml = '';
    for (let i = 0; i < 100; i++) {
        hpSegmentsHtml += `<div class="hp-segment" id="hp-seg-${i}"></div>`;
    }

    UI.viewContainer.innerHTML = `
        <div id="arena-view" style="background-image: url('assets/background1.png');">
            <!-- HUD / Boss HP Bar & Exit Menu Button -->
            <div id="arena-hud">
                <span class="hud-skull">💀</span>
                <div class="health-bar-container" id="boss-health-bar">
                    ${hpSegmentsHtml}
                </div>
                <span id="boss-hp-text">100 / 100</span>
                <button class="exit-menu-btn" id="btn-exit-menu" title="Return to Menu">EXIT</button>
            </div>

            <!-- Battleground Sprites -->
            <div id="battleground">
                <div id="hero-sprite" class="sprite" style="background-image: url('assets/herostand.png');"></div>
                <div id="boss-sprite" class="sprite" style="background-image: url('assets/boss1.png');"></div>
            </div>

            <!-- Central Interactive Question UI -->
            <div id="battle-ui">
                <div id="prompt-box">
                    <div id="prompt-display">--</div>
                    <div id="sub-prompt-display">--</div>
                </div>
                <div id="options-row"></div>
            </div>
        </div>
    `;

    document.getElementById('btn-exit-menu').onclick = () => {
        clearInterval(timerInterval);
        cleanupListeners();
        renderMainMenu();
    };
}

function updateBossHealthBar() {
    const remainingHp = stageData.length - currentIndex;
    const hpText = document.getElementById('boss-hp-text');
    if (hpText) hpText.textContent = `${remainingHp} / 100`;

    for (let i = 0; i < stageData.length; i++) {
        const seg = document.getElementById(`hp-seg-${i}`);
        if (!seg) continue;
        if (i >= remainingHp) {
            seg.classList.add('depleted');
        } else {
            seg.classList.remove('depleted');
        }
    }
}

function startTimerIfNeeded() {
    if (!startTime) {
        startTime = Date.now();
        timerInterval = setInterval(() => {}, 100);
    }
}

function cleanupListeners() {
    if (activeKeyHandler) {
        document.removeEventListener('keydown', activeKeyHandler, true);
        activeKeyHandler = null;
    }
}

function loadEncounter() {
    cleanupListeners();

    if (currentIndex >= stageData.length) {
        if (currentPhase === 1) {
            currentPhase = 2;
            currentIndex = 0;
            triggerPhase2HardModeTransition();
            return;
        } else {
            stageComplete();
            return;
        }
    }

    updateBossHealthBar();
    const word = stageData[currentIndex];
    const promptDisplay = document.getElementById('prompt-display');
    const subPromptDisplay = document.getElementById('sub-prompt-display');

    if (currentPhase === 1) {
        promptDisplay.textContent = word.hanzi;
        subPromptDisplay.textContent = word.pinyin;
        speak(word.hanzi);
        renderEnglishOptions(word);
    } else {
        promptDisplay.textContent = word.english[0].toUpperCase();
        subPromptDisplay.textContent = "";
        renderHanziOptions(word);
    }
}

function triggerPhase2HardModeTransition() {
    const promptDisplay = document.getElementById('prompt-display');
    const subPromptDisplay = document.getElementById('sub-prompt-display');
    const optionsRow = document.getElementById('options-row');
    const bossSprite = document.getElementById('boss-sprite');

    if (bossSprite) {
        bossSprite.classList.add('phase2-true-form');
    }

    promptDisplay.textContent = "TRUE FORM BOSS";
    subPromptDisplay.textContent = "PHASE 2 HARD MODE ACTIVE (ENGLISH ➔ HANZI)";
    optionsRow.innerHTML = `
        <button class="option-btn" style="justify-content: center; flex-direction: row; border-color: var(--phase2-accent);" id="phase2-start-btn">
            <span>[Press Any Key or Click to Attack True Form]</span>
        </button>
    `;

    setTimeout(() => {
        const transitionHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', transitionHandler, true);
            loadEncounter();
        };
        document.addEventListener('keydown', transitionHandler, true);

        const btn = document.getElementById('phase2-start-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                loadEncounter();
            };
        }
    }, 300);
}

function renderEnglishOptions(word) {
    const optionsRow = document.getElementById('options-row');
    optionsRow.innerHTML = '';
    
    const correctAns = word.english[0];
    const options = [...word.distractors.slice(0, 3), correctAns]
        .sort(() => Math.random() - 0.5);

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `${opt} <span>[${idx + 1}]</span>`;
        btn.onclick = (e) => {
            e.preventDefault();
            startTimerIfNeeded();
            handleSelection(opt, correctAns, word);
        };
        optionsRow.appendChild(btn);
    });

    activeKeyHandler = (e) => {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
        if (keyMap.hasOwnProperty(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            startTimerIfNeeded();
            handleSelection(options[keyMap[e.key]], correctAns, word);
        }
    };
    document.addEventListener('keydown', activeKeyHandler, true);
}

function renderHanziOptions(word) {
    const optionsRow = document.getElementById('options-row');
    optionsRow.innerHTML = '';
    
    const correctAns = word.hanzi;
    const otherWords = stageData.filter(w => w.hanzi !== word.hanzi);
    const shuffledPool = [...otherWords].sort(() => Math.random() - 0.5);
    const dynamicDistractors = shuffledPool.slice(0, 3).map(w => w.hanzi);
    
    const options = [...dynamicDistractors, correctAns]
        .sort(() => Math.random() - 0.5);

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.style.fontSize = '1.75rem';
        btn.innerHTML = `${opt} <span>[${idx + 1}]</span>`;
        btn.onclick = (e) => {
            e.preventDefault();
            startTimerIfNeeded();
            handleSelection(opt, correctAns, word);
        };
        optionsRow.appendChild(btn);
    });

    activeKeyHandler = (e) => {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
        if (keyMap.hasOwnProperty(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            startTimerIfNeeded();
            handleSelection(options[keyMap[e.key]], correctAns, word);
        }
    };
    document.addEventListener('keydown', activeKeyHandler, true);
}

function handleSelection(selected, correct, word) {
    cleanupListeners();

    if (selected === correct) {
        const heroSprite = document.getElementById('hero-sprite');
        const bossSprite = document.getElementById('boss-sprite');

        if (heroSprite) {
            heroSprite.style.backgroundImage = "url('assets/heroattack.png')";
            heroSprite.style.transform = "translateX(40px)";
        }
        if (bossSprite) {
            bossSprite.style.transform = "translateX(12px) rotate(3deg)";
        }

        triggerCombatParticles(bossSprite);

        setTimeout(() => {
            if (heroSprite) {
                heroSprite.style.backgroundImage = "url('assets/herostand.png')";
                heroSprite.style.transform = "translateX(0)";
            }
            if (bossSprite) {
                bossSprite.style.transform = "translateX(0) rotate(0)";
            }

            currentIndex++;
            loadEncounter();
        }, 180);
    } else {
        handleError(word, selected, correct);
    }
}

function handleError(word, userChoice, correctChoice) {
    triggerErrorFlash();
    clearInterval(timerInterval);
    cleanupListeners();

    const heroSprite = document.getElementById('hero-sprite');
    const bossSprite = document.getElementById('boss-sprite');

    // Hero dies and falls
    if (heroSprite) {
        heroSprite.style.backgroundImage = "url('assets/herodead.png')";
    }
    // Monster lunges forward toward the screen/hero on a fatal mistake
    if (bossSprite) {
        bossSprite.style.transform = "translateX(-60px) scale(1.08)";
    }

    triggerDeathParticles(heroSprite);

    const promptDisplay = document.getElementById('prompt-display');
    const subPromptDisplay = document.getElementById('sub-prompt-display');
    const optionsRow = document.getElementById('options-row');

    promptDisplay.innerHTML = `<span style="color: var(--danger);">你死了</span>`;
    subPromptDisplay.textContent = `Defeated on Phase ${currentPhase} (Word ${currentIndex + 1}/100)`;

    optionsRow.innerHTML = `
        <div style="background: rgba(18,18,22,0.9); border: 1px solid #3f3f46; padding: 1rem; width: 100%; display: flex; flex-direction: column; gap: 0.4rem; font-family: var(--font-mono); font-size: 0.8rem; text-align: left;">
            <div style="color: var(--text-secondary); border-bottom: 1px solid #3f3f46; padding-bottom: 0.3rem;">COMBAT FATALITY RECAP</div>
            <div style="font-family: var(--font-sans); font-size: 1.05rem; padding: 0.1rem 0;">
                Target: <strong>${word.hanzi}</strong> (${word.pinyin}) — <em>${word.english[0]}</em>
            </div>
            <div>Phase: <span style="color: var(--danger);">Phase ${currentPhase} (${currentPhase === 1 ? 'Forward' : 'Reverse'})</span></div>
            <div>Your Choice: <span style="color: var(--danger);">${userChoice}</span></div>
            <div>Correct Answer: <span style="color: var(--success);">${correctChoice}</span></div>
        </div>
        <button class="option-btn" style="justify-content: center; flex-direction: row; margin-top: 0.25rem;" id="restart-btn">
            <span>[Press Any Key or Click to Revive & Retry Stage]</span>
        </button>
    `;

    setTimeout(() => {
        const restartHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', restartHandler, true);
            startGauntlet();
        };
        document.addEventListener('keydown', restartHandler, true);

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.onclick = (e) => {
                e.preventDefault();
                startGauntlet();
            };
        }
    }, 500);
}

function stageComplete() {
    clearInterval(timerInterval);
    
    const promptDisplay = document.getElementById('prompt-display');
    const subPromptDisplay = document.getElementById('sub-prompt-display');
    const optionsRow = document.getElementById('options-row');

    promptDisplay.textContent = "🏆";
    subPromptDisplay.textContent = `VICTORY! BOSS SLAIN`;
    optionsRow.innerHTML = `
        <button class="option-btn" style="justify-content: center; flex-direction: row;" onclick="renderMainMenu()">
            <span>[Return to Main Menu]</span>
        </button>
    `;
}

init();