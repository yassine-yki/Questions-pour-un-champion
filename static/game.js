// ============================================
// LANDING PAGE
// ============================================


console.log('=== GAME.JS VERSION 5.0 LOADED ===');

// FAQ Toggle Function
function toggleFaq(element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');
}

// Generate random stars on landing page
document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.getElementById('landingStars');
    if (starsContainer) {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 2 + 's';
            star.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
            starsContainer.appendChild(star);
        }
    }
});

function enterGame() {
    const landingPage = document.getElementById('landingPage');
    if (landingPage) {
        landingPage.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => {
            landingPage.style.display = 'none';
        }, 800);
    }
}

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
        // Voice chat translations
        voiceChat: "Voice Chat",
        joinVoice: "Join Voice",
        leaveVoice: "Leave Voice",
        voiceConnecting: "Connecting...",
        voiceConnected: "Connected",
        voiceDisconnected: "Disconnected",
        // Custom category (AI) translations
        customCategoryLabel: "🤖 Custom Category (AI)",
        customCategoryPlaceholder: "E.g.: Harry Potter, Italian Cuisine, Football...",
        customCategoryHint: "AI will generate questions on your chosen topic",
        orDivider: "OR",
        aiLoading: "Generating questions...",
        aiLoadingText: "AI is preparing your questions about",
        aiLoadingRetry: "AI is waking up... Attempt",
        aiLoadingWait: "This may take a few seconds",
        aiErrorTimeout: "AI is taking too long to respond. Please try again later or choose a predefined category.",
        aiErrorGeneration: "Error generating questions. Please try again.",
        aiErrorConnection: "Connection error. Please try again.",
        subjects: {
            science: "🔬 Science",
            history: "📚 History",
            geography: "🌍 Geography",
            sports: "⚽ Sports",
            technology: "💻 Technology",
            food: "🍕 Food & Cooking",
            music: "🎵 Music",
            tv_shows: "📺 TV Shows",
            anime: "🎌 Anime",
            riddles: "🧩 Riddles"
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
        // Voice chat translations
        voiceChat: "Chat Vocal",
        joinVoice: "Rejoindre",
        leaveVoice: "Quitter",
        voiceConnecting: "Connexion...",
        voiceConnected: "Connecté",
        voiceDisconnected: "Déconnecté",
        // Custom category (AI) translations
        customCategoryLabel: "🤖 Catégorie Personnalisée (IA)",
        customCategoryPlaceholder: "Ex: Harry Potter, Cuisine Italienne, Football...",
        customCategoryHint: "L'IA générera des questions sur le thème de votre choix",
        orDivider: "OU",
        aiLoading: "Génération des questions...",
        aiLoadingText: "L'IA prépare vos questions sur",
        aiLoadingRetry: "L'IA se réveille... Tentative",
        aiLoadingWait: "Cela peut prendre quelques secondes",
        aiErrorTimeout: "L'IA prend trop de temps à répondre. Veuillez réessayer plus tard ou choisir une catégorie prédéfinie.",
        aiErrorGeneration: "Erreur lors de la génération des questions. Veuillez réessayer.",
        aiErrorConnection: "Erreur de connexion. Veuillez réessayer.",
        subjects: {
            science: "🔬 Science",
            history: "📚 Histoire",
            geography: "🌍 Géographie",
            sports: "⚽ Sports",
            technology: "💻 Technologie",
            music: "🎵 Musique",
            food: "🍕 Cuisine & Alimentation",
            tv_shows: "📺 Séries TV",
            anime: "🎌 Anime",
            riddles: "🧩 Devinettes"
            
        }
    }
};

// ============================================
// CONSTANTS & STATE
// ============================================

const SUBJECTS = [
    'science', 'history', 'geography', 'sports', 
    'technology', 'music', 'food', 'tv_shows', 'anime', 'riddles'
    
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
    const currentScreen = document.querySelector('.screen.active');
    const newScreen = document.getElementById(screenId);
    
    if (currentScreen && currentScreen.id !== screenId) {
        // Add exit animation to current screen
        currentScreen.classList.add('exiting');
        
        setTimeout(() => {
            currentScreen.classList.remove('active', 'exiting');
            if (newScreen) newScreen.classList.add('active');
        }, 250);
    } else {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (newScreen) newScreen.classList.add('active');
    }
}

function showHome() { showScreen('homeScreen'); }

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
    // Render to both containers regardless of active state
    renderSubjectsToContainer('soloSubjects');
    renderSubjectsToContainer('createSubjects');
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
    const customCategoryEl = document.getElementById('customCategoryInput');
    const customCategory = customCategoryEl ? customCategoryEl.value.trim() : '';
    
    console.log('startSoloGame called');
    console.log('Name:', name);
    console.log('Subjects:', subjects);
    console.log('Custom Category Element:', customCategoryEl);
    console.log('Custom Category Value:', customCategory);
    
    if (!name) { alert(t('alertName')); return; }
    
    // Check if using custom category or predefined subjects
    if (customCategory && customCategory.length > 0) {
        console.log('Using AI for custom category:', customCategory);
        // Use AI to generate questions for custom category
        await startSoloGameWithAI(name, customCategory);
    } else if (subjects.length > 0) {
        console.log('Using predefined subjects:', subjects);
        // Use predefined questions from questions.json
        await startSoloGameWithPredefined(name, subjects);
    } else {
        console.log('No category selected!');
        alert(t('alertSubjects'));
        return;
    }
}

async function startSoloGameWithPredefined(name, subjects) {
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

async function startSoloGameWithAI(name, category, retryCount = 0) {
    const MAX_RETRIES = 5;
    
    // Show loading modal
    const loadingModal = document.getElementById('aiLoadingModal');
    const loadingCategory = document.getElementById('aiLoadingCategory');
    const loadingText = document.getElementById('aiLoadingText');
    
    if (loadingModal) loadingModal.style.display = 'flex';
    if (loadingCategory) loadingCategory.textContent = category;
    
    // Update loading text based on retry count
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
            // Hide loading modal
            if (loadingModal) loadingModal.style.display = 'none';
            
            // Transform AI questions to match game format
            soloQuestions = data.questions.map((q, idx) => {
                // Find the index of the correct answer in options
                const correctIndex = q.options.findIndex(opt => opt === q.answer);
                return {
                    q: q.question,
                    options: q.options,
                    correct: correctIndex >= 0 ? correctIndex : 0,  // Default to 0 if not found
                    time: 15  // Give a bit more time for AI questions
                };
            });
            
            showScreen('soloGameScreen');
            showNextSoloQuestion();
        } else if (data.retry && retryCount < MAX_RETRIES) {
            // Model is loading, auto-retry after delay
            console.log(`AI model loading, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => startSoloGameWithAI(name, category, retryCount + 1), 3000);
        } else if (retryCount >= MAX_RETRIES) {
            // Max retries reached
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

// Handle custom category input - deselect subjects when typing
document.addEventListener('DOMContentLoaded', function() {
    // Solo mode custom category
    const customInput = document.getElementById('customCategoryInput');
    const soloSubjectsContainer = document.getElementById('soloSubjects');
    
    if (customInput) {
        customInput.addEventListener('input', function() {
            if (this.value.trim()) {
                // Deselect all subjects when custom category is entered
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
    
    // Clear custom input when selecting a predefined subject
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
    
    // Multiplayer mode custom category
    const customInputMulti = document.getElementById('customCategoryInputMulti');
    const createSubjectsContainer = document.getElementById('createSubjects');
    
    if (customInputMulti) {
        customInputMulti.addEventListener('input', function() {
            if (this.value.trim()) {
                // Deselect all subjects when custom category is entered
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
    
    // Clear custom input when selecting a predefined subject (multiplayer)
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

function showNextSoloQuestion() {
    if (soloQuestionIndex >= soloQuestions.length) { showSoloGameOver(); return; }

    soloCurrentQuestion = soloQuestions[soloQuestionIndex];
    
    // Update score badge
    const scoreEl = document.getElementById('soloScore');
    if (scoreEl) {
        const scoreValue = scoreEl.querySelector('.score-value');
        if (scoreValue) {
            scoreValue.textContent = soloScore;
        }
    }
    
    // Update question badge
    const questionBadge = document.getElementById('soloQuestionBadge');
    if (questionBadge) {
        const questionValue = questionBadge.querySelector('.question-value');
        if (questionValue) {
            questionValue.textContent = `${soloQuestionIndex + 1}/${soloQuestions.length}`;
        }
    }
    
    const questionText = document.getElementById('soloQuestionText');
    if (questionText) questionText.textContent = soloCurrentQuestion.q;
    const questionNumber = document.getElementById('soloQuestionNumber');
    if (questionNumber) questionNumber.textContent = `${t('question').toUpperCase()} #${soloQuestionIndex + 1}`;

    let timeLeft = soloCurrentQuestion.time || 10;
    const maxTime = timeLeft;
    const timerEl = document.getElementById('soloTimer');
    
    // Use circular timer
    if (timerEl) {
        timerEl.innerHTML = createCircularTimer(timeLeft, maxTime);
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerHTML = createCircularTimer(timeLeft, maxTime);
        }
        if (timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleSoloTimeout(); 
        }
    }, 1000);

    const optionsBox = document.getElementById('soloOptionsBox');
    if (optionsBox) {
        optionsBox.innerHTML = '';
        soloCurrentQuestion.options.forEach((option, idx) => {
            const div = document.createElement('div');
            div.className = 'option visible';
            div.textContent = option;
            div.onclick = () => handleSoloAnswer(idx);
            // Add staggered animation
            div.style.animationDelay = (idx * 0.1) + 's';
            optionsBox.appendChild(div);
        });
    }
    hideSoloMessage();
}

function handleSoloAnswer(idx) {
    clearInterval(timerInterval);
    const correct = idx === soloCurrentQuestion.correct;
    if (correct) {
        soloScore += 100;
        playSfx('correct');
        const scoreEl = document.getElementById('soloScore');
        if (scoreEl) {
            const scoreValue = scoreEl.querySelector('.score-value');
            if (scoreValue) {
                scoreValue.textContent = soloScore;
            }
            // Add animation
            scoreEl.classList.remove('updated');
            void scoreEl.offsetWidth; // Trigger reflow
            scoreEl.classList.add('updated');
        }
        createConfetti(30);
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

async function createRoom() {
    const code = document.getElementById('createCode')?.value.trim().toUpperCase();
    const name = document.getElementById('createName')?.value.trim();
    const subjects = getSelectedSubjects('createSubjects');
    const customCategory = document.getElementById('customCategoryInputMulti')?.value.trim();
    
    if (!code || !name) { alert(t('alertBothFields')); return; }
    
    // Check if using custom category or predefined subjects
    if (customCategory) {
        // Use AI to generate questions for custom category
        await createRoomWithAI(code, name, customCategory);
    } else if (subjects.length > 0) {
        // Use predefined questions
        currentRoomCode = code;
        gameMode = 'multiplayer';
        const isPublic = selectedRoomVisibility === 'public';
        connectWebSocket(code, name, true, subjects, selectedGameMode, isPublic);
    } else {
        alert(t('alertSubjects'));
        return;
    }
}

async function createRoomWithAI(code, name, category, retryCount = 0) {
    const MAX_RETRIES = 5;
    
    // Show loading modal
    const loadingModal = document.getElementById('aiLoadingModal');
    const loadingCategory = document.getElementById('aiLoadingCategory');
    const loadingText = document.getElementById('aiLoadingText');
    
    if (loadingModal) loadingModal.style.display = 'flex';
    if (loadingCategory) loadingCategory.textContent = category;
    
    // Update loading text based on retry count
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
            // Hide loading modal
            if (loadingModal) loadingModal.style.display = 'none';
            
            // Store AI questions temporarily
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
            // Pass 'ai_custom' as subject to signal using AI questions
            // Parameters: code, name, isCreating, subjects, gm, isPublic, team, aiQuestions
            connectWebSocket(code, name, true, ['ai_custom'], selectedGameMode, isPublic, null, window.aiGeneratedQuestions);
        } else if (data.retry && retryCount < MAX_RETRIES) {
            // Model is loading, auto-retry after delay
            console.log(`AI model loading, retry ${retryCount + 1}/${MAX_RETRIES}...`);
            setTimeout(() => createRoomWithAI(code, name, category, retryCount + 1), 3000);
        } else if (retryCount >= MAX_RETRIES) {
            // Max retries reached
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
            setTimeout(() => createRoomWithAI(code, name, category, retryCount + 1), 3000);
        } else {
            if (loadingModal) loadingModal.style.display = 'none';
            alert(t('aiErrorConnection'));
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

function connectWebSocket(code, playerName, isCreating, subjects, gm = 'ffa', isPublic = false, team = null, aiQuestions = null) {
    // Disconnect from lobby when joining a room
    disconnectFromLobby();
    
    // Debug logging
    console.log('connectWebSocket called with:');
    console.log('- code:', code);
    console.log('- isCreating:', isCreating);
    console.log('- aiQuestions:', aiQuestions);
    console.log('- aiQuestions length:', aiQuestions ? aiQuestions.length : 0);
    
    ws = new WebSocket(getWebSocketUrl(code));
    ws.onopen = () => {
        if (isCreating) {
            const createData = { 
                action: 'create', 
                language: selectedLanguage, 
                subjects: subjects, 
                gameMode: gm, 
                isPublic: isPublic 
            };
            // Include AI questions if provided
            if (aiQuestions && aiQuestions.length > 0) {
                createData.aiQuestions = aiQuestions;
                console.log('Adding aiQuestions to createData:', aiQuestions.length);
            }
            console.log('Sending createData:', JSON.stringify(createData).substring(0, 500));
            ws.send(JSON.stringify(createData));
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
        
        // Use avatar
        const avatar = createAvatarHTML(player.name);
        div.innerHTML = `
            <div class="player-info">
                ${avatar}
                <span class="player-name">${player.name}${teamBadge}</span>
            </div>
            ${player.isHost ? `<span class="host-badge">${t('host')}</span>` : ''}
        `;
        list.appendChild(div);
    });
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.style.display = (isHost && data.canStart) ? 'block' : 'none';
}

function startGame() {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'start', userId, matchToken, language: selectedLanguage }));
}

let currentMaxTime = 10; // Store max time for circular timer

function showQuestion(data) {
    hasBuzzed = false; canAnswer = false;
    document.getElementById('questionText').textContent = data.q;
    
    // Update round badge
    const roundInfo = document.getElementById('roundInfo');
    if (roundInfo && data.round) {
        const roundValue = roundInfo.querySelector('.round-value');
        if (roundValue) {
            roundValue.textContent = `${data.round}/3`;
        }
    }
    
    // Update question badge
    const questionBadge = document.getElementById('questionBadge');
    if (questionBadge && data.questionInRound) {
        const questionValue = questionBadge.querySelector('.question-value');
        if (questionValue) {
            questionValue.textContent = `${data.questionInRound}/${data.questionsPerRound}`;
        }
    }

    let timeLeft = data.time;
    currentMaxTime = data.time;
    const timerEl = document.getElementById('timer');
    
    // Use circular timer
    if (timerEl) {
        timerEl.innerHTML = createCircularTimer(timeLeft, currentMaxTime);
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerHTML = createCircularTimer(timeLeft, currentMaxTime);
        }
        if (timeLeft <= 0) { 
            clearInterval(timerInterval);
        }
    }, 1000);

    const buzzer = document.getElementById('buzzer');
    if (buzzer) { buzzer.disabled = false; buzzer.classList.remove('buzzed'); buzzer.textContent = t('buzz'); }

    const optionsBox = document.getElementById('optionsBox');
    if (optionsBox) {
        optionsBox.innerHTML = '';
        data.options.forEach((option, idx) => {
            const div = document.createElement('div'); 
            div.className = 'option'; 
            div.textContent = option; 
            div.onclick = () => answerQuestion(idx);
            // Add staggered animation
            div.style.animationDelay = (idx * 0.1) + 's';
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
    document.querySelectorAll('#optionsBox .option').forEach((opt, idx) => {
        opt.classList.add('visible'); 
        opt.onclick = null;
        // Mark correct answer
        if (opt.textContent === data.answer) { 
            opt.classList.add('correct'); 
            animateCorrectOption(opt); 
        }
        // Mark incorrect answer that was selected (if wrong)
        if (!data.correct && data.selectedIdx !== undefined && idx === data.selectedIdx) {
            opt.classList.add('incorrect');
        }
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
    
    // Find max score for progress bars
    const maxScore = Math.max(...Object.values(scores), 1);
    
    Object.entries(scores).forEach(([name, score]) => {
        const div = document.createElement('div'); 
        div.className = 'score-row';
        const avatar = createAvatarHTML(name);
        const percentage = (score / maxScore) * 100;
        
        div.innerHTML = `
            <div class="player-info">
                ${avatar}
                <span class="player-name">${name}</span>
            </div>
            <div class="player-score-container">
                <div class="player-score-bar">
                    <div class="player-score-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="player-score-text">${score}</span>
            </div>
        `;
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

// ============================================
// UI IMPROVEMENTS
// ============================================

// Button ripple effect
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--ripple-x', x + '%');
        btn.style.setProperty('--ripple-y', y + '%');
        btn.classList.remove('ripple');
        void btn.offsetWidth; // Trigger reflow
        btn.classList.add('ripple');
        setTimeout(() => btn.classList.remove('ripple'), 600);
    }
});

// Generate avatar color from name
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

// Get initials from name
function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Create avatar HTML
function createAvatarHTML(name) {
    const color = getAvatarColor(name);
    const initials = getInitials(name);
    return `<div class="player-avatar" style="background: ${color};">${initials}</div>`;
}

// Create circular timer HTML
function createCircularTimer(time, maxTime) {
    const percentage = (time / maxTime);
    const circumference = 226; // 2 * PI * 36 (radius)
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

// Update circular timer
function updateCircularTimer(containerId, time, maxTime) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createCircularTimer(time, maxTime);
    }
}

// ============================================
// VOICE CHAT (AGORA)
// ============================================

const AGORA_APP_ID = 'bfb23a30fb7349438d544b129ce4bd51';
let agoraClient = null;
let localAudioTrack = null;
let isInVoiceChat = false;
let isMuted = false;
let voiceParticipants = new Map(); // odUserId -> {name, odUserId}

async function initAgoraClient() {
    if (!window.AgoraRTC) {
        console.error('Agora SDK not loaded');
        return false;
    }
    
    if (!agoraClient) {
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Handle user published (someone joins voice)
        agoraClient.on('user-published', async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack.play();
                addVoiceParticipant(user.uid, 'Player');
            }
        });
        
        // Handle user unpublished (someone leaves voice)
        agoraClient.on('user-unpublished', (user) => {
            removeVoiceParticipant(user.uid);
        });
        
        // Handle user left
        agoraClient.on('user-left', (user) => {
            removeVoiceParticipant(user.uid);
        });
        
        // Handle volume indicator for speaking animation
        agoraClient.enableAudioVolumeIndicator();
        agoraClient.on('volume-indicator', (volumes) => {
            volumes.forEach(volume => {
                const el = document.querySelector(`[data-odUserId="${volume.uid}"]`);
                if (el) {
                    if (volume.level > 5) {
                        el.classList.remove('not-speaking');
                    } else {
                        el.classList.add('not-speaking');
                    }
                }
            });
        });
    }
    return true;
}

async function toggleVoiceChat() {
    if (isInVoiceChat) {
        await leaveVoiceChat();
    } else {
        await joinVoiceChat();
    }
}

async function joinVoiceChat() {
    try {
        updateVoiceStatus('connecting', t('voiceConnecting'));
        
        const initialized = await initAgoraClient();
        if (!initialized) {
            alert('Voice chat not available');
            updateVoiceStatus('disconnected', t('voiceDisconnected'));
            return;
        }
        
        // Use room code as channel name
        const channelName = currentRoomCode || 'default';
        
        // Join the channel (null token for testing, odUserId is a random number)
        const odUserId = Math.floor(Math.random() * 100000);
        await agoraClient.join(AGORA_APP_ID, channelName, null, odUserId);
        
        // Create and publish local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        isInVoiceChat = true;
        isMuted = false;
        
        // Update UI
        updateVoiceStatus('connected', t('voiceConnected'));
        updateVoiceButtons();
        
        // Add self to participants
        const myName = document.getElementById('createName')?.value || 
                       document.getElementById('joinName')?.value || 'You';
        addVoiceParticipant(odUserId, myName + ' (You)');
        
    } catch (error) {
        console.error('Failed to join voice chat:', error);
        alert('Failed to join voice chat: ' + error.message);
        updateVoiceStatus('disconnected', t('voiceDisconnected'));
    }
}

async function leaveVoiceChat() {
    try {
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (agoraClient) {
            await agoraClient.leave();
        }
        
        isInVoiceChat = false;
        isMuted = false;
        voiceParticipants.clear();
        
        // Update UI
        updateVoiceStatus('disconnected', t('voiceDisconnected'));
        updateVoiceButtons();
        renderVoiceParticipants();
        
    } catch (error) {
        console.error('Failed to leave voice chat:', error);
    }
}

function toggleMute() {
    if (!localAudioTrack) return;
    
    isMuted = !isMuted;
    localAudioTrack.setEnabled(!isMuted);
    
    const muteIcon = document.getElementById('muteIcon');
    const muteBtn = document.getElementById('muteBtn');
    
    if (muteIcon) {
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    if (muteBtn) {
        muteBtn.classList.toggle('muted', isMuted);
    }
}

function updateVoiceStatus(status, text) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.voice-status span:last-child');
    
    if (statusDot) {
        statusDot.className = 'status-dot ' + status;
    }
    if (statusText) {
        statusText.textContent = text;
    }
}

function updateVoiceButtons() {
    const joinBtn = document.getElementById('joinVoiceBtn');
    const voiceIcon = document.getElementById('voiceIcon');
    const voiceBtnText = document.getElementById('voiceBtnText');
    const muteBtn = document.getElementById('muteBtn');
    
    if (isInVoiceChat) {
        if (joinBtn) joinBtn.classList.add('active');
        if (voiceIcon) voiceIcon.textContent = '📞';
        if (voiceBtnText) voiceBtnText.textContent = t('leaveVoice');
        if (muteBtn) muteBtn.style.display = 'flex';
    } else {
        if (joinBtn) joinBtn.classList.remove('active');
        if (voiceIcon) voiceIcon.textContent = '🎤';
        if (voiceBtnText) voiceBtnText.textContent = t('joinVoice');
        if (muteBtn) muteBtn.style.display = 'none';
    }
}

function addVoiceParticipant(odUserId, name) {
    voiceParticipants.set(odUserId, { name, odUserId });
    renderVoiceParticipants();
}

function removeVoiceParticipant(odUserId) {
    voiceParticipants.delete(odUserId);
    renderVoiceParticipants();
}

function renderVoiceParticipants() {
    const container = document.getElementById('voiceParticipants');
    if (!container) return;
    
    if (voiceParticipants.size === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = Array.from(voiceParticipants.values()).map(p => `
        <div class="voice-participant not-speaking" data-odUserId="${p.odUserId}">
            <span class="speaking-indicator"></span>
            <span>${p.name}</span>
        </div>
    `).join('');
}

// Clean up voice chat when leaving game
function cleanupVoiceChat() {
    if (isInVoiceChat) {
        leaveVoiceChat();
    }
}

// Add cleanup when showing home screen
const originalShowHome = showHome;
showHome = function() {
    cleanupVoiceChat();
    originalShowHome();
};
