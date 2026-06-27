/*
Resume du fichier :
Ce fichier gere le coeur du multijoueur : messages WebSocket, lobby, questions, buzzer, reponses, scores et fin de partie.
Si un evenement vient du serveur pendant une partie multi, il passe presque toujours par ici.
*/

let isAttemptingReconnect = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAYS = [0, 650, 1200, 2000, 3000];
const UX_TIMING = Object.freeze({
    gameStartMs: 1800,
    toastMs: 2200,
    reconnectOverlayAfter: 2
});
window.UX_TIMING = UX_TIMING;
window.UXState = window.UXState || { phase: 'idle', updatedAt: Date.now(), meta: {} };

function setUXState(phase, meta = {}) {
    window.UXState.phase = phase;
    window.UXState.updatedAt = Date.now();
    window.UXState.meta = meta;
    document.body.dataset.uxPhase = phase;
}
window.setUXState = setUXState;

function stopQuestionTimer() {
    clearInterval(timerInterval);
    clearInterval(window._mpTimerInt);
    timerInterval = null;
    window._mpTimerInt = null;
    if (window._mpTimerRaf) {
        cancelAnimationFrame(window._mpTimerRaf);
        window._mpTimerRaf = null;
    }
}
window.stopQuestionTimer = stopQuestionTimer;

function serverMsToPerfMs(serverMs, serverNow) {
    if (!Number.isFinite(serverMs) || !Number.isFinite(serverNow)) return null;
    return performance.now() + (serverMs - serverNow);
}

function startSyncedQuestionTimer(data = {}) {
    stopQuestionTimer();
    const durationMs = Math.max(1000, Number(data.time || 10) * 1000);
    const serverNow = Number(data.serverNow);
    const phaseEndsAt = Number(data.phaseEndsAt);
    const phaseStartedAt = Number(data.phaseStartedAt);
    const syncedEnd = serverMsToPerfMs(phaseEndsAt, serverNow);
    const endAt = syncedEnd || (performance.now() + durationMs);
    const totalMs = Number.isFinite(phaseEndsAt - phaseStartedAt) && phaseEndsAt > phaseStartedAt
        ? (phaseEndsAt - phaseStartedAt)
        : durationMs;

    const timerEls = [
        document.getElementById('timer'),
        document.getElementById('timerValue')
    ].filter(Boolean);
    const timerChip = document.querySelector('.ch-timer-chip');
    const fill = document.getElementById('countdownFill');
    const totalDash = 314.16;
    if (fill) {
        fill.style.transition = 'none';
        fill.style.strokeDasharray = String(totalDash);
    }

    function render() {
        const remainingMs = Math.max(0, endAt - performance.now());
        const seconds = Math.ceil(remainingMs / 1000);
        timerEls.forEach(el => { el.textContent = seconds; });
        if (timerChip) timerChip.classList.toggle('urgent', seconds <= 3 && seconds > 0);
        if (fill) {
            const elapsedRatio = Math.max(0, Math.min(1, 1 - (remainingMs / totalMs)));
            fill.style.strokeDashoffset = String(totalDash * elapsedRatio);
        }
        if (remainingMs > 0) {
            window._mpTimerRaf = requestAnimationFrame(render);
        } else {
            window._mpTimerRaf = null;
        }
    }

    render();
}
window.startSyncedQuestionTimer = startSyncedQuestionTimer;
function showReconnectOverlay() {
    let overlay = document.getElementById('reconnectOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'reconnectOverlay';
        overlay.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;background:rgba(32,26,20,0.92);display:flex;flex-direction:column;align-items:flex-start;gap:6px;font-family:inherit;color:white;border-radius:14px;padding:14px 16px;box-shadow:0 12px 32px rgba(0,0,0,0.28);max-width:min(320px,calc(100vw - 32px));';
        overlay.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div>
                <div style="font-size:14px;font-weight:800;">Reconnecting...</div>
            </div>
            <div id="reconnectStatus" style="font-size:12px;opacity:0.75;">Keeping your seat warm</div>
            <button onclick="cancelReconnect()" style="margin-top:4px;padding:7px 12px;background:transparent;border:1px solid rgba(255,255,255,0.28);color:white;cursor:pointer;font-size:12px;border-radius:999px;">Cancel</button>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    overlay.style.inset = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? '0' : '';
    overlay.style.right = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? '0' : '16px';
    overlay.style.bottom = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? '0' : '16px';
    overlay.style.alignItems = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? 'center' : 'flex-start';
    overlay.style.justifyContent = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? 'center' : '';
    overlay.style.borderRadius = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? '0' : '14px';
    overlay.style.background = reconnectAttempts >= UX_TIMING.reconnectOverlayAfter ? 'rgba(0,0,0,0.82)' : 'rgba(32,26,20,0.92)';
}

function hideReconnectOverlay() {
    const overlay = document.getElementById('reconnectOverlay');
    if (overlay) overlay.style.display = 'none';
}

function cancelReconnect() {
    isAttemptingReconnect = false;
    reconnectAttempts = 0;
    hideReconnectOverlay();
    if (ws) { try { ws.close(); } catch(e) {} }
    showHome();
}

function attemptReconnect() {
    if (isAttemptingReconnect) return;
    isAttemptingReconnect = true;
    reconnectAttempts = 0;
    setUXState('reconnecting');
    showMessage('Reconnecting...', 'info', 1200);
    doReconnectAttempt();
}

function doReconnectAttempt() {
    if (!isAttemptingReconnect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        isAttemptingReconnect = false;
        hideReconnectOverlay();
        showMessage('Could not reconnect to the game.');
        showHome();
        return;
    }
    
    reconnectAttempts++;
    showReconnectOverlay();
    const statusEl = document.getElementById('reconnectStatus');
    if (statusEl) statusEl.textContent = `Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`;
    
    console.log(`Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} to room ${currentRoomCode}`);
    
    ws = new WebSocket(getWebSocketUrl(currentRoomCode));
    ws.onopen = () => {
        // Envoie la demande de reconnexion avec les identifiants sauvegardes
        ws.send(JSON.stringify({
            action: 'rejoin',
            userId: userId,
            matchToken: matchToken
        }));
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.event === 'rejoined') {
            // Reconnexion reussie : restaure l etat
            isAttemptingReconnect = false;
            reconnectAttempts = 0;
            hideReconnectOverlay();
            
            userId = msg.data.userId;
            matchToken = msg.data.matchToken;
            isHost = msg.data.isHost;
            myTeam = msg.data.team;
            if (Array.isArray(msg.data.players)) {
                window.currentGamePlayers = msg.data.players;
            }
            if (msg.data.language) {
                selectedLanguage = msg.data.language;
                if (window.AppState) window.AppState.language = selectedLanguage;
                applyTranslations();
            }

            setUXState('waiting', { rejoined: true, gameState: msg.data.gameState });
            showMessage('Reconnected!', 'success', 1600);
            
            // Va vers le bon ecran selon l etat de la partie
            if (msg.data.gameState === 'waiting' || msg.data.gameState === 'gameOver') {
                if (Array.isArray(msg.data.players)) updatePlayers(msg.data);
                showScreen('lobbyScreen');
            } else {
                if (Array.isArray(msg.data.players)) initializeGameScreen(msg.data.players, msg.data.scores || {});
                showScreen('gameScreen');
                if (msg.data.currentQuestion) {
                    currentMultiQuestion = msg.data.currentQuestion;
                    showQuestion(msg.data.currentQuestion);
                    if (msg.data.buzzedPlayer) handleBuzzed({ player: msg.data.buzzedPlayer });
                }
            }
            
            // Rebranche le gestionnaire de messages pour la partie en cours
            ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
            ws.onclose = () => {
                if (userId && matchToken && currentRoomCode && !isAttemptingReconnect) {
                    const activeScreen = document.querySelector('.screen.active');
                    const inGame = activeScreen && ['gameScreen', 'lobbyScreen'].includes(activeScreen.id);
                    if (inGame) attemptReconnect();
                }
            };
            ws.onerror = () => {};
        } else if (msg.event === 'rejoinFailed' || msg.event === 'error') {
            console.log('Rejoin failed:', msg.data);
            ws.close();
            // Nouvelle tentative apres un delai
            setTimeout(doReconnectAttempt, RECONNECT_DELAYS[reconnectAttempts] || 3000);
        } else {
            // Evenement different : on est peut-etre deja reconnecte, on traite normalement
            handleMessage(msg);
        }
    };
    ws.onerror = () => {
        setTimeout(doReconnectAttempt, RECONNECT_DELAYS[reconnectAttempts] || 3000);
    };
    ws.onclose = () => {
        if (isAttemptingReconnect) {
            setTimeout(doReconnectAttempt, RECONNECT_DELAYS[reconnectAttempts] || 3000);
        }
    };
}

// ============================================
// SUPPORT DE REVANCHE
// ============================================

function requestRematch() {
    if (ws?.readyState === WebSocket.OPEN && userId && matchToken) {
        ws.send(JSON.stringify({
            action: 'rematch',
            userId: userId,
            matchToken: matchToken
        }));
    }
}

// Table de routage : chaque evenement serveur appelle la bonne fonction cote client.
const MESSAGE_HANDLERS = {
    roomCreated(data) {
        document.getElementById('roomCode').textContent = data.code;
    },
    joined(data) {
        userId = data.userId;
        matchToken = data.matchToken;
        isHost = data.isHost;
        myTeam = data.team;
        setUXState('waiting', { roomCode: currentRoomCode });
        if (data.language) {
            selectedLanguage = data.language;
            if (window.AppState) window.AppState.language = selectedLanguage;
            applyTranslations();
        }
        showScreen('lobbyScreen');
        document.getElementById('roomCode').textContent = currentRoomCode;
        startLobbyFunFacts();
    },
    languageChanged(data) {
        if (data.language) {
            selectedLanguage = data.language;
            if (window.AppState) window.AppState.language = selectedLanguage;
            localStorage.setItem('triviaLanguage', selectedLanguage);
            applyTranslations();
            showMessage(selectedLanguage === 'fr' ? 'Langue mise a jour' : 'Language updated');
        }
    },
    players(data) {
        window.currentGamePlayers = data.players || [];
        const renderPlayers = typeof window.updatePlayers === 'function' ? window.updatePlayers : updatePlayers;
        try {
            renderPlayers(data);
        } catch (e) {
            console.error('Unable to render lobby players, using fallback renderer:', e);
            if (renderPlayers !== updatePlayers) updatePlayers(data);
        }
    },
    gameStarting(data) {
        setUXState('starting', data);
        showMessage(data.message || 'La partie commence !', 'info', 1400);
        if (window.currentGamePlayers) {
            initializeGameScreen(window.currentGamePlayers, {});
        }
        showScreen('gameScreen');
        showGameCountdown(null, data.countdownMs || UX_TIMING.gameStartMs);
    },
    question(data) {
        currentMultiQuestion = data;
        setUXState('question', data);
        showQuestion(data);
    },
    buzzAck(data) {
        setUXState('buzz-sent', data || {});
    },
    buzzed: handleBuzzed,
    answerLocked(data) {
        setUXState('answer-locked', data || {});
        markPickedOption(data && data.idx);
        showMessage(selectedLanguage === 'fr' ? 'Reponse verrouillee.' : 'Answer locked.', 'info', 1200);
    },
    answerResult: showResult,
    speedResult: showSpeedResult,
    roundComplete(data) {
        stopQuestionTimer();
        showClubhouseScoreboard(data.scores, data.message, data.round, data.maxRounds);
        if (data.teamScores) updateTeamScores(data.teamScores);
    },
    playerEliminated: showEliminationOverlay,
    teamEliminated(data) {
        showMessage(`💀 ${data.message}`);
        updateScores(data.scores);
        if (data.teamScores) updateTeamScores(data.teamScores);
        if (data.team === myTeam) {
            const b = document.getElementById('buzzer');
            if (b) {
                b.disabled = true;
                const bt = b.querySelector('.buzzer__text');
                if (bt) bt.textContent = 'ELIMINATED';
            }
        }
    },
    roundTransition(data) {
        setUXState('waiting', data || {});
        showMessage(`🔥 ${data.message}`);
        updateScores(data.scores);
        if (data.teamScores) updateTeamScores(data.teamScores);
    },
    gameOver: showGameOver,
    reaction: handleReaction,
    playerDisconnected(data) {
        showMessage(`⚡ ${data.message}`);
    },
    playerReconnected(data) {
        showMessage(`✅ ${data.message}`);
    },
    rematchStarted(data) {
        showMessage(data.message || 'Revanche !');
        clearInterval(timerInterval);
        currentMultiQuestion = null;
        updatePlayers(data);
        window.currentGamePlayers = data.players;
        showScreen('lobbyScreen');
        document.getElementById('roomCode').textContent = data.roomCode || currentRoomCode;
        const remBtn = document.getElementById('rematchBtn');
        if (remBtn) remBtn.style.display = 'none';
    },
    error(data) {
        setUXState('error', { message: data });
        showMessage(data, 'error', 2800);
    },
    playerLeft(data) {
        showMessage(data.message || 'Player left');
    },
    newHost(data) {
        showMessage(data.message || 'New host');
        const myN2 = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
        if (data.hostName === myN2) isHost = true;
    }
};

function registerMessageHandler(event, handler) {
    MESSAGE_HANDLERS[event] = handler;
}

function getMessageHandler(event) {
    return MESSAGE_HANDLERS[event];
}

window.registerMessageHandler = registerMessageHandler;
window.getMessageHandler = getMessageHandler;

function handleMessage(msg) {
    const handler = MESSAGE_HANDLERS[msg.event];
    if (handler) handler(msg.data, msg);
}

function updatePlayers(data) {
    const list = document.getElementById('playersList');
    if (!list) return;
    const players = Array.isArray(data.players) ? data.players : [];
    const maxPlayers = Number(data.maxPlayers || 4);

    const countEl = document.getElementById('lobbyPlayerCount');
    const maxEl = document.getElementById('lobbyPlayerMax');
    if (countEl) countEl.textContent = players.length;
    if (maxEl) maxEl.textContent = maxPlayers;
    currentLobbyPlayerCount = players.length;
    window.currentLobbyPlayerCount = players.length;

    list.innerHTML = `<h3>${t('players')}</h3>`;
    if (data.gameMode === 'team' && data.teamCounts) {
        const td = document.createElement('div'); td.className = 'team-scores';
        td.innerHTML = `<div class="team-score-box red"><div>${t('teamRed')}</div><div style="font-size:20px;margin-top:5px;">${data.teamCounts.red}/2</div></div><div class="team-score-box blue"><div>${t('teamBlue')}</div><div style="font-size:20px;margin-top:5px;">${data.teamCounts.blue}/2</div></div>`;
        list.appendChild(td);
    }
    
    // Recupere le nom du joueur actuel depuis les champs
    const currentPlayerName = document.getElementById('createName')?.value || 
                              document.getElementById('joinName')?.value || '';
    
    players.forEach(player => {
        const div = document.createElement('div'); div.className = 'player-item' + (player.isHost ? ' host' : '');
        let teamBadge = '';
        if (data.gameMode === 'team' && player.team) teamBadge = `<span class="team-badge team-${player.team}">${t('team' + player.team.charAt(0).toUpperCase() + player.team.slice(1))}</span>`;
        
        // Utilise l avatar du serveur si disponible, sinon genere depuis le nom
        let avatarUrl;
        try {
            if (player.avatar) {
                avatarUrl = generateAvatarUrl(player.avatar);
            } else {
                avatarUrl = generateAvatarUrlFromName(player.name);
            }
        } catch (e) {
            avatarUrl = '';
        }
        
        div.innerHTML = `
            <div class="player-info">
                <img src="${avatarUrl}" alt="${player.name}" class="player-avatar">
                <span class="player-name">${player.name}${teamBadge}</span>
            </div>
            ${player.isHost ? `<span class="host-badge">${t('host')}</span>` : ''}
        `;
        // Ajoute l animation d arrivee
        div.classList.add('player-join-animation');
        list.appendChild(div);
    });
    
    // Met a jour le nombre de joueurs et le garde pour les changements de langue
    updateLobbyPlayerCount();
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.style.display = (isHost && data.canStart) ? 'block' : 'none';
        if (data.canStart) {
            startBtn.disabled = false;
            delete startBtn.dataset.pending;
        }
    }
}

function updateLobbyPlayerCount() {
    const waitingMsg = document.querySelector('.waiting-message');
    if (waitingMsg && currentLobbyPlayerCount > 0) {
        const countText = currentLobbyPlayerCount === 1 ? t('playerInLobby') : t('playersInLobby');
        waitingMsg.innerHTML = `<span class="lobby-player-count">${currentLobbyPlayerCount}</span> ${countText}<span class="lobby-waiting-dots">...</span>`;
    } else if (waitingMsg) {
        waitingMsg.textContent = t('waitingForPlayers');
    }
}

// Rotation des petites infos du lobby
const lobbyFunFacts = [
    "💡 Le saviez-vous ? Le quiz le plus ancien date de 1938 en Angleterre.",
    "🎯 Astuce : Répondez vite — les points diminuent avec le temps !",
    "🧠 Les joueurs qui buzzent en premier gagnent 2× plus de points en moyenne.",
    "ðŸŒ Plus de 1000 questions dans 10+ catÃ©gories vous attendent.",
    "🤖 Tapez n'importe quel sujet — l'IA génère un quiz en secondes.",
    "⚡ Mode Speed Round : timer divisé par 2, adrénaline multipliée par 10.",
    "ðŸ† Le record actuel est dÃ©tenu par quelqu'un dans cette salle... peut-Ãªtre.",
    "🎮 Essayez le thème Horror pour une expérience terrifiante !",
];
let funFactInterval = null;

function startLobbyFunFacts() {
    clearInterval(funFactInterval);
    const el = document.querySelector('.lobby-fun-fact');
    if (!el) return;
    let idx = Math.floor(Math.random() * lobbyFunFacts.length);
    el.textContent = lobbyFunFacts[idx];
    el.style.opacity = '1';
    funFactInterval = setInterval(() => {
        el.style.opacity = '0';
        setTimeout(() => {
            idx = (idx + 1) % lobbyFunFacts.length;
            el.textContent = lobbyFunFacts[idx];
            el.style.opacity = '1';
        }, 400);
    }, 6000);
}

function stopLobbyFunFacts() { clearInterval(funFactInterval); }

function startGame() {
    if (ws?.readyState === WebSocket.OPEN) {
        setUXState('starting', { requested: true });
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.dataset.pending = 'true';
        }
        ws.send(JSON.stringify({ action: 'start', userId, matchToken, language: selectedLanguage }));
    }
}

let currentMaxTime = 10;

function showGameCountdown(callback, durationMs = UX_TIMING.gameStartMs) {
    const existing = document.getElementById('gameStartCountdownOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gameStartCountdownOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);';
    const num = document.createElement('div');
    num.style.cssText = 'font-size:clamp(76px,18vw,150px);font-weight:900;color:var(--accent-1,#0ff);text-shadow:0 0 80px currentColor;font-family:var(--font-display,inherit);opacity:0;transform:scale(1.4);transition:opacity 140ms ease,transform 240ms var(--ease-spring, ease);';
    overlay.appendChild(num);
    document.body.appendChild(overlay);

    const counts = ['3', '2', '1', 'GO!'];
    let i = 0;
    const stepMs = Math.max(260, Math.floor(durationMs / counts.length));

    function showNext() {
        if (i >= counts.length) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 180ms ease';
            setTimeout(() => {
                overlay.remove();
                if (typeof callback === 'function') callback();
            }, 190);
            return;
        }

        num.textContent = counts[i];
        if (i === counts.length - 1) num.style.fontSize = 'clamp(80px,18vw,160px)';

        playSfx('countdown');
        num.style.transition = 'none';
        num.style.opacity = '0';
        num.style.transform = 'scale(1.45)';
        void num.offsetWidth;
        num.style.transition = 'opacity 140ms ease,transform 240ms var(--ease-spring, ease)';
        requestAnimationFrame(() => {
            num.style.opacity = '1';
            num.style.transform = 'scale(1)';
        });
        setTimeout(() => {
            num.style.opacity = '0';
            num.style.transform = 'scale(0.84)';
        }, Math.max(120, stepMs - 140));
        setTimeout(() => { i++; showNext(); }, stepMs);
    }

    showNext();
}

// Affiche une question multijoueur : texte, image, options, chrono et buzzer si necessaire.
function showQuestion(data) {
    setUXState('question', data || {});
    
    // S assure que l ecran de jeu est actif
    const currentScreen = document.querySelector('.screen.active');
    const gameScreen = document.getElementById('gameScreen');
    if (currentScreen) currentScreen.classList.remove('active', 'exiting');
    if (gameScreen) gameScreen.classList.add('active');
    
    hasBuzzed = false; canAnswer = false;
    
    // Met a jour le texte de la question
    const questionTextEl = document.getElementById('questionText');
    if (questionTextEl) questionTextEl.textContent = data.q;
    
    // Met a jour le numero de question
    const questionNumberEl = document.getElementById('questionNumber');
    if (questionNumberEl && data.questionInRound) {
        questionNumberEl.textContent = `QUESTION #${data.questionInRound}`;
    }
    
    const quizType = data.quizType || 'classic';
    const isBuzzerless = !!data.buzzerless || quizType === 'speed';
    
    // Gere l image de la question
    const questionImageEl = document.getElementById('questionImage');
    if (questionImageEl) {
        if (data.image) {
            questionImageEl.style.display = 'block';
            questionImageEl.classList.toggle('picguess-frame', quizType === 'picguess');
            const img = questionImageEl.querySelector('img');
            if (img) {
                img.src = data.image;
                img.style.filter = '';
                img.style.transform = '';
                img.style.transition = '';
            }
            questionImageEl.querySelectorAll('.picguess-reveal-meter, .picguess-hint').forEach(el => el.remove());
        } else {
            questionImageEl.style.display = 'none';
            questionImageEl.classList.remove('picguess-frame');
            questionImageEl.querySelectorAll('.picguess-reveal-meter, .picguess-hint').forEach(el => el.remove());
        }
    }
    
    // Anime l entree de la bulle de question avec GSAP
    const bubble = document.getElementById('questionBubble');
    if (bubble) {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(bubble,
                { y: 40, opacity: 0, scale: 0.92 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }
            );
        } else {
            bubble.style.animation = 'none'; void bubble.offsetWidth;
            bubble.style.animation = 'chBubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both';
        }
    }
    
    // Met a jour le badge de manche
    const roundInfo = document.getElementById('roundInfo');
    if (roundInfo && data.round) {
        const roundValue = roundInfo.querySelector('.round-value');
        if (roundValue) roundValue.textContent = `${data.round}/3`;
    }
    
    // Met a jour le badge de difficulte
    const diffBadge = document.getElementById('difficultyBadge');
    if (diffBadge && data.difficulty) {
        diffBadge.style.display = 'flex';
        diffBadge.dataset.level = data.difficulty;
        const diffIcon = document.getElementById('difficultyIcon');
        const diffText = document.getElementById('difficultyText');
        const diffMap = { easy: { icon: '🟢', text: 'Facile' }, medium: { icon: '🟡', text: 'Moyen' }, hard: { icon: '🔴', text: 'Difficile ×1.5' } };
        const d = diffMap[data.difficulty] || diffMap.medium;
        if (diffIcon) diffIcon.textContent = d.icon;
        if (diffText) diffText.textContent = d.text;
    }
    
    // Met a jour le badge de question
    const questionBadge = document.getElementById('questionBadge');
    if (questionBadge && data.questionInRound) {
        const questionValue = questionBadge.querySelector('.question-value');
        if (questionValue) questionValue.textContent = `${data.questionInRound}/${data.questionsPerRound || 5}`;
    }

    currentMaxTime = data.time || 10;
    startSyncedQuestionTimer(data);

    // Affiche le buzzer et cache les options pour le mode classique.
    const buzzerArea = document.getElementById('buzzerArea');
    const buzzer = document.getElementById('buzzer');
    if (buzzerArea) buzzerArea.style.display = isBuzzerless ? 'none' : 'flex';
    if (buzzer) { 
        buzzer.disabled = isBuzzerless; 
        buzzer.classList.remove('buzzed');
        const buzzerText = buzzer.querySelector('.ch-buzzer-text');
        if (buzzerText) buzzerText.textContent = isBuzzerless ? '' : t('buzz');
    }

    // Construit les options mais les garde cachees
    const optionsBox = document.getElementById('optionsBox');
    
    if (optionsBox && data.options) {
        optionsBox.innerHTML = '';
        optionsBox.style.display = isBuzzerless ? 'grid' : 'none';
        
        if (quizType === 'truefalse') {
            // Vrai/Faux : deux gros boutons cote a cote
            optionsBox.style.gridTemplateColumns = 'repeat(2, 1fr)';
            data.options.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.className = 'ch-option';
                btn.style.minHeight = '120px';
                btn.style.fontSize = '24px';
                const isTrueLabel = /^(vrai|true)$/i.test(String(option).trim());
                btn.innerHTML = `${isTrueLabel ? 'T' : 'F'} ${option}`;
                btn.onclick = () => answerQuestion(idx);
                optionsBox.appendChild(btn);
            });
        } else {
            // Classique, Speed et Picguess : grille normale en 2x2
            optionsBox.style.gridTemplateColumns = 'repeat(2, 1fr)';
            const optionKeys = ['A', 'B', 'X', 'Y'];
            data.options.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.className = 'ch-option';
                btn.innerHTML = `<span class="ch-option-key">${optionKeys[idx] || idx + 1}</span>${option}`;
                btn.onclick = () => answerQuestion(idx);
                optionsBox.appendChild(btn);
            });
        }
    }
    
    // Picguess : l image se defloute progressivement
    if (quizType === 'picguess' && data.image) {
        const qImg = document.querySelector('#questionImage img');
        if (qImg) {
            const blurStart = data.blurStart || 20;
            qImg.style.filter = `blur(${blurStart}px) brightness(0.72) saturate(0.8)`;
            qImg.style.transform = 'scale(1.06)';
            qImg.style.transition = 'filter linear, transform linear';
            // Defloute pendant la duree du chrono
            const deblurDuration = (data.time || 15) * 1000;
            qImg.style.transitionDuration = `${deblurDuration}ms`;
            const holder = document.getElementById('questionImage');
            if (holder) {
                holder.insertAdjacentHTML('beforeend', `
                    <div class="picguess-hint">${selectedLanguage === 'fr' ? 'L image se revele...' : 'Image revealing...'}</div>
                    <div class="picguess-reveal-meter"><span class="picguess-reveal-meter__fill"></span></div>
                `);
                const fill = holder.querySelector('.picguess-reveal-meter__fill');
                if (fill) fill.style.animationDuration = `${data.time || 15}s`;
            }
            const startReveal = () => requestAnimationFrame(() => {
                qImg.style.filter = 'blur(0px) brightness(1) saturate(1)';
                qImg.style.transform = 'scale(1)';
            });
            if (typeof qImg.decode === 'function') {
                qImg.decode().then(startReveal).catch(startReveal);
            } else {
                startReveal();
            }
        }
    }
    if (isBuzzerless) {
        canAnswer = true;
        const wrap = document.querySelector('.buzzer-wrap');
        if (wrap) wrap.style.display = 'none';
    }
    
    hideMessage();
}

function buzzerPressed() {
    const buzzer = document.getElementById('buzzer');
    if (!buzzer || buzzer.disabled || hasBuzzed) return;
    hasBuzzed = true;
    buzzer.disabled = true;
    buzzer.classList.add('buzzed');
    setUXState('buzz-sent', { sentAt: Date.now() });
    const buzzerText = buzzer.querySelector('.buzzer__text');
    if (buzzerText) buzzerText.textContent = selectedLanguage === 'fr' ? 'BUZZ ENVOYE' : 'BUZZ SENT';
    playSfx('buzzer');
    if (navigator.vibrate) navigator.vibrate(80);
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'buzz', userId, matchToken }));
    } else {
        showMessage(selectedLanguage === 'fr' ? 'Connexion perdue...' : 'Connection lost...', 'error', 1600);
    }
}
function handleBuzzed(data) {
    const playerName = data.player || data;
    setUXState('revealing', data || {});
    showMessage(data.message || `🔔 ${playerName} a buzzé !`);
    playSfx('buzzer');

    const buzzer = document.getElementById('buzzer');
    if (buzzer) {
        buzzer.disabled = true;
        buzzer.classList.add('buzzed');
        const buzzerText = buzzer.querySelector('.buzzer__text');
        if (buzzerText) buzzerText.textContent = `${playerName} a buzzé !`;
    }
    
    const myName = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
    if (playerName === myName) { 
        canAnswer = true;
    }

    // Revelation progressive : cache le buzzer et affiche les options avec animation
    const buzzerArea = document.getElementById('buzzerArea');
    if (buzzerArea) {
        if (typeof gsap !== 'undefined') {
            gsap.to(buzzerArea, { scale: 0.8, opacity: 0, duration: 0.25, ease: 'power2.in',
                onComplete: () => { buzzerArea.style.display = 'none'; }
            });
        } else {
            buzzerArea.style.display = 'none';
        }
    }
    
    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) {
        optionsBox.style.display = 'grid';
        const opts = optionsBox.querySelectorAll('.ch-option');
        
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(opts, 
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)', delay: 0.2 }
            );
        } else {
            opts.forEach((opt, i) => {
                opt.style.animation = 'none'; void opt.offsetWidth;
                opt.style.animation = `chOptionIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.07}s both`;
            });
        }
    }
    
    // Met en avant le joueur qui a buzze
    highlightBuzzedPlayer(playerName);
}

function highlightBuzzedPlayer(playerName) {
    document.querySelectorAll('.ch-player-card').forEach(card => {
        card.classList.remove('buzzed-highlight');
        const nameEl = card.querySelector('.ch-player-name');
        if (nameEl && nameEl.textContent === playerName) {
            card.classList.add('buzzed-highlight');
        }
    });
}

function markPickedOption(idx) {
    if (idx === undefined || idx === null) return;
    document.querySelectorAll('#optionsBox .option, #optionsBox .ch-option').forEach((opt, optionIdx) => {
        opt.classList.toggle('option--picked', optionIdx === idx);
    });
}

// Envoie la reponse choisie au serveur. En Speed/Wager, pas besoin de buzzer avant.
function answerQuestion(idx) {
    const qType = currentMultiQuestion && currentMultiQuestion.quizType;
    const isBuzzerless = currentMultiQuestion && (currentMultiQuestion.buzzerless || qType === 'speed');
    if (!canAnswer && !isBuzzerless) return;
    markPickedOption(idx);
    setUXState('answer-locked', { idx });
    document.querySelectorAll('#optionsBox .option, #optionsBox .ch-option').forEach(opt => {
        opt.onclick = null;
        opt.disabled = true;
    });
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'answer', userId, matchToken, idx }));
        showMessage(selectedLanguage === 'fr' ? 'Reponse envoyee...' : 'Answer sent...', 'info', 900);
    } else {
        showMessage(selectedLanguage === 'fr' ? 'Connexion perdue...' : 'Connection lost...', 'error', 1600);
    }
    canAnswer = false;
}

// Affiche le resultat d une question Speed ou tout le monde a repondu en meme temps.
function showSpeedResult(data) {
    stopQuestionTimer();
    setUXState('revealing', data || {});

    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) {
        optionsBox.style.display = 'grid';
        optionsBox.querySelectorAll('.option, .ch-option').forEach((opt, idx) => {
            opt.onclick = null;
            if (idx === data.correctIdx) opt.classList.add('correct');
        });
    }

    if (data.scores) updateScores(data.scores);
    if (data.teamScores) updateTeamScores(data.teamScores);

    const mine = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
    const myResult = data.results && data.results[mine];
    if (myResult) {
        if (myResult.correct) {
            playSfx('correct');
            showPointsPopup(`+${myResult.delta}`, true);
            showFeedbackFlash(true);
        } else if (myResult.answered) {
            playSfx('wrong');
            showPointsPopup(`${myResult.delta}`, false);
            showFeedbackFlash(false);
        }
    }

    const answer = data.answer || '';
    const msg = selectedLanguage === 'fr'
        ? `Reponse: ${answer} - prochaine question tout de suite.`
        : `Answer: ${answer} - next question coming up.`;
    showMessage(msg);
}

// Affiche le resultat classique apres une reponse au buzzer.
function showResult(data) {
    stopQuestionTimer();
    setUXState('revealing', data || {});
    
    // S assure que les options sont visibles pour montrer le resultat
    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) optionsBox.style.display = 'grid';
    
    document.querySelectorAll('#optionsBox .ch-option').forEach((opt, idx) => {
        opt.onclick = null;
        // Marque la bonne reponse
        if (opt.textContent.replace(/^[ABXY]/, '').trim() === data.answer || 
            opt.textContent.includes(data.answer)) { 
            opt.classList.add('correct'); 
        }
        // Marque la mauvaise reponse choisie
        if (!data.correct && data.selectedIdx !== undefined && idx === data.selectedIdx) {
            opt.classList.add('wrong');
        }
    });
    
    const myName = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
    if (data.answeredBy === myName || (data.timeout && data.pointsEarned)) { 
        const pointsEarned = data.pointsEarned || 0;
        
        if (data.correct) { 
            playSfx('correct');
            showPointsPopup(`+${pointsEarned}`, true);
            showFeedbackFlash(true);
            createConfetti(30); 
        } else { 
            playSfx('wrong');
            
            // Theme horreur : declenche parfois un jumpscare sur mauvaise reponse
            if (selectedTheme === 'horror' && Math.random() > 0.7) {
                triggerHorrorJumpscare();
            }
            
            showPointsPopup(pointsEarned < 0 ? `${pointsEarned}` : '✗', false);
            showFeedbackFlash(false);
            shakeScreen(); 
        } 
    }
    updateScores(data.scores);
    if (data.teamScores) updateTeamScores(data.teamScores);
    showMessage(data.message || (data.correct ? t('correct') : `${t('wrong')} ${data.answer}`));
    
    // Affiche le classement anime apres un court delai
    setTimeout(() => {
        showAnimatedLeaderboard(data.scores, 2500);
    }, 1000);
}

// Rafraichit les scores visibles dans le panneau de jeu.
function updateScores(scores) {
    const scoresBox = document.getElementById('scoresBox');
    if (!scoresBox) return;
    const teamDiv = document.getElementById('teamScoresDiv');
    scoresBox.innerHTML = `<h3>${t('scores')}</h3>`;
    if (teamDiv) scoresBox.insertBefore(teamDiv, scoresBox.firstChild);
    
    // Trouve le meilleur score pour calculer les barres
    const maxScore = Math.max(...Object.values(scores), 1);
    
    Object.entries(scores).forEach(([name, score]) => {
        const div = document.createElement('div'); 
        div.className = 'score-row';
        const avatar = createAvatarHTML(name);
        const percentage = Math.max(0, (score / maxScore) * 100);
        
        div.innerHTML = `
            <div class="player-info">
                ${avatar}
                <span class="player-name">${name}</span>
            </div>
            <div class="player-score-container">
                <div class="player-score-bar">
                    <div class="player-score-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="player-score-text ${score < 0 ? 'negative' : ''}">${score}</span>
            </div>
        `;
        scoresBox.appendChild(div);
    });
    
    // Met aussi a jour les cartes joueurs de l ecran de jeu
    updatePlayerCardsScores(scores);
}

function updateTeamScores(teamScores) {
    const scoresBox = document.getElementById('scoresBox');
    if (!scoresBox) return;
    let teamDiv = document.getElementById('teamScoresDiv');
    if (!teamDiv) { teamDiv = document.createElement('div'); teamDiv.id = 'teamScoresDiv'; teamDiv.className = 'team-scores'; scoresBox.insertBefore(teamDiv, scoresBox.firstChild); }
    teamDiv.innerHTML = `<div class="team-score-box red ${!teamScores.red.active ? 'eliminated' : ''}"><div>${t('teamRed')}</div><div style="font-size:24px;margin-top:5px;">${teamScores.red.score}</div>${!teamScores.red.active ? '<div style="font-size:10px;">ELIMINATED</div>' : ''}</div><div class="team-score-box blue ${!teamScores.blue.active ? 'eliminated' : ''}"><div>${t('teamBlue')}</div><div style="font-size:24px;margin-top:5px;">${teamScores.blue.score}</div>${!teamScores.blue.active ? '<div style="font-size:10px;">ELIMINATED</div>' : ''}</div>`;
}

// Couleurs des cartes joueurs

// Affiche les cartes joueurs sur l ecran de jeu
// Met a jour les scores des cartes joueurs
function updatePlayerCardsScores(scores) {
    // Met a jour les cartes joueurs flottantes
    document.querySelectorAll('.ch-player-card').forEach(card => {
        const nameEl = card.querySelector('.ch-player-name');
        if (!nameEl) return;
        // Retire la couronne hote pour comparer les noms
        const name = nameEl.textContent.replace(' 👑', '').trim();
        if (name && scores[name] !== undefined) {
            const scoreEl = card.querySelector('.ch-player-score');
            if (scoreEl) {
                scoreEl.textContent = `${scores[name]} pts`;
                scoreEl.style.animation = 'none';
                void scoreEl.offsetWidth;
                scoreEl.style.animation = 'chScoreBounce 0.4s ease';
            }
        }
    });
}

function showScorePopup(points) {
    const popup = document.createElement('div');
    popup.className = `ch-score-popup ${points >= 0 ? 'positive' : 'negative'}`;
    popup.textContent = points >= 0 ? `+${points}` : `${points}`;
    popup.style.left = '50%';
    popup.style.top = '45%';
    popup.style.transform = 'translateX(-50%)';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1300);
}

// Initialise les cartes joueurs au debut de partie
function initializeGameScreen(players, scores = {}) {
    renderClubhousePlayers(players, scores);
    
    // Remet les elements d interface a zero
    const buzzerArea = document.getElementById('buzzerArea');
    const buzzer = document.getElementById('buzzer');
    if (buzzerArea) buzzerArea.style.display = 'flex';
    if (buzzer) {
        buzzer.disabled = false;
        buzzer.classList.remove('buzzed');
        const buzzerText = buzzer.querySelector('.ch-buzzer-text');
        if (buzzerText) buzzerText.textContent = t('buzz');
    }
    
    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) optionsBox.style.display = 'none';
}

function renderClubhousePlayers(players, scores = {}) {
    const layer = document.getElementById('chPlayersLayer');
    if (!layer) return;
    layer.innerHTML = '';
    
    const gamePlayers = players || window.currentGamePlayers || [];
    
    gamePlayers.forEach((player, idx) => {
        const card = document.createElement('div');
        card.className = 'ch-player-card';
        
        // Recupere l URL de l avatar
        let avatarHTML = '';
        if (player.avatar) {
            const url = typeof generateAvatarUrl === 'function' ? generateAvatarUrl(player.avatar) : '';
            avatarHTML = url ? `<img src="${url}" alt="${player.name}">` : `<span style="font-size:40px;">👤</span>`;
        } else {
            avatarHTML = `<span style="font-size:40px;">👤</span>`;
        }
        
        const score = scores[player.name] || player.score || 0;
        
        card.innerHTML = `
            <div class="ch-player-avatar">${avatarHTML}</div>
            <div class="ch-player-nametag">
                <div class="ch-player-name">${player.name}${player.isHost ? ' 👑' : ''}</div>
                <div class="ch-player-score">${score} pts</div>
            </div>
        `;
        
        layer.appendChild(card);
    });
}

function showGameOver(data) {
    stopQuestionTimer();
    setUXState('idle', { gameOver: true });
    
    // Transforme finalScores en liste pour le podium
    const players = Object.entries(data.finalScores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
    
    // Affiche d abord la celebration du podium
    showPodiumCelebration(players, false);
    
    // Garde les donnees pour closePodiumAndShowMultiGameOver
    window.multiGameOverData = data;
}

function closePodiumAndShowMultiGameOver() {
    const overlay = document.querySelector('.podium-overlay');
    if (overlay) overlay.remove();
    
    const data = window.multiGameOverData;
    if (!data) {
        showScreen('homeScreen');
        return;
    }
    
    // Modifie le DOM directement pour eviter les problemes de timing
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'exiting'));
    const goScreen = document.getElementById('gameOverScreen');
    if (goScreen) goScreen.classList.add('active');
    
    // Regle le bouton revanche apres activation de l ecran
    const rematchBtn = document.getElementById('rematchBtn');
    console.log('[Rematch] isHost:', isHost, 'userId:', userId, 'ws open:', ws?.readyState === WebSocket.OPEN);
    if (rematchBtn) {
        if (isHost) {
            rematchBtn.style.display = 'inline-flex';
            rematchBtn.textContent = '🔄 Rematch';
        } else {
            rematchBtn.style.display = 'inline-flex';
            rematchBtn.textContent = '⏳ Waiting for host...';
            rematchBtn.disabled = true;
            rematchBtn.style.opacity = '0.5';
            rematchBtn.style.cursor = 'default';
        }
    }
    
    // Met a jour l annonce du gagnant
    const winnerBox = document.getElementById('winnerBox');
    if (winnerBox) {
        const winnerName = winnerBox.querySelector('.winner-name');
        if (winnerName) {
            winnerName.textContent = data.winner ? `${data.winner} wins!` : (data.reason || 'Game Over!');
        }
    }
    
    // Trie les joueurs par score
    const sortedPlayers = Object.entries(data.finalScores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
    
    const currentPlayerName = document.getElementById('createName')?.value || 
                              document.getElementById('joinName')?.value || '';
    
    // ========================================
    // SAUVEGARDE LES STATS MULTIJOUEUR DANS SUPABASE
    // ========================================
    if (currentPlayer && currentPlayerName) {
        // Trouve le score et la position du joueur actuel
        const playerIndex = sortedPlayers.findIndex(p => p.name === currentPlayerName);
        if (playerIndex !== -1) {
            const myScore = sortedPlayers[playerIndex].score;
            const myPosition = playerIndex + 1;
            const didWin = myPosition === 1;
            const playersCount = sortedPlayers.length;
            
            // Met a jour les stats dans Supabase avec la position
            updatePlayerStats(myScore, didWin, playersCount, myPosition);
            
            console.log(`[Multiplayer] Stats saved: Score=${myScore}, Position=${myPosition}/${playersCount}, Won=${didWin}`);
        }
    }
    
    // Recupere les avatars depuis les joueurs sauvegardes
    const gamePlayers = window.currentGamePlayers || [];
    const getPlayerAvatar = (playerName) => {
        const player = gamePlayers.find(p => p.name === playerName);
        if (player && player.avatar) {
            return generateAvatarUrl(player.avatar);
        }
        // Secours : verifie si c est le joueur actuel
        if (playerName === currentPlayerName && currentAvatar) {
            return generateAvatarUrl(currentAvatar);
        }
        return generateAvatarUrlFromName(playerName);
    };
    
    // Affiche le podium avec avatars
    const podiumContainer = document.getElementById('podiumClubhouse');
    if (podiumContainer && sortedPlayers.length >= 1) {
        let podiumHTML = '';
        
        // Trois premiers pour le podium
        const podiumPlayers = sortedPlayers.slice(0, 3);
        const positions = ['first', 'second', 'third'];
        const medals = ['🥇', '🥈', '🥉'];
        
        podiumPlayers.forEach((player, idx) => {
            const avatarUrl = getPlayerAvatar(player.name);
            
            podiumHTML += `
                <div class="podium-place-clubhouse ${positions[idx]}">
                    <div class="podium-avatar-frame">
                        <img src="${avatarUrl}" alt="${player.name}">
                    </div>
                    <div class="podium-player-name">${player.name}</div>
                    <div class="podium-player-score">${player.score} pts</div>
                    <div class="podium-stand">${idx + 1}</div>
                </div>
            `;
        });
        
        podiumContainer.innerHTML = podiumHTML;
    }
    
    // Affiche le classement avec avatars
    const leaderboardList = document.getElementById('leaderboardList');
    if (leaderboardList) {
        leaderboardList.innerHTML = sortedPlayers.map((player, idx) => {
            const avatarUrl = getPlayerAvatar(player.name);
            
            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${idx + 1}</div>
                    <div class="leaderboard-avatar">
                        <img src="${avatarUrl}" alt="${player.name}">
                    </div>
                    <div class="leaderboard-name">${player.name}</div>
                    <div class="leaderboard-score">${player.score} pts</div>
                </div>
            `;
        }).join('');
    }
    
    // Lance la celebration
    createConfetti(80);
}

let messageTimer = null;
let lastMessageText = '';
function showMessage(text, type = 'info', duration = UX_TIMING.toastMs) {
    const box = document.getElementById('messageBox');
    if (!box || !text) return;
    const normalized = String(text);
    if (normalized === lastMessageText && box.classList.contains('visible')) return;
    lastMessageText = normalized;
    clearTimeout(messageTimer);
    box.textContent = normalized;
    box.dataset.type = type;
    box.classList.add('visible');
    box.style.display = 'block';
    messageTimer = setTimeout(() => {
        box.classList.remove('visible');
        lastMessageText = '';
    }, duration);
}
function hideMessage() {
    const box = document.getElementById('messageBox');
    clearTimeout(messageTimer);
    lastMessageText = '';
    if (box) {
        box.classList.remove('visible');
        box.style.display = 'none';
    }
}

// ============================================
// EFFETS VISUELS
// ============================================

// Petit effet de celebration utilise pour les bonnes reponses/victoires.
function createConfetti(count = 50) {
    if (typeof confetti !== 'function') return;
    const themeColors = {
        neon: ['#0ff', '#f0f', '#0f0', '#ff0'],
        dragon: ['#ff6b35', '#c41e3a', '#ffd700', '#fff'],
        horror: ['#cc0000', '#8B0000', '#ff4444', '#fff'],
        sakura: ['#ffb7c5', '#ff69b4', '#fff0f5', '#ff1493'],
        midnight: ['#e94560', '#533a7b', '#ffc857', '#fff'],
        clean: ['#4361ee', '#3a0ca3', '#7209b7', '#fff']
    };
    const colors = themeColors[selectedTheme] || themeColors.neon;
    
    // Explosion des deux cotes
    confetti({ particleCount: Math.floor(count / 2), angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: Math.floor(count / 2), angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
}

function celebrateVictory() {
    if (typeof confetti !== 'function') return;
    const themeColors = {
        neon: ['#0ff', '#f0f', '#0f0'], dragon: ['#ff6b35', '#ffd700'], sakura: ['#ffb7c5', '#ff69b4'],
        midnight: ['#e94560', '#ffc857'], clean: ['#4361ee', '#7209b7'], horror: ['#cc0000', '#ff4444']
    };
    const colors = themeColors[selectedTheme] || ['#0ff', '#f0f', '#ff0'];
    
    // Big celebration — 3 staggered bursts
    const duration = 2000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: Math.random() * 0.4 + 0.3 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: Math.random() * 0.4 + 0.3 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
    
    const wb = document.getElementById('winnerBox');
    if (wb) wb.classList.add('victory-animate');
}

function shakeScreen() { const c = document.querySelector('.screen.active'); if (c) { c.classList.add('shake'); setTimeout(() => c.classList.remove('shake'), 500); } }
function flashWrong() { const c = document.querySelector('.screen.active'); if (c) { c.classList.add('wrong-flash'); setTimeout(() => c.classList.remove('wrong-flash'), 500); } }
function animateScore(id) { const el = document.getElementById(id); if (el) { el.classList.add('score-animate'); setTimeout(() => el.classList.remove('score-animate'), 500); } }
function animateCorrectOption(el) { if (el) { el.classList.add('correct-pulse'); setTimeout(() => el.classList.remove('correct-pulse'), 600); } }

// ============================================
// AMELIORATIONS D INTERFACE
// ============================================

// Effet ripple sur les boutons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--ripple-x', x + '%');
        btn.style.setProperty('--ripple-y', y + '%');
        btn.classList.remove('ripple');
        void btn.offsetWidth; // Force le recalcul visuel
        btn.classList.add('ripple');
        setTimeout(() => btn.classList.remove('ripple'), 600);
    }
});

// Genere une couleur d avatar depuis le nom
function getAvatarColor(name) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8B500', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9',
        '#92A8D1', '#955251', '#B565A7', '#009B77', '#DD4124'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Recupere les initiales du nom
function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Cree le HTML de l avatar avec DiceBear
function createAvatarHTML(name, isCurrentPlayer = false) {
    let avatarUrl;
    if (isCurrentPlayer && currentAvatar) {
        avatarUrl = generateAvatarUrl(currentAvatar);
    } else {
        avatarUrl = generateAvatarUrlFromName(name);
    }
    return `<div class="player-avatar"><img src="${avatarUrl}" alt="${name}" class="player-avatar-img"></div>`;
}

// Cree le HTML du chrono circulaire
function createCircularTimer(time, maxTime) {
    const percentage = (time / maxTime);
    const circumference = 226; // 2 * PI * 36 (rayon)
    const offset = circumference * (1 - percentage);
    
    let colorClass = '';
    if (percentage <= 0.25) colorClass = 'danger';
    else if (percentage <= 0.5) colorClass = 'warning';
    
    return `
        <div class="timer-container">
            <div class="circular-timer">
                <svg viewBox="0 0 80 80">
                    <circle class="timer-bg" cx="40" cy="40" r="36"/>
                    <circle class="timer-progress ${colorClass}" cx="40" cy="40" r="36" 
                        style="stroke-dashoffset: ${offset}"/>
                </svg>
                <span class="timer-text ${colorClass}">${time}</span>
            </div>
        </div>
    `;
}

// Met a jour le chrono circulaire
function updateCircularTimer(containerId, time, maxTime) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createCircularTimer(time, maxTime);
    }
}

// ============================================
// REACTIONS DES JOUEURS
// ============================================

function sendReaction(emoji) {
    // Affiche la reaction locale immediatement
    showFloatingReaction(emoji);
    
    // Envoie aux autres joueurs via WebSocket
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
            action: 'reaction', 
            userId, 
            matchToken,
            emoji 
        }));
    }
}

function showFloatingReaction(emoji, fromPlayer = null) {
    const reaction = document.createElement('div');
    reaction.className = 'floating-reaction';
    reaction.textContent = emoji;

    const randomX = 20 + Math.random() * 60;
    reaction.style.left = randomX + '%';
    reaction.style.bottom = '100px';

    document.body.appendChild(reaction);
    setTimeout(() => reaction.remove(), 2000);
}

function handleReaction(data) {
    showFloatingReaction(data.emoji, data.player);
}
