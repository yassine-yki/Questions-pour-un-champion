/*
Resume du fichier :
Ce fichier regroupe les noms fixes utilises partout : actions WebSocket, evenements serveur, sujets, musiques et valeurs de score.
Quand un nom de protocole change, c'est ici qu'il faut regarder en premier.
*/

// Constantes partagees et noms du protocole.
window.WS_ACTIONS = Object.freeze({
    JOIN_LOBBY: 'joinLobby',
    LEAVE_LOBBY: 'leaveLobby',
    CREATE: 'create',
    JOIN: 'join',
    START: 'start',
    BUZZ: 'buzz',
    ANSWER: 'answer',
    REACTION: 'reaction',
    REJOIN: 'rejoin',
    REMATCH: 'rematch',
    WAGER: 'wager',
    CHANGE_LANGUAGE: 'changeLanguage'
});
window.WS_EVENTS = Object.freeze({
    ROOM_CREATED: 'roomCreated',
    JOINED: 'joined',
    PLAYERS: 'players',
    QUESTION: 'question',
    ANSWER_RESULT: 'answerResult',
    SPEED_RESULT: 'speedResult',
    GAME_OVER: 'gameOver',
    LANGUAGE_CHANGED: 'languageChanged'
});

const SUBJECTS = [
    'science', 'history', 'geography', 'sports', 'music', 'food', 'tv_shows', 'anime', 'image_riddles',
    'flags', 'picguess'
];

const themeMusicUrls = {
    neon: '/static/music/neon.mp3',
    dragon: '/static/music/dragon.mp3',
    horror: '/static/music/horror.mp3', // Musique d ambiance horreur
    sakura: '/static/music/sakura.mp3',
    midnight: '/static/music/midnight.mp3',
    clean: '/static/music/clean.mp3'
};

// ============================================
// SOUND SYSTEM — Web Audio Synthesis
// ============================================

// Valeurs de score utilisees cote navigateur pour le mode solo.
const WRONG_ANSWER_PENALTY = 50;  // Points perdus pour une mauvaise reponse
const MIN_CORRECT_POINTS = 10;   // Minimum de points pour une bonne reponse
const MAX_CORRECT_POINTS = 100;  // Maximum de points pour une reponse instantanee

const playerCardColors = ['pink', 'blue', 'yellow', 'green'];

const AGORA_APP_ID = 'bfb23a30fb7349438d544b129ce4bd51';
