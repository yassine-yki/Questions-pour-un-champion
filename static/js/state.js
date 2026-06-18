/*
Resume du fichier :
Ce fichier garde les grandes variables partagees par le jeu.
Il garde les informations que plusieurs fichiers doivent partager : salle, joueur, langue, audio et interface.
*/

// Etat partage de l application et variables utilisees par plusieurs modules.
window.AppState = window.AppState || {
    auth: {},
    room: {},
    game: {},
    audio: {},
    ui: {},
    language: localStorage.getItem('triviaLanguage') || 'fr'
};

let ws;
let userId;
let matchToken;
let isHost = false;
let currentRoomCode;
let hasBuzzed = false;
let canAnswer = false;
let timerInterval;
let selectedLanguage = localStorage.getItem('triviaLanguage') || 'fr';
let selectedTheme = 'neon';
let gameMode = null;
let selectedGameMode = 'ffa';
let selectedQuizType = { solo: 'classic', multi: 'classic' };
window.selectedQuizType = selectedQuizType;
let myTeam = null;
let selectedJoinTeam = null;
let roomGameMode = null;
let isCheckingRoom = false;
let currentMultiQuestion = null;
let currentLobbyPlayerCount = 0; // Garde le nombre de joueurs pour l affichage du lobby

// Reglages de la touche buzzer
let buzzerKey = localStorage.getItem('triviaBuzzerKey') || 'Space';
let buzzerKeyDisplay = localStorage.getItem('triviaBuzzerKeyDisplay') || 'SPACE';
let isCapturingKey = false;

// Reglages de musique
let musicPlayer = null;
let isMusicPlaying = false;
let musicVolume = parseInt(localStorage.getItem('triviaMusicVolume')) || 30;
let sfxVolume = parseInt(localStorage.getItem('triviaSfxVolume')) || 70;
let sfxEnabled = localStorage.getItem('triviaSfxEnabled') !== 'false';
let masterMuted = localStorage.getItem('triviaMasterMuted') === 'true';
