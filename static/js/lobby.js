/*
Resume du fichier :
Ce fichier gere la creation et l'entree dans les salles multijoueur.
Il ouvre la connexion WebSocket, envoie les infos de salle au serveur et gere les questions IA pour une salle.
*/

// Cree une salle multijoueur avec les options choisies par l hote.
function getSelectedMultiQuizType() {
    const validTypes = ['classic', 'speed', 'picguess', 'wager'];
    const fromWindow = window.selectedMultiQuizType || window.selectedQuizType?.multi;
    return validTypes.includes(fromWindow) ? fromWindow : 'classic';
}

async function createRoom() {
    const codeEl = document.getElementById('createCode');
    const nameEl = document.getElementById('createName');
    const code = codeEl?.value.trim().toUpperCase();
    const name = (typeof getPreferredPlayerName === 'function')
        ? getPreferredPlayerName('createName')
        : nameEl?.value.trim();
    const subjects = getSelectedSubjects('createSubjects');
    const customCategory = document.getElementById('customCategoryInputMulti')?.value.trim();
    
    // Validation
    if (!name) { nameEl?.focus(); nameEl?.classList.add('input-error'); setTimeout(() => nameEl?.classList.remove('input-error'), 1500); showMessage('⚠️ ' + t('alertName')); return; }
    if (!code) { codeEl?.focus(); codeEl?.classList.add('input-error'); setTimeout(() => codeEl?.classList.remove('input-error'), 1500); showMessage('⚠️ Entrez un code de salle'); return; }
    if (!customCategory && subjects.length === 0) { showMessage('⚠️ ' + t('alertSubjects')); return; }
    
    const launchBtn = document.querySelector('#createMultiScreen .setup-launch-btn');
    if (launchBtn) { launchBtn.disabled = true; launchBtn.textContent = '⏳ Création...'; }
    
    try {
        if (customCategory) {
            await createRoomWithAI(code, name, customCategory);
        } else if (subjects.length > 0) {
            currentRoomCode = code;
            gameMode = 'multiplayer';
            const isPublic = selectedRoomVisibility === 'public';
            connectWebSocket(code, name, true, subjects, selectedGameMode, isPublic, null, null, getSelectedMultiQuizType());
        }
    } finally {
        if (launchBtn) { launchBtn.disabled = false; launchBtn.textContent = '🚀 Créer & Rejoindre'; }
    }
}

async function createRoomWithAI(code, name, category, retryCount = 0) {
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
            
            // Garde temporairement les questions IA
            window.aiGeneratedQuestions = data.questions.map((q) => {
                const correctIndex = q.options.findIndex(opt => opt === q.answer);
                return {
                    q: q.question,
                    options: q.options,
                    correct: correctIndex >= 0 ? correctIndex : 0,
                    time: 15
                };
            });
            
            currentRoomCode = code;
            gameMode = 'multiplayer';
            const isPublic = selectedRoomVisibility === 'public';
            // Envoie ai_custom comme sujet pour signaler les questions IA
            // Parametres : code, nom, creation, sujets, mode, public, equipe, questions IA
            connectWebSocket(code, name, true, ['ai_custom'], selectedGameMode, isPublic, null, window.aiGeneratedQuestions, getSelectedMultiQuizType());
        } else if (data.retry && retryCount < MAX_RETRIES) {
            // Le modele charge encore, nouvelle tentative apres un delai
            console.log(`AI model loading, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => createRoomWithAI(code, name, category, retryCount + 1), 3000);
        } else if (retryCount >= MAX_RETRIES) {
            // Nombre maximum de tentatives atteint
            if (loadingModal) loadingModal.style.display = 'none';
            showMessage(t('aiErrorTimeout'), 'error', 3200);
        } else {
            if (loadingModal) loadingModal.style.display = 'none';
            showMessage(data.error || t('aiErrorGeneration'), 'error', 3200);
        }
    } catch (error) {
        console.error('Error generating AI questions:', error);
        if (retryCount < MAX_RETRIES) {
            console.log(`Network error, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => createRoomWithAI(code, name, category, retryCount + 1), 3000);
        } else {
            if (loadingModal) loadingModal.style.display = 'none';
            showMessage(t('aiErrorConnection'), 'error', 3200);
        }
    }
}

async function checkRoomMode() {
    const code = document.getElementById('joinCode')?.value.trim().toUpperCase();
    if (!code || code.length < 3) {
        document.getElementById('teamSelectionDiv')?.style.setProperty('display', 'none');
        roomGameMode = null;
        return;
    }
    if (isCheckingRoom) return;
    isCheckingRoom = true;

    return new Promise((resolve) => {
        const tempWs = new WebSocket(getWebSocketUrl(code));
        let responseReceived = false;
        const timeout = setTimeout(() => { if (!responseReceived) { tempWs.close(); isCheckingRoom = false; resolve(null); } }, 3000);

        tempWs.onopen = () => tempWs.send(JSON.stringify({ action: 'getRoomInfo' }));
        tempWs.onmessage = (event) => {
            responseReceived = true;
            clearTimeout(timeout);
            const msg = JSON.parse(event.data);
            if (msg.event === 'roomInfo') {
                roomGameMode = msg.data.gameMode;
                const teamSelectionDiv = document.getElementById('teamSelectionDiv');
                if (msg.data.gameMode === 'team' && teamSelectionDiv) {
                    teamSelectionDiv.style.display = 'block';
                    selectedJoinTeam = null;
                    resetTeamButtonStyles();
                    if (msg.data.teamCounts) {
                        document.getElementById('redCount').textContent = `${msg.data.teamCounts.red}/2`;
                        document.getElementById('blueCount').textContent = `${msg.data.teamCounts.blue}/2`;
                        const redDiv = document.getElementById('joinTeamRed');
                        const blueDiv = document.getElementById('joinTeamBlue');
                        if (msg.data.teamCounts.red >= 2 && redDiv) { redDiv.style.opacity = '0.5'; redDiv.style.pointerEvents = 'none'; redDiv.classList.add('disabled'); }
                        if (msg.data.teamCounts.blue >= 2 && blueDiv) { blueDiv.style.opacity = '0.5'; blueDiv.style.pointerEvents = 'none'; blueDiv.classList.add('disabled'); }
                        if (msg.data.teamCounts.red >= 2 && msg.data.teamCounts.blue < 2) selectJoinTeam('blue');
                        else if (msg.data.teamCounts.blue >= 2 && msg.data.teamCounts.red < 2) selectJoinTeam('red');
                    }
                } else if (teamSelectionDiv) teamSelectionDiv.style.display = 'none';
                resolve(msg.data.gameMode);
            } else { roomGameMode = null; document.getElementById('teamSelectionDiv')?.style.setProperty('display', 'none'); resolve(null); }
            tempWs.close();
            isCheckingRoom = false;
        };
        tempWs.onerror = () => { responseReceived = true; clearTimeout(timeout); isCheckingRoom = false; resolve(null); };
        tempWs.onclose = () => { if (!responseReceived) { isCheckingRoom = false; resolve(null); } };
    });
}

// Rejoint une salle existante avec le nom du joueur et son equipe si besoin.
async function joinRoom() {
    const code = document.getElementById('joinCode')?.value.trim().toUpperCase();
    const name = (typeof getPreferredPlayerName === 'function')
        ? getPreferredPlayerName('joinName')
        : document.getElementById('joinName')?.value.trim();
    if (!code || !name) { showMessage(t('alertBothFields'), 'error', 2200); return; }
    if (roomGameMode === null && !isCheckingRoom) await checkRoomMode();
    if (isCheckingRoom) await new Promise(r => setTimeout(r, 500));
    if (roomGameMode === 'team' && !selectedJoinTeam) { showMessage(t('selectTeam'), 'error', 2200); return; }
    currentRoomCode = code;
    gameMode = 'multiplayer';
    connectWebSocket(code, name, false, [], 'ffa', false, selectedJoinTeam);
}

// Ouvre la connexion temps reel avec le serveur pour cette salle.
function connectWebSocket(code, playerName, isCreating, subjects, gm = 'ffa', isPublic = false, team = null, aiQuestions = null, quizType = 'classic') {
    // Quitte le lobby general quand on rejoint une salle
    disconnectFromLobby();
    if (typeof window.setUXState === 'function') window.setUXState('connecting', { roomCode: code, isCreating });
    
    // Logs de debug
    console.log('connectWebSocket called with:');
    console.log('- code:', code);
    console.log('- isCreating:', isCreating);
    console.log('- quizType:', quizType);
    console.log('- aiQuestions length:', aiQuestions ? aiQuestions.length : 0);
    
    // Recupere l avatar actuel pour l envoyer au serveur
    const avatarConfig = currentAvatar || generateRandomAvatar();
    
    ws = new WebSocket(getWebSocketUrl(code));
    ws.onopen = () => {
        if (isCreating) {
            const createData = { 
                action: 'create', 
                language: selectedLanguage, 
                subjects: subjects, 
                gameMode: gm, 
                isPublic: isPublic,
                quizType: quizType
            };
            // Inclut les questions IA si elles existent
            if (aiQuestions && aiQuestions.length > 0) {
                createData.aiQuestions = aiQuestions;
            }
            ws.send(JSON.stringify(createData));
            ws.send(JSON.stringify({ action: 'join', playerName: playerName, avatar: avatarConfig }));
        } else ws.send(JSON.stringify({ action: 'join', playerName: playerName, team: team, avatar: avatarConfig }));
    };
    ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
    ws.onerror = () => {
        if (!isAttemptingReconnect) showMessage(t('connectionError'), 'error', 2600);
    };
    ws.onclose = () => {
        // Reconnexion automatique si la partie etait en cours
        if (userId && matchToken && currentRoomCode && !isAttemptingReconnect) {
            const activeScreen = document.querySelector('.screen.active');
            const inGame = activeScreen && ['gameScreen', 'lobbyScreen'].includes(activeScreen.id);
            if (inGame) {
                attemptReconnect();
            }
        }
    };
}

// ============================================
// SUPPORT DE RECONNEXION
// ============================================

