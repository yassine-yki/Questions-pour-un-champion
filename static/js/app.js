/*
Resume du fichier :
Ce fichier gere une grande partie du rendu de l'interface du jeu.
Il affiche les cartes de salle, les sujets, les joueurs, les ecrans de fin, le mode Mise, le mode Speed et plusieurs petits elements visuels.
C'est le fichier a lire quand on veut comprendre comment l'interface est assemblee cote navigateur.
*/

// Demarrage de cette couche d interface.
// Ce fichier est charge apres les modules principaux pour finaliser l interface.
window.AppState = window.AppState || {};
window.AppState.bootedAt = Date.now();

/* ============================================================
   QPUC - rendu principal de l interface

   Ce bloc construit plusieurs parties visibles du jeu.
   Il transforme les donnees du jeu en cartes, boutons, listes et ecrans que le joueur voit.

   Zones importantes :
     - renderPublicRooms : cartes des salles publiques
     - selectVisibility : bouton public/prive
     - selectGameMode : choix chacun pour soi/equipe
     - renderSubjectsToContainer : boutons de sujets
     - selectJoinTeam : choix d equipe
     - renderPlayerCards : cartes joueurs autour du jeu
     - updatePlayerCardsScores : mise a jour des scores visibles
     - highlightBuzzedPlayer : joueur qui a buzze
     - showQuestion : boutons de reponse colores
     - closePodiumAndShowMultiGameOver : podium et classement final
     - renderLobbyPlayers : places des joueurs dans le lobby
   ============================================================ */

(function() {
    'use strict';

    // Outils internes

    const TEAM_TINTS = ['coral', 'sky', 'mint', 'amber'];
    function tintForIndex(i) { return TEAM_TINTS[i % TEAM_TINTS.length]; }

    function avatarHtml(url, name) {
        if (url) {
            return `<img src="${url}" alt="${escapeHtml(name || '')}" onerror="this.style.display='none'">`;
        }
        const initial = (name || '?').charAt(0).toUpperCase();
        return `<span style="font-size:24px;font-weight:800;">${initial}</span>`;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function safeAvatarUrl(name) {
        if (typeof generateAvatarUrlFromName === 'function') {
            try { return generateAvatarUrlFromName(name); } catch(e) {}
        }
        return null;
    }

    function getPlayerAvatarFor(name) {
        const gamePlayers = window.currentGamePlayers || [];
        const myName = document.getElementById('createName')?.value ||
                       document.getElementById('joinName')?.value || '';
        const server = gamePlayers.find(p => p.name === name);
        if (server && server.avatar && typeof generateAvatarUrl === 'function') {
            return generateAvatarUrl(server.avatar);
        }
        if (name === myName && window.currentAvatar && typeof generateAvatarUrl === 'function') {
            return generateAvatarUrl(window.currentAvatar);
        }
        return safeAvatarUrl(name);
    }

    function lang() {
        try { return selectedLanguage === 'en' ? 'en' : 'fr'; } catch (e) {}
        try { return localStorage.getItem('triviaLanguage') === 'en' ? 'en' : 'fr'; } catch (e) {}
        return 'fr';
    }

    function copy(fr, en) {
        return lang() === 'en' ? en : fr;
    }

    function label(key, fr, en) {
        if (typeof t === 'function') {
            const translated = t(key);
            if (translated && translated !== key) return translated;
        }
        return copy(fr, en);
    }


    // Liste des salles publiques

    // Rendu moderne des cartes de salles publiques.
window.renderPublicRooms = function(rooms) {
        const container = document.getElementById('publicRoomsList');
        if (!container) return;
