/*
Resume du fichier :
Ce fichier gere les grands ecrans de l'application : accueil, reglages, solo, multi, creation et rejoindre une salle.
Il contient surtout la navigation visuelle et les petits modals/overlays generaux.
*/

let horrorActive = false;
let horrorIntervals = [];
let horrorTimeouts = [];

const horrorMessages = [
    "Regarde derrière toi...",
    "Je suis dans tes murs...",
    "Ne cligne pas des yeux...",
    "Quelqu'un respire dans ton dos...",
    "Je te vois jouer...",
    "Tu ne peux pas gagner...",
    "Le silence avant la tempête...",
    "Sens-tu cette présence ?",
    "Tes réponses ne te sauveront pas..."
];

function startHorrorEffects() {
    if (horrorActive) return;
    horrorActive = true;
    console.log("👻 Horror effects activated");
    
    // Cree le conteneur visuel du theme horreur
    if (!document.getElementById('horror-overlay-container')) {
        const container = document.createElement('div');
        container.id = 'horror-overlay-container';
        container.innerHTML = `
            <style>
                #horror-overlay-container {
                    pointer-events: none;
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    z-index: 9999;
                }
                
                .horror-flicker {
                    animation: horrorFlicker 0.1s infinite;
                }
                
                @keyframes horrorFlicker {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                .horror-notification {
                    position: fixed;
                    right: -300px;
                    background: rgba(20, 0, 0, 0.95);
                    color: #ff0000;
                    padding: 15px 20px;
                    border-left: 3px solid #ff0000;
                    font-family: 'Creepster', cursive, sans-serif;
                    font-size: 14px;
                    z-index: 10000;
                    transition: right 0.5s ease;
                    box-shadow: -5px 0 20px rgba(255, 0, 0, 0.3);
                    max-width: 280px;
                }
                
                .horror-notification.show {
                    right: 20px;
                }
                
                .horror-notification::before {
                    content: '👻';
                    margin-right: 10px;
                }
                
                .horror-demon {
                    position: fixed;
                    width: 150px;
                    height: 200px;
                    background: radial-gradient(ellipse at center, rgba(255,0,0,0.3) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 2s ease;
                    pointer-events: none;
                    z-index: 9998;
                }
                
                .horror-demon::after {
                    content: '👁️';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 60px;
                    filter: drop-shadow(0 0 10px red);
                    animation: demonPulse 2s infinite;
                }
                
                @keyframes demonPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                }
                
                .horror-glitch-text {
                    animation: glitchText 0.3s infinite;
                }
                
                @keyframes glitchText {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                
                .horror-vignette {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%);
                    pointer-events: none;
                    z-index: 9997;
                    opacity: 0;
                    transition: opacity 3s ease;
                }
                
                .horror-scanlines {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(0, 0, 0, 0.1),
                        rgba(0, 0, 0, 0.1) 1px,
                        transparent 1px,
                        transparent 2px
                    );
                    pointer-events: none;
                    z-index: 9996;
                    opacity: 0;
                    transition: opacity 2s ease;
                }
                
                .horror-blood-drip {
                    position: fixed;
                    top: -50px;
                    width: 8px;
                    height: 50px;
                    background: linear-gradient(to bottom, #8B0000, #FF0000);
                    border-radius: 0 0 4px 4px;
                    animation: bloodDrip 4s ease-in forwards;
                    z-index: 9999;
                }
                
                @keyframes bloodDrip {
                    0% { top: -50px; height: 50px; }
                    70% { top: 100vh; height: 100px; }
                    100% { top: 100vh; height: 0; opacity: 0; }
                }
                
                .horror-jumpscare {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    opacity: 0;
                    pointer-events: none;
                }
                
                .horror-jumpscare.active {
                    opacity: 1;
                    animation: jumpscareFlash 0.5s ease;
                }
                
                .horror-jumpscare span {
                    font-size: 150px;
                    filter: drop-shadow(0 0 30px red);
                }
                
                @keyframes jumpscareFlash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                .cursor-horror {
                    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext x='0' y='24' font-size='24'%3E🩸%3C/text%3E%3C/svg%3E"), auto !important;
                }
            </style>
            
            <div class="horror-vignette" id="horror-vignette"></div>
            <div class="horror-scanlines" id="horror-scanlines"></div>
            <div class="horror-demon" id="horror-demon"></div>
            <div class="horror-jumpscare" id="horror-jumpscare"><span>👹</span></div>
        `;
        document.body.appendChild(container);
    }
    
    // Active la vignette et les lignes visuelles
    setTimeout(() => {
        const vignette = document.getElementById('horror-vignette');
        const scanlines = document.getElementById('horror-scanlines');
        if (vignette) vignette.style.opacity = '1';
        if (scanlines) scanlines.style.opacity = '0.3';
    }, 1000);
    
    // Ajoute le curseur horreur
    document.body.classList.add('cursor-horror');
    
    // Lance les evenements horreur aleatoires
    startHorrorNotifications();
    startHorrorDemon();
    startBloodDrips();
    startRandomGlitches();
    startRandomJumpscares();
}

function stopHorrorEffects() {
    if (!horrorActive) return;
    horrorActive = false;
    console.log("👻 Horror effects deactivated");
    
    // Nettoie tous les intervalles et timeouts
    horrorIntervals.forEach(i => clearInterval(i));
    horrorTimeouts.forEach(t => clearTimeout(t));
    horrorIntervals = [];
    horrorTimeouts = [];
    
    // Retire les elements horreur
    const container = document.getElementById('horror-overlay-container');
    if (container) container.remove();
    
    // Retire le curseur horreur
    document.body.classList.remove('cursor-horror');
    
    // Retire les classes de glitch
    document.querySelectorAll('.horror-glitch-text, .horror-flicker').forEach(el => {
        el.classList.remove('horror-glitch-text', 'horror-flicker');
    });
}

function startHorrorNotifications() {
    // Notifications horreur aleatoires
    const interval = setInterval(() => {
        if (!horrorActive) return;
        
        if (Math.random() > 0.6) {
            showHorrorNotification(horrorMessages[Math.floor(Math.random() * horrorMessages.length)]);
        }
    }, 15000 + Math.random() * 20000); // Toutes les 15 a 35 secondes
    
    horrorIntervals.push(interval);
    
    // Premiere notification apres 10 secondes
    const timeout = setTimeout(() => {
        if (horrorActive) {
            showHorrorNotification(horrorMessages[Math.floor(Math.random() * horrorMessages.length)]);
        }
    }, 10000);
    horrorTimeouts.push(timeout);
}

function showHorrorNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'horror-notification';
    notif.textContent = message;
    notif.style.top = (20 + Math.random() * 60) + '%';
    
    const container = document.getElementById('horror-overlay-container');
    if (container) {
        container.appendChild(notif);
        
        // Fait entrer la notification
        setTimeout(() => notif.classList.add('show'), 100);
        
        // Fait sortir puis retire la notification
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 500);
        }, 4000);
    }
}

function startHorrorDemon() {
    const demon = document.getElementById('horror-demon');
    if (!demon) return;
    
    const interval = setInterval(() => {
        if (!horrorActive) return;
        
        if (Math.random() > 0.7) {
            // Positionne aleatoirement
            demon.style.left = (Math.random() * 80 + 10) + '%';
            demon.style.top = (Math.random() * 80 + 10) + '%';
            
            // Apparition progressive
            demon.style.opacity = '0.6';
            
            // Disparition apres un temps aleatoire
            const timeout = setTimeout(() => {
                demon.style.opacity = '0';
            }, 2000 + Math.random() * 3000);
            horrorTimeouts.push(timeout);
        }
    }, 20000 + Math.random() * 30000); // Toutes les 20 a 50 secondes
    
    horrorIntervals.push(interval);
}

function startBloodDrips() {
    const interval = setInterval(() => {
        if (!horrorActive) return;
        
        if (Math.random() > 0.5) {
            createBloodDrip();
        }
    }, 10000 + Math.random() * 15000); // Toutes les 10 a 25 secondes
    
    horrorIntervals.push(interval);
}

function createBloodDrip() {
    const drip = document.createElement('div');
    drip.className = 'horror-blood-drip';
    drip.style.left = (Math.random() * 100) + '%';
    
    const container = document.getElementById('horror-overlay-container');
    if (container) {
        container.appendChild(drip);
        setTimeout(() => drip.remove(), 5000);
    }
}

function startRandomGlitches() {
    const interval = setInterval(() => {
        if (!horrorActive) return;
        
        if (Math.random() > 0.7) {
            // Fait glitcher le titre ou le texte de question
            const targets = document.querySelectorAll('.title, .question-text, h1, h2');
            const target = targets[Math.floor(Math.random() * targets.length)];
            
            if (target) {
                target.classList.add('horror-glitch-text');
                const timeout = setTimeout(() => {
                    target.classList.remove('horror-glitch-text');
                }, 500 + Math.random() * 1000);
                horrorTimeouts.push(timeout);
            }
            
            // Fait aussi clignoter l ecran parfois
            if (Math.random() > 0.8) {
                document.body.classList.add('horror-flicker');
                const timeout2 = setTimeout(() => {
                    document.body.classList.remove('horror-flicker');
                }, 200);
                horrorTimeouts.push(timeout2);
            }
        }
    }, 8000 + Math.random() * 12000); // Toutes les 8 a 20 secondes
    
    horrorIntervals.push(interval);
}

function startRandomJumpscares() {
    // Jumpscares tres rares, seulement sur mauvaise reponse en mode horreur
    // Declenche depuis le gestionnaire de reponse
}

function triggerHorrorJumpscare() {
    if (!horrorActive) return;
    
    const jumpscare = document.getElementById('horror-jumpscare');
    if (jumpscare) {
        // Symbole horreur aleatoire
        const scaryEmojis = ['👹', '👺', '💀', '👻', '🎃', '😈'];
        jumpscare.querySelector('span').textContent = scaryEmojis[Math.floor(Math.random() * scaryEmojis.length)];
        
        jumpscare.classList.add('active');
        
        // Joue le son horreur s il existe
        playSfx('horror_scare');
        
        setTimeout(() => {
            jumpscare.classList.remove('active');
        }, 500);
    }
}

function updateThemeUI() {
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.theme === selectedTheme) {
            opt.classList.add('selected');
        }
    });
}

function updateParticlesColor() {
    const themeColors = {
        neon: '#0ff',
        dragon: '#ff6b35',
        ocean: '#00b4d8',
        sakura: '#ffb7c5',
        midnight: '#e94560',
        clean: '#4361ee',
        horror: '#8B0000'
    };
    
    const color = themeColors[selectedTheme] || '#0ff';
    document.querySelectorAll('.particle').forEach(p => {
        p.style.background = color;
        p.style.boxShadow = `0 0 10px ${color}`;
    });
}

// ============================================
// GESTION DE LA LANGUE
// ============================================


// Ouvre les reglages et remet les boutons dans le bon etat visuel.
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    updateLanguageUI();
    updateThemeUI();
    if (typeof updateMasterMuteUI === 'function') updateMasterMuteUI();
    if (typeof updateMusicUI === 'function') updateMusicUI();
    if (typeof updateSfxToggleUI === 'function') updateSfxToggleUI();
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

// ============================================
// NAVIGATION ENTRE ECRANS
// ============================================

// Change d ecran principal avec une transition simple.
function showScreen(screenId) {
    const currentScreen = document.querySelector('.screen.active');
    const newScreen = document.getElementById(screenId);
    if (!newScreen) return;
    
    if (currentScreen && currentScreen.id !== screenId) {
        // Fondu croise : le nouvel ecran entre pendant que l ancien sort
        newScreen.classList.add('active', 'screen-entering');
        currentScreen.classList.add('screen-exiting');
        
        setTimeout(() => {
            currentScreen.classList.remove('active', 'screen-exiting');
            newScreen.classList.remove('screen-entering');
        }, 300);
    } else {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'screen-exiting', 'screen-entering'));
        newScreen.classList.add('active');
    }
}

function showHome() { 
    showScreen('homeScreen'); 
    updateAllAvatarDisplays();
}

function copyRoomCode() {
    const code = document.getElementById('roomCode')?.textContent;
    if (code && code !== '----') {
        navigator.clipboard.writeText(code).then(() => {
            const el = document.getElementById('roomCode');
            if (el) { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); }
            showMessage('📋 Code copied!');
        }).catch(() => {});
    }
}

function showSoloSetup() {
    showScreen('soloSetupScreen');
    setTimeout(renderSubjects, 300);
}

function showMultiMode() { showScreen('multiModeScreen'); }

function showCreateMulti() {
    showScreen('createMultiScreen');
    setTimeout(renderSubjects, 300);
}

function showJoinMulti() {
    showScreen('joinMultiScreen');
    selectedJoinTeam = null;
    roomGameMode = null;
    isCheckingRoom = false;
    const teamSelectionDiv = document.getElementById('teamSelectionDiv');
    if (teamSelectionDiv) teamSelectionDiv.style.display = 'none';
    resetTeamButtonStyles();
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) joinCodeInput.value = '';
    
    // Se connecte au lobby pour les salles publiques
    connectToLobby();
}

// ============================================
// SALLES PUBLIQUES ET LOBBY
// ============================================

let lobbyWs = null;
let selectedRoomVisibility = 'private';

function connectToLobby() {
    if (lobbyWs && lobbyWs.readyState === WebSocket.OPEN) {
        return;
    }
    
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    lobbyWs = new WebSocket(`${protocol}//${location.host}/ws/LOBBY`);
    
    lobbyWs.onopen = () => {
        lobbyWs.send(JSON.stringify({ action: 'joinLobby' }));
    };
    
    lobbyWs.onmessage = (e) => {
        const { event, data } = JSON.parse(e.data);
        if (event === 'publicRooms') {
            renderPublicRooms(data);
        }
    };
    
    lobbyWs.onerror = (e) => {
        console.log('Lobby connection error:', e);
    };
    
    lobbyWs.onclose = () => {
        lobbyWs = null;
    };
}

function disconnectFromLobby() {
    if (lobbyWs) {
        lobbyWs.close();
        lobbyWs = null;
    }
}

// Remplit la liste des salles publiques visibles depuis l ecran rejoindre.
function renderPublicRooms(rooms) {
    const container = document.getElementById('publicRoomsList');
    if (!container) return;
    
    if (!rooms || rooms.length === 0) {
        container.innerHTML = `<p class="no-rooms" data-translate="noPublicRooms">${t('noPublicRooms')}</p>`;
        return;
    }
    
    container.innerHTML = rooms.map(room => `
        <div class="public-room-item" onclick="joinPublicRoom('${room.code}')">
            <div class="public-room-info">
                <span class="public-room-host">🎮 ${room.hostName}</span>
                <span class="public-room-details">
                    ${room.gameMode === 'team' ? '👥 Team Mode' : '🎯 Free for All'} • 
                    ${room.playerCount}/${room.maxPlayers} ${t('players')}
                </span>
            </div>
            <button class="public-room-join">${t('join')}</button>
        </div>
    `).join('');
}

function joinPublicRoom(code) {
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) {
        joinCodeInput.value = code;
        // Lance la verification des infos de salle
        checkRoomMode();
    }
}

function selectVisibility(visibility) {
    selectedRoomVisibility = visibility;
    // Le nouvel ecran utilise setupVisPrivate/setupVisPublic via onclick
    // Legacy IDs for backward compat
    const privateItem = document.getElementById('visibilityPrivate') || document.getElementById('setupVisPrivate');
    const publicItem = document.getElementById('visibilityPublic') || document.getElementById('setupVisPublic');
    
    if (privateItem) privateItem.classList.remove('selected');
    if (publicItem) publicItem.classList.remove('selected');
    
    if (visibility === 'private' && privateItem) {
        privateItem.classList.add('selected');
    } else if (visibility === 'public' && publicItem) {
        publicItem.classList.add('selected');
    }
}

// ============================================
// MODE DE JEU ET SELECTION DES SUJETS
// ============================================

function selectGameMode(mode) {
    selectedGameMode = mode;
    // Le nouvel ecran utilise setupModeFFA/setupModeTeam via onclick
    // Legacy IDs for backward compat
    const ffaDiv = document.getElementById('gameModeFF') || document.getElementById('setupModeFFA');
    const teamDiv = document.getElementById('gameModeTeam') || document.getElementById('setupModeTeam');
    if (ffaDiv) ffaDiv.classList.remove('selected');
    if (teamDiv) teamDiv.classList.remove('selected');
    if (mode === 'ffa' && ffaDiv) ffaDiv.classList.add('selected');
    else if (mode === 'team' && teamDiv) teamDiv.classList.add('selected');
}

