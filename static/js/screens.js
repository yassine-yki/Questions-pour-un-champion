/*
Resume du fichier :
Ce fichier gere les changements d'ecran et les petites actions de navigation.
Il expose les fonctions appelees par les boutons HTML : solo, multijoueur, creation,
rejoindre, accueil, reglages et salles publiques.
*/

let lobbyWs = null;
let lobbyRefreshTimer = null;
let lobbyWsHealthy = false;
let selectedRoomVisibility = window.selectedRoomVisibility || 'public';
window.selectedRoomVisibility = selectedRoomVisibility;

function showScreen(screenId) {
    const currentScreen = document.querySelector('.screen.active');
    const newScreen = document.getElementById(screenId);
    if (!newScreen) return;

    if (currentScreen && currentScreen.id !== screenId) {
        newScreen.classList.add('active', 'screen-entering');
        currentScreen.classList.add('screen-exiting');

        setTimeout(() => {
            currentScreen.classList.remove('active', 'screen-exiting');
            newScreen.classList.remove('screen-entering');
        }, 300);
    } else {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active', 'screen-exiting', 'screen-entering');
        });
        newScreen.classList.add('active');
    }
}

function showHome() {
    disconnectFromLobby();
    showScreen('homeScreen');
    if (typeof updateAllAvatarDisplays === 'function') updateAllAvatarDisplays();
}

function showSoloSetup() {
    showScreen('soloSetupScreen');
    setTimeout(() => {
        if (typeof renderSubjects === 'function') renderSubjects();
    }, 50);
}

function showMultiMode() {
    showScreen('multiModeScreen');
}

function showCreateMulti() {
    disconnectFromLobby();
    showScreen('createMultiScreen');
    if (typeof syncPlayerNameInputs === 'function') syncPlayerNameInputs();
    setTimeout(() => {
        if (typeof renderSubjects === 'function') renderSubjects();
        if (typeof syncPlayerNameInputs === 'function') syncPlayerNameInputs();
    }, 50);
}

function showJoinMulti() {
    showScreen('joinMultiScreen');
    if (typeof syncPlayerNameInputs === 'function') syncPlayerNameInputs();
    selectedJoinTeam = null;
    roomGameMode = null;
    isCheckingRoom = false;

    const teamSelectionDiv = document.getElementById('teamSelectionDiv');
    if (teamSelectionDiv) teamSelectionDiv.style.display = 'none';
    if (typeof resetTeamButtonStyles === 'function') resetTeamButtonStyles();

    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) joinCodeInput.value = '';

    connectToLobby();
    refreshPublicRooms();
    startPublicRoomsRefresh();
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.add('active');
    if (typeof updateLanguageUI === 'function') updateLanguageUI();
    if (typeof updateThemeUI === 'function') updateThemeUI();
    if (typeof updateMasterMuteUI === 'function') updateMasterMuteUI();
    if (typeof updateMusicUI === 'function') updateMusicUI();
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
}

function copyRoomCode() {
    const codeEl = document.getElementById('roomCode') || document.getElementById('createCode');
    const code = (codeEl?.value || codeEl?.textContent || '').replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
    if (!code) return;

    const onCopied = () => {
        codeEl.classList.add('copied');
        setTimeout(() => codeEl.classList.remove('copied'), 1500);
        if (typeof showMessage === 'function') showMessage('Code copie !');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(onCopied).catch(() => {});
    }
}

function connectToLobby() {
    if (lobbyWs && lobbyWs.readyState === WebSocket.OPEN) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    lobbyWs = new WebSocket(`${protocol}//${location.host}/ws/LOBBY`);

    lobbyWs.onopen = () => {
        lobbyWsHealthy = true;
        lobbyWs.send(JSON.stringify({ action: 'joinLobby' }));
    };

    lobbyWs.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.event === 'publicRooms' && typeof renderPublicRooms === 'function') {
            renderPublicRooms(msg.data);
        }
    };

    lobbyWs.onerror = () => { lobbyWsHealthy = false; };
    lobbyWs.onclose = () => {
        lobbyWsHealthy = false;
        lobbyWs = null;
    };
}

function disconnectFromLobby() {
    stopPublicRoomsRefresh();
    if (!lobbyWs) return;
    try {
        lobbyWs.close();
    } catch (e) {}
    lobbyWsHealthy = false;
    lobbyWs = null;
}
async function refreshPublicRooms() {
    if (typeof renderPublicRooms !== 'function') return;
    if (lobbyWsHealthy && lobbyWs && lobbyWs.readyState === WebSocket.OPEN) return;
    try {
        const response = await fetch('/api/public-rooms', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        renderPublicRooms(data.rooms || []);
    } catch (e) {}
}

function startPublicRoomsRefresh() {
    stopPublicRoomsRefresh();
    lobbyRefreshTimer = setInterval(() => {
        const joinScreen = document.getElementById('joinMultiScreen');
        if (!joinScreen || !joinScreen.classList.contains('active')) {
            stopPublicRoomsRefresh();
            return;
        }
        refreshPublicRooms();
    }, 2500);
}

function stopPublicRoomsRefresh() {
    if (!lobbyRefreshTimer) return;
    clearInterval(lobbyRefreshTimer);
    lobbyRefreshTimer = null;
}

function joinPublicRoom(code) {
    showJoinMulti();

    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) {
        joinCodeInput.value = String(code || '').toUpperCase();
        joinCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (typeof checkRoomMode === 'function') {
        setTimeout(checkRoomMode, 50);
    }
}

function selectVisibility(visibility) {
    selectedRoomVisibility = visibility === 'private' ? 'private' : 'public';
    window.selectedRoomVisibility = selectedRoomVisibility;

    const pub = document.getElementById('visibilityPublic');
    const priv = document.getElementById('visibilityPrivate');
    [pub, priv].forEach(el => el && el.classList.remove('is-on', 'selected'));

    const target = selectedRoomVisibility === 'public' ? pub : priv;
    if (target) target.classList.add('is-on', 'selected');
}
