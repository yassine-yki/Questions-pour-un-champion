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
var selectedQuizType = window.selectedQuizType;

function selectQuizType(mode, type, el) {
    selectedQuizType[mode] = type;
    const parent = el.closest('.setup-quiz-types');
    parent.querySelectorAll('.setup-quiz-type').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

function isPicguessQuestion(question) {
    return !!question && (
        question.picguess === true ||
        question.category === 'picguess' ||
        question.subject === 'picguess'
    );
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
    blueDiv?.classList.remove('selected');
    if (team === 'red') redDiv?.classList.add('selected');
    else blueDiv?.classList.add('selected');
}

// ============================================
// OUTILS WEBSOCKET
// ============================================

function getWebSocketUrl(code) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/${code}`;
}

// ============================================
// MODE SOLO
// ============================================

// Point de depart du mode solo : verifie le nom, les sujets, puis lance la partie.
async function startSoloGame() {
    const nameEl = document.getElementById('soloName');
    const name = nameEl?.value.trim();
    const subjects = getSelectedSubjects('soloSubjects');
    const customCategoryEl = document.getElementById('customCategoryInput');
    const customCategory = customCategoryEl ? customCategoryEl.value.trim() : '';
    
    // Validation avec retour visuel
    if (!name) {
        nameEl?.focus();
        nameEl?.classList.add('input-error');
        setTimeout(() => nameEl?.classList.remove('input-error'), 1500);
        showMessage('⚠️ ' + t('alertName')); return;
    }
    
    if (!customCategory && subjects.length === 0) {
        showMessage('⚠️ ' + t('alertSubjects')); return;
    }
    
    // Etat de chargement sur le bouton de lancement
    const launchBtn = document.querySelector('#soloSetupScreen .setup-launch-btn');
    if (launchBtn) { launchBtn.disabled = true; launchBtn.textContent = '⏳ Chargement...'; }
    
    try {
        if (customCategory && customCategory.length > 0) {
            await startSoloGameWithAI(name, customCategory);
        } else if (subjects.length > 0) {
            await startSoloGameWithPredefined(name, subjects);
        }
    } finally {
        if (launchBtn) { launchBtn.disabled = false; launchBtn.textContent = '🚀 Lancer le Quiz'; }
    }
}

async function startSoloGameWithPredefined(name, subjects) {
    gameMode = 'solo';
    soloScore = 0;
    soloQuestionIndex = 0;
    resetSoloAdaptive();
    
    try {
        const response = await fetch(`/api/questions?language=${selectedLanguage}&subjects=${subjects.join(',')}`);
        const data = await response.json();
        soloQuestions = data.questions;
        if (soloQuestions.length === 0) { showMessage('⚠️ No questions available'); return; }
        showScreen('soloGameScreen');
        showNextSoloQuestion();
    } catch (error) {
        console.error('Error:', error);
        showMessage('⚠️ ' + t('connectionError'));
    }
}

async function startSoloGameWithAI(name, category, retryCount = 0) {
    const MAX_RETRIES = 5;
    
    // Affiche la fenetre de chargement
    const loadingModal = document.getElementById('aiLoadingModal');
    const loadingCategory = document.getElementById('aiLoadingCategory');
    const loadingText = document.getElementById('aiLoadingText');
    
    if (loadingModal) loadingModal.style.display = 'flex';
    if (loadingCategory) loadingCategory.textContent = category;
    
    // Met a jour le texte selon le nombre de tentatives
    if (loadingText) {
        if (retryCount === 0) {
            loadingText.innerHTML = `${t('aiLoadingText')} "<span id="aiLoadingCategory">${category}</span>"`;
        } else {
            loadingText.innerHTML = `${t('aiLoadingRetry')} ${retryCount}/${MAX_RETRIES} 🔄`;
        }
    }
    
    gameMode = 'solo';
    soloScore = 0;
    soloQuestionIndex = 0;
    resetSoloAdaptive();
    
    try {
        const response = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: category,
                count: 10,
                language: selectedLanguage
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.questions && data.questions.length > 0) {
            // Cache la fenetre de chargement
            if (loadingModal) loadingModal.style.display = 'none';
            
            // Transforme les questions IA au format attendu par le jeu
            soloQuestions = data.questions.map((q, idx) => {
                // Trouve la position de la bonne reponse dans les options
                const correctIndex = q.options.findIndex(opt => opt === q.answer);
                return {
                    q: q.question,
                    options: q.options,
                    correct: correctIndex >= 0 ? correctIndex : 0,  // Utilise 0 par defaut si rien n est trouve
                    time: 15  // Donne un peu plus de temps aux questions IA
                };
            });
            
            showScreen('soloGameScreen');
            showNextSoloQuestion();
        } else if (data.retry && retryCount < MAX_RETRIES) {
            // Le modele charge encore, nouvelle tentative apres un delai
            console.log(`AI model loading, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => startSoloGameWithAI(name, category, retryCount + 1), 3000);
        } else if (retryCount >= MAX_RETRIES) {
            // Nombre maximum de tentatives atteint
            if (loadingModal) loadingModal.style.display = 'none';
            alert(t('aiErrorTimeout'));
        } else {
            if (loadingModal) loadingModal.style.display = 'none';
            alert(data.error || t('aiErrorGeneration'));
        }
    } catch (error) {
        console.error('Error generating AI questions:', error);
        if (retryCount < MAX_RETRIES) {
            console.log(`Network error, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => startSoloGameWithAI(name, category, retryCount + 1), 3000);
        } else {
            if (loadingModal) loadingModal.style.display = 'none';
            alert(t('aiErrorConnection'));
        }
    }
}

// Champ categorie personnalisee : deselectionne les sujets quand on tape
document.addEventListener('DOMContentLoaded', function() {
    // Categorie personnalisee du mode solo
    const customInput = document.getElementById('customCategoryInput');
    const soloSubjectsContainer = document.getElementById('soloSubjects');
    
    if (customInput) {
        customInput.addEventListener('input', function() {
            if (this.value.trim()) {
                // Deselectionne les sujets quand une categorie personnalisee est saisie
                if (soloSubjectsContainer) {
                    soloSubjectsContainer.classList.add('custom-category-active');
                    soloSubjectsContainer.querySelectorAll('.subject-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                }
            } else {
                if (soloSubjectsContainer) {
                    soloSubjectsContainer.classList.remove('custom-category-active');
                }
            }
        });
    }
    
    // Vide le champ personnalise quand un sujet existant est choisi
    if (soloSubjectsContainer) {
        soloSubjectsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('subject-btn')) {
                if (customInput) {
                    customInput.value = '';
                    soloSubjectsContainer.classList.remove('custom-category-active');
                }
            }
        });
    }
    
    // Categorie personnalisee du mode multijoueur
    const customInputMulti = document.getElementById('customCategoryInputMulti');
    const createSubjectsContainer = document.getElementById('createSubjects');
    
    if (customInputMulti) {
        customInputMulti.addEventListener('input', function() {
            if (this.value.trim()) {
                // Deselectionne les sujets quand une categorie personnalisee est saisie
                if (createSubjectsContainer) {
                    createSubjectsContainer.classList.add('custom-category-active');
                    createSubjectsContainer.querySelectorAll('.subject-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                }
            } else {
                if (createSubjectsContainer) {
                    createSubjectsContainer.classList.remove('custom-category-active');
                }
            }
        });
    }
    
    // Vide le champ personnalise quand un sujet deja prevu est choisi en multijoueur
    if (createSubjectsContainer) {
        createSubjectsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('subject-btn')) {
                if (customInputMulti) {
                    customInputMulti.value = '';
                    createSubjectsContainer.classList.remove('custom-category-active');
                }
            }
        });
    }
});

// Affiche la prochaine question solo et demarre son chrono.
function showNextSoloQuestion() {
    if (soloQuestionIndex >= soloQuestions.length) { showSoloGameOver(); return; }

    // Adaptatif : choisit la prochaine question selon la difficulte actuelle.
    pickSoloQuestionForDifficulty();

    soloCurrentQuestion = soloQuestions[soloQuestionIndex];
    
    // Met a jour le badge de score
    const scoreEl = document.getElementById('soloScore');
    if (scoreEl) {
        const scoreValue = scoreEl.querySelector('.score-value');
        if (scoreValue) {
            scoreValue.textContent = soloScore;
        }
    }
    
    // Met a jour le badge de question
    const questionBadge = document.getElementById('soloQuestionBadge');
    if (questionBadge) {
        const questionValue = questionBadge.querySelector('.question-value');
        if (questionValue) {
            questionValue.textContent = `${soloQuestionIndex + 1}/${soloQuestions.length}`;
        }
    }
    
    const isPicguess = isPicguessQuestion(soloCurrentQuestion);

    // Gere l image de la question (drapeaux, picguess, etc.)
    const questionImageEl = document.getElementById('soloQuestionImage');
    if (questionImageEl) {
        questionImageEl.querySelectorAll('.picguess-reveal-meter, .picguess-hint').forEach(el => el.remove());
        if (soloCurrentQuestion.image) {
            questionImageEl.style.display = 'block';
            questionImageEl.classList.toggle('picguess-frame', isPicguess);
            const img = questionImageEl.querySelector('img');
            if (img) {
                img.src = soloCurrentQuestion.image;
                if (!isPicguess && typeof window.resetPicguessImageReveal === 'function') {
                    window.resetPicguessImageReveal(img);
                } else if (!isPicguess) {
                    img.style.filter = '';
                    img.style.transform = '';
                    img.style.transition = '';
                }
            }
        } else {
            questionImageEl.style.display = 'none';
            questionImageEl.classList.remove('picguess-frame');
            const img = questionImageEl.querySelector('img');
            if (img && typeof window.resetPicguessImageReveal === 'function') {
                window.resetPicguessImageReveal(img);
            }
        }
    }
    
    const questionText = document.getElementById('soloQuestionText');
    if (questionText) questionText.textContent = soloCurrentQuestion.q;
    const questionNumber = document.getElementById('soloQuestionNumber');
    if (questionNumber) questionNumber.textContent = `${soloQuestionIndex + 1} / ${soloQuestions.length}`;

    // Ajoute l animation d entree de la question
    const questionBox = document.querySelector('#soloGameScreen .question-box');
    if (questionBox) {
        questionBox.classList.remove('entering');
        void questionBox.offsetWidth; // Force le recalcul visuel
        questionBox.classList.add('entering');
    }

    // Store time info for scoring — adjust for quiz type + adaptive difficulty
    const soloQType = selectedQuizType.solo || 'classic';
    let baseTime = soloCurrentQuestion.time || 10;
    if (soloQType === 'speed') baseTime = Math.max(5, Math.floor(baseTime / 2));
    else if (isPicguess) baseTime = Math.max(baseTime, 15);
    
    // Applique le modificateur de chrono adaptatif
    const adaptMods = getSoloAdaptiveModifiers();
    baseTime = Math.max(5, baseTime + adaptMods.timerBonus);
    
    window.soloTimeLeft = baseTime;
    window.soloMaxTime = window.soloTimeLeft;
    window.soloScoreMultiplier = adaptMods.scoreMultiplier;
    const timerEl = document.getElementById('soloTimer');
    
    // Utilise le chrono circulaire
    if (timerEl) {
        timerEl.innerHTML = createCircularTimer(window.soloTimeLeft, window.soloMaxTime);
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        window.soloTimeLeft--;
        if (timerEl) {
            timerEl.innerHTML = createCircularTimer(window.soloTimeLeft, window.soloMaxTime);
        }
        if (window.soloTimeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleSoloTimeout(); 
        }
    }, 1000);

    const optionsBox = document.getElementById('soloOptionsBox');
    if (optionsBox) {
        optionsBox.innerHTML = '';
        const soloQType = selectedQuizType.solo || 'classic';
        
        if (soloQType === 'truefalse') {
            // Convertit en Vrai/Faux pour le solo
            const correctOption = soloCurrentQuestion.options[soloCurrentQuestion.correct];
            const useCorrect = Math.random() > 0.5;
            let tfQuestion, tfCorrectIdx;
            if (useCorrect) {
                tfQuestion = `${soloCurrentQuestion.q} → ${correctOption}`;
                tfCorrectIdx = 0;
            } else {
                const wrongOpts = soloCurrentQuestion.options.filter((_, i) => i !== soloCurrentQuestion.correct);
                tfQuestion = `${soloCurrentQuestion.q} → ${wrongOpts[0] || correctOption}`;
                tfCorrectIdx = 1;
            }
            // Remplace le texte de la question
            document.getElementById('soloQuestionText').textContent = tfQuestion;
            soloCurrentQuestion = { ...soloCurrentQuestion, options: ['Vrai', 'Faux'], correct: tfCorrectIdx };
            
            optionsBox.style.gridTemplateColumns = 'repeat(2, 1fr)';
            const tfVariants = ['option--a', 'option--b'];
            soloCurrentQuestion.options.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.className = `option ${tfVariants[idx % 2]}`;
                const letter = document.createElement('span');
                letter.className = 'option__letter';
                letter.textContent = option === 'Vrai' ? '✅' : '❌';
                const text = document.createElement('span');
                text.className = 'option__text';
                text.textContent = option;
                btn.append(letter, text);
                btn.onclick = () => handleSoloAnswer(idx);
                btn.style.animationDelay = (idx * 0.06) + 's';
                optionsBox.appendChild(btn);
            });
        } else {
            optionsBox.style.gridTemplateColumns = 'repeat(2, 1fr)';
            const optLetters = ['A', 'B', 'C', 'D'];
            const optVariants = ['option--a', 'option--b', 'option--c', 'option--d'];
            soloCurrentQuestion.options.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.className = `option ${optVariants[idx % 4]}`;
                const letter = document.createElement('span');
                letter.className = 'option__letter';
                letter.textContent = optLetters[idx % 4];
                const text = document.createElement('span');
                text.className = 'option__text';
                text.textContent = option;
                btn.append(letter, text);
                btn.onclick = () => handleSoloAnswer(idx);
                btn.style.animationDelay = (idx * 0.06) + 's';
                optionsBox.appendChild(btn);
            });
        }
        
        // Picguess category: progressive reveal.
        if (isPicguess && soloCurrentQuestion.image) {
            const qImg = document.querySelector('#soloQuestionImage img');
            if (qImg) {
                const holder = document.getElementById('soloQuestionImage');
                if (holder) {
                    holder.style.display = 'block';
                    holder.classList.add('picguess-frame');
                    holder.insertAdjacentHTML('beforeend', `
                        <div class="picguess-hint">${selectedLanguage === 'fr' ? 'L image se revele...' : 'Image revealing...'}</div>
                        <div class="picguess-reveal-meter"><span class="picguess-reveal-meter__fill"></span></div>
                    `);
                    const fill = holder.querySelector('.picguess-reveal-meter__fill');
                    if (fill) fill.style.animationDuration = `${window.soloMaxTime || 15}s`;
                }
                const durationMs = (window.soloMaxTime || 15) * 1000;
                if (typeof window.startPicguessImageReveal === 'function') {
                    window.startPicguessImageReveal(qImg, {
                        blurStart: soloCurrentQuestion.blurStart || 20,
                        durationMs
                    });
                } else {
                    qImg.style.filter = `blur(${soloCurrentQuestion.blurStart || 20}px) brightness(0.72) saturate(0.8)`;
                    qImg.style.transform = 'scale(1.06)';
                    qImg.style.transition = `filter ${durationMs}ms linear, transform ${durationMs}ms linear`;
                    void qImg.offsetWidth;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            qImg.style.filter = 'blur(0px) brightness(1) saturate(1)';
                            qImg.style.transform = 'scale(1)';
                        });
                    });
                }
            }
        }
    }
    hideSoloMessage();
}

// Constantes de score

// Calcule le score selon le temps restant
function calculateTimeScore(timeLeft, maxTime) {
    // Score = MIN + (MAX - MIN) * (timeLeft / maxTime)
    // Reponse rapide = plus de points
    const timeRatio = Math.max(0, timeLeft / maxTime);
    const score = Math.round(MIN_CORRECT_POINTS + (MAX_CORRECT_POINTS - MIN_CORRECT_POINTS) * timeRatio);
    return score;
}

// Traite la reponse solo : score, feedback visuel, puis question suivante.
function handleSoloAnswer(idx) {
    clearInterval(timerInterval);
    const correct = idx === soloCurrentQuestion.correct;
    const responseTime = (window.soloMaxTime || 10) - (window.soloTimeLeft || 0);
    const scoreMultiplier = window.soloScoreMultiplier || 1.0;
    
    // Met a jour l etat de difficulte adaptative
    updateSoloAdaptive(correct, responseTime);
    
    if (correct) {
        // Calcule le score au temps avec le multiplicateur adaptatif
        const basePoints = calculateTimeScore(window.soloTimeLeft || 0, window.soloMaxTime || 10);
        const earnedPoints = Math.round(basePoints * scoreMultiplier);
        soloScore += earnedPoints;
        
        playSfx('correct');
        const scoreEl = document.getElementById('soloScore');
        if (scoreEl) {
            const scoreValue = scoreEl.querySelector('.score-value');
            if (scoreValue) scoreValue.textContent = soloScore;
            scoreEl.classList.remove('updated');
            void scoreEl.offsetWidth;
            scoreEl.classList.add('updated');
        }
        const multiplierLabel = scoreMultiplier > 1 ? ` (×${scoreMultiplier})` : '';
        showPointsPopup(`+${earnedPoints}${multiplierLabel}`, true);
        showFeedbackFlash(true);
        createConfetti(30);
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    } else { 
        soloScore = Math.max(0, soloScore - WRONG_ANSWER_PENALTY);
        
        playSfx('wrong');
        
        if (selectedTheme === 'horror' && Math.random() > 0.7) {
            triggerHorrorJumpscare();
        }
        
        const scoreEl = document.getElementById('soloScore');
        if (scoreEl) {
            const scoreValue = scoreEl.querySelector('.score-value');
            if (scoreValue) scoreValue.textContent = soloScore;
            scoreEl.classList.remove('updated');
            void scoreEl.offsetWidth;
            scoreEl.classList.add('updated');
        }
        
        showPointsPopup(`-${WRONG_ANSWER_PENALTY}`, false);
        showFeedbackFlash(false);
        shakeScreen();
        if (navigator.vibrate) navigator.vibrate(150);
    }

    document.querySelectorAll('#soloOptionsBox .option').forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) { opt.classList.add('correct'); animateCorrectOption(opt); }
        else if (i === idx && !correct) opt.classList.add('incorrect');
    });

    showSoloMessage(correct ? t('correct') : `${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`);
    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 3000);
}

function handleSoloTimeout() {
    // Penalite de temps ecoule (comme une mauvaise reponse)
    soloScore = Math.max(0, soloScore - WRONG_ANSWER_PENALTY);
    
    playSfx('wrong');
    
    // Met a jour l affichage du score
    const scoreEl = document.getElementById('soloScore');
    if (scoreEl) {
        const scoreValue = scoreEl.querySelector('.score-value');
        if (scoreValue) {
            scoreValue.textContent = soloScore;
        }
    }
    
    showPointsPopup(`-${WRONG_ANSWER_PENALTY}`, false);
    showFeedbackFlash(false);
    shakeScreen();
    document.querySelectorAll('#soloOptionsBox .option').forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) { opt.classList.add('correct'); animateCorrectOption(opt); }
    });
    showSoloMessage(`⏰ ${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`);
    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 3000);
}

function showSoloGameOver() {
    clearInterval(timerInterval);
    
    // Sauvegarde les statistiques dans Supabase si le joueur est connecte
    if (currentPlayer) {
        // En solo, on considere une victoire si le score est positif
        const didWin = soloScore > 0;
        updatePlayerStats(soloScore, didWin, 1);
        console.log(`[Solo] Stats saved: Score=${soloScore}, Won=${didWin}`);
    }
    
    // Affiche le podium du mode solo
    showPodiumCelebration([{
        name: document.getElementById('soloName')?.value || 'Player',
        score: soloScore
    }], true);
}

// Enhanced feedback functions
function showPointsPopup(text, isCorrect) {
    const popup = document.createElement('div');
    popup.className = `points-popup ${isCorrect ? 'correct' : 'wrong'}`;
    popup.textContent = text;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1800);
}

function showFeedbackFlash(isCorrect) {
    const overlay = document.createElement('div');
    overlay.className = `feedback-overlay ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 750);
}

// Celebration du podium avec avatars
function showPodiumCelebration(players, isSolo = false) {
    // Trie par score
    const sorted = [...players].sort((a, b) => b.score - a.score);
    
    // Garde le mode pour la fonction de fermeture
    window.podiumIsSolo = isSolo;
    
    // Recupere les avatars des joueurs
    const gamePlayers = window.currentGamePlayers || [];
    const currentPlayerName = (typeof getPreferredPlayerName === 'function')
        ? getPreferredPlayerName()
        : (document.getElementById('createName')?.value || document.getElementById('joinName')?.value || '');
    
    function getPlayerAvatar(name) {
        const serverPlayer = gamePlayers.find(p => p.name === name);
        if (serverPlayer && serverPlayer.avatar) {
            return generateAvatarUrl(serverPlayer.avatar);
        } else if (name === currentPlayerName && currentAvatar) {
            return generateAvatarUrl(currentAvatar);
        } else {
            return generateAvatarUrlFromName(name);
        }
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'podium-overlay';
    overlay.innerHTML = `
        <div class="podium-title">🏆 ${isSolo ? t('gameOver') : t('finalResults')} 🏆</div>
        <div class="podium-container">
            ${sorted.length > 1 ? `
            <div class="podium-place second" style="animation-delay: 0.3s;">
                <div class="podium-avatar">
                    <img src="${getPlayerAvatar(sorted[1]?.name)}" alt="${sorted[1]?.name || ''}">
                    <span class="podium-medal">🥈</span>
                </div>
                <div class="podium-name">${sorted[1]?.name || '-'}</div>
                <div class="podium-score">${sorted[1]?.score || 0} pts</div>
                <div class="podium-stand second-stand">2</div>
            </div>
            ` : ''}
            <div class="podium-place first" style="animation-delay: 0.6s;">
                <div class="podium-avatar">
                    <img src="${getPlayerAvatar(sorted[0]?.name)}" alt="${sorted[0]?.name || ''}">
                    <span class="podium-medal">🥇</span>
                </div>
                <div class="podium-name">${sorted[0]?.name || '-'}</div>
                <div class="podium-score">${sorted[0]?.score || 0} pts</div>
                <div class="podium-stand first-stand">1</div>
            </div>
            ${sorted.length > 2 ? `
            <div class="podium-place third" style="animation-delay: 0.9s;">
                <div class="podium-avatar">
                    <img src="${getPlayerAvatar(sorted[2]?.name)}" alt="${sorted[2]?.name || ''}">
                    <span class="podium-medal">🥉</span>
                </div>
                <div class="podium-name">${sorted[2]?.name || '-'}</div>
                <div class="podium-score">${sorted[2]?.score || 0} pts</div>
                <div class="podium-stand third-stand">3</div>
            </div>
            ` : ''}
        </div>
        <button class="btn podium-btn" onclick="closePodium()">${t('continue')}</button>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate podium places
    setTimeout(() => {
        overlay.querySelectorAll('.podium-place').forEach((place, i) => {
            setTimeout(() => place.classList.add('animate-in'), i * 300);
        });
    }, 100);
    
    // Confetti celebration — double burst
    playSfx('victory');
    celebrateVictory();
    createConfetti(100);
    setTimeout(() => createConfetti(60), 800);
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function closePodium() {
    const overlay = document.querySelector('.podium-overlay');
    if (overlay) overlay.remove();
    
    if (window.podiumIsSolo) {
        // Solo : retour direct a l accueil, pas besoin d ecran de fin
        showScreen('homeScreen');
        updateAllAvatarDisplays();
    } else {
        // Multijoueur : affiche l ecran de fin avec classement et bouton revanche
        closePodiumAndShowMultiGameOver();
    }
}

// Classement anime
function showAnimatedLeaderboard(scores, duration = 3500) {
    showClubhouseScoreboard(scores, null, null, null, duration);
}

// ============================================
// TABLEAU DES SCORES - apres chaque question
// ============================================
let _prevScores = {};

function showClubhouseScoreboard(scores, message, round, maxRounds, duration = 4100) {
    const sorted = Object.entries(scores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
    
    const myName = (typeof getPreferredPlayerName === 'function' ? getPreferredPlayerName() : (document.getElementById('createName')?.value || document.getElementById('joinName')?.value || ''));
    const gamePlayers = window.currentGamePlayers || [];
    
    const getAvatar = (name) => {
        const p = gamePlayers.find(x => x.name === name);
        if (p && p.avatar && typeof generateAvatarUrl === 'function') return generateAvatarUrl(p.avatar);
        if (name === myName && typeof currentAvatar !== 'undefined' && currentAvatar && typeof generateAvatarUrl === 'function') return generateAvatarUrl(currentAvatar);
        if (typeof generateAvatarUrlFromName === 'function') return generateAvatarUrlFromName(name);
        return '';
    };

    const subtitle = message || (round ? `Manche ${round}${maxRounds ? '/' + maxRounds : ''} terminée` : 'Classement');

    const overlay = document.createElement('div');
    overlay.className = 'ch-scoreboard-overlay';
    overlay.innerHTML = `
        <div class="ch-scoreboard">
            <div class="ch-scoreboard-header">
                <div class="ch-scoreboard-title">📊 Classement</div>
                <div class="ch-scoreboard-subtitle">${subtitle}</div>
            </div>
            <div class="ch-scoreboard-list">
                ${sorted.map((p, i) => {
                    const prev = _prevScores[p.name] || 0;
                    const diff = p.score - prev;
                    const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
                    const diffText = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '—';
                    const avatarUrl = getAvatar(p.name);
                    const isMe = p.name === myName;
                    return `
                        <div class="ch-sb-row rank-${i + 1}" style="transition-delay: ${i * 0.1}s;">
                            <div class="ch-sb-rank">${i + 1}</div>
                            <div class="ch-sb-avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="">` : '<span style="font-size:20px;">👤</span>'}</div>
                            <div class="ch-sb-info">
                                <div class="ch-sb-name">${p.name}${isMe ? '<span class="ch-sb-you">(vous)</span>' : ''}</div>
                            </div>
                            <div class="ch-sb-right">
                                <div class="ch-sb-score">${p.score}</div>
                                <div class="ch-sb-change ${diffClass}">${diffText}</div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>`;
    
    document.body.appendChild(overlay);
    
    // Affiche les lignes progressivement avec GSAP
    setTimeout(() => {
        const rows = overlay.querySelectorAll('.ch-sb-row');
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(rows,
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
            );
        } else {
            rows.forEach((row, i) => {
                setTimeout(() => row.classList.add('visible'), i * 120);
            });
        }
    }, 200);
    
    // Garde les scores pour comparer au prochain affichage
    _prevScores = { ...scores };
    
    // Fermeture automatique
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }, duration);
    
    // Click to dismiss
    overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    });

    updateScores(scores);
}

// ============================================
// ELIMINATION OVERLAY — Clubhouse Style
// ============================================
function showEliminationOverlay(data) {
    updateScores(data.scores);
    
    const myName = (typeof getPreferredPlayerName === 'function' ? getPreferredPlayerName() : (document.getElementById('createName')?.value || document.getElementById('joinName')?.value || ''));
    const isMe = data.player === myName;
    const gamePlayers = window.currentGamePlayers || [];
    
    const getAvatar = (name) => {
        const p = gamePlayers.find(x => x.name === name);
        if (p && p.avatar && typeof generateAvatarUrl === 'function') return generateAvatarUrl(p.avatar);
        if (typeof generateAvatarUrlFromName === 'function') return generateAvatarUrlFromName(name);
        return '';
    };
    
    const avatarUrl = getAvatar(data.player);
    const activePlayers = data.activePlayers || [];
    
    // Desactive le buzzer si c est moi
    if (isMe) {
        const b = document.getElementById('buzzer');
        if (b) { b.disabled = true; const bt = b.querySelector('.buzzer__text'); if(bt) bt.textContent = 'ELIMINATED'; }
        shakeScreen();
    }
    
    const overlay = document.createElement('div');
    overlay.className = `ch-elimination-overlay ${isMe ? 'ch-elim-self' : ''}`;
    overlay.innerHTML = `
        <div class="ch-elim-card">
            <div class="ch-elim-skull">${isMe ? '😵' : '💀'}</div>
            <div class="ch-elim-title">${isMe ? 'Vous êtes éliminé(e) !' : 'Éliminé !'}</div>
            <div class="ch-elim-avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="${data.player}">` : '<span style="font-size:36px;">👤</span>'}</div>
            <div class="ch-elim-name">${data.player}</div>
            <div class="ch-elim-score">${data.score} pts</div>
            ${activePlayers.length > 0 ? `
                <div class="ch-elim-remaining">
                    <strong>${activePlayers.length}</strong> joueur${activePlayers.length !== 1 ? 's' : ''} restant${activePlayers.length !== 1 ? 's' : ''}
                </div>` : ''}
        </div>`;
    
    document.body.appendChild(overlay);
    
    // GSAP entrance animation
    if (typeof gsap !== 'undefined') {
        const card = overlay.querySelector('.ch-elim-card');
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        if (card) gsap.fromTo(card, { y: 50, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, delay: 0.15, ease: 'back.out(1.7)' });
    }
    
    // Joue le son d elimination
    playSfx('wrong');
    
    // Ferme automatiquement apres 3,5 secondes
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(() => overlay.remove(), 400);
    }, 3500);
    
    // Click to dismiss early
    overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    });
}

// Transition de question avec "Preparez-vous"
function showQuestionTransition(questionNum, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'get-ready-overlay';
    overlay.innerHTML = `
        <div class="get-ready-text">${t('question').toUpperCase()} ${questionNum}</div>
        <div class="countdown-number">3</div>
    `;
    document.body.appendChild(overlay);
    
    const countdownEl = overlay.querySelector('.countdown-number');
    let count = 3;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
            countdownEl.style.animation = 'none';
            void countdownEl.offsetWidth;
            countdownEl.style.animation = 'countdownPulse 1s ease-in-out';
        } else {
            clearInterval(countdownInterval);
            countdownEl.textContent = t('go');
            countdownEl.style.color = 'var(--success)';
            setTimeout(() => {
                overlay.remove();
                if (callback) callback();
            }, 500);
        }
    }, 1000);
}

function showSoloMessage(text) {
    const box = document.getElementById('soloMessageBox');
    if (box) { box.textContent = text; box.style.display = 'block'; }
}

function hideSoloMessage() {
    const box = document.getElementById('soloMessageBox');
    if (box) box.style.display = 'none';
}

// ============================================
// PARTIE MULTIJOUEUR
// ============================================

