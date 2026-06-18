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

        if (!rooms || rooms.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:32px 16px;color:var(--ink-faint);font-weight:500;font-size:14px;">
                    ${copy('Aucune partie publique en ce moment.', 'No public games right now.')}
                </div>`;
            return;
        }

        container.innerHTML = rooms.map(room => {
            const playerCount = Number(room.playerCount ?? room.count ?? 0);
            const maxPlayers = Number(room.maxPlayers ?? 4);
            const isFull = playerCount >= maxPlayers;
            const isPlaying = room.state === 'playing' || room.inProgress;
            const disabled = isFull || isPlaying;
            const stateLabel = isPlaying
                ? copy('En cours', 'In progress')
                : (isFull ? copy('Pleine', 'Full') : copy('En attente', 'Waiting'));
            const stateClass = isPlaying ? 'pr-state--playing' : (isFull ? 'pr-state--full' : 'pr-state--waiting');
            const modeLabel = room.gameMode === 'team'
                ? copy('En equipe', 'Team mode')
                : copy('Chacun pour soi', 'Free for all');
            const onclick = disabled ? '' : `onclick="joinPublicRoom('${escapeHtml(room.code)}')"`;
            return `
                <button class="pr-room ${disabled ? 'is-disabled' : ''}" ${onclick} ${disabled ? 'disabled' : ''}>
                    <div class="pr-room__head">
                        <span class="pr-room__code">${escapeHtml(room.code)}</span>
                        <span class="pr-room__state ${stateClass}">${stateLabel}</span>
                    </div>
                    <div class="pr-room__meta">
                        <span class="pr-room__tag">${modeLabel}</span>
                        <span class="pr-room__tag">${playerCount}/${maxPlayers} ${label('players', 'joueurs', 'players').toLowerCase()}</span>
                    </div>
                </button>`;
        }).join('');
    };


    // Choix public ou prive

    window.selectVisibility = function(visibility) {
        window.selectedRoomVisibility = visibility;
        try { selectedRoomVisibility = visibility; } catch (e) {}
        const pub = document.getElementById('visibilityPublic');
        const priv = document.getElementById('visibilityPrivate');
        [pub, priv].forEach(el => el && el.classList.remove('is-on', 'selected'));
        const target = visibility === 'public' ? pub : priv;
        if (target) target.classList.add('is-on');
    };


    // Choix du mode de jeu

    window.selectGameMode = function(mode) {
        window.selectedGameMode = mode;
        // Synchronise aussi la variable globale si elle existe
        try { selectedGameMode = mode; } catch (e) {}
        const ffa = document.getElementById('gameModeFF');
        const team = document.getElementById('gameModeTeam');
        [ffa, team].forEach(el => el && el.classList.remove('is-on', 'selected'));
        const target = mode === 'ffa' ? ffa : team;
        if (target) target.classList.add('is-on');

        // Met a jour la description courte pour expliquer le choix.
        const hint = document.getElementById('gameModeHint');
        if (hint) {
            hint.textContent = (mode === 'team')
                ? copy('Exactement 4 joueurs, en 2 equipes de 2. Les points sont communs ; la partie demarre une fois les equipes completes.', 'Exactly 4 players, in 2 teams of 2. Points are shared; the game starts once teams are complete.')
                : copy('2 a 4 joueurs. Chacun joue pour soi - le meilleur score gagne. La partie demarre des 2 joueurs.', '2 to 4 players. Everyone plays for themselves; the highest score wins. The game can start with 2 players.');
        }
    };


    // Selection des sujets

    // Les boutons visibles gardent une case cachee pour faciliter la lecture des sujets selectionnes.
    // Rendu moderne des sujets sous forme de boutons selectionnables.
window.renderSubjectsToContainer = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container || typeof SUBJECTS === 'undefined') return;
        container.innerHTML = '';
        // Seule la zone solo est visible au depart; createSubjects reste cachee
        // car l ecran de creation montre un resume et le bouton Modifier.
        if (containerId === 'soloSubjects') {
            container.classList.remove('hidden');
        }

        SUBJECTS.forEach(subject => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'subject-pill is-on';
            pill.dataset.subject = subject;

            const hiddenCb = document.createElement('input');
            hiddenCb.type = 'checkbox';
            hiddenCb.id = `${containerId}-${subject}`;
            hiddenCb.value = subject;
            hiddenCb.checked = true;
            hiddenCb.style.display = 'none';

            const label = t('subjects.' + subject) || subject;
            pill.innerHTML = `
                <span class="subject-pill__icon">
                    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>
                </span>
                <span>${escapeHtml(label)}</span>`;
            pill.appendChild(hiddenCb);

            pill.addEventListener('click', (e) => {
                if (e.target === hiddenCb) return;
                e.preventDefault();
                hiddenCb.checked = !hiddenCb.checked;
                pill.classList.toggle('is-on', hiddenCb.checked);
                // Change l icone quand le sujet n est pas coche
                const iconSpan = pill.querySelector('.subject-pill__icon');
                if (iconSpan) {
                    if (hiddenCb.checked) {
                        iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;
                    } else {
                        iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 256 256" fill="var(--primary)"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>`;
                    }
                }
            });

            container.appendChild(pill);
        });
    };

    // Tout selectionner en solo : inverse les boutons et les cases cachees.
    window.toggleAllSubjects = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const pill = cb.closest('.subject-pill');
            if (pill) {
                pill.classList.toggle('is-on', cb.checked);
                const iconSpan = pill.querySelector('.subject-pill__icon');
                if (iconSpan) {
                    if (cb.checked) {
                        iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;
                    } else {
                        iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 256 256" fill="var(--primary)"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>`;
                    }
                }
            }
        });
    };

    // Alias pratique utilise par le nouveau HTML
    window.toggleAllSoloSubjects = () => window.toggleAllSubjects('soloSubjects');


    // Choix de l equipe

    window.selectJoinTeam = function(team) {
        window.selectedJoinTeam = team;
        const red = document.getElementById('joinTeamRed');
        const blue = document.getElementById('joinTeamBlue');
        [red, blue].forEach(el => {
            if (!el) return;
            el.classList.remove('selected', 'is-on');
            el.style.outline = '';
        });
        const target = team === 'red' ? red : blue;
        if (target) {
            target.classList.add('is-on');
            target.style.outline = `3px solid ${team === 'red' ? 'var(--primary)' : 'var(--tertiary)'}`;
            target.style.outlineOffset = '-3px';
        }
    };


    // Cartes joueurs autour de l ecran

    // Les joueurs sont repartis dans deux colonnes autour de la zone de question.
    // Affiche les joueurs autour de la zone de jeu.
window.renderPlayerCards = function(players, scores = {}) {
        const left = document.getElementById('playersListLeft');
        const right = document.getElementById('playersListRight');
        if (!left || !right) return;
        left.innerHTML = '';
        right.innerHTML = '';

        const list = players.map((player, idx) => {
            const name = typeof player === 'string' ? player : player.name;
            return {
                name,
                score: scores[name] || 0,
                idx,
                eliminated: typeof player === 'object' && player.eliminated,
                tint: tintForIndex(idx)
            };
        });

        list.forEach((p, i) => {
            const target = (i % 2 === 0) ? left : right;
            const avatarUrl = getPlayerAvatarFor(p.name);
            const tile = document.createElement('div');
            tile.className = 'player-tile player-card' + (p.eliminated ? ' is-out' : '');
            tile.dataset.playerName = p.name;
            tile.innerHTML = `
                <div class="player-avatar-wrap team-${p.tint}">
                    <div class="player-avatar">
                        ${avatarHtml(avatarUrl, p.name)}
                    </div>
                    <span class="player-status-dot ${p.eliminated ? 'is-eliminated' : ''}"></span>
                </div>
                <div class="player-name">${escapeHtml(p.name)}</div>
                <span class="score-pill score-pill--${p.tint} player-score" data-name="${escapeHtml(p.name)}">${p.score} pts</span>
            `;
            target.appendChild(tile);
        });
    };

    // Met a jour les scores sans reconstruire les cartes
    window.updatePlayerCardsScores = function(scores) {
        Object.entries(scores || {}).forEach(([name, score]) => {
            const tiles = document.querySelectorAll(`[data-player-name="${CSS.escape(name)}"]`);
            tiles.forEach(t => {
                const scoreEl = t.querySelector('.score-pill, .player-score');
                if (scoreEl) {
                    scoreEl.textContent = `${score} pts`;
                    scoreEl.classList.add('score-animate');
                    setTimeout(() => scoreEl.classList.remove('score-animate'), 600);
                }
            });
        });
    };

    // Met en avant le joueur qui a buzze
    window.highlightBuzzedPlayer = function(playerName) {
        document.querySelectorAll('.player-tile').forEach(t => {
            t.classList.remove('is-buzzing', 'active-buzzer');
            const wrap = t.querySelector('.player-avatar-wrap');
            if (wrap) wrap.classList.remove('is-buzzing');
        });
        const escaped = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(playerName) : playerName;
        const tile = document.querySelector(`[data-player-name="${escaped}"]`);
        if (tile) {
            tile.classList.add('is-buzzing');
            const wrap = tile.querySelector('.player-avatar-wrap');
            if (wrap) wrap.classList.add('is-buzzing');
        }
    };


    // Zone des reponses

    // Les reponses sont affichees comme de grands boutons colores, faciles a cliquer rapidement.
    const _origShowQuestion = window.showQuestion;
    window.showQuestion = function(data) {
        if (typeof _origShowQuestion === 'function') {
            _origShowQuestion(data);
        }

        // Rewrite options to Toybox colored variants
        const optionsBox = document.getElementById('optionsBox');
        if (optionsBox && data && data.options) {
            optionsBox.innerHTML = '';
            optionsBox.style.display = 'grid';
            const isTrueFalse = data.quizType === 'truefalse';
            const letters = isTrueFalse ? ['T', 'F'] : ['A', 'B', 'C', 'D'];
            const variants = ['option--a', 'option--b', 'option--c', 'option--d'];
            data.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = `option ${variants[idx % 4]}`;
                btn.style.animationDelay = (idx * 0.06) + 's';
                btn.innerHTML = `
                    <span class="option__letter">${letters[idx % 4]}</span>
                    <span class="option__text">${escapeHtml(opt)}</span>
                `;
                btn.onclick = () => answerQuestion(idx);
                optionsBox.appendChild(btn);
            });
        }

        // Met a jour la pastille de question en haut de la carte
        const badge = document.getElementById('questionBadge');
        if (badge && data && data.questionInRound) {
            badge.textContent = `Question ${data.questionInRound} / ${data.questionsPerRound || 5}`;
        }

        // Anime l anneau du chrono pendant la duree de la question
        const fill = document.getElementById('countdownFill');
        if (fill && data && data.time) {
            const total = 314.16; // 2Ãâ‚¬ * 50
            fill.style.transition = `stroke-dashoffset ${data.time}s linear`;
            fill.style.strokeDashoffset = '0';
            // Force le recalcul visuel puis lance l animation.
            void fill.getBoundingClientRect();
            fill.style.strokeDashoffset = total;
        }
        // La barre de progression haute est geree plus bas.
    };


    // Structure des places du lobby : joueur present, place vide, hote, equipe et micro.
    const modelePlacesLobby = function(data) {
        const container = document.getElementById('playersList');
        if (!container) return;

        const players = data.players || [];
        window.currentGamePlayers = players;
        const maxPlayers = data.maxPlayers || 4;
        const hostName = data.host || (players[0] && (players[0].name || players[0]));
        const readyPlayers = new Set(data.readyPlayers || []);
        const micStates = data.micStates || {}; // { name: 'on'|'off'|'speaking' }
        const myName = document.getElementById('createName')?.value ||
                       document.getElementById('joinName')?.value || '';

        container.innerHTML = '';

        // Affiche les places occupees
        players.forEach((player, idx) => {
            const name = typeof player === 'string' ? player : player.name;
            const isHost = name === hostName;
            const isReady = readyPlayers.has(name);
            const isMe = name === myName;
            const micState = micStates[name] || 'off';
            const tint = tintForIndex(idx);
            const avatarUrl = getPlayerAvatarFor(name);

            let seatClass = 'seat';
            if (isHost) seatClass += ' is-host';
            else if (isReady) seatClass += ' is-ready';

            let micChipClass = 'seat__mic-chip';
            if (micState === 'speaking') micChipClass += ' is-speaking';
            else if (micState === 'on') micChipClass += ' is-on';

            let statusDotIcon = '';
            if (isHost) {
                statusDotIcon = `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M243.81,90.36a16,16,0,0,0-14.79-9.85H184.69L154.13,21.46a16,16,0,0,0-28.26,0L95.31,80.51H50.94A16,16,0,0,0,36.16,90.36a16.16,16.16,0,0,0,3.06,17.46l31.17,32.61L57.13,191.27a16.16,16.16,0,0,0,21,18.65L128,189.62l49.9,20.3a16,16,0,0,0,21.05-18.65L185.61,140.43l31.17-32.61A16.16,16.16,0,0,0,243.81,90.36Z"/></svg>`;
            } else if (isReady) {
                statusDotIcon = `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;
            }

            const meta = isHost ? (isMe ? 'Vous Â· HÃ´te' : 'HÃ´te')
                       : isReady ? 'PrÃªt(e)'
                       : (isMe ? 'Vous' : 'ConnectÃ©');

            const seat = document.createElement('div');
            seat.className = seatClass;
            seat.dataset.playerName = name;
            seat.innerHTML = `
                <div class="seat__avatar-wrap">
                    <span class="${micChipClass}" title="Micro ${micState}">
                        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176Z"/>${micState === 'off' ? '<line x1="40" y1="216" x2="216" y2="40" stroke="currentColor" stroke-width="22" stroke-linecap="round"/>' : ''}</svg>
                    </span>
                    <div class="seat__avatar">${avatarHtml(avatarUrl, name)}</div>
                    <span class="seat__status-dot">${statusDotIcon}</span>
                </div>
                <div>
                    <div class="seat__name">${escapeHtml(name)}</div>
                    <div class="seat__meta">${meta}</div>
                </div>
                ${isMe ? `
                    <button class="seat__mic-btn ${micState === 'off' ? 'is-off' : 'is-on'}" onclick="toggleVoiceChat()">
                        <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor"><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176Z"/></svg>
                        ${micState === 'off' ? copy('Activer micro', 'Enable mic') : copy('Micro actif', 'Mic on')}
                    </button>
                ` : ''}
            `;
            container.appendChild(seat);
        });

        // Affiche les places vides
        const empty = Math.max(0, maxPlayers - players.length);
        for (let i = 0; i < empty; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat is-empty';
            seat.innerHTML = `
                <div class="seat__empty-icon">
                    <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
                </div>
                <div class="seat__empty-label">${copy('En attente...', 'Waiting...')}</div>
            `;
            container.appendChild(seat);
        }

        // Met a jour le compteur du lobby
        const countEl = document.getElementById('lobbyPlayerCount');
        const maxEl = document.getElementById('lobbyPlayerMax');
        if (countEl) countEl.textContent = players.length;
        if (maxEl) maxEl.textContent = maxPlayers;

        // Infos de format du lobby
        if (data.gameMode) {
            const modeEl = document.getElementById('lobbyMode');
            if (modeEl) modeEl.textContent = data.gameMode === 'team'
                ? copy('En equipe', 'Team mode')
                : copy('Chacun pour soi', 'Free for all');
        }
        if (data.visibility) {
            const visEl = document.getElementById('lobbyVisibility');
            if (visEl) visEl.textContent = data.visibility === 'public'
                ? copy('Publique', 'Public')
                : copy('Privee', 'Private');
        }
        if (typeof data.subjectCount === 'number') {
            const subEl = document.getElementById('lobbySubjectCount');
            if (subEl) subEl.textContent = `${data.subjectCount} ${copy('sujets', 'subjects')}`;
        }

        // Nombre de participants vocaux
        const voiceCount = Object.values(micStates).filter(s => s !== 'off').length;
        const vEl = document.getElementById('voiceParticipants');
        if (vEl) vEl.textContent = lang() === 'en'
            ? `${voiceCount} active`
            : `${voiceCount} actif${voiceCount !== 1 ? 's' : ''}`;

        // Message d attente : explique ce qui manque pour lancer selon le mode
        const waitEl = document.getElementById('lobbyWaitingMsg');
        if (waitEl) {
            if (players.length < 2) {
                waitEl.textContent = copy("En attente d'au moins 2 joueurs...", 'Waiting for at least 2 players...');
            } else if (players.length < maxPlayers) {
                waitEl.textContent = lang() === 'en'
                    ? `${players.length} player${players.length > 1 ? 's' : ''} - ready to start`
                    : `${players.length} joueur${players.length > 1 ? 's' : ''} - pret a lancer`;
            } else {
                waitEl.textContent = copy('Salon plein', 'Room full');
            }
        }
    };


    // Categorie IA

    window.toggleAICategory = function() {
        const btn = document.getElementById('aiToggleMulti');
        const input = document.getElementById('customCategoryInputMulti');
        if (!btn) return;
        btn.classList.toggle('is-off');
        const enabled = !btn.classList.contains('is-off');
        if (input) {
            input.disabled = !enabled;
            input.style.opacity = enabled ? '1' : '0.5';
        }
    };


    // Outils internes

    window.openSubjectsPicker = window.openSubjectsPicker || function() {
        // Fonction d attente : avant, les sujets etaient choisis ailleurs.
        // Pour l instant, on va vers la zone des sujets si elle existe,
        // or open a future picker modal.
        alert('La sÃ©lection des sujets sera bientÃ´t disponible. Tous les sujets sont activÃ©s par dÃ©faut.');
    };

    window.shareRoomLink = window.shareRoomLink || function() {
        const code = document.getElementById('createCode')?.textContent || '';
        if (navigator.share) {
            navigator.share({
                title: 'Questions pour un Champion',
                text: `Rejoignez ma partie avec le code ${code}`,
                url: `${window.location.origin}/play?code=${encodeURIComponent(code)}`
            }).catch(() => {});
        } else if (typeof copyRoomCode === 'function') {
            copyRoomCode();
        }
    };

    window.showHistory = function() {
        // Le modele garde seulement des statistiques globales par joueur,
        // table exists yet), so we surface those honestly rather than faking
        // a match list.
        const p = window.currentPlayer;
        const existing = document.querySelector('.history-overlay');
        if (existing) existing.remove();

        let inner;
        if (!p) {
            inner = `<p class="no-data">Connectez-vous pour suivre vos statistiques de jeu.</p>`;
        } else {
            const played = p.games_played || 0;
            const won = p.games_won || 0;
            const score = p.total_score || 0;
            const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
            inner = `
                <div class="history-list">
                    <div class="history-row">
                        <span class="history-row__result win">â˜…</span>
                        <div class="history-row__meta">
                            <div class="history-row__title">Parties gagnÃ©es</div>
                            <div class="history-row__date">${winRate}% de victoires</div>
                        </div>
                        <span class="history-row__score">${won}</span>
                    </div>
                    <div class="history-row">
                        <span class="history-row__result loss">#</span>
                        <div class="history-row__meta">
                            <div class="history-row__title">Parties jouÃ©es</div>
                            <div class="history-row__date">Au total</div>
                        </div>
                        <span class="history-row__score">${played}</span>
                    </div>
                    <div class="history-row">
                        <span class="history-row__result win">ÃŽÂ£</span>
                        <div class="history-row__meta">
                            <div class="history-row__title">Score cumulÃ©</div>
                            <div class="history-row__date">Toutes parties confondues</div>
                        </div>
                        <span class="history-row__score">${score}</span>
                    </div>
                </div>
                <p class="no-data" style="padding:12px 16px;">L'historique partie par partie arrive bientÃ´t.</p>`;
        }

        const html = `
            <div class="history-overlay" onclick="if(event.target===this)this.remove()">
                <div class="history-modal">
                    <h2>Votre <em>historique</em></h2>
                    ${inner}
                    <button class="btn btn--ghost btn--md" style="width:100%;" onclick="this.closest('.history-overlay').remove()">Fermer</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    window.showHelp = window.showHelp || function() {
        alert('Aide â€” bientÃ´t disponible.');
    };

    // Le lancement depend du nombre de joueurs et de l etat de la salle
    // du nombre de joueurs et de l equilibre des equipes.
    // L interface actuelle ne demande pas de validation Pret avant de lancer.
    // reference resolves to a harmless no-op.
    window.toggleReady = function() {};

    window.leaveLobby = function() {
        // Envoie au serveur que le joueur quitte le lobby, puis ferme la connexion en cours.
        try {
            if (typeof ws !== 'undefined' && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'leaveLobby', userId: (typeof userId !== 'undefined' ? userId : undefined) }));
                ws.close();
            }
        } catch (e) {}
        if (typeof showHome === 'function') showHome();
    };

    window.cancelAILoading = window.cancelAILoading || function() {
        const modal = document.getElementById('aiLoadingModal');
        if (modal) modal.classList.remove('active');
    };


    // Initialisation au chargement de la page

    document.addEventListener('DOMContentLoaded', () => {
        // Affiche les sujets solo dans la nouvelle zone
        setTimeout(() => {
            if (typeof SUBJECTS !== 'undefined') {
                window.renderSubjectsToContainer('soloSubjects');
            }
        }, 100);
    });

})();


/* Fonctions de rendu utilisees par les ecrans de lobby et de fin de partie. */

(function() {
    'use strict';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function avatarFor(name) {
        const gp = window.currentGamePlayers || [];
        const sv = gp.find(p => p.name === name);
        if (sv && sv.avatar && typeof generateAvatarUrl === 'function') return generateAvatarUrl(sv.avatar);
        if (typeof generateAvatarUrlFromName === 'function') {
            try { return generateAvatarUrlFromName(name); } catch (e) {}
        }
        return null;
    }
    function avatarImg(url, name) {
        return url
            ? `<img src="${url}" alt="${esc(name||'')}" onerror="this.style.display='none'">`
            : `<span style="font-size:24px;font-weight:800;">${esc((name||'?').charAt(0).toUpperCase())}</span>`;
    }
    const TINTS = ['coral','sky','mint','amber'];

    /* Le chrono renvoie le nombre visible; l anneau autour est anime par le CSS/DOM. */
    try {
        window.createCircularTimer = function(time) { return String(time); };
    } catch (e) { /* Hors navigateur : on ignore. */ }

    /* Affiche les joueurs du lobby avec leur nom, role, equipe, avatar et etat de demarrage. */
    window.updatePlayers = function(data) {
        const container = document.getElementById('playersList');
        if (!container) return;

        const players = data.players || [];
        const maxPlayers = data.maxPlayers || (data.gameMode === 'team' ? 4 : 4);
        const myName = document.getElementById('createName')?.value ||
                       document.getElementById('joinName')?.value || '';

        container.innerHTML = '';

        players.forEach((player, idx) => {
            const name = typeof player === 'string' ? player : player.name;
            const pIsHost = (typeof player === 'object') && player.isHost;
            const isMe = name === myName;
            const team = (typeof player === 'object') ? player.team : null;
            // Couleur : en equipe on prend la couleur d equipe, sinon une couleur tournante
            const tint = team === 'red' ? 'coral' : team === 'blue' ? 'sky' : TINTS[idx % 4];
            const url = player && player.avatar && typeof generateAvatarUrl === 'function'
                ? generateAvatarUrl(player.avatar)
                : avatarFor(name);

            let seatClass = 'seat';
            if (pIsHost) seatClass += ' is-host';

            const statusIcon = pIsHost
                ? `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M243.81,90.36a16,16,0,0,0-14.79-9.85H184.69L154.13,21.46a16,16,0,0,0-28.26,0L95.31,80.51H50.94A16,16,0,0,0,36.16,90.36a16.16,16.16,0,0,0,3.06,17.46l31.17,32.61L57.13,191.27a16.16,16.16,0,0,0,21,18.65L128,189.62l49.9,20.3a16,16,0,0,0,21.05-18.65L185.61,140.43l31.17-32.61A16.16,16.16,0,0,0,243.81,90.36Z"/></svg>`
                : '';

            const teamLabel = team ? (team === 'red' ? copy(' - Rouge', ' - Red') : copy(' - Bleu', ' - Blue')) : '';
            const hostLabel = label('host', 'Hote', 'Host');
            const youLabel = copy('Vous', 'You');
            const connectedLabel = copy('Connecte', 'Connected');
            const meta = pIsHost ? (isMe ? `${youLabel} - ${hostLabel}` : hostLabel) : (isMe ? youLabel + teamLabel : connectedLabel + teamLabel);
            const seat = document.createElement('div');
            seat.className = seatClass;
            seat.dataset.playerName = name;
            seat.innerHTML = `
                <div class="seat__avatar-wrap">
                    <div class="seat__avatar">${avatarImg(url, name)}</div>
                    <span class="seat__status-dot">${statusIcon}</span>
                </div>
                <div>
                    <div class="seat__name">${esc(name)}</div>
                    <div class="seat__meta">${meta}</div>
                </div>
                ${isMe ? `
                    <button class="seat__mic-btn is-off" id="lobbyMicBtn" onclick="toggleVoiceChat()">
                        <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor"><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176Z"/></svg>
                        ${copy('Activer micro', 'Enable mic')}
                    </button>` : ''}
            `;
            container.appendChild(seat);
        });

        // Places vides
        for (let i = players.length; i < maxPlayers; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat is-empty';
            seat.innerHTML = `
                <div class="seat__empty-icon">
                    <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
                </div>
                <div class="seat__empty-label">${copy('En attente...', 'Waiting...')}</div>`;
            container.appendChild(seat);
        }

        // Infos de format quand elles existent : mode, visibilite, sujets
        const modeEl = document.getElementById('lobbyMode');
        if (modeEl && data.gameMode) modeEl.textContent = data.gameMode === 'team'
            ? copy('En equipe', 'Team mode')
            : copy('Chacun pour soi', 'Free for all');

        // Nombre de joueurs
        const countEl = document.getElementById('lobbyPlayerCount');
        const maxEl = document.getElementById('lobbyPlayerMax');
        if (countEl) countEl.textContent = players.length;
        if (maxEl) maxEl.textContent = maxPlayers;

        // Garde les effets attendus : compteur global et rafraichissement langue
        try { currentLobbyPlayerCount = players.length; } catch (e) {}
        window.currentLobbyPlayerCount = players.length;
        if (typeof updateLobbyPlayerCount === 'function') updateLobbyPlayerCount();

        // Le bouton Lancer apparait seulement pour l hote quand la salle peut commencer.
        // Si canStart manque, on utilise hote + au moins 2 joueurs.
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            let amHost = false;
            try { amHost = (typeof isHost !== 'undefined') ? isHost : false; } catch (e) { amHost = false; }
            // On accepte aussi isHost sur le joueur local.
            if (!amHost) {
                const me = players.find(p => (typeof p === 'object') && p.name === myName);
                if (me && me.isHost) amHost = true;
            }
            const enoughPlayers = players.length >= 2;
            const canStart = ('canStart' in data) ? !!data.canStart : enoughPlayers;
            startBtn.style.display = (amHost && canStart) ? 'inline-flex' : 'none';
        }

        // Message d attente : explique ce qui manque pour lancer selon le mode
        // Cela evite que le bouton de lancement cache paraisse mysterieux.
        const waitEl = document.getElementById('lobbyWaitingMsg');
        if (waitEl) {
            const isTeam = data.gameMode === 'team';
            if (isTeam) {
                const tc = data.teamCounts || { red: 0, blue: 0 };
                if (players.length < 4) {
                    waitEl.textContent = lang() === 'en' ? `Teams: ${tc.red || 0}/2 red - ${tc.blue || 0}/2 blue - 4 players required (2 v 2)` : `Equipes : ${tc.red || 0}/2 rouge - ${tc.blue || 0}/2 bleu - il faut 4 joueurs (2 v 2)`;
                } else {
                    waitEl.textContent = copy('Equipes completes - pret a lancer', 'Teams complete - ready to start');
                }
            } else {
                if (players.length < 2) waitEl.textContent = copy("En attente d'au moins 2 joueurs...", 'Waiting for at least 2 players...');
                else if (players.length < maxPlayers) waitEl.textContent = lang() === 'en' ? `${players.length} player${players.length > 1 ? 's' : ''} - host can start` : `${players.length} joueur${players.length > 1 ? 's' : ''} - l'hote peut lancer`;
                else waitEl.textContent = copy('Salon plein - pret a lancer', 'Room full - ready to start');
            }
        }
    };

    /* Ferme le podium puis affiche l ecran de fin adapte au mode joue. */
    window.closePodium = function() {
        const overlay = document.querySelector('.podium-overlay');
        if (overlay) overlay.remove();

        if (window.podiumIsSolo) {
            renderSoloGameOver();
        } else {
            renderMultiGameOver();
        }
    };

    /* Fonctions de rendu utilisees par les ecrans de lobby et de fin de partie. */
    function renderMultiGameOver() {
        const data = window.multiGameOverData;
        if (typeof showScreen === 'function') showScreen('gameOverScreen');
        if (!data) return;

        const sorted = Object.entries(data.finalScores || {})
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);

        const codeEl = document.getElementById('gameOverRoomCode');
        if (codeEl) codeEl.textContent = data.roomCode || window.currentRoomCode || 'â€”â€”';

        const winnerBox = document.getElementById('winnerBox');
        if (winnerBox) {
            winnerBox.innerHTML = data.winner
                ? `<em>${esc(data.winner)}</em> remporte la partie`
                : esc(data.reason || 'Partie terminÃ©e');
        }

        // Statistiques conservees
        const myName = document.getElementById('createName')?.value ||
                       document.getElementById('joinName')?.value || '';
        if (window.currentPlayer && myName && typeof updatePlayerStats === 'function') {
            const i = sorted.findIndex(p => p.name === myName);
            if (i !== -1) updatePlayerStats(sorted[i].score, i === 0, sorted.length, i + 1);
        }

        renderPodium(sorted);
        renderScoreboard(sorted, data.winner);
        if (typeof createConfetti === 'function') createConfetti(80);
    }

    /* Ferme le podium puis affiche l ecran de fin adapte au mode joue. */
    function renderSoloGameOver() {
        if (typeof showScreen === 'function') showScreen('gameOverScreen');

        const name = document.getElementById('soloName')?.value || 'Joueur';
        const scoreText = document.getElementById('soloScore')?.textContent || '0';
        const score = parseInt(scoreText, 10) || 0;

        const codeEl = document.getElementById('gameOverRoomCode');
        if (codeEl) codeEl.textContent = 'SOLO';

        const winnerBox = document.getElementById('winnerBox');
        if (winnerBox) winnerBox.innerHTML = `<em>${esc(name)}</em> Â· ${score} points`;

        renderPodium([{ name, score }]);
        renderScoreboard([{ name, score }], name);
    }
    window.closePodiumAndShowGameOver = renderSoloGameOver;
    window.closePodiumAndShowMultiGameOver = renderMultiGameOver;

    function renderPodium(sorted) {
        const c = document.getElementById('podiumClubhouse');
        if (!c || !sorted.length) return;
        const order = [sorted[1] || null, sorted[0] || null, sorted[2] || null];
        const spot = ['podium-spot--2','podium-spot--1','podium-spot--3'];
        const rank = ['podium-rank--2','podium-rank--1','podium-rank--3'];
        const num = [2,1,3];
        c.innerHTML = order.map((p,i) => {
            if (!p) return '<div class="podium-spot"></div>';
            const crown = i === 1
                ? `<svg class="podium-crown" width="44" height="44" viewBox="0 0 256 256" fill="currentColor"><path d="M248,80a28,28,0,1,0-51.12,15.77l-26.79,33L146.36,80.27a28,28,0,1,0-36.72,0L86.91,128.74l-26.79-33a28,28,0,1,0-26.15,4.95L48,192H208l13.95-91.31A28,28,0,0,0,248,80Z"/></svg>`
                : '';
            return `
                <div class="podium-spot ${spot[i]}">
                    ${crown}
                    <span class="podium-rank-badge ${rank[i]}">${num[i]}</span>
                    <div class="podium__avatar-wrap"><div class="podium__avatar">${avatarImg(avatarFor(p.name), p.name)}</div></div>
                    <div style="text-align:center;">
                        <div class="podium__name">${esc(p.name)}</div>
                        <div class="podium__score">${p.score}</div>
                    </div>
                    <div class="podium__base"></div>
                </div>`;
        }).join('');
    }

    function renderScoreboard(sorted, winner) {
        const el = document.getElementById('finalScores');
        if (!el) return;
        el.innerHTML = sorted.map((p, idx) => {
            const isWin = idx === 0;
            const tint = TINTS[idx % 4];
            const meta = (isWin && winner === p.name) ? 'CHAMPION(NE)' : `${idx + 1}áµ‰ place`;
            return `
                <div class="sb-row ${isWin ? 'is-winner' : ''}">
                    <span class="sb-row__rank">${idx + 1}</span>
                    <div class="sb-row__player">
                        <span class="mini-av mini-av--${tint}">${avatarImg(avatarFor(p.name), p.name)}</span>
                        <div>
                            <div class="sb-row__name">${esc(p.name)}</div>
                            <div class="sb-row__meta">${meta}</div>
                        </div>
                    </div>
                    <span class="sb-row__stat"><b>â€”</b></span>
                    <span class="sb-row__stat"><b>â€”</b></span>
                    <span class="sb-row__final">${p.score}</span>
                </div>`;
        }).join('');
    }

    /* Met a jour la barre de progression pendant les questions multijoueur. */
    const _prevShowQuestion = window.showQuestion;
    window.showQuestion = function(data) {
        if (typeof _prevShowQuestion === 'function') _prevShowQuestion(data);
        const progress = document.getElementById('progressFill');
        if (progress && data) {
            const perRound = data.questionsPerRound || 5;
            const round = data.round || 1;
            const inRound = data.questionInRound || 1;
            const totalRounds = 3;
            const done = ((round - 1) * perRound) + inRound;
            const total = totalRounds * perRound;
            progress.style.width = `${Math.min(100, (done / total) * 100)}%`;
        }
    };

    /* Gere l ouverture et la fermeture de la carte de connexion/profil. */
    // La carte se ferme avec le bouton, un clic a l exterieur ou la touche Echap.
    window.openAuthCard = function() {
        const card = document.getElementById('authCard');
        if (!card) return;
        card.classList.add('visible');
        if (typeof updateAuthUI === 'function') { try { updateAuthUI(); } catch (e) {} }
    };
    window.closeAuthCard = function() {
        const card = document.getElementById('authCard');
        if (card) card.classList.remove('visible');
    };
    window.toggleAuthCard = function(e) {
        const ev = e || window.event;
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
        const card = document.getElementById('authCard');
        if (!card) return;
        if (card.classList.contains('visible')) window.closeAuthCard();
        else window.openAuthCard();
    };
    // Un clic hors de la carte la ferme.
    document.addEventListener('click', function(e) {
        const card = document.getElementById('authCard');
        if (!card || !card.classList.contains('visible')) return;
        const pill = document.getElementById('profileToggleBtn');
        if (card.contains(e.target) || (pill && pill.contains(e.target))) return;
        window.closeAuthCard();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.closeAuthCard();
    });

    // "Jouer en invitÃ©" was wired to an undefined function. Playing is allowed
    // Le mode invite permet de jouer sans compte avec le nom saisi dans la configuration
    // La carte se ferme et le profil indique Invite
    window.playAsGuest = function() {
        window.isGuest = true;
        const welcome = document.getElementById('welcomeName');
        if (welcome) welcome.textContent = 'InvitÃ©';
        window.closeAuthCard();
    };

    /* Fonctions de rendu utilisees par les ecrans de lobby et de fin de partie. */
    window.createConfetti = function(count) {
        const n = count || 50;
        const colors = ['#9C3B3E', '#FD8585', '#2C673C', '#B2F2BB', '#2A6082', '#A5D8FF', '#FED01B'];
        for (let i = 0; i < n; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti';
            piece.style.left = (Math.random() * 100) + 'vw';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = (Math.random() * 0.5) + 's';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 3500);
        }
    };

    /* Gere l ouverture et la fermeture de la carte de connexion/profil. */
    ['handleLogin', 'handleRegister'].forEach(fnName => {
        const orig = window[fnName];
        if (typeof orig !== 'function') return;
        window[fnName] = async function() {
            const r = await orig.apply(this, arguments);
            // updateAuthUI affiche le profil apres connexion; si currentPlayer existe,
            // si currentPlayer existe, la connexion a reussi et la carte se ferme
            try {
                if (typeof currentPlayer !== 'undefined' && currentPlayer) {
                    if (typeof closeAuthCard === 'function') closeAuthCard();
                }
            } catch (e) {}
            return r;
        };
    });


    /* Valeurs par defaut pour le mode de jeu et la visibilite de la salle. */
    if (!window.selectedRoomVisibility) window.selectedRoomVisibility = 'public';
    if (!window.selectedGameMode) window.selectedGameMode = 'ffa';


    /* Gere le code de salle affiche sur l ecran de creation. */

    function genRoomCode() {
        if (typeof generateRoomCode === 'function') {
            try { return generateRoomCode(); } catch (e) {}
        }
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let c = '';
        for (let i = 0; i < 4; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
        return c;
    }

    function readCreateCode() {
        const el = document.getElementById('createCode');
        if (!el) return '';
        // Fonctionne avec #createCode en input ou en paragraphe.
        const raw = (typeof el.value === 'string' && el.value) ? el.value : (el.textContent || '');
        const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
        return cleaned;
    }

    function ensureRoomCode() {
        const el = document.getElementById('createCode');
        if (!el) return '';
        let code = readCreateCode();
        if (!code || code.length < 4) {
            code = genRoomCode();
            // Ecrit le code dans le type d element present a l ecran.
            if ('value' in el && el.tagName === 'INPUT') el.value = code;
            el.textContent = code;
        }
        window.currentRoomCode = code;
        return code;
    }

    // Genere et affiche le code quand l ecran creation s ouvre.
    const _origShowCreateMulti = window.showCreateMulti;
    window.showCreateMulti = function() {
        if (typeof _origShowCreateMulti === 'function') {
            _origShowCreateMulti();
        } else if (typeof showScreen === 'function') {
            showScreen('createMultiScreen');
        }
        // Selectionne les valeurs visibles par defaut pour le mode et la visibilite.
        if (typeof window.selectGameMode === 'function') {
            window.selectGameMode(window.selectedGameMode || 'ffa');
        }
        if (typeof window.selectVisibility === 'function') {
            window.selectVisibility(window.selectedRoomVisibility || 'public');
        }
        setTimeout(ensureRoomCode, 50);
    };

    // Cree la salle avec le code, le nom, les sujets et le type de quiz choisis.
    const _origCreateRoom = window.createRoom;
    window.createRoom = function() {
        const code = ensureRoomCode();
        const nameEl = document.getElementById('createName');
        const name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            const err = document.getElementById('authError');
            alert(typeof t === 'function' ? t('alertBothFields') : 'Entrez votre nom.');
            if (nameEl) nameEl.focus();
            return;
        }

        // Synchronise les informations de salle utilisees par les autres modules.
        window.currentRoomCode = code;
        try { currentRoomCode = code; } catch (e) {}
        try { gameMode = 'multiplayer'; } catch (e) {}

        const subjects = (typeof getSelectedSubjects === 'function')
            ? getSelectedSubjects('createSubjects') : [];
        const customCategory = document.getElementById('customCategoryInputMulti')?.value.trim();
        const isPublic = (window.selectedRoomVisibility || 'public') === 'public';
        const mode = window.selectedGameMode || 'ffa';
        let quizType = 'classic';
        try { if (selectedQuizType && selectedQuizType.multi) quizType = selectedQuizType.multi; } catch (e) {}

        if (customCategory && typeof createRoomWithAI === 'function') {
            createRoomWithAI(code, name, customCategory);
        } else if (subjects.length > 0 && typeof connectWebSocket === 'function') {
            connectWebSocket(code, name, true, subjects, mode, isPublic, null, null, quizType);
        } else {
            // Si aucun sujet n est choisi, on lance avec tous les sujets disponibles.
            const all = (typeof SUBJECTS !== 'undefined') ? SUBJECTS.slice() : [];
            if (all.length && typeof connectWebSocket === 'function') {
                connectWebSocket(code, name, true, all, mode, isPublic, null, null, quizType);
            } else {
                alert(typeof t === 'function' ? t('alertSubjects') : 'Choisissez au moins un sujet.');
            }
        }
    };

    // Choix du type de quiz sur l ecran creation.
    // Change le type de quiz multijoueur : classique, Speed, Picguess ou Mise.
window.selectMultiQuizType = function(type) {
        try { if (typeof selectedQuizType !== 'undefined') selectedQuizType.multi = type; } catch (e) {}
        window.selectedMultiQuizType = type;
        const buttons = {
            classic: document.getElementById('quizTypeClassic'),
            speed: document.getElementById('quizTypeSpeed'),
            picguess: document.getElementById('quizTypePicguess'),
            wager: document.getElementById('quizTypeWager')
        };
        Object.values(buttons).forEach(el => el && el.classList.remove('is-on'));
        const target = buttons[type] || buttons.classic;
        if (target) target.classList.add('is-on');
        const hint = document.getElementById('quizTypeHint');
        if (hint) {
            const lang = (typeof selectedLanguage !== 'undefined' && selectedLanguage === 'en') ? 'en' : 'fr';
            const hints = {
                fr: {
                    classic: 'Questions classiques au buzzer.',
                    speed: 'Speed simultane : 10 questions, 1 seule manche, tout le monde repond en meme temps. Fait pour les parties tres rapides.',
                    picguess: 'Image mystere : l image se revele pendant le chrono, puis repondez.',
                    wager: 'Mode Mise : chaque joueur mise une partie de ses points, puis tout le monde repond sans buzzer.'
                },
                en: {
                    classic: 'Classic buzzer questions.',
                    speed: 'Simultaneous Speed: 10 questions, 1 round, everyone answers at once. Built for very quick games.',
                    picguess: 'Picguess: the image reveals during the timer, then you answer.',
                    wager: 'Wager: each player stakes points, then everyone answers without a buzzer.'
                }
            };
            hint.textContent = (hints[lang][type] || hints[lang].classic);
        }
    };

})();


/* Fonctions de rendu utilisees par les ecrans de lobby et de fin de partie. */

(function() {
    'use strict';

    /* Lit les sujets selectionnes dans une zone de sujets. */
    window.getSelectedSubjects = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        // Les boutons de sujet contiennent des cases cachees cochees ou non.
        const checks = container.querySelectorAll('input[type="checkbox"]');
        if (checks.length) {
            return Array.from(checks)
                .filter(cb => cb.checked)
                .map(cb => cb.value)
                .filter(Boolean);
        }
        // Lecture alternative si une autre forme de carte sujet est presente.
        return Array.from(container.querySelectorAll('.setup-cat-card.selected'))
            .map(card => card.dataset.subject)
            .filter(Boolean);
    };

    /* Prepare l ecran de jeu multijoueur avec les cartes joueurs, le buzzer et les options. */
    window.initializeGameScreen = function(players, scores = {}) {
        const list = players || window.currentGamePlayers || [];
        if (typeof window.renderPlayerCards === 'function') {
            window.renderPlayerCards(list, scores || {});
        }
        const buzzer = document.getElementById('buzzer');
        if (buzzer) { buzzer.disabled = false; buzzer.classList.remove('buzzed'); }
        const wrap = document.querySelector('.buzzer-wrap');
        if (wrap) wrap.style.display = '';
        const optionsBox = document.getElementById('optionsBox');
        if (optionsBox) optionsBox.style.display = 'none';
    };

    /* Gere l affichage des options : cachees en mode buzzer, visibles en modes simultanes. */
    const _chainShowQuestion = window.showQuestion;
    window.showQuestion = function(data) {
        if (typeof _chainShowQuestion === 'function') _chainShowQuestion(data);

        const quizType = data && data.quizType;
        const isBuzzerless = data && (data.buzzerless || quizType === 'speed');

        // Revelation progressive : options cachees jusqu au buzzer.
        const optionsBox = document.getElementById('optionsBox');
        if (optionsBox) optionsBox.style.display = isBuzzerless ? 'grid' : 'none';
        const wrap = document.querySelector('.buzzer-wrap');
        if (wrap) wrap.style.display = isBuzzerless ? 'none' : '';
        const buzzer = document.getElementById('buzzer');
        if (buzzer) {
            buzzer.disabled = !!isBuzzerless;
            buzzer.classList.remove('buzzed');
            const txt = buzzer.querySelector('.buzzer__text');
            if (txt && typeof t === 'function') txt.textContent = isBuzzerless ? '' : t('buzz');
        }
        if (isBuzzerless) {
            try { canAnswer = true; } catch (e) {}
        }

        // Chrono numerique dans #timer; l anneau est anime par #countdownFill.
        const timerEl = document.getElementById('timer');
        let secs = data && data.time ? data.time : 10;
        if (timerEl) timerEl.textContent = secs;
        clearInterval(window._mpTimerInt);
        window._mpTimerInt = setInterval(() => {
            secs--;
            if (timerEl) timerEl.textContent = Math.max(0, secs);
            if (secs <= 0) clearInterval(window._mpTimerInt);
        }, 1000);
    };

    /* Construit des boutons de reponse colores a partir d une liste de textes. */
    const OPT_LETTERS = ['A', 'B', 'C', 'D'];
    const OPT_VARIANTS = ['option--a', 'option--b', 'option--c', 'option--d'];
    // Construit les boutons de reponse colores utilises par plusieurs modes.
function paintColoredOptions(box, items, onClick, letterFor) {
        box.innerHTML = '';
        box.style.display = 'grid';
        items.forEach((label, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option ' + OPT_VARIANTS[idx % 4];
            btn.style.animationDelay = (idx * 0.06) + 's';
            const letter = document.createElement('span');
            letter.className = 'option__letter';
            letter.textContent = letterFor ? letterFor(idx, label) : OPT_LETTERS[idx % 4];
            const text = document.createElement('span');
            text.className = 'option__text';
            text.textContent = label;
            btn.append(letter, text);
            btn.onclick = () => onClick(idx);
            box.appendChild(btn);
        });
    }

    /* Quand un joueur buzz, le buzzer disparait et les choix de reponse apparaissent. */
    const _chainHandleBuzzed = window.handleBuzzed;
    window.handleBuzzed = function(data) {
        const wrap = document.querySelector('.buzzer-wrap');
        if (wrap) wrap.style.display = 'none';

        const box = document.getElementById('optionsBox');
        if (box) {
            // Si les boutons ne sont pas encore presents, on les construit ici.
            if (!box.querySelector('.option')) {
                let q = null;
                try { q = (typeof currentMultiQuestion !== 'undefined') ? currentMultiQuestion : null; } catch (e) {}
                if (q && Array.isArray(q.options)) {
                    paintColoredOptions(box, q.options,
                        (idx) => { if (typeof answerQuestion === 'function') answerQuestion(idx); });
                }
            }
            box.style.display = 'grid';
            box.querySelectorAll('.option').forEach(opt => {
                opt.style.opacity = '1';
                opt.style.visibility = 'visible';
            });
        }

        try { if (typeof _chainHandleBuzzed === 'function') _chainHandleBuzzed(data); }
        catch (e) { console.error('handleBuzzed a echoue:', e); }
    };

    /* Apres une reponse, colore la bonne option et la mauvaise option choisie si besoin. */
    const _chainShowResult = window.showResult;
    window.showResult = function(data) {
        clearInterval(window._mpTimerInt);
        if (typeof _chainShowResult === 'function') _chainShowResult(data);

        const optionsBox = document.getElementById('optionsBox');
        if (!optionsBox) return;
        optionsBox.style.display = 'grid';
        const wrap = document.querySelector('.buzzer-wrap');
        if (wrap) wrap.style.display = 'none';

        optionsBox.querySelectorAll('.option').forEach((opt, idx) => {
            opt.onclick = null;
            const label = opt.querySelector('.option__text');
            const text = (label ? label.textContent : opt.textContent || '').trim();
            if (data && data.answer && (text === data.answer || text.includes(data.answer))) {
                opt.classList.add('correct');
            }
            if (data && !data.correct && data.selectedIdx !== undefined && idx === data.selectedIdx) {
                opt.classList.add('wrong');
            }
        });
    };

    /* Donne au mode solo le meme style de boutons de reponse que le multijoueur. */
    const _chainSoloQuestion = window.showNextSoloQuestion;
    window.showNextSoloQuestion = function() {
        if (typeof _chainSoloQuestion === 'function') _chainSoloQuestion.apply(this, arguments);

        const box = document.getElementById('soloOptionsBox');
        if (box) {
            const existing = Array.from(box.children);
            const items = existing.map(el => {
                const t = el.querySelector('.option__text');
                return (t ? t.textContent : el.textContent || '')
                    .replace(/^[Ã¢Å“â€¦Ã¢ÂÅ’]\s*/, '').trim();
            }).filter(s => s.length);
            if (items.length) {
                // En Vrai/Faux, la lettre du bouton sert de repere visuel
                const isTF = items.length === 2 &&
                    items.every(s => /vrai|faux|Ã¢Å“â€¦|Ã¢ÂÅ’/i.test(s));
                paintColoredOptions(box, items,
                    (idx) => { if (typeof handleSoloAnswer === 'function') handleSoloAnswer(idx); },
                    isTF ? (idx) => (idx === 0 ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’') : null);
            }
        }

        // La pastille garde seulement le numero pour eviter un titre trop long.
        const num = document.getElementById('soloQuestionNumber');
        const badgeVal = document.querySelector('#soloQuestionBadge .question-value');
        if (num && badgeVal) num.textContent = badgeVal.textContent;
    };

    /* Ouvre/ferme la selection des sujets sur l ecran de creation de salle. */
    function updateCreateSubjectsCount() {
        const label = document.getElementById('createSubjectsCount');
        if (!label) return;
        const sel = (typeof getSelectedSubjects === 'function') ? getSelectedSubjects('createSubjects') : [];
        const total = (typeof SUBJECTS !== 'undefined') ? SUBJECTS.length : sel.length;
        if (!sel.length) label.textContent = 'Aucun sujet';
        else if (sel.length >= total) label.textContent = 'Tous les sujets';
        else label.textContent = sel.length + ' sujet' + (sel.length > 1 ? 's' : '');
    }

    window.openSubjectsPicker = function() {
        const box = document.getElementById('createSubjects');
        if (!box) return;
        // Verifie que les boutons de sujets existent, une seule fois.
        if (!box.querySelector('.subject-pill') && typeof renderSubjectsToContainer === 'function') {
            renderSubjectsToContainer('createSubjects');
        }
        box.classList.toggle('hidden');
        // Le resume se met a jour quand un sujet est coche ou decoche.
        if (!box.dataset.countWired) {
            box.addEventListener('click', () => setTimeout(updateCreateSubjectsCount, 0));
            box.dataset.countWired = '1';
        }
        updateCreateSubjectsCount();
        const btn = document.querySelector('.row-block__action');
        if (btn) btn.textContent = box.classList.contains('hidden') ? 'Modifier' : 'Terminer';
    };

    // Garde le compteur de sujets correct apres le rendu.
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateCreateSubjectsCount, 400);
    });

    /* Permet d utiliser la barre espace comme raccourci pour buzzer. */
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Spacebar') return;
        const el = e.target;
        const tag = (el && el.tagName) || '';
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (el && el.isContentEditable)) return;
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen || !gameScreen.classList.contains('active')) return;
        const buzzer = document.getElementById('buzzer');
        if (!buzzer || buzzer.disabled) return;
        e.preventDefault();
        if (typeof buzzerPressed === 'function') buzzerPressed();
    });

})();


/* ============================================================
   Mode Mise

   Ce bloc gere l interface du mode Mise.
   Avant chaque question, chaque joueur choisit une mise.
   Ensuite tout le monde repond en meme temps, sans buzzer.
   Le resultat affiche les gains, les pertes et les scores.
   ============================================================ */
(function() {
    'use strict';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function myName() {
        return document.getElementById('createName')?.value ||
               document.getElementById('joinName')?.value || '';
    }
    function creds() {
        let uid = null, tok = null;
        try { uid = (typeof userId !== 'undefined') ? userId : null; } catch (e) {}
        try { tok = (typeof matchToken !== 'undefined') ? matchToken : null; } catch (e) {}
        return { uid, tok };
    }
    function send(obj) {
        try {
            if (typeof ws !== 'undefined' && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(obj));
            }
        } catch (e) {}
    }
    function ensureGameScreen() {
        const gs = document.getElementById('gameScreen');
        if (gs && !gs.classList.contains('active') && typeof showScreen === 'function') showScreen('gameScreen');
    }
    function removeWagerOverlay() { const o = document.getElementById('wagerOverlay'); if (o) o.remove(); }

    let myWager = 0;

    // Premiere etape du mode Mise : chaque joueur choisit combien il risque.
function showWagerPhase(d) {
        ensureGameScreen();
        removeWagerOverlay();
        clearInterval(window._wagerTimerInt);
        const mine = (d.maxWagers && typeof d.maxWagers[myName()] === 'number') ? d.maxWagers[myName()] : 0;
        const max = Math.max(0, mine);            // le joueur peut miser au maximum ses points actuels
        const bank = (d.scores && typeof d.scores[myName()] === 'number') ? d.scores[myName()] : max;
        const step = Math.max(1, Math.min(10, Math.floor(max / 20) || 1));
        const mult = d.winMultiplier || 2;
        const base = (d.base != null) ? d.base : 50;
        const lang = selectedLanguage === 'en' ? 'en' : 'fr';
        const copy = {
            fr: {
                round: 'Manche',
                question: 'Question',
                title: 'Choisissez votre',
                em: 'mise',
                sub: `Banque: <b>${bank}</b> | Correct: <b>+${base} + ${mult}x mise</b> | Faux: <b>-mise</b>`,
                safe: 'Sure',
                half: 'MoitiÃ©',
                all: `Tout (${max})`,
                confirm: 'Verrouiller la mise',
                hint: 'La question arrive quand tout le monde a mise.',
                diffs: { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' }
            },
            en: {
                round: 'Round',
                question: 'Question',
                title: 'Choose your',
                em: 'wager',
                sub: `Bank: <b>${bank}</b> | Correct: <b>+${base} + ${mult}x wager</b> | Wrong: <b>-wager</b>`,
                safe: 'Safe',
                half: 'Half',
                all: `All (${max})`,
                confirm: 'Lock wager',
                hint: 'The question starts when every player has wagered.',
                diffs: { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
            }
        }[lang];
        const diffLabel = copy.diffs[d.difficulty] || '';
        myWager = 0;

        const o = document.createElement('div');
        o.id = 'wagerOverlay';
        o.className = 'wager-overlay';
        o.innerHTML = `
            <div class="wager-card">
                <div class="wager-card__lbl">${copy.round} ${d.round || 1}${diffLabel ? ' | ' + diffLabel : ''} | ${copy.question} ${d.questionInRound || ''}/${d.questionsPerRound || ''}</div>
                <h2 class="wager-card__title">${copy.title} <em>${copy.em}</em></h2>
                <p class="wager-card__sub">${copy.sub}</p>
                <div class="wager-amount" id="wagerAmount">0</div>
                <input type="range" id="wagerSlider" class="wager-slider" min="0" max="${max}" step="${step}" value="0">
                <div class="wager-quick">
                    <button type="button" data-w="0">${copy.safe}</button>
                    <button type="button" data-w="half">${copy.half}</button>
                    <button type="button" data-w="max">${copy.all}</button>
                </div>
                <div class="wager-timer" id="wagerTimerLbl">${d.wagerTime || 15}s</div>
                <p class="wager-card__note">${copy.hint}</p>
                <button class="btn btn--primary btn--lg" id="wagerConfirm" style="width:100%;">${copy.confirm}</button>
            </div>`;
        document.body.appendChild(o);

        const slider = o.querySelector('#wagerSlider');
        const amt = o.querySelector('#wagerAmount');
        const setVal = (v) => { v = Math.max(0, Math.min(max, Math.round(v))); slider.value = v; amt.textContent = v; myWager = v; };
        slider.addEventListener('input', () => setVal(parseInt(slider.value, 10) || 0));
        o.querySelectorAll('.wager-quick button').forEach(b => b.addEventListener('click', () => {
            const w = b.dataset.w;
            setVal(w === 'max' ? max : w === 'half' ? Math.round(max / 2) : 0);
        }));
        o.querySelector('#wagerConfirm').addEventListener('click', () => {
            const c = creds(); send({ action: 'wager', userId: c.uid, matchToken: c.tok, amount: myWager });
        });

        let secs = d.wagerTime || 15;
        const lbl = o.querySelector('#wagerTimerLbl');
        clearInterval(window._wagerTimerInt);
        window._wagerTimerInt = setInterval(() => {
            secs--;
            if (lbl) lbl.textContent = Math.max(0, secs) + 's';
            if (secs <= 0) {
                clearInterval(window._wagerTimerInt);
                const c = creds(); send({ action: 'wager', userId: c.uid, matchToken: c.tok, amount: myWager });
            }
        }, 1000);
    }

    function onWagerAccepted(d) {
        myWager = d.amount;
        clearInterval(window._wagerTimerInt);
        const o = document.getElementById('wagerOverlay');
        const card = o && o.querySelector('.wager-card');
        if (card) {
            const isEn = selectedLanguage === 'en';
            card.innerHTML = `
                <div class="wager-card__lbl">${isEn ? 'Wager locked' : 'Mise verrouillee'}</div>
                <h2 class="wager-card__title">${isEn ? 'Wager' : 'Mise'}: <em>${d.amount}</em></h2>
                <p class="wager-card__sub">${isEn ? 'Waiting for the other players...' : 'En attente des autres joueurs...'}</p>
                <div class="wager-spinner"></div>`;
        }
    }

    function buildWagerOptions(box, options) {
        box.innerHTML = '';
        box.style.display = 'grid';
        const letters = ['A', 'B', 'C', 'D'];
        const variants = ['option--a', 'option--b', 'option--c', 'option--d'];
        (options || []).forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option ' + variants[idx % 4];
            btn.style.animationDelay = (idx * 0.06) + 's';
            btn.innerHTML = `<span class="option__letter">${letters[idx % 4]}</span><span class="option__text">${esc(opt)}</span>`;
            btn.onclick = () => sendWagerAnswer(idx, box);
            box.appendChild(btn);
        });
    }

    function sendWagerAnswer(idx, box) {
        const c = creds(); send({ action: 'answer', userId: c.uid, matchToken: c.tok, idx });
        if (box) box.querySelectorAll('.option').forEach((o, i) => {
            o.onclick = null;
            if (i === idx) o.classList.add('option--picked'); else o.style.opacity = '0.5';
        });
    }

    // Deuxieme etape du mode Mise : la question apparait et tout le monde repond.
function showWagerQuestion(d) {
        removeWagerOverlay();
        ensureGameScreen();
        const wrap = document.querySelector('.buzzer-wrap'); if (wrap) wrap.style.display = 'none';

        const qt = document.getElementById('questionText'); if (qt) qt.textContent = d.q;

        const img = document.getElementById('questionImage');
        if (img) {
            if (d.image) { img.style.display = 'block'; const im = img.querySelector('img'); if (im) im.src = d.image; }
            else img.style.display = 'none';
        }

        const badge = document.getElementById('questionBadge');
        if (badge && d.questionInRound) badge.textContent = `Question ${d.questionInRound} / ${d.questionsPerRound || 5}`;

        let ind = document.getElementById('wagerIndicator');
        if (!ind) {
            ind = document.createElement('div'); ind.id = 'wagerIndicator'; ind.className = 'wager-indicator';
            const stage = document.querySelector('#gameScreen .game-stage');
            if (stage) stage.insertBefore(ind, stage.firstChild);
        }
        if (ind) ind.textContent = selectedLanguage === 'en' ? `Wager: ${myWager}` : `Mise : ${myWager}`;

        const box = document.getElementById('optionsBox'); if (box) buildWagerOptions(box, d.options);

        const timerEl = document.getElementById('timer'); let secs = d.time || 15;
        if (timerEl) timerEl.textContent = secs;
        clearInterval(window._wagerTimerInt);
        window._wagerTimerInt = setInterval(() => {
            secs--; if (timerEl) timerEl.textContent = Math.max(0, secs);
            if (secs <= 0) clearInterval(window._wagerTimerInt);
        }, 1000);

        const fill = document.getElementById('countdownFill');
        if (fill && d.time) {
            const total = 314.16;
            fill.style.transition = `stroke-dashoffset ${d.time}s linear`;
            fill.style.strokeDashoffset = '0';
            void fill.getBoundingClientRect();
            fill.style.strokeDashoffset = total;
        }
    }

    function onAnswerLocked(d) {
        const box = document.getElementById('optionsBox');
        if (box) box.querySelectorAll('.option').forEach((o, i) => {
            o.onclick = null;
            if (i === d.idx) o.classList.add('option--picked'); else o.style.opacity = '0.5';
        });
        let qType = null;
        try { qType = currentMultiQuestion && currentMultiQuestion.quizType; } catch (e) {}
        if (qType === 'speed') {
            if (typeof showMessage === 'function') {
                showMessage(selectedLanguage === 'fr' ? 'Reponse verrouillee.' : 'Answer locked.');
            }
            return;
        }
        const ind = document.getElementById('wagerIndicator');
        const suffix = selectedLanguage === 'fr' ? ' Â· reponse verrouillee' : ' Â· answer locked';
        if (ind && !/locked|verrouill/i.test(ind.textContent)) ind.textContent += suffix;
    }

    // Derniere etape du mode Mise : montre les gains/pertes de chaque joueur.
function showWagerResult(d) {
        clearInterval(window._wagerTimerInt);
        removeWagerOverlay();

        const box = document.getElementById('optionsBox');
        if (box) box.querySelectorAll('.option').forEach((o, i) => {
            o.onclick = null;
            if (i === d.correctIdx) o.classList.add('correct');
        });

        if (typeof updateScores === 'function' && d.scores) updateScores(d.scores);
        if (typeof updateTeamScores === 'function' && d.teamScores) updateTeamScores(d.teamScores);

        const rows = Object.entries(d.results || {}).map(([name, r]) => {
            const sign = r.delta > 0 ? '+' : '';
            const cls = r.correct ? 'wr-row--win' : 'wr-row--lose';
            return `<div class="wr-row ${cls}">
                        <span class="wr-name">${esc(name)}</span>
                        <span class="wr-wager">${selectedLanguage === 'en' ? 'wager' : 'mise'} ${r.wager}</span>
                        <span class="wr-delta">${sign}${r.delta}</span>
                    </div>`;
        }).join('');

        const o = document.createElement('div');
        o.id = 'wagerOverlay'; o.className = 'wager-overlay';
        o.innerHTML = `
            <div class="wager-card">
                <div class="wager-card__lbl">${selectedLanguage === 'en' ? 'Correct answer' : 'Bonne reponse'}</div>
                <h2 class="wager-card__title"><em>${esc(d.answer || '')}</em></h2>
                <div class="wr-list">${rows}</div>
            </div>`;
        document.body.appendChild(o);
        const ind = document.getElementById('wagerIndicator'); if (ind) ind.remove();
        setTimeout(() => { const ov = document.getElementById('wagerOverlay'); if (ov) ov.remove(); }, 3800);
    }

    // Synchronisation de la langue de l interface
    // La langue sauvegardee doit etre chargee pour les textes dynamiques
    // et les messages serveur. Par defaut, on utilise le francais.
    // Le bouton de langue reste synchronise avec ce choix.
    function syncLangToggle(lang) {
        const fr = document.getElementById('langFR');
        const en = document.getElementById('langEN');
        [fr, en].forEach(b => b && b.classList.remove('is-on'));
        const target = lang === 'en' ? en : fr;
        if (target) target.classList.add('is-on');
    }
    const _origSelectLanguage = window.selectLanguage;
    window.selectLanguage = function(lang) {
        if (typeof _origSelectLanguage === 'function') {
            _origSelectLanguage(lang);
        } else {
            try { selectedLanguage = lang; } catch (e) {}
            try { localStorage.setItem('triviaLanguage', lang); } catch (e) {}
            if (typeof applyTranslations === 'function') applyTranslations();
        }
        syncLangToggle(lang);
    };
    document.addEventListener('DOMContentLoaded', () => {
        let lang = 'fr';
        try { lang = localStorage.getItem('triviaLanguage') || 'fr'; } catch (e) {}
        try { selectedLanguage = lang; } catch (e) { window.selectedLanguage = lang; }
        syncLangToggle(lang);
        if (typeof applyTranslations === 'function') { try { applyTranslations(); } catch (e) {} }
    });

    // Enregistre les evenements WebSocket du mode Mise dans le routeur central.
    if (typeof window.registerMessageHandler === 'function') {
        const handlerQuestionStandard = typeof window.getMessageHandler === 'function'
            ? window.getMessageHandler('question')
            : null;

        window.registerMessageHandler('wagerPhase', showWagerPhase);
        window.registerMessageHandler('wagerAccepted', onWagerAccepted);
        window.registerMessageHandler('answerLocked', onAnswerLocked);
        window.registerMessageHandler('wagerResult', showWagerResult);
        window.registerMessageHandler('question', (d, msg) => {
            try {
                if (d && d.quizType === 'wager') {
                    showWagerQuestion(d);
                    return;
                }
            } catch (e) {
                console.error('Erreur du gestionnaire Mise:', e);
            }
            if (typeof handlerQuestionStandard === 'function') handlerQuestionStandard(d, msg);
        });
    }

})();
