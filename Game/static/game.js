const translations = {
    en: {
        title: "🎯 Trivia Game",
        settings: "⚙️ Settings",
        selectLanguage: "Select Language:",
        done: "Done",
        soloMode: "🎮 Solo Mode",
        multiplayerMode: "👥 Multiplayer Mode",
        createRoom: "Create Room",
        joinRoom: "Join Room",
        enterRoomCode: "Enter Room Code (e.g., ABCD)",
        yourName: "Your Name",
        createAndJoin: "Create & Join",
        back: "Back",
        roomCode: "Room Code",
        joinRoomBtn: "Join Room",
        waitingForPlayers: "Waiting for players to join...",
        startGame: "Start Game",
        buzz: "BUZZ!",
        gameOver: "Game Over!",
        playAgain: "Play Again",
        players: "Players:",
        scores: "Scores:",
        finalScores: "Final Scores:",
        host: "HOST",
        selectSubjects: "Select Subjects:",
        selectGameMode: "Select Game Mode:",
        freeForAll: "🎯 Free for All (2+ players)",
        teamMode: "👥 Team Mode (4 players exactly)",
        selectTeam: "Select Your Team:",
        teamFull: "That team is full!",
        teamRed: "Red Team",
        teamBlue: "Blue Team",
        teamScores: "Team Scores",
        alertBothFields: "Please enter both room code and name",
        alertName: "Please enter your name",
        alertSubjects: "Please select at least one subject",
        connectionError: "Connection error. Please try again.",
        score: "Score",
        correct: "✅ Correct!",
        wrong: "❌ Wrong! Correct answer:",
        round: "Round",
        question: "Question",
        checkingRoom: "Checking room...",
        subjects: {
            science: "🔬 Science",
            history: "📚 History",
            geography: "🌍 Geography",
            sports: "⚽ Sports",
            entertainment: "🎬 Entertainment",
            technology: "💻 Technology"
        }
    },
    fr: {
        title: "🎯 Jeu de Trivia",
        settings: "⚙️ Paramètres",
        selectLanguage: "Sélectionner la langue:",
        done: "Terminé",
        soloMode: "🎮 Mode Solo",
        multiplayerMode: "👥 Mode Multijoueur",
        createRoom: "Créer une salle",
        joinRoom: "Rejoindre une salle",
        enterRoomCode: "Entrez le code de la salle (ex: ABCD)",
        yourName: "Votre nom",
        createAndJoin: "Créer et rejoindre",
        back: "Retour",
        roomCode: "Code de la salle",
        joinRoomBtn: "Rejoindre la salle",
        waitingForPlayers: "En attente de joueurs...",
        startGame: "Démarrer le jeu",
        buzz: "BUZZ!",
        gameOver: "Jeu terminé!",
        playAgain: "Rejouer",
        players: "Joueurs:",
        scores: "Scores:",
        finalScores: "Scores finaux:",
        host: "HÔTE",
        selectSubjects: "Sélectionner les sujets:",
        selectGameMode: "Sélectionner le mode de jeu:",
        freeForAll: "🎯 Tous contre tous (2+ joueurs)",
        teamMode: "👥 Mode Équipe (exactement 4 joueurs)",
        selectTeam: "Sélectionnez votre équipe:",
        teamFull: "Cette équipe est pleine!",
        teamRed: "Équipe Rouge",
        teamBlue: "Équipe Bleue",
        teamScores: "Scores des équipes",
        alertBothFields: "Veuillez entrer le code de la salle et votre nom",
        alertName: "Veuillez entrer votre nom",
        alertSubjects: "Veuillez sélectionner au moins un sujet",
        connectionError: "Erreur de connexion. Veuillez réessayer.",
        score: "Score",
        correct: "✅ Correct !",
        wrong: "❌ Faux ! Bonne réponse:",
        round: "Manche",
        question: "Question",
        checkingRoom: "Vérification de la salle...",
        subjects: {
            science: "🔬 Science",
            history: "📚 Histoire",
            geography: "🌍 Géographie",
            sports: "⚽ Sports",
            entertainment: "🎬 Divertissement",
            technology: "💻 Technologie"
        }
    }
};

const SUBJECTS = ['science', 'history', 'geography', 'sports', 'entertainment', 'technology'];

let ws;
let userId;
let matchToken;
let isHost = false;
let currentRoomCode;
let hasBuzzed = false;
let canAnswer = false;
let timerInterval;
let selectedLanguage = 'en';
let gameMode = null;
let selectedGameMode = 'ffa';
let myTeam = null;
let selectedJoinTeam = null;
let roomGameMode = null;
let isCheckingRoom = false;  // NEW: Flag to prevent race conditions

// Solo game state
let soloQuestions = [];
let soloScore = 0;
let soloCurrentQuestion = null;
let soloQuestionIndex = 0;

const savedLang = sessionStorage.getItem('triviaLanguage');
if (savedLang) {
    selectedLanguage = savedLang;
    updateLanguageUI();
    applyTranslations();
}

function t(key) {
    const keys = key.split('.');
    let value = translations[selectedLanguage];
    for (const k of keys) {
        value = value?.[k];
        if (!value) break;
    }
    return value || translations.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const text = t(key);
        element.textContent = text;
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        element.placeholder = t(key);
    });
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    updateLanguageUI();
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function selectLanguage(lang) {
    selectedLanguage = lang;
    sessionStorage.setItem('triviaLanguage', lang);
    updateLanguageUI();
    applyTranslations();

    if (ws && ws.readyState === WebSocket.OPEN && userId) {
        ws.send(JSON.stringify({
            action: 'changeLanguage',
            userId: userId,
            matchToken: matchToken,
            language: lang
        }));
    }
}

function updateLanguageUI() {
    document.querySelectorAll('.language-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.lang === selectedLanguage) {
            opt.classList.add('selected');
        }
    });
}

function selectGameMode(mode) {
    selectedGameMode = mode;
    
    const ffaDiv = document.getElementById('gameModeFF');
    const teamDiv = document.getElementById('gameModeTeam');
    
    if (!ffaDiv || !teamDiv) return;
    
    if (mode === 'ffa') {
        ffaDiv.style.border = '2px solid #667eea';
        ffaDiv.style.background = '#dbeafe';
        teamDiv.style.border = '2px solid #e5e7eb';
        teamDiv.style.background = '#f9fafb';
        const radio = document.querySelector('input[name="gameMode"][value="ffa"]');
        if (radio) radio.checked = true;
    } else {
        teamDiv.style.border = '2px solid #667eea';
        teamDiv.style.background = '#dbeafe';
        ffaDiv.style.border = '2px solid #e5e7eb';
        ffaDiv.style.background = '#f9fafb';
        const radio = document.querySelector('input[name="gameMode"][value="team"]');
        if (radio) radio.checked = true;
    }
}

function renderSubjects() {
    const soloScreen = document.getElementById('soloSetupScreen');
    const createScreen = document.getElementById('createMultiScreen');
    
    if (soloScreen && soloScreen.classList.contains('active')) {
        const container = document.getElementById('soloSubjects');
        if (container) {
            container.innerHTML = '';
            SUBJECTS.forEach(subject => {
                const div = document.createElement('div');
                div.className = 'subject-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `soloSubjects-${subject}`;
                checkbox.value = subject;
                checkbox.checked = true;
                
                const label = document.createElement('label');
                label.htmlFor = `soloSubjects-${subject}`;
                label.textContent = t('subjects.' + subject);
                
                div.appendChild(checkbox);
                div.appendChild(label);
                
                div.onclick = (e) => {
                    if (e.target === div) {
                        checkbox.checked = !checkbox.checked;
                    }
                };
                
                container.appendChild(div);
            });
        }
    }
    
    if (createScreen && createScreen.classList.contains('active')) {
        const container = document.getElementById('createSubjects');
        if (container) {
            container.innerHTML = '';
            SUBJECTS.forEach(subject => {
                const div = document.createElement('div');
                div.className = 'subject-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `createSubjects-${subject}`;
                checkbox.value = subject;
                checkbox.checked = true;
                
                const label = document.createElement('label');
                label.htmlFor = `createSubjects-${subject}`;
                label.textContent = t('subjects.' + subject);
                
                div.appendChild(checkbox);
                div.appendChild(label);
                
                div.onclick = (e) => {
                    if (e.target === div) {
                        checkbox.checked = !checkbox.checked;
                    }
                };
                
                container.appendChild(div);
            });
        }
    }
}

function getSelectedSubjects(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showHome() { showScreen('homeScreen'); }

function showSoloSetup() { 
    showScreen('soloSetupScreen');
    setTimeout(renderSubjects, 50);
}

function showMultiMode() { showScreen('multiModeScreen'); }

function showCreateMulti() { 
    showScreen('createMultiScreen');
    setTimeout(renderSubjects, 50);
}

function showJoinMulti() { 
    showScreen('joinMultiScreen');
    // Reset all team selection state
    selectedJoinTeam = null;
    roomGameMode = null;
    isCheckingRoom = false;
    
    const teamSelectionDiv = document.getElementById('teamSelectionDiv');
    if (teamSelectionDiv) {
        teamSelectionDiv.style.display = 'none';
    }
    
    // Reset team button styles
    resetTeamButtonStyles();
    
    // Clear the room code input
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) {
        joinCodeInput.value = '';
    }
}

function resetTeamButtonStyles() {
    const redDiv = document.getElementById('joinTeamRed');
    const blueDiv = document.getElementById('joinTeamBlue');
    
    if (redDiv) {
        redDiv.style.border = '2px solid #e5e7eb';
        redDiv.style.background = '#f9fafb';
        redDiv.style.opacity = '1';
        redDiv.style.pointerEvents = 'auto';
        redDiv.style.cursor = 'pointer';
    }
    
    if (blueDiv) {
        blueDiv.style.border = '2px solid #e5e7eb';
        blueDiv.style.background = '#f9fafb';
        blueDiv.style.opacity = '1';
        blueDiv.style.pointerEvents = 'auto';
        blueDiv.style.cursor = 'pointer';
    }
    
    // Uncheck radio buttons
    const redRadio = document.querySelector('input[name="joinTeam"][value="red"]');
    const blueRadio = document.querySelector('input[name="joinTeam"][value="blue"]');
    if (redRadio) redRadio.checked = false;
    if (blueRadio) blueRadio.checked = false;
}

function getMyTeam() {
    return myTeam;
}

// === SOLO GAME ===
async function startSoloGame() {
    const name = document.getElementById('soloName').value.trim();
    const subjects = getSelectedSubjects('soloSubjects');

    if (!name) {
        alert(t('alertName'));
        return;
    }

    if (subjects.length === 0) {
        alert(t('alertSubjects'));
        return;
    }

    gameMode = 'solo';
    soloScore = 0;
    soloQuestionIndex = 0;

    try {
        const response = await fetch(`/api/questions?language=${selectedLanguage}&subjects=${subjects.join(',')}`);
        const data = await response.json();
        soloQuestions = data.questions;

        if (soloQuestions.length === 0) {
            alert('No questions available for selected subjects');
            return;
        }

        showScreen('soloGameScreen');
        showNextSoloQuestion();
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert(t('connectionError'));
    }
}

function showNextSoloQuestion() {
    if (soloQuestionIndex >= soloQuestions.length) {
        showSoloGameOver();
        return;
    }

    soloCurrentQuestion = soloQuestions[soloQuestionIndex];
    document.getElementById('soloScore').textContent = `${t('score')}: ${soloScore}`;
    document.getElementById('soloQuestionText').textContent = soloCurrentQuestion.q;

    let timeLeft = soloCurrentQuestion.time || 10;
    document.getElementById('soloTimer').textContent = `⏱️ ${timeLeft}s`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('soloTimer').textContent = `⏱️ ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleSoloTimeout();
        }
    }, 1000);

    const optionsBox = document.getElementById('soloOptionsBox');
    optionsBox.innerHTML = '';

    soloCurrentQuestion.options.forEach((option, idx) => {
        const div = document.createElement('div');
        div.className = 'option visible';
        div.textContent = option;
        div.onclick = () => handleSoloAnswer(idx);
        optionsBox.appendChild(div);
    });

    hideSoloMessage();
}

function handleSoloAnswer(idx) {
    clearInterval(timerInterval);

    const correct = idx === soloCurrentQuestion.correct;
    if (correct) {
        soloScore += 100;
        document.getElementById('soloScore').textContent = `${t('score')}: ${soloScore}`;
    }

    const options = document.querySelectorAll('#soloOptionsBox .option');
    options.forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) {
            opt.classList.add('correct');
        } else if (i === idx && !correct) {
            opt.classList.add('incorrect');
        }
    });

    const message = correct ? t('correct') : `${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`;
    showSoloMessage(message);

    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 3000);
}

function handleSoloTimeout() {
    const options = document.querySelectorAll('#soloOptionsBox .option');
    options.forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) {
            opt.classList.add('correct');
        }
    });

    showSoloMessage(`⏰ ${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`);
    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 3000);
}

function showSoloGameOver() {
    clearInterval(timerInterval);
    showScreen('gameOverScreen');

    document.getElementById('winnerBox').textContent = `🏆 ${t('score')}: ${soloScore}`;

    const finalScores = document.getElementById('finalScores');
    finalScores.innerHTML = `<h3 style="margin-bottom: 15px;">${t('finalScores')}</h3>`;

    const div = document.createElement('div');
    div.className = 'score-item';
    div.innerHTML = `<span>${document.getElementById('soloName').value}</span><span>${soloScore}</span>`;
    finalScores.appendChild(div);
}

function showSoloMessage(text) {
    const box = document.getElementById('soloMessageBox');
    box.textContent = text;
    box.style.display = 'block';
}

function hideSoloMessage() {
    document.getElementById('soloMessageBox').style.display = 'none';
}

// === MULTIPLAYER GAME ===
function createRoom() {
    const code = document.getElementById('createCode').value.trim().toUpperCase();
    const name = document.getElementById('createName').value.trim();
    const subjects = getSelectedSubjects('createSubjects');
    
    if (!code || !name) {
        alert(t('alertBothFields'));
        return;
    }
    
    if (subjects.length === 0) {
        alert(t('alertSubjects'));
        return;
    }
    
    currentRoomCode = code;
    gameMode = 'multiplayer';
    connectWebSocket(code, name, true, subjects, selectedGameMode);
}

// FIXED: Single checkRoomMode function with proper Promise handling
async function checkRoomMode() {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    
    if (!code || code.length < 3) {
        // Hide team selection if code is too short
        const teamSelectionDiv = document.getElementById('teamSelectionDiv');
        if (teamSelectionDiv) {
            teamSelectionDiv.style.display = 'none';
        }
        roomGameMode = null;
        return;
    }
    
    // Prevent multiple simultaneous checks
    if (isCheckingRoom) {
        return;
    }
    
    isCheckingRoom = true;
    console.log('Checking room mode for:', code);
    
    return new Promise((resolve) => {
        const tempWs = new WebSocket(`ws://${window.location.host}/ws/${code}`);
        let responseReceived = false;
        
        const timeout = setTimeout(() => {
            if (!responseReceived) {
                console.log('Timeout waiting for room info');
                tempWs.close();
                isCheckingRoom = false;
                resolve(null);
            }
        }, 3000);
        
        tempWs.onopen = () => {
            console.log('WebSocket opened, sending getRoomInfo');
            tempWs.send(JSON.stringify({ 
                action: 'getRoomInfo'
            }));
        };
        
        tempWs.onmessage = (event) => {
            responseReceived = true;
            clearTimeout(timeout);
            
            const msg = JSON.parse(event.data);
            console.log('Room info received:', msg);
            
            if (msg.event === 'roomInfo') {
                roomGameMode = msg.data.gameMode;
                console.log('Game mode set to:', roomGameMode);
                
                const teamSelectionDiv = document.getElementById('teamSelectionDiv');
                if (msg.data.gameMode === 'team') {
                    console.log('Team mode detected, showing team selection');
                    teamSelectionDiv.style.display = 'block';
                    
                    // Reset team selection
                    selectedJoinTeam = null;
                    resetTeamButtonStyles();
                    
                    // Update team counts
                    if (msg.data.teamCounts) {
                        console.log('Team counts:', msg.data.teamCounts);
                        document.getElementById('redCount').textContent = `${msg.data.teamCounts.red}/2`;
                        document.getElementById('blueCount').textContent = `${msg.data.teamCounts.blue}/2`;
                        
                        const redDiv = document.getElementById('joinTeamRed');
                        const blueDiv = document.getElementById('joinTeamBlue');
                        
                        // Handle full teams
                        if (msg.data.teamCounts.red >= 2) {
                            redDiv.style.opacity = '0.5';
                            redDiv.style.pointerEvents = 'none';
                            redDiv.style.cursor = 'not-allowed';
                        }
                        
                        if (msg.data.teamCounts.blue >= 2) {
                            blueDiv.style.opacity = '0.5';
                            blueDiv.style.pointerEvents = 'none';
                            blueDiv.style.cursor = 'not-allowed';
                        }
                        
                        // Auto-select available team if only one is available
                        if (msg.data.teamCounts.red >= 2 && msg.data.teamCounts.blue < 2) {
                            selectJoinTeam('blue');
                        } else if (msg.data.teamCounts.blue >= 2 && msg.data.teamCounts.red < 2) {
                            selectJoinTeam('red');
                        }
                    }
                } else {
                    console.log('FFA mode detected, hiding team selection');
                    teamSelectionDiv.style.display = 'none';
                }
                
                resolve(msg.data.gameMode);
            } else if (msg.event === 'error') {
                console.log('Room not found:', msg.data);
                roomGameMode = null;
                const teamSelectionDiv = document.getElementById('teamSelectionDiv');
                if (teamSelectionDiv) {
                    teamSelectionDiv.style.display = 'none';
                }
                resolve(null);
            }
            
            isCheckingRoom = false;
        };
        
        tempWs.onerror = (error) => {
            responseReceived = true;
            clearTimeout(timeout);
            console.log('WebSocket error:', error);
            isCheckingRoom = false;
            resolve(null);
        };
        
        tempWs.onclose = () => {
            console.log('Temp WebSocket closed');
            if (!responseReceived) {
                isCheckingRoom = false;
                resolve(null);
            }
        };
    });
}

function selectJoinTeam(team) {
    selectedJoinTeam = team;
    console.log('Selected team:', team);
    
    const redDiv = document.getElementById('joinTeamRed');
    const blueDiv = document.getElementById('joinTeamBlue');
    
    // Reset both first
    if (redDiv.style.pointerEvents !== 'none') {
        redDiv.style.border = '2px solid #e5e7eb';
        redDiv.style.background = '#f9fafb';
    }
    if (blueDiv.style.pointerEvents !== 'none') {
        blueDiv.style.border = '2px solid #e5e7eb';
        blueDiv.style.background = '#f9fafb';
    }
    
    // Highlight selected
    if (team === 'red' && redDiv.style.pointerEvents !== 'none') {
        redDiv.style.border = '2px solid #ef4444';
        redDiv.style.background = '#fee2e2';
        const radio = document.querySelector('input[name="joinTeam"][value="red"]');
        if (radio) radio.checked = true;
    } else if (team === 'blue' && blueDiv.style.pointerEvents !== 'none') {
        blueDiv.style.border = '2px solid #3b82f6';
        blueDiv.style.background = '#dbeafe';
        const radio = document.querySelector('input[name="joinTeam"][value="blue"]');
        if (radio) radio.checked = true;
    }
}

// FIXED: joinRoom now awaits checkRoomMode if needed
async function joinRoom() {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const name = document.getElementById('joinName').value.trim();
    
    if (!code || !name) {
        alert(t('alertBothFields'));
        return;
    }
    
    // If we haven't checked the room mode yet, do it now
    if (roomGameMode === null && !isCheckingRoom) {
        console.log('Room mode not checked yet, checking now...');
        await checkRoomMode();
    }
    
    // Wait a bit if still checking
    if (isCheckingRoom) {
        console.log('Still checking room, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Joining room. Game mode:', roomGameMode, 'Selected team:', selectedJoinTeam);
    
    // Check if team mode and no team selected
    if (roomGameMode === 'team' && !selectedJoinTeam) {
        alert(t('selectTeam'));
        return;
    }
    
    currentRoomCode = code;
    gameMode = 'multiplayer';
    connectWebSocket(code, name, false, [], 'ffa', selectedJoinTeam);
}

function initializeGameModeSelection() {
    const gameModeFF = document.getElementById('gameModeFF');
    const gameModeTeam = document.getElementById('gameModeTeam');
    
    if (gameModeFF) {
        gameModeFF.onclick = () => selectGameMode('ffa');
    }
    
    if (gameModeTeam) {
        gameModeTeam.onclick = () => selectGameMode('team');
    }
}

function connectWebSocket(code, playerName, isCreating, subjects, gameMode = 'ffa', team = null) {
    console.log('Connecting with team:', team);
    ws = new WebSocket(`ws://${window.location.host}/ws/${code}`);
    
    ws.onopen = () => {
        if (isCreating) {
            ws.send(JSON.stringify({ 
                action: 'create',
                language: selectedLanguage,
                subjects: subjects,
                gameMode: gameMode
            }));
            setTimeout(() => {
                ws.send(JSON.stringify({ 
                    action: 'join',
                    playerName: playerName
                }));
            }, 100);
        } else {
            ws.send(JSON.stringify({ 
                action: 'join',
                playerName: playerName,
                team: team
            }));
        }
    };
    
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert(t('connectionError'));
    };
}

function handleMessage(msg) {
    switch (msg.event) {
        case 'roomCreated':
            document.getElementById('roomCode').textContent = msg.data.code;
            break;

        case 'joined':
            userId = msg.data.userId;
            matchToken = msg.data.matchToken;
            isHost = msg.data.isHost;
            myTeam = msg.data.team;
            if (msg.data.language) {
                selectedLanguage = msg.data.language;
                applyTranslations();
            }
            showScreen('lobbyScreen');
            document.getElementById('roomCode').textContent = currentRoomCode;
            break;

        case 'players':
            updatePlayers(msg.data);
            break;

        case 'gameStarting':
            showMessage(msg.data.message || `${msg.data.startedBy} started the game!`);
            setTimeout(() => showScreen('gameScreen'), 2000);
            break;

        case 'question':
            showQuestion(msg.data);
            break;

        case 'buzzed':
            handleBuzzed(msg.data);
            break;

        case 'answerResult':
            showResult(msg.data);
            break;

        case 'roundComplete':
            clearInterval(timerInterval);
            showMessage(`🎊 ${msg.data.message}`);
            updateScores(msg.data.scores);
            if (msg.data.teamScores) {
                updateTeamScores(msg.data.teamScores);
            }
            break;

        case 'playerEliminated':
            showMessage(`💀 ${msg.data.message}`);
            updateScores(msg.data.scores);

            const myName = document.getElementById('createName').value ||
                document.getElementById('joinName').value;
            if (msg.data.player === myName) {
                const buzzer = document.getElementById('buzzer');
                buzzer.disabled = true;
                buzzer.style.opacity = '0.5';
                buzzer.textContent = 'ELIMINATED';
                showMessage('💀 You have been eliminated! You can still watch the game.');
            }
            break;

        case 'teamEliminated':
            showMessage(`💀 ${msg.data.message}`);
            updateScores(msg.data.scores);
            if (msg.data.teamScores) {
                updateTeamScores(msg.data.teamScores);
            }

            if (msg.data.team === myTeam) {
                const buzzer = document.getElementById('buzzer');
                buzzer.disabled = true;
                buzzer.style.opacity = '0.5';
                buzzer.textContent = 'ELIMINATED';
                showMessage('💀 Your team has been eliminated! You can still watch the game.');
            }
            break;

        case 'roundTransition':
            showMessage(`🔥 ${msg.data.message}`);
            updateScores(msg.data.scores);
            if (msg.data.teamScores) {
                updateTeamScores(msg.data.teamScores);
            }
            break;

        case 'gameOver':
            showGameOver(msg.data);
            break;

        case 'error':
            alert(msg.data);
            break;

        case 'playerLeft':
            showMessage(msg.data.message || `${msg.data.player} left the game`);
            break;

        case 'newHost':
            showMessage(msg.data.message || `${msg.data.hostName} is now the host`);
            if (msg.data.hostName === document.getElementById('createName').value ||
                msg.data.hostName === document.getElementById('joinName').value) {
                isHost = true;
            }
            break;
    }
}

function updatePlayers(data) {
    const list = document.getElementById('playersList');
    list.innerHTML = `<h3 style="margin-bottom: 15px;">${t('players')}</h3>`;

    const isTeamMode = data.gameMode === 'team';

    if (isTeamMode && data.teamCounts) {
        const teamCountsDiv = document.createElement('div');
        teamCountsDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
        teamCountsDiv.innerHTML = `
            <div style="flex: 1; padding: 10px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; text-align: center;">
                <strong>${t('teamRed')}</strong><br>
                ${data.teamCounts.red}/2 Players
            </div>
            <div style="flex: 1; padding: 10px; background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; text-align: center;">
                <strong>${t('teamBlue')}</strong><br>
                ${data.teamCounts.blue}/2 Players
            </div>
        `;
        list.appendChild(teamCountsDiv);
    }

    data.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item' + (player.isHost ? ' host' : '');

        let teamBadge = '';
        if (isTeamMode && player.team) {
            const teamColor = player.team === 'red' ? 'team-red' : 'team-blue';
            const teamName = t('team' + player.team.charAt(0).toUpperCase() + player.team.slice(1));
            teamBadge = `<span class="team-badge ${teamColor}">${teamName}</span>`;
        }

        div.innerHTML = `
            <span>${player.name}${teamBadge}</span>
            ${player.isHost ? `<span class="host-badge">${t('host')}</span>` : ''}
        `;
        list.appendChild(div);
    });

    const startBtn = document.getElementById('startBtn');
    if (isHost && data.canStart) {
        startBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'none';
    }
}

function startGame() {
    ws.send(JSON.stringify({
        action: 'start',
        userId: userId,
        matchToken: matchToken,
        language: selectedLanguage
    }));
}

function showQuestion(data) {
    hasBuzzed = false;
    canAnswer = false;

    document.getElementById('questionText').textContent = data.q;

    if (data.round && data.questionInRound && data.questionsPerRound) {
        const roundInfo = document.getElementById('roundInfo');
        if (roundInfo) {
            roundInfo.textContent = `${t('round')} ${data.round}/3 - ${t('question')} ${data.questionInRound}/${data.questionsPerRound}`;
        }
    }

    let timeLeft = data.time;
    document.getElementById('timer').textContent = `⏱️ ${timeLeft}s`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `⏱️ ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);

    const buzzer = document.getElementById('buzzer');
    buzzer.disabled = false;
    buzzer.classList.remove('buzzed');
    buzzer.textContent = t('buzz');

    const optionsBox = document.getElementById('optionsBox');
    optionsBox.innerHTML = '';

    data.options.forEach((option, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = option;
        div.dataset.index = idx;
        div.onclick = () => answerQuestion(idx);
        optionsBox.appendChild(div);
    });

    hideMessage();
}

function buzzerPressed() {
    const buzzer = document.getElementById('buzzer');

    if (buzzer.disabled) {
        return;
    }

    if (hasBuzzed) return;

    hasBuzzed = true;
    buzzer.disabled = true;
    buzzer.classList.add('buzzed');

    ws.send(JSON.stringify({
        action: 'buzz',
        userId: userId,
        matchToken: matchToken
    }));
}

function handleBuzzed(data) {
    const playerName = data.player || data;
    const message = data.message || `🔔 ${playerName} buzzed!`;
    showMessage(message);

    const buzzer = document.getElementById('buzzer');
    buzzer.disabled = true;
    buzzer.classList.add('buzzed');
    buzzer.textContent = `${playerName} ${t('buzz')}`;

    const myName = document.getElementById('createName').value ||
        document.getElementById('joinName').value;
    if (playerName === myName) {
        canAnswer = true;
        const options = document.querySelectorAll('.option');
        options.forEach(opt => opt.classList.add('visible'));
    }
}

function answerQuestion(idx) {
    if (!canAnswer) return;

    ws.send(JSON.stringify({
        action: 'answer',
        userId: userId,
        matchToken: matchToken,
        idx: idx
    }));

    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.onclick = null);
    canAnswer = false;
}

function showResult(data) {
    clearInterval(timerInterval);

    const optionsBox = document.getElementById('optionsBox');
    const options = optionsBox.querySelectorAll('.option');

    options.forEach((opt) => {
        opt.classList.add('visible');
        opt.onclick = null;
        if (opt.textContent === data.answer) {
            opt.classList.add('correct');
        }
    });

    updateScores(data.scores);

    if (data.teamScores) {
        updateTeamScores(data.teamScores);
    }

    const message = data.message || (data.correct ? '✅ Correct!' : `❌ Wrong! Answer: ${data.answer}`);
    showMessage(message);
}

function updateScores(scores) {
    const scoresBox = document.getElementById('scoresBox');
    const existingTeamScores = document.getElementById('teamScoresDiv');

    scoresBox.innerHTML = `<h3 style="margin-bottom: 15px;">${t('scores')}</h3>`;

    if (existingTeamScores) {
        scoresBox.insertBefore(existingTeamScores, scoresBox.firstChild);
    }

    Object.entries(scores).forEach(([name, score]) => {
        const div = document.createElement('div');
        div.className = 'score-item';
        div.innerHTML = `<span>${name}</span><span>${score}</span>`;
        scoresBox.appendChild(div);
    });
}

function updateTeamScores(teamScores) {
    const scoresBox = document.getElementById('scoresBox');

    let teamScoresDiv = document.getElementById('teamScoresDiv');
    if (!teamScoresDiv) {
        teamScoresDiv = document.createElement('div');
        teamScoresDiv.id = 'teamScoresDiv';
        teamScoresDiv.className = 'team-scores';
        scoresBox.insertBefore(teamScoresDiv, scoresBox.firstChild);
    }

    teamScoresDiv.innerHTML = `
        <div class="team-score-box red ${!teamScores.red.active ? 'eliminated' : ''}">
            <div style="font-size: 14px;">${t('teamRed')}</div>
            <div style="font-size: 24px; margin-top: 5px;">${teamScores.red.score}</div>
            ${!teamScores.red.active ? '<div style="font-size: 12px; margin-top: 5px;">ELIMINATED</div>' : ''}
        </div>
        <div class="team-score-box blue ${!teamScores.blue.active ? 'eliminated' : ''}">
            <div style="font-size: 14px;">${t('teamBlue')}</div>
            <div style="font-size: 24px; margin-top: 5px;">${teamScores.blue.score}</div>
            ${!teamScores.blue.active ? '<div style="font-size: 12px; margin-top: 5px;">ELIMINATED</div>' : ''}
        </div>
    `;
}

function showGameOver(data) {
    clearInterval(timerInterval);
    showScreen('gameOverScreen');

    const reason = data.reason || 'Game Finished!';
    document.getElementById('winnerBox').textContent =
        data.winner ? `🏆 ${reason} - Winner: ${data.winner}` : reason;

    const finalScores = document.getElementById('finalScores');
    finalScores.innerHTML = `<h3 style="margin-bottom: 15px;">${t('finalScores')}</h3>`;

    if (data.teamScores) {
        const teamScoresDiv = document.createElement('div');
        teamScoresDiv.className = 'team-scores';
        teamScoresDiv.style.marginBottom = '20px';
        teamScoresDiv.innerHTML = `
            <div class="team-score-box red">
                <div style="font-size: 14px;">${t('teamRed')}</div>
                <div style="font-size: 24px; margin-top: 5px;">${data.teamScores.red.score}</div>
            </div>
            <div class="team-score-box blue">
                <div style="font-size: 14px;">${t('teamBlue')}</div>
                <div style="font-size: 24px; margin-top: 5px;">${data.teamScores.blue.score}</div>
            </div>
        `;
        finalScores.appendChild(teamScoresDiv);
    }

    const scoresTitle = document.createElement('h4');
    scoresTitle.textContent = 'Individual Scores:';
    scoresTitle.style.marginBottom = '10px';
    finalScores.appendChild(scoresTitle);

    Object.entries(data.finalScores).sort((a, b) => b[1] - a[1]).forEach(([name, score]) => {
        const div = document.createElement('div');
        div.className = 'score-item';
        div.innerHTML = `<span>${name}</span><span>${score}</span>`;
        finalScores.appendChild(div);
    });
}

function showMessage(text) {
    const box = document.getElementById('messageBox');
    box.textContent = text;
    box.style.display = 'block';
}

function hideMessage() {
    document.getElementById('messageBox').style.display = 'none';
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    applyTranslations();

    // Set up room code listener with debounce
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) {
        let debounceTimer;
        
        joinCodeInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const code = e.target.value.trim();
            
            if (code.length >= 4) {
                debounceTimer = setTimeout(() => {
                    checkRoomMode();
                }, 300);
            } else {
                // Hide team selection if code is too short
                const teamSelectionDiv = document.getElementById('teamSelectionDiv');
                if (teamSelectionDiv) {
                    teamSelectionDiv.style.display = 'none';
                }
                roomGameMode = null;
            }
        });
        
        joinCodeInput.addEventListener('blur', () => {
            const code = joinCodeInput.value.trim();
            if (code.length >= 4) {
                checkRoomMode();
            }
        });
    }
    
    // Initialize game mode selection
    initializeGameModeSelection();
    
    // Set up team selection click handlers
    const joinTeamRed = document.getElementById('joinTeamRed');
    const joinTeamBlue = document.getElementById('joinTeamBlue');
    
    if (joinTeamRed) {
        joinTeamRed.onclick = (e) => {
            e.preventDefault();
            if (joinTeamRed.style.pointerEvents !== 'none') {
                selectJoinTeam('red');
            }
        };
    }
    
    if (joinTeamBlue) {
        joinTeamBlue.onclick = (e) => {
            e.preventDefault();
            if (joinTeamBlue.style.pointerEvents !== 'none') {
                selectJoinTeam('blue');
            }
        };
    }
});