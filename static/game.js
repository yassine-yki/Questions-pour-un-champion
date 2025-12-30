// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    en: {
        title: "🎯 Questions for a Champion",
        settings: "Settings",
        selectLanguage: "Select Language:",
        selectTheme: "Select Theme:",
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
        players: "Players",
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
        buzzerKey: "Buzzer Key:",
        changeKey: "Change Key",
        pressAnyKey: "Press any key...",
        backgroundMusic: "Background Music:",
        musicOn: "Music: On",
        musicOff: "Music: Off",
        soundEffects: "Sound Effects:",
        sfxOn: "SFX: On",
        sfxOff: "SFX: Off",
        score: "Score",
        correct: "✅ Correct!",
        wrong: "❌ Wrong! Correct answer:",
        round: "Round",
        question: "Question",
        // Public rooms translations
        roomVisibility: "Room Visibility:",
        privateRoom: "Private",
        publicRoom: "Public",
        privateDesc: "Code required",
        publicDesc: "Visible to all",
        publicRooms: "Public Rooms",
        noPublicRooms: "No public rooms available",
        orJoinPrivate: "OR join a private room",
        join: "Join",
        subjects: {
            science: "🔬 Science",
            history: "📚 History",
            geography: "🌍 Geography",
            sports: "⚽ Sports",
            entertainment: "🎬 Entertainment",
            technology: "💻 Technology",
            food: "🍕 Food & Cooking",
            music: "🎵 Music",
            tv_shows: "📺 TV Shows",
            anime: "🎌 Anime",
            riddles: "🧩 Riddles",
            current_events: "📰 Current Events",
            pop_culture: "🎭 Pop Culture",
            pop_culture_2010s: "📱 2010s Pop Culture",
            pop_culture_morocco: "🇲🇦 Moroccan Pop Culture"
        }
    },
    fr: {
        title: "🎯 Questions pour un Champion",
        settings: "Paramètres",
        selectLanguage: "Sélectionner la langue:",
        selectTheme: "Sélectionner le thème:",
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
        players: "Joueurs",
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
        buzzerKey: "Touche Buzzer:",
        changeKey: "Changer",
        pressAnyKey: "Appuyez sur une touche...",
        backgroundMusic: "Musique de fond:",
        musicOn: "Musique: Activée",
        musicOff: "Musique: Désactivée",
        soundEffects: "Effets sonores:",
        sfxOn: "SFX: Activés",
        sfxOff: "SFX: Désactivés",
        score: "Score",
        correct: "✅ Correct !",
        wrong: "❌ Faux ! Bonne réponse:",
        round: "Manche",
        question: "Question",
        // Public rooms translations
        roomVisibility: "Visibilité de la salle:",
        privateRoom: "Privée",
        publicRoom: "Publique",
        privateDesc: "Code requis",
        publicDesc: "Visible par tous",
        publicRooms: "Salles publiques",
        noPublicRooms: "Aucune salle publique disponible",
        orJoinPrivate: "OU rejoindre une salle privée",
        join: "Rejoindre",
        subjects: {
            science: "🔬 Science",
            history: "📚 Histoire",
            geography: "🌍 Géographie",
            sports: "⚽ Sports",
            entertainment: "🎬 Divertissement",
            technology: "💻 Technologie",
            music: "🎵 Musique",
            food: "🍕 Cuisine & Alimentation",
            tv_shows: "📺 Séries TV",
            anime: "🎌 Anime",
            riddles: "🧩 Devinettes",
            current_events: "📰 Actualités",
            pop_culture: "🎭 Culture Pop",
            pop_culture_2010s: "📱 Culture Pop 2010s",
            pop_culture_morocco: "🇲🇦 Culture Pop Marocaine"
        }
    }
};

// ============================================
// CONSTANTS & STATE
// ============================================

const SUBJECTS = [
    'science', 'history', 'geography', 'sports', 'entertainment', 
    'technology', 'music', 'food', 'tv_shows', 'anime', 'riddles',
    'current_events', 'pop_culture', 'pop_culture_2010s', 'pop_culture_morocco'
];

let ws;
let userId;
let matchToken;
let isHost = false;
let currentRoomCode;
let hasBuzzed = false;
let canAnswer = false;
let timerInterval;
let selectedLanguage = 'en';
let selectedTheme = 'neon';
let gameMode = null;
let selectedGameMode = 'ffa';
let myTeam = null;
let selectedJoinTeam = null;
let roomGameMode = null;
let isCheckingRoom = false;
let currentMultiQuestion = null;

// Buzzer key settings
let buzzerKey = localStorage.getItem('triviaBuzzerKey') || 'Space';
let buzzerKeyDisplay = localStorage.getItem('triviaBuzzerKeyDisplay') || 'SPACE';
let isCapturingKey = false;

// Music settings
let musicPlayer = null;
let isMusicPlaying = false;
let musicVolume = parseInt(localStorage.getItem('triviaMusicVolume')) || 30;
let sfxVolume = parseInt(localStorage.getItem('triviaSfxVolume')) || 70;
let sfxEnabled = localStorage.getItem('triviaSfxEnabled') !== 'false';

const themeMusicUrls = {
    neon: '/static/music/neon.mp3',
    dragon: '/static/music/dragon.mp3',
    ocean: '/static/music/ocean.mp3',
    sakura: '/static/music/sakura.mp3',
    midnight: '/static/music/midnight.mp3',
    clean: '/static/music/clean.mp3'
};

// Audio context for generating sound effects
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Generate sound effects programmatically
function playGeneratedSfx(type) {
    if (!sfxEnabled) return;
    
    try {
        const ctx = getAudioContext();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = sfxVolume / 100;
        
        const oscillator = ctx.createOscillator();
        oscillator.connect(gainNode);
        
        switch(type) {
            case 'buzzer':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
                break;
                
            case 'correct':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, ctx.currentTime);
                oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;
                
            case 'wrong':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
                break;
                
            case 'victory':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.value = (sfxVolume / 100) * 0.3;
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8 + i * 0.15);
                    osc.start(ctx.currentTime + i * 0.15);
                    osc.stop(ctx.currentTime + 0.8 + i * 0.15);
                });
                return;
                
            case 'tick':
                oscillator.type = 'sine';
                oscillator.frequency.value = 800;
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
                break;
                
            default:
                return;
        }
    } catch(e) {
        console.log('Audio generation error:', e);
    }
}

// Solo game state
let soloQuestions = [];
let soloScore = 0;
let soloCurrentQuestion = null;
let soloQuestionIndex = 0;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Load saved preferences
    const savedLang = localStorage.getItem('triviaLanguage');
    const savedTheme = localStorage.getItem('triviaTheme');
    
    if (savedLang) selectedLanguage = savedLang;
    if (savedTheme) {
        selectedTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Load buzzer key
    updateBuzzerKeyDisplay();
    
    // Initialize music
    initMusic();
    
    applyTranslations();
    updateLanguageUI();
    updateThemeUI();
    updateParticlesColor();
    setupEventListeners();
    setupKeyboardBuzzer();
});

function setupKeyboardBuzzer() {
    document.addEventListener('keydown', (e) => {
        // If capturing a new key
        if (isCapturingKey) {
            e.preventDefault();
            setBuzzerKey(e.code, getKeyDisplayName(e));
            return;
        }
        
        // Check if buzzer key was pressed
        if (e.code === buzzerKey) {
            e.preventDefault();
            buzzerPressed();
        }
    });
}

function getKeyDisplayName(e) {
    // Get a user-friendly name for the key
    if (e.code === 'Space') return 'SPACE';
    if (e.code.startsWith('Key')) return e.code.replace('Key', '');
    if (e.code.startsWith('Digit')) return e.code.replace('Digit', '');
    if (e.code.startsWith('Numpad')) return 'NUM ' + e.code.replace('Numpad', '');
    if (e.code === 'Enter') return 'ENTER';
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'SHIFT';
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') return 'CTRL';
    if (e.code === 'AltLeft' || e.code === 'AltRight') return 'ALT';
    if (e.code.startsWith('Arrow')) return e.code.replace('Arrow', '↑↓←→ ').trim();
    return e.code.toUpperCase();
}

function startKeyCapture() {
    isCapturingKey = true;
    const keyDisplay = document.getElementById('currentKeyDisplay');
    const keyHint = document.getElementById('keyHint');
    const changeBtn = document.getElementById('changeKeyBtn');
    
    if (keyDisplay) {
        keyDisplay.textContent = '...';
        keyDisplay.classList.add('listening');
    }
    if (keyHint) keyHint.style.display = 'block';
    if (changeBtn) changeBtn.disabled = true;
}

function setBuzzerKey(keyCode, displayName) {
    buzzerKey = keyCode;
    buzzerKeyDisplay = displayName;
    isCapturingKey = false;
    
    // Save to localStorage
    localStorage.setItem('triviaBuzzerKey', keyCode);
    localStorage.setItem('triviaBuzzerKeyDisplay', displayName);
    
    updateBuzzerKeyDisplay();
}

function updateBuzzerKeyDisplay() {
    const keyDisplay = document.getElementById('currentKeyDisplay');
    const keyHint = document.getElementById('keyHint');
    const changeBtn = document.getElementById('changeKeyBtn');
    
    if (keyDisplay) {
        keyDisplay.textContent = buzzerKeyDisplay;
        keyDisplay.classList.remove('listening');
    }
    if (keyHint) keyHint.style.display = 'none';
    if (changeBtn) changeBtn.disabled = false;
}

// ============================================
// MUSIC SYSTEM
// ============================================

function initMusic() {
    musicPlayer = new Audio();
    musicPlayer.loop = true;
    musicPlayer.volume = musicVolume / 100;
    
    // Add error listener for debugging
    musicPlayer.addEventListener('error', (e) => {
        console.log('Music error:', musicPlayer.error);
        isMusicPlaying = false;
        updateMusicUI();
    });
    
    // Load the music for current theme
    loadThemeMusic(selectedTheme);
    
    // Preload sound effects
    preloadSoundEffects();
    
    // Update volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = musicVolume;
    }
    
    const sfxSlider = document.getElementById('sfxVolumeSlider');
    if (sfxSlider) {
        sfxSlider.value = sfxVolume;
    }
    
    // Update SFX toggle
    updateSfxToggleUI();
    
    // Update UI
    updateMusicUI();
}

function preloadSoundEffects() {
    // Sound effects are generated via Web Audio API, no preloading needed
}

function playSfx(soundName) {
    if (!sfxEnabled) return;
    playGeneratedSfx(soundName);
}

function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem('triviaSfxEnabled', sfxEnabled);
    updateSfxToggleUI();
}

function setSfxVolume(value) {
    sfxVolume = parseInt(value);
    localStorage.setItem('triviaSfxVolume', sfxVolume);
    // Volume is applied when sounds are played
}

function updateSfxToggleUI() {
    const sfxIcon = document.getElementById('sfxIcon');
    const sfxToggleBtn = document.getElementById('sfxToggleBtn');
    const sfxStatus = document.getElementById('sfxStatus');
    
    if (sfxIcon) {
        sfxIcon.textContent = sfxEnabled ? '🔔' : '🔕';
    }
    
    if (sfxToggleBtn) {
        if (sfxEnabled) {
            sfxToggleBtn.classList.add('enabled');
            sfxToggleBtn.classList.remove('disabled');
        } else {
            sfxToggleBtn.classList.remove('enabled');
            sfxToggleBtn.classList.add('disabled');
        }
    }
    
    if (sfxStatus) {
        sfxStatus.textContent = sfxEnabled ? t('sfxOn') : t('sfxOff');
    }
}

function loadThemeMusic(theme) {
    const musicUrl = themeMusicUrls[theme] || themeMusicUrls.neon;
    
    if (musicPlayer) {
        const wasPlaying = isMusicPlaying;
        
        // Pause current music
        musicPlayer.pause();
        
        // Load new track
        musicPlayer.src = musicUrl;
        musicPlayer.load();
        
        // Resume if was playing
        if (wasPlaying) {
            musicPlayer.play().catch(e => console.log('Music autoplay prevented:', e));
        }
    }
}

function toggleMusic() {
    if (!musicPlayer) {
        initMusic();
    }
    
    if (isMusicPlaying) {
        musicPlayer.pause();
        isMusicPlaying = false;
        updateMusicUI();
    } else {
        // Make sure the source is set
        if (!musicPlayer.src || musicPlayer.src === '') {
            loadThemeMusic(selectedTheme);
        }
        
        const playPromise = musicPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                updateMusicUI();
            }).catch(e => {
                console.log('Music play error:', e.message);
                console.log('Music src:', musicPlayer.src);
                console.log('Music ready state:', musicPlayer.readyState);
                isMusicPlaying = false;
                updateMusicUI();
            });
        }
    }
}

function setVolume(value) {
    musicVolume = parseInt(value);
    localStorage.setItem('triviaMusicVolume', musicVolume);
    
    if (musicPlayer) {
        musicPlayer.volume = musicVolume / 100;
    }
}

function updateMusicUI() {
    const musicIcon = document.getElementById('musicIcon');
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const musicStatus = document.getElementById('musicStatus');
    
    if (musicIcon) {
        musicIcon.textContent = isMusicPlaying ? '🔊' : '🔇';
    }
    
    if (musicToggleBtn) {
        if (isMusicPlaying) {
            musicToggleBtn.classList.add('playing');
        } else {
            musicToggleBtn.classList.remove('playing');
        }
    }
    
    if (musicStatus) {
        musicStatus.textContent = isMusicPlaying ? t('musicOn') : t('musicOff');
    }
}

function setupEventListeners() {
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) {
        let debounceTimer;
        joinCodeInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            e.target.value = e.target.value.toUpperCase();
            if (e.target.value.length >= 4) {
                debounceTimer = setTimeout(checkRoomMode, 300);
            } else {
                const teamSelectionDiv = document.getElementById('teamSelectionDiv');
                if (teamSelectionDiv) teamSelectionDiv.style.display = 'none';
                roomGameMode = null;
            }
        });
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================

function setTheme(themeName) {
    selectedTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('triviaTheme', themeName);
    updateThemeUI();
    updateParticlesColor();
    
    // Change music to match theme
    loadThemeMusic(themeName);
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
        clean: '#4361ee'
    };
    
    const color = themeColors[selectedTheme] || '#0ff';
    document.querySelectorAll('.particle').forEach(p => {
        p.style.background = color;
        p.style.boxShadow = `0 0 10px ${color}`;
    });
}

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

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
        if (text) element.textContent = text;
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const text = t(key);
        if (text) element.placeholder = text;
    });
}

function selectLanguage(lang) {
    selectedLanguage = lang;
    localStorage.setItem('triviaLanguage', lang);
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

// ============================================
// SETTINGS MODAL
// ============================================

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    updateLanguageUI();
    updateThemeUI();
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

// ============================================
// SCREEN NAVIGATION
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
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
    selectedJoinTeam = null;
    roomGameMode = null;
    isCheckingRoom = false;
    const teamSelectionDiv = document.getElementById('teamSelectionDiv');
    if (teamSelectionDiv) teamSelectionDiv.style.display = 'none';
    resetTeamButtonStyles();
    const joinCodeInput = document.getElementById('joinCode');
    if (joinCodeInput) joinCodeInput.value = '';
    
    // Connect to lobby for public rooms
    connectToLobby();
}

// ============================================
// PUBLIC ROOMS & LOBBY
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
        // Trigger the room info check
        checkRoomMode();
    }
}

function selectVisibility(visibility) {
    selectedRoomVisibility = visibility;
    
    const privateItem = document.getElementById('visibilityPrivate');
    const publicItem = document.getElementById('visibilityPublic');
    
    if (privateItem) privateItem.classList.remove('selected');
    if (publicItem) publicItem.classList.remove('selected');
    
    if (visibility === 'private' && privateItem) {
        privateItem.classList.add('selected');
    } else if (visibility === 'public' && publicItem) {
        publicItem.classList.add('selected');
    }
}

// ============================================
// GAME MODE & SUBJECT SELECTION
// ============================================

function selectGameMode(mode) {
    selectedGameMode = mode;
    const ffaDiv = document.getElementById('gameModeFF');
    const teamDiv = document.getElementById('gameModeTeam');
    if (ffaDiv) ffaDiv.classList.remove('selected');
    if (teamDiv) teamDiv.classList.remove('selected');
    if (mode === 'ffa' && ffaDiv) ffaDiv.classList.add('selected');
    else if (mode === 'team' && teamDiv) teamDiv.classList.add('selected');
}

function renderSubjects() {
    const soloScreen = document.getElementById('soloSetupScreen');
    const createScreen = document.getElementById('createMultiScreen');
    if (soloScreen?.classList.contains('active')) renderSubjectsToContainer('soloSubjects');
    if (createScreen?.classList.contains('active')) renderSubjectsToContainer('createSubjects');
}

function renderSubjectsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    SUBJECTS.forEach(subject => {
        const div = document.createElement('div');
        div.className = 'subject-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${containerId}-${subject}`;
        checkbox.value = subject;
        checkbox.checked = true;
        const label = document.createElement('label');
        label.htmlFor = `${containerId}-${subject}`;
        label.textContent = t('subjects.' + subject);
        div.appendChild(checkbox);
        div.appendChild(label);
        div.onclick = (e) => {
            if (e.target === div || e.target === label) checkbox.checked = !checkbox.checked;
        };
        container.appendChild(div);
    });
}

function getSelectedSubjects(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
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
// WEBSOCKET HELPERS
// ============================================

function getWebSocketUrl(code) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/${code}`;
}

// ============================================
// SOLO GAME
// ============================================

async function startSoloGame() {
    const name = document.getElementById('soloName')?.value.trim();
    const subjects = getSelectedSubjects('soloSubjects');
    if (!name) { alert(t('alertName')); return; }
    if (subjects.length === 0) { alert(t('alertSubjects')); return; }

    gameMode = 'solo';
    soloScore = 0;
    soloQuestionIndex = 0;

    try {
        const response = await fetch(`/api/questions?language=${selectedLanguage}&subjects=${subjects.join(',')}`);
        const data = await response.json();
        soloQuestions = data.questions;
        if (soloQuestions.length === 0) { alert('No questions available'); return; }
        showScreen('soloGameScreen');
        showNextSoloQuestion();
    } catch (error) {
        console.error('Error:', error);
        alert(t('connectionError'));
    }
}

function showNextSoloQuestion() {
    if (soloQuestionIndex >= soloQuestions.length) { showSoloGameOver(); return; }

    soloCurrentQuestion = soloQuestions[soloQuestionIndex];
    const scoreEl = document.getElementById('soloScore');
    if (scoreEl) scoreEl.innerHTML = `${t('score')}: <span>${soloScore}</span>`;
    const questionText = document.getElementById('soloQuestionText');
    if (questionText) questionText.textContent = soloCurrentQuestion.q;
    const questionNumber = document.getElementById('soloQuestionNumber');
    if (questionNumber) questionNumber.textContent = `${t('question').toUpperCase()} #${soloQuestionIndex + 1}`;

    let timeLeft = soloCurrentQuestion.time || 10;
    const timerEl = document.getElementById('soloTimer');
    if (timerEl) { timerEl.innerHTML = `⏱️ <span>${timeLeft}</span>s`; timerEl.classList.remove('warning'); }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerHTML = `⏱️ <span>${timeLeft}</span>s`;
            if (timeLeft <= 3) timerEl.classList.add('warning');
        }
        if (timeLeft <= 0) { clearInterval(timerInterval); timerEl?.classList.remove('warning'); handleSoloTimeout(); }
    }, 1000);

    const optionsBox = document.getElementById('soloOptionsBox');
    if (optionsBox) {
        optionsBox.innerHTML = '';
        soloCurrentQuestion.options.forEach((option, idx) => {
            const div = document.createElement('div');
            div.className = 'option visible';
            div.textContent = option;
            div.onclick = () => handleSoloAnswer(idx);
            optionsBox.appendChild(div);
        });
    }
    hideSoloMessage();
}

function handleSoloAnswer(idx) {
    clearInterval(timerInterval);
    document.getElementById('soloTimer')?.classList.remove('warning');
    const correct = idx === soloCurrentQuestion.correct;
    if (correct) {
        soloScore += 100;
        playSfx('correct');
        const scoreEl = document.getElementById('soloScore');
        if (scoreEl) scoreEl.innerHTML = `${t('score')}: <span>${soloScore}</span>`;
        createConfetti(30);
        animateScore('soloScore');
    } else { 
        playSfx('wrong');
        shakeScreen(); 
        flashWrong(); 
    }

    document.querySelectorAll('#soloOptionsBox .option').forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) { opt.classList.add('correct'); animateCorrectOption(opt); }
        else if (i === idx && !correct) opt.classList.add('incorrect');
    });

    showSoloMessage(correct ? t('correct') : `${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`);
    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 2500);
}

function handleSoloTimeout() {
    playSfx('wrong');
    shakeScreen(); flashWrong();
    document.querySelectorAll('#soloOptionsBox .option').forEach((opt, i) => {
        opt.onclick = null;
        if (i === soloCurrentQuestion.correct) { opt.classList.add('correct'); animateCorrectOption(opt); }
    });
    showSoloMessage(`⏰ ${t('wrong')} ${soloCurrentQuestion.options[soloCurrentQuestion.correct]}`);
    soloQuestionIndex++;
    setTimeout(showNextSoloQuestion, 2500);
}

function showSoloGameOver() {
    clearInterval(timerInterval);
    showScreen('gameOverScreen');
    playSfx('victory');
    celebrateVictory();
    const winnerBox = document.getElementById('winnerBox');
    if (winnerBox) winnerBox.textContent = `🏆 ${t('score')}: ${soloScore}`;
    const finalScores = document.getElementById('finalScores');
    if (finalScores) {
        finalScores.innerHTML = `<h3>${t('finalScores')}</h3>`;
        const div = document.createElement('div');
        div.className = 'score-row';
        div.innerHTML = `<span>${document.getElementById('soloName')?.value || 'Player'}</span><span>${soloScore}</span>`;
        finalScores.appendChild(div);
    }
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
// MULTIPLAYER GAME
// ============================================

function createRoom() {
    const code = document.getElementById('createCode')?.value.trim().toUpperCase();
    const name = document.getElementById('createName')?.value.trim();
    const subjects = getSelectedSubjects('createSubjects');
    if (!code || !name) { alert(t('alertBothFields')); return; }
    if (subjects.length === 0) { alert(t('alertSubjects')); return; }
    currentRoomCode = code;
    gameMode = 'multiplayer';
    const isPublic = selectedRoomVisibility === 'public';
    connectWebSocket(code, name, true, subjects, selectedGameMode, isPublic);
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

async function joinRoom() {
    const code = document.getElementById('joinCode')?.value.trim().toUpperCase();
    const name = document.getElementById('joinName')?.value.trim();
    if (!code || !name) { alert(t('alertBothFields')); return; }
    if (roomGameMode === null && !isCheckingRoom) await checkRoomMode();
    if (isCheckingRoom) await new Promise(r => setTimeout(r, 500));
    if (roomGameMode === 'team' && !selectedJoinTeam) { alert(t('selectTeam')); return; }
    currentRoomCode = code;
    gameMode = 'multiplayer';
    connectWebSocket(code, name, false, [], 'ffa', false, selectedJoinTeam);
}

function connectWebSocket(code, playerName, isCreating, subjects, gm = 'ffa', isPublic = false, team = null) {
    // Disconnect from lobby when joining a room
    disconnectFromLobby();
    
    ws = new WebSocket(getWebSocketUrl(code));
    ws.onopen = () => {
        if (isCreating) {
            ws.send(JSON.stringify({ action: 'create', language: selectedLanguage, subjects: subjects, gameMode: gm, isPublic: isPublic }));
            setTimeout(() => ws.send(JSON.stringify({ action: 'join', playerName: playerName })), 100);
        } else ws.send(JSON.stringify({ action: 'join', playerName: playerName, team: team }));
    };
    ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
    ws.onerror = () => alert(t('connectionError'));
}

function handleMessage(msg) {
    switch (msg.event) {
        case 'roomCreated': document.getElementById('roomCode').textContent = msg.data.code; break;
        case 'joined':
            userId = msg.data.userId; matchToken = msg.data.matchToken; isHost = msg.data.isHost; myTeam = msg.data.team;
            if (msg.data.language) { selectedLanguage = msg.data.language; applyTranslations(); }
            showScreen('lobbyScreen');
            document.getElementById('roomCode').textContent = currentRoomCode;
            break;
        case 'players': updatePlayers(msg.data); break;
        case 'gameStarting': showMessage(msg.data.message || 'Game starting!'); setTimeout(() => showScreen('gameScreen'), 2000); break;
        case 'question': currentMultiQuestion = msg.data; showQuestion(msg.data); break;
        case 'buzzed': handleBuzzed(msg.data); break;
        case 'answerResult': showResult(msg.data); break;
        case 'roundComplete': clearInterval(timerInterval); showMessage(`🎊 ${msg.data.message}`); updateScores(msg.data.scores); if (msg.data.teamScores) updateTeamScores(msg.data.teamScores); break;
        case 'playerEliminated': showMessage(`💀 ${msg.data.message}`); updateScores(msg.data.scores); const myN = document.getElementById('createName')?.value || document.getElementById('joinName')?.value; if (msg.data.player === myN) { const b = document.getElementById('buzzer'); if (b) { b.disabled = true; b.textContent = 'ELIMINATED'; } shakeScreen(); } break;
        case 'teamEliminated': showMessage(`💀 ${msg.data.message}`); updateScores(msg.data.scores); if (msg.data.teamScores) updateTeamScores(msg.data.teamScores); if (msg.data.team === myTeam) { const b = document.getElementById('buzzer'); if (b) { b.disabled = true; b.textContent = 'ELIMINATED'; } } break;
        case 'roundTransition': showMessage(`🔥 ${msg.data.message}`); updateScores(msg.data.scores); if (msg.data.teamScores) updateTeamScores(msg.data.teamScores); break;
        case 'gameOver': showGameOver(msg.data); break;
        case 'error': alert(msg.data); break;
        case 'playerLeft': showMessage(msg.data.message || 'Player left'); break;
        case 'newHost': showMessage(msg.data.message || 'New host'); const myN2 = document.getElementById('createName')?.value || document.getElementById('joinName')?.value; if (msg.data.hostName === myN2) isHost = true; break;
    }
}

function updatePlayers(data) {
    const list = document.getElementById('playersList');
    if (!list) return;
    list.innerHTML = `<h3>${t('players')}</h3>`;
    if (data.gameMode === 'team' && data.teamCounts) {
        const td = document.createElement('div'); td.className = 'team-scores';
        td.innerHTML = `<div class="team-score-box red"><div>${t('teamRed')}</div><div style="font-size:20px;margin-top:5px;">${data.teamCounts.red}/2</div></div><div class="team-score-box blue"><div>${t('teamBlue')}</div><div style="font-size:20px;margin-top:5px;">${data.teamCounts.blue}/2</div></div>`;
        list.appendChild(td);
    }
    data.players.forEach(player => {
        const div = document.createElement('div'); div.className = 'player-item' + (player.isHost ? ' host' : '');
        let teamBadge = '';
        if (data.gameMode === 'team' && player.team) teamBadge = `<span class="team-badge team-${player.team}">${t('team' + player.team.charAt(0).toUpperCase() + player.team.slice(1))}</span>`;
        div.innerHTML = `<span>${player.name}${teamBadge}</span>${player.isHost ? `<span class="host-badge">${t('host')}</span>` : ''}`;
        list.appendChild(div);
    });
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.style.display = (isHost && data.canStart) ? 'block' : 'none';
}

function startGame() {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'start', userId, matchToken, language: selectedLanguage }));
}

function showQuestion(data) {
    hasBuzzed = false; canAnswer = false;
    document.getElementById('questionText').textContent = data.q;
    const roundInfo = document.getElementById('roundInfo');
    if (roundInfo && data.round) roundInfo.innerHTML = `${t('round')}: <span>${data.round}/3</span> • Q: <span>${data.questionInRound}/${data.questionsPerRound}</span>`;

    let timeLeft = data.time;
    const timerEl = document.getElementById('timer');
    if (timerEl) { timerEl.innerHTML = `⏱️ <span>${timeLeft}</span>s`; timerEl.classList.remove('warning'); }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) { timerEl.innerHTML = `⏱️ <span>${timeLeft}</span>s`; if (timeLeft <= 3) timerEl.classList.add('warning'); }
        if (timeLeft <= 0) { clearInterval(timerInterval); timerEl?.classList.remove('warning'); }
    }, 1000);

    const buzzer = document.getElementById('buzzer');
    if (buzzer) { buzzer.disabled = false; buzzer.classList.remove('buzzed'); buzzer.textContent = t('buzz'); }

    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) {
        optionsBox.innerHTML = '';
        data.options.forEach((option, idx) => {
            const div = document.createElement('div'); div.className = 'option'; div.textContent = option; div.onclick = () => answerQuestion(idx);
            optionsBox.appendChild(div);
        });
    }
    hideMessage();
}

function buzzerPressed() {
    const buzzer = document.getElementById('buzzer');
    if (!buzzer || buzzer.disabled || hasBuzzed) return;
    hasBuzzed = true; buzzer.disabled = true; buzzer.classList.add('buzzed');
    playSfx('buzzer');
    animateBuzzerPress();
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'buzz', userId, matchToken }));
}

function handleBuzzed(data) {
    const playerName = data.player || data;
    showMessage(`🔔 ${playerName} buzzed!`);
    playSfx('buzzer');
    const buzzer = document.getElementById('buzzer');
    if (buzzer) { buzzer.disabled = true; buzzer.classList.add('buzzed'); buzzer.textContent = `${playerName} BUZZED!`; }
    const myName = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
    if (playerName === myName) { canAnswer = true; document.querySelectorAll('#optionsBox .option').forEach(opt => opt.classList.add('visible')); }
}

function answerQuestion(idx) {
    if (!canAnswer) return;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'answer', userId, matchToken, idx }));
    document.querySelectorAll('#optionsBox .option').forEach(opt => opt.onclick = null);
    canAnswer = false;
}

function showResult(data) {
    clearInterval(timerInterval);
    document.querySelectorAll('#optionsBox .option').forEach(opt => {
        opt.classList.add('visible'); opt.onclick = null;
        if (opt.textContent === data.answer) { opt.classList.add('correct'); animateCorrectOption(opt); }
    });
    const myName = document.getElementById('createName')?.value || document.getElementById('joinName')?.value;
    if (data.answeredBy === myName) { 
        if (data.correct) { 
            playSfx('correct');
            createConfetti(30); 
        } else { 
            playSfx('wrong');
            shakeScreen(); 
            flashWrong(); 
        } 
    }
    updateScores(data.scores);
    if (data.teamScores) updateTeamScores(data.teamScores);
    showMessage(data.message || (data.correct ? '✅ Correct!' : `❌ Wrong! Answer: ${data.answer}`));
}

function updateScores(scores) {
    const scoresBox = document.getElementById('scoresBox');
    if (!scoresBox) return;
    const teamDiv = document.getElementById('teamScoresDiv');
    scoresBox.innerHTML = `<h3>${t('scores')}</h3>`;
    if (teamDiv) scoresBox.insertBefore(teamDiv, scoresBox.firstChild);
    Object.entries(scores).forEach(([name, score]) => {
        const div = document.createElement('div'); div.className = 'score-row'; div.innerHTML = `<span>${name}</span><span>${score}</span>`;
        scoresBox.appendChild(div);
    });
}

function updateTeamScores(teamScores) {
    const scoresBox = document.getElementById('scoresBox');
    if (!scoresBox) return;
    let teamDiv = document.getElementById('teamScoresDiv');
    if (!teamDiv) { teamDiv = document.createElement('div'); teamDiv.id = 'teamScoresDiv'; teamDiv.className = 'team-scores'; scoresBox.insertBefore(teamDiv, scoresBox.firstChild); }
    teamDiv.innerHTML = `<div class="team-score-box red ${!teamScores.red.active ? 'eliminated' : ''}"><div>${t('teamRed')}</div><div style="font-size:24px;margin-top:5px;">${teamScores.red.score}</div>${!teamScores.red.active ? '<div style="font-size:10px;">ELIMINATED</div>' : ''}</div><div class="team-score-box blue ${!teamScores.blue.active ? 'eliminated' : ''}"><div>${t('teamBlue')}</div><div style="font-size:24px;margin-top:5px;">${teamScores.blue.score}</div>${!teamScores.blue.active ? '<div style="font-size:10px;">ELIMINATED</div>' : ''}</div>`;
}

function showGameOver(data) {
    clearInterval(timerInterval); showScreen('gameOverScreen'); celebrateVictory();
    playSfx('victory');
    const winnerBox = document.getElementById('winnerBox');
    if (winnerBox) winnerBox.textContent = data.winner ? `🏆 Winner: ${data.winner}` : (data.reason || 'Game Over!');
    const finalScores = document.getElementById('finalScores');
    if (finalScores) {
        finalScores.innerHTML = `<h3>${t('finalScores')}</h3>`;
        if (data.teamScores) {
            const td = document.createElement('div'); td.className = 'team-scores';
            td.innerHTML = `<div class="team-score-box red"><div>${t('teamRed')}</div><div style="font-size:24px;">${data.teamScores.red.score}</div></div><div class="team-score-box blue"><div>${t('teamBlue')}</div><div style="font-size:24px;">${data.teamScores.blue.score}</div></div>`;
            finalScores.appendChild(td);
        }
        Object.entries(data.finalScores).sort((a, b) => b[1] - a[1]).forEach(([name, score]) => {
            const div = document.createElement('div'); div.className = 'score-row'; div.innerHTML = `<span>${name}</span><span>${score}</span>`;
            finalScores.appendChild(div);
        });
    }
}

function showMessage(text) { const box = document.getElementById('messageBox'); if (box) { box.textContent = text; box.style.display = 'block'; } }
function hideMessage() { const box = document.getElementById('messageBox'); if (box) box.style.display = 'none'; }

// ============================================
// VISUAL EFFECTS
// ============================================

function createConfetti(count = 50) {
    const themeColors = { neon: ['#0ff', '#f0f', '#0f0', '#ff0'], dragon: ['#ff6b35', '#c41e3a', '#ffd700', '#fff'], ocean: ['#00b4d8', '#0077b6', '#90e0ef', '#fff'], sakura: ['#ffb7c5', '#ff69b4', '#fff0f5', '#ff1493'], midnight: ['#e94560', '#533a7b', '#ffc857', '#fff'], clean: ['#4361ee', '#3a0ca3', '#7209b7', '#fff'] };
    const colors = themeColors[selectedTheme] || themeColors.neon;
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div'); confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3500);
    }
}

function shakeScreen() { const c = document.querySelector('.container'); if (c) { c.classList.add('shake'); setTimeout(() => c.classList.remove('shake'), 500); } }
function flashWrong() { const c = document.querySelector('.container'); if (c) { c.classList.add('wrong-flash'); setTimeout(() => c.classList.remove('wrong-flash'), 500); } }
function animateScore(id) { const el = document.getElementById(id); if (el) { el.classList.add('score-animate'); setTimeout(() => el.classList.remove('score-animate'), 500); } }
function animateBuzzerPress() { const b = document.getElementById('buzzer'); if (b) { b.classList.add('buzzer-press'); setTimeout(() => b.classList.remove('buzzer-press'), 300); } }
function celebrateVictory() { createConfetti(100); const wb = document.getElementById('winnerBox'); if (wb) wb.classList.add('victory-animate'); }
function animateCorrectOption(el) { if (el) { el.classList.add('correct-pulse'); setTimeout(() => el.classList.remove('correct-pulse'), 600); } }
