/*
Resume du fichier :
Ce fichier contient le mode solo : configuration, choix des questions, timer, reponses, score et fin de partie.
C'est ici qu'on modifie le comportement d'une partie jouee seul.
*/

let soloAdaptive = { history: [], level: 'medium', streak: 0, responseTimes: [] };

// Ajuste doucement la difficulte solo selon les reponses du joueur.
function updateSoloAdaptive(correct, responseTime) {
    const WINDOW = 5;
    soloAdaptive.history.push(correct ? 1 : 0);
    if (soloAdaptive.history.length > WINDOW) soloAdaptive.history = soloAdaptive.history.slice(-WINDOW);
    soloAdaptive.responseTimes.push(responseTime);
    if (soloAdaptive.responseTimes.length > WINDOW) soloAdaptive.responseTimes = soloAdaptive.responseTimes.slice(-WINDOW);
    
    if (correct) soloAdaptive.streak = Math.max(0, soloAdaptive.streak) + 1;
    else soloAdaptive.streak = Math.min(0, soloAdaptive.streak) - 1;
    
    if (soloAdaptive.history.length >= 3) {
        const ratio = soloAdaptive.history.reduce((a, b) => a + b, 0) / soloAdaptive.history.length;
        if (ratio >= 0.8 && soloAdaptive.streak >= 3) {
            if (soloAdaptive.level === 'easy') soloAdaptive.level = 'medium';
            else if (soloAdaptive.level === 'medium') soloAdaptive.level = 'hard';
        } else if (ratio < 0.4 || soloAdaptive.streak <= -2) {
            if (soloAdaptive.level === 'hard') soloAdaptive.level = 'medium';
            else if (soloAdaptive.level === 'medium') soloAdaptive.level = 'easy';
        }
    }
}

function getSoloAdaptiveModifiers() {
    const mods = { easy: { timerBonus: 5, scoreMultiplier: 0.8 }, medium: { timerBonus: 0, scoreMultiplier: 1.0 }, hard: { timerBonus: -3, scoreMultiplier: 1.5 } };
    return mods[soloAdaptive.level] || mods.medium;
}

function resetSoloAdaptive() {
    soloAdaptive = { history: [], level: 'medium', streak: 0, responseTimes: [] };
}

// Selection adaptative solo : place une question non jouee dont
// le tag de difficulte correspond au niveau actuel dans la prochaine position,
// sans changer la logique d index de showNextSoloQuestion. Sinon, on essaie
// une difficulte proche, puis on garde l ordre original si rien n est tague.
function pickSoloQuestionForDifficulty() {
    const start = soloQuestionIndex;
    if (!Array.isArray(soloQuestions) || start >= soloQuestions.length - 1) return;
    const target = { easy: 1, medium: 2, hard: 3 }[soloAdaptive.level] || 2;

    const remaining = [];
    for (let i = start; i < soloQuestions.length; i++) {
        if (soloQuestions[i] && typeof soloQuestions[i].difficulty === 'number') remaining.push(i);
    }
    if (!remaining.length) return; // no difficulty tags — keep original order

    const exact = remaining.filter(i => soloQuestions[i].difficulty === target);
    const adjacent = remaining.filter(i => Math.abs(soloQuestions[i].difficulty - target) <= 1);
    const pool = exact.length ? exact : (adjacent.length ? adjacent : remaining);
    const pickIdx = pool[Math.floor(Math.random() * pool.length)];

    if (pickIdx !== start) {
        const tmp = soloQuestions[start];
        soloQuestions[start] = soloQuestions[pickIdx];
        soloQuestions[pickIdx] = tmp;
    }
}

// Quiz type selection
if (!window.selectedQuizType) window.selectedQuizType = { solo: 'classic', multi: 'classic' };
try { selectedQuizType = window.selectedQuizType; } catch (e) {}

function selectQuizType(mode, type, el) {
    selectedQuizType[mode] = type;
    const parent = el.closest('.setup-quiz-types');
    parent.querySelectorAll('.setup-quiz-type').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

// ============================================
// TEAM SELECTION
// ============================================

function resetTeamButtonStyles() {
    ['joinTeamRed', 'joinTeamBlue'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('selected', 'disabled');
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        }
    });
}

function selectJoinTeam(team) {
    const redDiv = document.getElementById('joinTeamRed');
    const blueDiv = document.getElementById('joinTeamBlue');
    if (team === 'red' && redDiv?.classList.contains('disabled')) return;
    if (team === 'blue' && blueDiv?.classList.contains('disabled')) return;
    selectedJoinTeam = team;
    redDiv?.classList.remove('selected');
