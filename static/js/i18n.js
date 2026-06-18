/*
Resume du fichier :
Ce fichier gere les textes traduits de l'interface.
Il contient les dictionnaires francais/anglais, applique les traductions au HTML, et synchronise le choix de langue.
*/

// Dictionnaires de texte : chaque cle existe en anglais et en francais.
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
        continue: "Continue",
        // Traductions des avatars
        avatarStudio: "Avatar Studio",
        dressingRoom: "Dressing Room",
        customize: "Customize Avatar",
        randomize: "Randomize",
        save: "Save",
        joinRoomBtn: "Join Room",
        waitingForPlayers: "Waiting for players to join...",
        playersInLobby: "players in lobby",
        playerInLobby: "player in lobby",
        finalResults: "FINAL RESULTS",
        leaderboard: "LEADERBOARD",
        getReady: "GET READY",
        go: "GO!",
        startGame: "Start Game",
        buzz: "BUZZ!",
        gameOver: "Game Over!",
        playAgain: "Play Again",
        rematch: "Rematch",
        backToMenu: "Menu",
        reconnecting: "Reconnecting...",
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
        wrong: "âŒ Wrong! Correct answer:",
        timeout: "⏰ Time's up!",
        round: "Round",
        question: "Question",
        winner: "Winner",
        // Traductions des salles publiques
        roomVisibility: "Room Visibility:",
        privateRoom: "Private",
        publicRoom: "Public",
        privateDesc: "Code required",
        publicDesc: "Visible to all",
        publicRooms: "Public Rooms",
        noPublicRooms: "No public rooms available",
        orJoinPrivate: "OR join a private room",
        join: "Join",
        // Traductions du chat vocal
        voiceChat: "Voice Chat",
        joinVoice: "Join Voice",
        leaveVoice: "Leave Voice",
        voiceConnecting: "Connecting...",
        voiceConnected: "Connected",
        voiceDisconnected: "Disconnected",
        // Traductions de la categorie personnalisee IA
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
        selectAll: "Select All",
        deselectAll: "Deselect All",
        advancedOptions: "Advanced Options",
        // Ecran d accueil
        welcome: "Welcome",
        guest: "Guest",
        playAsGuest: "Play as Guest",
        loginOrRegister: "Login / Register",
        globalLeaderboard: "Global Leaderboard",
        editAvatar: "Edit Avatar",
        logout: "Logout",
        // Auth
        username: "Username",
        password: "Password",
        login: "Login",
        register: "Register",
        // Statistiques
        gamesPlayed: "Games Played",
        gamesWon: "Games Won",
        highScore: "High Score",
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
            image_riddles: "🖼️ Image Riddles",
            flags: "🏳️ World Flags",
            picguess: "🔍 Picture Guess"
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
        continue: "Continuer",
        // Traductions des avatars
        avatarStudio: "Studio Avatar",
        dressingRoom: "Vestiaire",
        customize: "Personnaliser l'avatar",
        randomize: "Aléatoire",
        save: "Sauvegarder",
        joinRoomBtn: "Rejoindre la salle",
        waitingForPlayers: "En attente de joueurs...",
        playersInLobby: "joueurs dans le salon",
        playerInLobby: "joueur dans le salon",
        finalResults: "RÉSULTATS FINAUX",
        leaderboard: "CLASSEMENT",
        getReady: "PRÉPAREZ-VOUS",
        go: "C'EST PARTI!",
        startGame: "Démarrer le jeu",
        buzz: "BUZZ!",
        gameOver: "Jeu terminé!",
        playAgain: "Rejouer",
        rematch: "Revanche",
        backToMenu: "Menu",
        reconnecting: "Reconnexion...",
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
        timeout: "⏰ Temps écoulé !",
        round: "Manche",
        question: "Question",
        winner: "Gagnant",
        // Traductions des salles publiques
        roomVisibility: "Visibilité de la salle:",
        privateRoom: "Privée",
        publicRoom: "Publique",
        privateDesc: "Code requis",
        publicDesc: "Visible par tous",
        publicRooms: "Salles publiques",
        noPublicRooms: "Aucune salle publique disponible",
        orJoinPrivate: "OU rejoindre une salle privée",
        join: "Rejoindre",
        // Traductions du chat vocal
        voiceChat: "Chat Vocal",
        joinVoice: "Rejoindre",
        leaveVoice: "Quitter",
        voiceConnecting: "Connexion...",
        voiceConnected: "Connecté",
        voiceDisconnected: "Déconnecté",
        // Traductions de la categorie personnalisee IA
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
        selectAll: "Tout sélectionner",
        deselectAll: "Tout désélectionner",
        advancedOptions: "Options avancées",
        // Ecran d accueil
        welcome: "Bienvenue",
        guest: "Invité",
        playAsGuest: "Jouer en tant qu'invité",
        loginOrRegister: "Connexion / Inscription",
        globalLeaderboard: "Classement Mondial",
        editAvatar: "Modifier l'avatar",
        logout: "Déconnexion",
        // Auth
        username: "Nom d'utilisateur",
        password: "Mot de passe",
        login: "Connexion",
        register: "S'inscrire",
        // Statistiques
        gamesPlayed: "Parties jouées",
        gamesWon: "Parties gagnées",
        highScore: "Meilleur score",
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
            image_riddles: "🖼️ Devinettes en Images",
            flags: "🏳️ Drapeaux du Monde",
            picguess: "🔍 Image Mystère"
        }
    }
};

// ============================================
// CONSTANTES ET ETAT
// ============================================


// Petite fonction pratique : donne le texte dans la langue actuelle.
function t(key) {
    const keys = key.split('.');
    let value = translations[selectedLanguage];
    for (const k of keys) {
        value = value?.[k];
        if (!value) break;
    }
    return value || translations.en[key] || key;
}

// Parcourt la page et remplace les textes visibles par leur traduction.
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

    const textBySelector = {
        '#settingsModal .modal-head h2': {
            en: 'Your settings',
            fr: 'Vos réglages'
        },
        '#settingsModal .setting-row:nth-of-type(2) .setting-row__name': {
            en: 'Language',
            fr: 'Langue'
        },
        '#settingsModal .setting-row:nth-of-type(2) .setting-row__help': {
            en: 'Interface and questions',
            fr: "L'interface et les questions"
        },
        '#settingsModal .setting-row:nth-of-type(3) .setting-row__name': {
            en: 'Master sound',
            fr: 'Son général'
        },
        '#settingsModal .setting-row:nth-of-type(3) .setting-row__help': {
            en: 'Mutes all sounds',
            fr: 'Coupe tous les sons'
        },
        '#settingsModal .setting-row:nth-of-type(4) .setting-row__name': {
            en: 'Sound effects',
            fr: 'Effets sonores'
        },
        '#sfxStatus': {
            en: 'Buzzer, correct/wrong answers',
            fr: 'Buzzer, bonnes/mauvaises reponses'
        },
        '#settingsModal .setting-row:nth-of-type(5) .setting-row__name': {
            en: 'Background music',
            fr: "Musique d'ambiance"
        },
        '#musicStatus': {
            en: 'In lobby and between questions',
            fr: 'En lobby et entre les questions'
        },
        '#settingsModal .setting-row:nth-of-type(6) .setting-row__name': {
            en: 'Buzzer key',
            fr: 'Touche buzzer'
        },
        '#settingsModal .setting-row:nth-of-type(6) .setting-row__help': {
            en: 'Click to remap',
            fr: 'Cliquez pour reprogrammer'
        },
        '#settingsModal .account-section-label': {
            en: 'Account',
            fr: 'Compte'
        },
        '#settingsModal .account-row__logout': {
            en: 'Log out',
            fr: 'Déconnexion'
        },
        '#accountUsername': {
            en: currentPlayer ? currentPlayer.username : 'Player',
            fr: currentPlayer ? currentPlayer.username : 'Joueur'
        },
        '#welcomeName': {
            en: currentPlayer ? currentPlayer.username : 'Sign in',
            fr: currentPlayer ? currentPlayer.username : 'Se connecter'
        },
        '#authCard .auth-card-title': {
            en: 'Your account',
            fr: 'Votre compte'
        },
        '#authCard .auth-tab:nth-child(1)': {
            en: 'Login',
            fr: 'Connexion'
        },
        '#authCard .auth-tab:nth-child(2)': {
            en: 'Register',
            fr: 'Inscription'
        },
        '#loginForm .btn': {
            en: 'Sign in',
            fr: 'Se connecter'
        },
        '#registerForm .btn': {
            en: 'Create account',
            fr: 'Creer un compte'
        },
        '#authCard .auth-divider span': {
            en: 'or',
            fr: 'ou'
        },
        '#authSection .btn--ghost': {
            en: 'Play as guest',
            fr: 'Jouer en invite'
        },
        '#profileSection .btn--ghost': {
            en: 'Log out',
            fr: 'Deconnexion'
        },
        '#homeScreen .home-hero h1': {
            en: 'Ready to play?',
            fr: 'Pret(e) a jouer ?'
        },
        '#homeScreen .home-hero .body': {
            en: 'The buzzer, round eliminations, a thousand questions. Choose your door.',
            fr: "Le buzzer, l'elimination par manche, mille questions. Choisissez votre porte."
        },
        '.door--solo .pill': {
            en: 'Mastery',
            fr: 'Maitrise'
        },
        '.door--solo .door__desc': {
            en: 'Sharpen your knowledge, beat your records, and clear rounds without buzzer pressure.',
            fr: 'Affutez votre culture, battez vos records, et passez les manches sans la pression du buzzer.'
        },
        '.door--solo .door__footer .btn': {
            en: 'Play solo',
            fr: 'Jouer en solo'
        },
        '.door--multi .pill': {
            en: 'Arena',
            fr: 'Arene'
        },
        '.door--multi .door__desc': {
            en: 'Face your friends or the community. Right answers, wrong answers, eliminations. Last player standing wins.',
            fr: 'Affrontez vos amis ou la communaute. Bonnes reponses, mauvaises reponses, eliminations. Le dernier debout gagne.'
        },
        '.door--multi .door__footer .btn': {
            en: 'Enter the arena',
            fr: "Entrer dans l'arene"
        },
        '.door--multi .live-dot': {
            en: '15 public games in progress',
            fr: '15 parties publiques en cours'
        },
        '#homeScreen .home-tile:nth-child(1) .home-tile__label': {
            en: 'Global',
            fr: 'Global'
        },
        '#homeScreen .home-tile:nth-child(3) .home-tile__label': {
            en: 'Your games',
            fr: 'Vos parties'
        },
        '#homeScreen .home-tile:nth-child(3) .home-tile__name': {
            en: 'History',
            fr: 'Historique'
        },
        '#homeScreen .home-tile:nth-child(4) .home-tile__label': {
            en: 'Rules',
            fr: 'Regles'
        },
        '#homeScreen .home-tile:nth-child(4) .home-tile__name': {
            en: 'Help',
            fr: 'Aide'
        },
        '#soloSetupScreen .crumb__text': {
            en: 'Home - Solo game',
            fr: 'Accueil - Partie solo'
        },
        '#soloSetupScreen .setup-hero h1': {
            en: 'Prepare the game',
            fr: 'Preparez la partie'
        },
        '#soloSetupScreen .setup-hero .body': {
            en: 'Choose your subjects. You can select several.',
            fr: 'Choisissez vos sujets. Vous pouvez en selectionner plusieurs.'
        },
        '#soloSetupScreen .field-label:nth-of-type(1)': {
            en: 'Your name',
            fr: 'Votre nom'
        },
        '#soloSetupScreen .field-label:nth-of-type(2)': {
            en: 'Subjects',
            fr: 'Sujets'
        },
        '#soloSetupScreen .toggle-all': {
            en: 'Select/deselect all',
            fr: 'Tout (de)selectionner'
        },
        '#soloSetupScreen .ai-card .field-label': {
            en: 'Custom category',
            fr: 'Categorie sur-mesure'
        },
        '#soloSetupScreen .ai-card h3': {
            en: 'Invent a subject',
            fr: 'Inventez un sujet'
        },
        '#soloSetupScreen .ai-card p:first-of-type': {
            en: 'Type what interests you - AI prepares questions.',
            fr: "Tapez ce qui vous interesse - l'IA prepare des questions."
        },
        '#soloSetupScreen .ai-card__meta': {
            en: 'Optional - 10 generated questions',
            fr: 'Optionnel - 10 questions generees'
        },
        '#soloSetupScreen .setup-counter': {
            en: '15 questions - about 8 minutes',
            fr: '15 questions - environ 8 minutes'
        }
    };

    const setTranslatedText = (element, text) => {
        const directSvgs = Array.from(element.children).filter(child => child.tagName?.toLowerCase() === 'svg');
        if (!directSvgs.length) {
            element.textContent = text;
            return;
        }

        const firstSvg = element.firstElementChild?.tagName?.toLowerCase() === 'svg';
        const svgClones = directSvgs.map(svg => svg.cloneNode(true));
        element.textContent = '';
        if (firstSvg) {
            svgClones.forEach(svg => element.appendChild(svg));
            element.appendChild(document.createTextNode(` ${text}`));
        } else {
            element.appendChild(document.createTextNode(`${text} `));
            svgClones.forEach(svg => element.appendChild(svg));
        }
    };

    Object.entries(textBySelector).forEach(([selector, copy]) => {
        const element = document.querySelector(selector);
        if (element) setTranslatedText(element, copy[selectedLanguage] || copy.en);
    });

    document.querySelectorAll('[data-i18n-en], [data-i18n-fr]').forEach(element => {
        const text = element.dataset[`i18n${selectedLanguage.toUpperCase()}`];
        if (text) element.textContent = text;
    });

    const placeholderBySelector = {
        '#loginUsername': { en: 'Username', fr: "Nom d'utilisateur" },
        '#loginPassword': { en: 'Password', fr: 'Mot de passe' },
        '#registerUsername': { en: 'Choose a username', fr: "Choisir un nom d'utilisateur" },
        '#registerPassword': { en: 'Password', fr: 'Mot de passe' },
        '#registerPasswordConfirm': { en: 'Confirm password', fr: 'Confirmer le mot de passe' },
        '#soloName': { en: 'Type your name...', fr: 'Tapez votre nom...' },
        '#customCategoryInput': { en: 'Ex: Pinot noir, French cinema from the 60s...', fr: 'Ex : Pinot noir, Cinema francais des annees 60...' }
    };

    Object.entries(placeholderBySelector).forEach(([selector, copy]) => {
        const element = document.querySelector(selector);
        if (element) element.placeholder = copy[selectedLanguage] || copy.en;
    });
    
    // Met a jour le nombre de joueurs si on est dans le lobby
    if (currentLobbyPlayerCount > 0) {
        updateLobbyPlayerCount();
    }
    
    // Reaffiche les sujets s ils sont visibles
    renderSubjects();
    if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof updateLanguageUI === 'function') updateLanguageUI();
    if (typeof updateMasterMuteUI === 'function') updateMasterMuteUI();
    if (typeof updateMusicUI === 'function') updateMusicUI();
    if (typeof updateSfxToggleUI === 'function') updateSfxToggleUI();
}

// Change la langue, la sauvegarde, puis rafraichit les textes deja affiches.
function selectLanguage(lang) {
    selectedLanguage = lang;
    if (window.AppState) window.AppState.language = lang;
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
    const fr = document.getElementById('langFR');
    const en = document.getElementById('langEN');
    [fr, en].forEach(btn => btn && btn.classList.remove('is-on', 'selected'));
    const activeBtn = selectedLanguage === 'en' ? en : fr;
    if (activeBtn) activeBtn.classList.add('is-on', 'selected');

    document.querySelectorAll('.language-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.lang === selectedLanguage) {
            opt.classList.add('selected');
        }
    });
}

// ============================================
