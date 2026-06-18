/* ============================================================
   QPUC — game-patches.js
   Toybox-era overrides for game.js render functions.
   Loaded AFTER game.js so these definitions win.

   Each override replaces ONE function. Original logic preserved
   where possible; only markup output is changed to match new
   Toybox DOM (base.css + app.css primitives).

   Touchpoints:
     - renderPublicRooms          → .pr-room cards (used in Join screen list)
     - selectVisibility           → .seg__btn.is-on toggle
     - selectGameMode             → .mode-card.is-on highlight
     - renderSubjectsToContainer  → .subject-pill toggles (keeps hidden checkboxes)
     - selectJoinTeam             → team button highlight
     - renderPlayerCards          → flanking .player-tile seats (game screen)
     - updatePlayerCardsScores    → score pill updates
     - highlightBuzzedPlayer      → .is-buzzing on flanking seats
     - showQuestion (options part) → colored .option--a/b/c/d
     - closePodiumAndShowMultiGameOver → new podium + scoreboard
     - renderLobbyPlayers (NEW)   → seat tiles in lobby
   ============================================================ */

(function() {
    'use strict';

    // ── Helpers ───────────────────────────────────────────────

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


    // ── Public rooms list (Join screen) ───────────────────────

    window.renderPublicRooms = function(rooms) {
        const container = document.getElementById('publicRoomsList');
        if (!container) return;

        if (!rooms || rooms.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:32px 16px;color:var(--ink-faint);font-weight:500;font-size:14px;">
                    ${copy('Aucune partie publique en ce moment.', 'No public games right now.')}
                </div>`;
            return;
        }

        container.innerHTML = rooms.map(room => {
