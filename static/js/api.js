/*
Resume du fichier :
Ce fichier s'occupe des appels API cote navigateur : profil joueur, connexion, statistiques, classement et questions IA.
Il contient aussi une partie du rendu lie au compte utilisateur et au classement global.
*/

// ============================================
// CONFIGURATION SUPABASE
// ============================================

const SUPABASE_URL = 'https://aczqcdgjvwjtalvrzhcz.supabase.co';
// Note : a remplacer par la cle anon Supabase du tableau de bord.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenFjZGdqdndqdGFsdnJ6aGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ5NzMsImV4cCI6MjA4NDMyMDk3M30.O8OiZb2bsnpEP6T64hIDfKcJ12dc_CXsOInZvzL_J7o';

// Joueur actuellement connecte
let currentPlayer = null;

// Outil pour appeler l API Supabase
// Point central pour parler a Supabase : les autres fonctions passent par ici.
async function supabaseRequest(endpoint, method = 'GET', body = null) {
    // Verifie si Supabase est configure
    if (SUPABASE_ANON_KEY === 'REPLACE_THIS_WITH_YOUR_ACTUAL_KEY') {
        throw new Error('Supabase not configured. Please set your anon key.');
    }
    
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'POST' ? 'return=representation' : undefined
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || 'Request failed');
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error('Supabase error:', error);
        throw error;
    }
}

// ============================================
// CONNEXION ET PROFIL JOUEUR
// ============================================

// Verifie si le nom existe deja
async function checkUsernameExists(username) {
    try {
        const data = await supabaseRequest(`players?username=eq.${encodeURIComponent(username)}&select=id`);
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

// Inscrit un nouveau joueur
async function registerPlayer(username, password) {
    try {
        // Verifie si ce nom est deja pris
        const exists = await checkUsernameExists(username);
        if (exists) {
            throw new Error('Username already taken');
        }
        
        // Hash simple du mot de passe : pour une vraie app, utiliser un hash securise cote serveur
        const passwordHash = await simpleHash(password);
        
        const playerData = {
            username: username,
            password_hash: passwordHash,
            avatar_config: currentAvatar || generateRandomAvatar(),
            games_played: 0,
            games_won: 0,
            total_score: 0,
            highest_score: 0
        };
        
        const data = await supabaseRequest('players', 'POST', playerData);
        
        if (data && data.length > 0) {
            currentPlayer = data[0];
            savePlayerSession(currentPlayer);
            return { success: true, player: currentPlayer };
        }
        throw new Error('Registration failed');
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Connecte un joueur
async function loginPlayer(username, password) {
    try {
        const passwordHash = await simpleHash(password);
        const data = await supabaseRequest(
            `players?username=eq.${encodeURIComponent(username)}&password_hash=eq.${encodeURIComponent(passwordHash)}&select=*`
        );
        
        if (data && data.length > 0) {
            currentPlayer = data[0];
            
            // Met a jour last_seen
            await supabaseRequest(
                `players?id=eq.${currentPlayer.id}`,
                'PATCH',
                { last_seen: new Date().toISOString() }
            );
            
            // Charge l avatar depuis le profil
            if (currentPlayer.avatar_config) {
                currentAvatar = currentPlayer.avatar_config;
                saveAvatarToStorage();
            }
            
            savePlayerSession(currentPlayer);
            return { success: true, player: currentPlayer };
        }
        throw new Error('Invalid username or password');
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Deconnecte le joueur
function logoutPlayer() {
    currentPlayer = null;
    localStorage.removeItem('playerSession');
    updateAuthUI();
}

// Sauvegarde la session joueur dans localStorage
function savePlayerSession(player) {
    localStorage.setItem('playerSession', JSON.stringify({
        id: player.id,
        username: player.username,
        avatar_config: player.avatar_config
    }));
}

// Charge la session joueur depuis localStorage
async function loadPlayerSession() {
    const saved = localStorage.getItem('playerSession');
    if (saved) {
        try {
            const session = JSON.parse(saved);
            // Verifie que la session est encore valide en rechargeant les donnees
            const data = await supabaseRequest(`players?id=eq.${session.id}&select=*`);
            if (data && data.length > 0) {
                currentPlayer = data[0];
                if (currentPlayer.avatar_config) {
                    currentAvatar = currentPlayer.avatar_config;
                }
                return true;
            }
        } catch (e) {
            console.error('Session load error:', e);
        }
    }
    return false;
}

// Met a jour le profil joueur (avatar, etc.)
async function updatePlayerProfile(updates) {
    if (!currentPlayer) return { success: false, error: 'Not logged in' };
    
    try {
        await supabaseRequest(
            `players?id=eq.${currentPlayer.id}`,
            'PATCH',
            updates
        );
        
        // Met a jour l objet joueur local
        Object.assign(currentPlayer, updates);
        savePlayerSession(currentPlayer);
        
        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
    }
}

// Sauvegarde l avatar dans Supabase
async function saveAvatarToSupabase() {
    if (!currentPlayer) return;
    
    await updatePlayerProfile({ avatar_config: currentAvatar });
}

// Met a jour les statistiques apres la partie
async function updatePlayerStats(score, won, playersCount, position = null) {
    if (!currentPlayer) return;
    
    try {
        const updates = {
            games_played: currentPlayer.games_played + 1,
            total_score: currentPlayer.total_score + score,
            last_seen: new Date().toISOString()
        };
        
        if (won) {
            updates.games_won = currentPlayer.games_won + 1;
        }
        
        if (score > currentPlayer.highest_score) {
            updates.highest_score = score;
        }
        
        await updatePlayerProfile(updates);
        
        // Sauvegarde aussi la partie dans l historique
        await supabaseRequest('game_history', 'POST', {
            player_id: currentPlayer.id,
            room_code: currentRoomCode || 'solo',
            score: score,
            position: position || (won ? 1 : null),
            players_count: playersCount
        });
        
        // Met a jour currentPlayer localement
        currentPlayer.games_played = updates.games_played;
        currentPlayer.total_score = updates.total_score;
        if (won) currentPlayer.games_won = updates.games_won;
        if (score > currentPlayer.highest_score) currentPlayer.highest_score = score;
        
        // Rafraichit l interface compte pour afficher les stats
        updateAuthUI();
        
    } catch (error) {
        console.error('Stats update error:', error);
    }
}

// Recupere le classement global
async function getGlobalLeaderboard(limit = 10) {
    try {
        const data = await supabaseRequest(
            `players?select=username,total_score,games_played,games_won,avatar_config&order=total_score.desc&limit=${limit}`
        );
        return data || [];
    } catch (error) {
        console.error('Leaderboard error:', error);
        return [];
    }
}

// Fonction de hash simple : pour une vraie app, utiliser bcrypt ou Argon2 cote serveur
async function simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str + 'quiz_game_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Met a jour l interface selon l etat de connexion
// Met a jour la carte compte/profil selon que le joueur est connecte ou invite.
function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const profileAvatar = document.getElementById('profileAvatar');
    const playerStatsDisplay = document.getElementById('playerStatsDisplay');
    
    if (currentPlayer) {
        if (authSection) authSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = currentPlayer.username;
        if (profileAvatar && currentPlayer.avatar_config) {
            profileAvatar.src = generateAvatarUrl(currentPlayer.avatar_config);
        }
        if (playerStatsDisplay) {
            playerStatsDisplay.innerHTML = `
                <span>ðŸŽ® ${currentPlayer.games_played}</span>
                <span>Ã°Å¸Ââ€  ${currentPlayer.games_won}</span>
                <span>â­ ${currentPlayer.total_score}</span>
            `;
        }
        
        // Met a jour la barre de stats de l accueil
        const strip = document.getElementById('homeStatsStrip');
        if (strip) {
            strip.style.display = 'flex';
            const s = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
            s('homeStatGames', currentPlayer.games_played || 0);
            s('homeStatWins', currentPlayer.games_won || 0);
            s('homeStatScore', currentPlayer.total_score || 0);
            s('homeStatBest', currentPlayer.highest_score || 0);
        }
        
        // Met a jour le nom d accueil
        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName) welcomeName.textContent = currentPlayer.username;
        
        // Pre-fill name fields
        const createName = document.getElementById('createName');
        const joinName = document.getElementById('joinName');
        if (createName) createName.value = currentPlayer.username;
        if (joinName) joinName.value = currentPlayer.username;
    } else {
        if (authSection) authSection.style.display = 'flex';
        if (profileSection) profileSection.style.display = 'none';
        const strip = document.getElementById('homeStatsStrip');
        if (strip) strip.style.display = 'none';
    }
}

// Affiche l onglet connexion/inscription
function showAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
    }
    
    // Efface le message d erreur
    const authError = document.getElementById('authError');
    if (authError) authError.textContent = '';
}

// Gere la connexion
async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const authError = document.getElementById('authError');
    
    if (!username || !password) {
        if (authError) authError.textContent = 'Please fill in all fields';
        return;
    }
    
    if (authError) authError.textContent = 'Logging in...';
    
    const result = await loginPlayer(username, password);
    
    if (result.success) {
        if (authError) authError.textContent = '';
        updateAuthUI();
        updateAllAvatarDisplays();
    } else {
        if (authError) authError.textContent = result.error || 'Login failed';
    }
}

// Gere l inscription
async function handleRegister() {
    const username = document.getElementById('registerUsername')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm')?.value;
    const authError = document.getElementById('authError');
    
    if (!username || !password || !passwordConfirm) {
        if (authError) authError.textContent = 'Please fill in all fields';
        return;
    }
    
    if (username.length < 3) {
        if (authError) authError.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    if (password.length < 4) {
        if (authError) authError.textContent = 'Password must be at least 4 characters';
        return;
    }
    
    if (password !== passwordConfirm) {
        if (authError) authError.textContent = 'Passwords do not match';
        return;
    }
    
    if (authError) authError.textContent = 'Creating account...';
    
    const result = await registerPlayer(username, password);
    
    if (result.success) {
        if (authError) authError.textContent = '';
        updateAuthUI();
        updateAllAvatarDisplays();
    } else {
        if (authError) authError.textContent = result.error || 'Registration failed';
    }
}

// Affiche le classement global
// Affiche le classement global dans une fenetre par-dessus le jeu.
async function showGlobalLeaderboard() {
    let leaderboard = [];
    let errorMsg = null;
    
    try {
        leaderboard = await getGlobalLeaderboard(10);
    } catch (error) {
        errorMsg = error.message;
    }
    
    let html = `
        <div class="global-leaderboard-overlay" onclick="closeGlobalLeaderboard(event)">
            <div class="global-leaderboard-modal" onclick="event.stopPropagation()">
                <h2>Ã°Å¸Ââ€  Classement mondial</h2>
                <div class="global-leaderboard-list">
    `;
    
    if (errorMsg) {
        html += `<p class="no-data">Ã¢Å¡Â Ã¯Â¸Â ${errorMsg}</p>`;
    } else if (leaderboard.length === 0) {
        html += '<p class="no-data">Aucun joueur pour l\'instant. Soyez le premier !</p>';
    } else {
        leaderboard.forEach((player, idx) => {
            const medal = idx === 0 ? 'ðŸ¥‡' : idx === 1 ? 'ðŸ¥ˆ' : idx === 2 ? 'ðŸ¥‰' : `#${idx + 1}`;
            const avatarUrl = player.avatar_config ? generateAvatarUrl(player.avatar_config) : generateAvatarUrlFromName(player.username);
            
            html += `
                <div class="leaderboard-row ${idx < 3 ? 'top-three' : ''}">
                    <span class="lb-rank">${medal}</span>
                    <img src="${avatarUrl}" alt="${player.username}" class="lb-avatar">
                    <span class="lb-name">${player.username}</span>
                    <span class="lb-score">${player.total_score} pts</span>
                    <span class="lb-stats">${player.games_won}W / ${player.games_played}G</span>
                </div>
            `;
        });
    }
    
    html += `
                </div>
                <button class="btn" onclick="closeGlobalLeaderboard()">Fermer</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeGlobalLeaderboard(event) {
    const overlay = document.querySelector('.global-leaderboard-overlay');
    if (overlay) overlay.remove();
}

// ============================================
// SYSTEME D AVATAR DICEBEAR
// ============================================

