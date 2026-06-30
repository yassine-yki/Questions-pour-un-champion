/*
Resume du fichier :
Ce fichier s'occupe des appels API cote navigateur : compte joueur, profil,
statistiques, classement et questions IA.

Important :
- Supabase Auth gere les mots de passe et les sessions.
- La table public.players garde seulement le profil de jeu et les statistiques.
*/

// ============================================
// CONFIGURATION SUPABASE
// ============================================

const SUPABASE_URL = 'https://aczqcdgjvwjtalvrzhcz.supabase.co';
// Cle anon publique Supabase. Ne jamais mettre la service-role key dans le navigateur.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenFjZGdqdndqdGFsdnJ6aGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ5NzMsImV4cCI6MjA4NDMyMDk3M30.O8OiZb2bsnpEP6T64hIDfKcJ12dc_CXsOInZvzL_J7o';

const PLAYER_SESSION_KEY = 'playerSession';
const AUTH_SESSION_KEY = 'qpucSupabaseAuthSession';
const AUTH_EMAIL_DOMAIN = 'qpuc.local';

// Joueur actuellement connecte. var garde aussi window.currentPlayer synchronise.
var currentPlayer = null;
window.currentPlayer = currentPlayer;

// ============================================
// OUTILS GENERAUX
// ============================================

function authLang() {
    try { return selectedLanguage === 'en' ? 'en' : 'fr'; } catch (e) {}
    try { return localStorage.getItem('triviaLanguage') === 'en' ? 'en' : 'fr'; } catch (e) {}
    return 'fr';
}

function authCopy(fr, en) {
    return authLang() === 'en' ? en : fr;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function isSupabaseConfigured() {
    return Boolean(
        SUPABASE_URL &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_ANON_KEY.includes('REPLACE_THIS')
    );
}

function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase();
}

function validateUsername(username) {
    if (!username) {
        return authCopy('Entrez un nom utilisateur.', 'Enter a username.');
    }
    if (username.length < 3 || username.length > 20) {
        return authCopy('Le nom doit contenir entre 3 et 20 caracteres.', 'Username must be 3 to 20 characters.');
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
        return authCopy('Utilisez seulement lettres, chiffres, _ ou -.', 'Use only letters, numbers, _ or -.');
    }
    return null;
}

function validatePassword(password, isRegister = false) {
    if (!password) {
        return authCopy('Entrez un mot de passe.', 'Enter a password.');
    }
    if (isRegister && password.length < 8) {
        return authCopy('Le mot de passe doit contenir au moins 8 caracteres.', 'Password must be at least 8 characters.');
    }
    return null;
}

function emailForUsername(username) {
    return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

function normalizePlayer(row) {
    if (!row) return null;
    return {
        ...row,
        games_played: Number(row.games_played || 0),
        games_won: Number(row.games_won || 0),
        total_score: Number(row.total_score || 0),
        highest_score: Number(row.highest_score || 0)
    };
}

function setCurrentPlayer(player) {
    currentPlayer = normalizePlayer(player);
    window.currentPlayer = currentPlayer;

    if (currentPlayer && currentPlayer.avatar_config) {
        try {
            currentAvatar = currentPlayer.avatar_config;
            window.currentAvatar = currentAvatar;
            localStorage.setItem('playerAvatar', JSON.stringify(currentAvatar));
        } catch (e) {}
    }
}

function setAuthError(message, tone = 'error') {
    const authError = document.getElementById('authError');
    if (!authError) return;
    authError.textContent = message || '';
    authError.dataset.tone = tone;
}

function setAuthBusy(formId, busy, label) {
    const button = document.querySelector(`#${formId} button`);
    if (!button) return;
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = Boolean(busy);
    button.textContent = busy ? label : button.dataset.defaultText;
}

function friendlyAuthError(error) {
    const raw = error?.message || String(error || '');
    const msg = raw.toLowerCase();

    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        return authCopy('Nom utilisateur ou mot de passe incorrect.', 'Invalid username or password.');
    }
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate key')) {
        return authCopy('Ce nom utilisateur est deja pris.', 'This username is already taken.');
    }
    if (msg.includes('email not confirmed')) {
        return authCopy('Confirmez le compte dans Supabase ou desactivez la confirmation email pour la demo.', 'Confirm the account in Supabase or disable email confirmation for the demo.');
    }
    if (msg.includes('failed to fetch') || msg.includes('network')) {
        return authCopy('Impossible de joindre Supabase. Verifiez la connexion.', 'Could not reach Supabase. Check the connection.');
    }
    if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
        return authCopy('Les policies Supabase bloquent cette action.', 'Supabase policies are blocking this action.');
    }
    if (msg.includes('schema cache') || msg.includes('auth_user_id')) {
        return authCopy('Le profil fonctionne, mais la table players doit etre migree pour auth_user_id.', 'Profile works, but the players table should be migrated for auth_user_id.');
    }

    return raw || authCopy('Une erreur est survenue.', 'Something went wrong.');
}

async function readSupabaseError(response) {
    const text = await response.text().catch(() => '');
    if (!text) return response.statusText || 'Supabase request failed';
    try {
        const parsed = JSON.parse(text);
        return parsed.error_description || parsed.msg || parsed.message || parsed.details || text;
    } catch (e) {
        return text;
    }
}

function isMissingColumnError(error, columnName) {
    const msg = (error?.message || '').toLowerCase();
    return msg.includes(columnName.toLowerCase()) && (
        msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('could not find')
    );
}

// ============================================
// REQUETES SUPABASE
// ============================================

async function supabaseRequest(endpoint, method = 'GET', body = null, options = {}) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured.');
    }

    const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${options.accessToken || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    };

    if (method === 'POST') {
        headers.Prefer = 'return=representation';
    }

    const request = { method, headers };
    if (body !== null) request.body = JSON.stringify(body);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, request);
    if (!response.ok) {
        throw new Error(await readSupabaseError(response));
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function supabaseAuthRequest(endpoint, method = 'POST', body = null, accessToken = null) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured.');
    }

    const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    };

    const request = { method, headers };
    if (body !== null) request.body = JSON.stringify(body);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, request);
    if (!response.ok) {
        throw new Error(await readSupabaseError(response));
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// ============================================
// SESSION SUPABASE AUTH
// ============================================

function normalizeAuthSession(payload) {
    if (!payload) return null;

    const rawSession = payload.session || (payload.access_token ? payload : null);
    const user = payload.user || rawSession?.user || null;
    if (!rawSession || !rawSession.access_token) {
        return user ? { user } : null;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = rawSession.expires_at || (rawSession.expires_in ? now + rawSession.expires_in : null);

    return {
        access_token: rawSession.access_token,
        refresh_token: rawSession.refresh_token,
        expires_at: expiresAt,
        token_type: rawSession.token_type || 'bearer',
        user
    };
}

function saveAuthSession(session) {
    const normalized = normalizeAuthSession(session);
    if (!normalized?.access_token) return null;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
}

function getStoredAuthSession() {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return null;
    }
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_SESSION_KEY);
}

async function refreshAuthSession() {
    const saved = getStoredAuthSession();
    if (!saved?.refresh_token) return null;

    const payload = await supabaseAuthRequest(
        'token?grant_type=refresh_token',
        'POST',
        { refresh_token: saved.refresh_token }
    );
    return saveAuthSession(payload);
}

async function getValidAuthSession() {
    const saved = getStoredAuthSession();
    if (!saved?.access_token) return null;

    const now = Math.floor(Date.now() / 1000);
    if (saved.expires_at && saved.expires_at - 60 <= now) {
        try {
            return await refreshAuthSession();
        } catch (e) {
            clearAuthSession();
            return null;
        }
    }

    return saved;
}

async function signUpWithPassword(username, password) {
    const payload = await supabaseAuthRequest('signup', 'POST', {
        email: emailForUsername(username),
        password,
        data: { username }
    });

    const session = normalizeAuthSession(payload);
    if (session?.access_token) saveAuthSession(session);

    return {
        user: payload?.user || session?.user || null,
        session
    };
}

async function signInWithPassword(username, password) {
    const payload = await supabaseAuthRequest('token?grant_type=password', 'POST', {
        email: emailForUsername(username),
        password
    });

    const session = saveAuthSession(payload);
    if (!session?.access_token) {
        throw new Error('Invalid login credentials');
    }
    return session;
}

async function signOutOfSupabase() {
    const session = getStoredAuthSession();
    if (!session?.access_token) return;

    try {
        await supabaseAuthRequest('logout', 'POST', null, session.access_token);
    } catch (e) {
        console.warn('Supabase logout failed:', e);
    }
}

// ============================================
// PROFIL JOUEUR
// ============================================

async function checkUsernameExists(username) {
    try {
        const data = await supabaseRequest(
            `players?username=eq.${encodeURIComponent(username)}&select=id&limit=1`
        );
        return Array.isArray(data) && data.length > 0;
    } catch (error) {
        console.warn('Username check failed:', error);
        return false;
    }
}

function buildPlayerProfile(username, authUserId, includeAuthColumn, includeLegacyPasswordColumn) {
    const profile = {
        username,
        avatar_config: (typeof currentAvatar !== 'undefined' && currentAvatar) ? currentAvatar : generateRandomAvatar(),
        games_played: 0,
        games_won: 0,
        total_score: 0,
        highest_score: 0,
        last_seen: new Date().toISOString()
    };

    if (includeAuthColumn && authUserId) {
        profile.auth_user_id = authUserId;
    }

    // Compatibility for the old table if password_hash is still NOT NULL.
    // This is not a password; credentials are now managed by Supabase Auth.
    if (includeLegacyPasswordColumn) {
        profile.password_hash = 'managed_by_supabase_auth';
    }

    return profile;
}

async function insertPlayerProfile(username, authUserId, accessToken) {
    const attempts = [
        { authColumn: true, legacyPasswordColumn: false },
        { authColumn: false, legacyPasswordColumn: false },
        { authColumn: true, legacyPasswordColumn: true },
        { authColumn: false, legacyPasswordColumn: true }
    ];

    let lastError = null;
    for (const attempt of attempts) {
        try {
            const body = buildPlayerProfile(
                username,
                authUserId,
                attempt.authColumn,
                attempt.legacyPasswordColumn
            );
            const data = await supabaseRequest('players', 'POST', body, { accessToken });
            if (Array.isArray(data) && data[0]) return normalizePlayer(data[0]);
        } catch (error) {
            lastError = error;
            const msg = (error?.message || '').toLowerCase();
            if (isMissingColumnError(error, 'auth_user_id')) continue;
            if (msg.includes('password_hash') || msg.includes('null value')) continue;
            if (msg.includes('duplicate key')) throw error;
        }
    }

    throw lastError || new Error('Profile creation failed');
}

async function findProfileByAuthUser(authUserId, accessToken) {
    if (!authUserId) return null;
    try {
        const data = await supabaseRequest(
            `players?auth_user_id=eq.${encodeURIComponent(authUserId)}&select=*&limit=1`,
            'GET',
            null,
            { accessToken }
        );
        return Array.isArray(data) && data[0] ? normalizePlayer(data[0]) : null;
    } catch (error) {
        if (isMissingColumnError(error, 'auth_user_id')) return null;
        throw error;
    }
}

async function findProfileByUsername(username, accessToken = null) {
    if (!username) return null;
    const data = await supabaseRequest(
        `players?username=eq.${encodeURIComponent(username)}&select=*&limit=1`,
        'GET',
        null,
        { accessToken }
    );
    return Array.isArray(data) && data[0] ? normalizePlayer(data[0]) : null;
}

async function bindProfileToAuth(profile, authUserId, accessToken) {
    if (!profile || !authUserId || profile.auth_user_id === authUserId) return profile;

    try {
        await supabaseRequest(
            `players?id=eq.${encodeURIComponent(profile.id)}`,
            'PATCH',
            { auth_user_id: authUserId },
            { accessToken }
        );
        return { ...profile, auth_user_id: authUserId };
    } catch (error) {
        if (isMissingColumnError(error, 'auth_user_id')) return profile;
        console.warn('Could not bind profile to auth user:', error);
        return profile;
    }
}

async function loadProfileForSession(username, session) {
    const accessToken = session?.access_token || null;
    const authUserId = session?.user?.id || null;
    let profile = await findProfileByAuthUser(authUserId, accessToken);

    if (!profile && username) {
        profile = await findProfileByUsername(normalizeUsername(username), accessToken);
    }

    if (!profile && username && authUserId) {
        profile = await insertPlayerProfile(normalizeUsername(username), authUserId, accessToken);
    }

    if (profile) {
        profile = await bindProfileToAuth(profile, authUserId, accessToken);
        setCurrentPlayer(profile);
        savePlayerSession(profile);
    }

    return profile;
}

async function registerPlayer(username, password) {
    const normalized = normalizeUsername(username);
    const usernameError = validateUsername(normalized);
    const passwordError = validatePassword(password, true);

    if (usernameError) return { success: false, error: usernameError };
    if (passwordError) return { success: false, error: passwordError };

    try {
        if (await checkUsernameExists(normalized)) {
            throw new Error('Username already exists');
        }

        const { user, session } = await signUpWithPassword(normalized, password);
        if (!user) throw new Error('Registration failed');

        if (!session?.access_token) {
            return {
                success: false,
                error: authCopy(
                    'Compte cree dans Supabase, mais la confirmation email est activee. Desactivez-la pour la demo username-only.',
                    'Account created in Supabase, but email confirmation is enabled. Disable it for the username-only demo.'
                )
            };
        }

        const profile = await insertPlayerProfile(normalized, user.id, session.access_token);
        setCurrentPlayer(profile);
        savePlayerSession(profile);
        return { success: true, player: profile };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: friendlyAuthError(error) };
    }
}

async function loginPlayer(username, password) {
    const normalized = normalizeUsername(username);
    const usernameError = validateUsername(normalized);
    const passwordError = validatePassword(password, false);

    if (usernameError) return { success: false, error: usernameError };
    if (passwordError) return { success: false, error: passwordError };

    try {
        const session = await signInWithPassword(normalized, password);
        const profile = await loadProfileForSession(normalized, session);
        if (!profile) throw new Error('Player profile not found');
        return { success: true, player: profile };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: friendlyAuthError(error) };
    }
}

function logoutPlayer() {
    signOutOfSupabase();
    setCurrentPlayer(null);
    window.isGuest = false;
    localStorage.removeItem(PLAYER_SESSION_KEY);
    clearAuthSession();
    updateAuthUI();
}

function savePlayerSession(player) {
    if (!player) return;
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({
        id: player.id,
        username: player.username,
        avatar_config: player.avatar_config
    }));
}

async function loadPlayerSession() {
    const session = await getValidAuthSession();
    if (!session?.access_token) {
        localStorage.removeItem(PLAYER_SESSION_KEY);
        setCurrentPlayer(null);
        return false;
    }

    let username = session.user?.user_metadata?.username || '';
    const saved = localStorage.getItem(PLAYER_SESSION_KEY);
    if (saved) {
        try {
            username = JSON.parse(saved).username || username;
        } catch (e) {}
    }

    const profile = await loadProfileForSession(username, session);
    return Boolean(profile);
}

async function updatePlayerProfile(updates) {
    if (!currentPlayer) {
        return { success: false, error: 'Not logged in' };
    }

    try {
        const session = await getValidAuthSession();
        await supabaseRequest(
            `players?id=eq.${encodeURIComponent(currentPlayer.id)}`,
            'PATCH',
            updates,
            { accessToken: session?.access_token || null }
        );

        setCurrentPlayer({ ...currentPlayer, ...updates });
        savePlayerSession(currentPlayer);
        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: friendlyAuthError(error) };
    }
}

async function saveAvatarToSupabase() {
    if (!currentPlayer) return;
    await updatePlayerProfile({ avatar_config: currentAvatar });
}

async function updatePlayerStats(score, won, playersCount, position = null) {
    if (!currentPlayer) return;

    const numericScore = Number(score || 0);
    const currentGames = Number(currentPlayer.games_played || 0);
    const currentWins = Number(currentPlayer.games_won || 0);
    const currentTotal = Number(currentPlayer.total_score || 0);
    const currentBest = Number(currentPlayer.highest_score || 0);

    const updates = {
        games_played: currentGames + 1,
        games_won: won ? currentWins + 1 : currentWins,
        total_score: currentTotal + numericScore,
        highest_score: Math.max(currentBest, numericScore),
        last_seen: new Date().toISOString()
    };

    try {
        const session = await getValidAuthSession();
        await updatePlayerProfile(updates);

        await supabaseRequest('game_history', 'POST', {
            player_id: currentPlayer.id,
            room_code: (typeof currentRoomCode !== 'undefined' && currentRoomCode) ? currentRoomCode : 'solo',
            score: numericScore,
            position: position || (won ? 1 : null),
            players_count: playersCount
        }, { accessToken: session?.access_token || null });

        updateAuthUI();
    } catch (error) {
        console.error('Stats update error:', error);
    }
}

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

// ============================================
// INTERFACE COMPTE
// ============================================

function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const profileAvatar = document.getElementById('profileAvatar');
    const playerStatsDisplay = document.getElementById('playerStatsDisplay');
    const welcomeName = document.getElementById('welcomeName');
    const homeImg = document.getElementById('homeAvatarImg');
    const homeFallback = document.getElementById('homeAvatarFallback');
    const strip = document.getElementById('homeStatsStrip');
    const accountUsername = document.getElementById('accountUsername');
    const accountStats = document.getElementById('accountStats');

    if (currentPlayer) {
        const avatarUrl = currentPlayer.avatar_config
            ? generateAvatarUrl(currentPlayer.avatar_config)
            : generateAvatarUrlFromName(currentPlayer.username);

        if (authSection) authSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = currentPlayer.username;
        if (profileAvatar) {
            profileAvatar.src = avatarUrl;
            profileAvatar.style.display = 'block';
        }
        if (playerStatsDisplay) {
            playerStatsDisplay.innerHTML = `
                <span>${currentPlayer.games_played} parties</span>
                <span>${currentPlayer.games_won} victoires</span>
                <span>${currentPlayer.total_score} pts</span>
            `;
        }

        if (strip) {
            strip.style.display = 'flex';
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            setText('homeStatGames', currentPlayer.games_played);
            setText('homeStatWins', currentPlayer.games_won);
            setText('homeStatScore', currentPlayer.total_score);
            setText('homeStatBest', currentPlayer.highest_score);
        }

        if (welcomeName) welcomeName.textContent = currentPlayer.username;
        if (homeImg) {
            homeImg.src = avatarUrl;
            homeImg.style.display = 'block';
        }
        if (homeFallback) homeFallback.style.display = 'none';
        if (accountUsername) accountUsername.textContent = currentPlayer.username;
        if (accountStats) {
            accountStats.textContent = `${currentPlayer.games_won}/${currentPlayer.games_played} victoires - ${currentPlayer.total_score} pts`;
        }

        const createName = document.getElementById('createName');
        const joinName = document.getElementById('joinName');
        if (createName) createName.value = currentPlayer.username;
        if (joinName) joinName.value = currentPlayer.username;
    } else {
        if (authSection) authSection.style.display = 'flex';
        if (profileSection) profileSection.style.display = 'none';
        if (strip) strip.style.display = 'none';
        if (welcomeName) welcomeName.textContent = window.isGuest ? authCopy('Invite', 'Guest') : authCopy('Se connecter', 'Sign in');
        if (homeImg) {
            homeImg.removeAttribute('src');
            homeImg.style.display = 'none';
        }
        if (homeFallback) homeFallback.style.display = 'block';
        if (accountUsername) accountUsername.textContent = window.isGuest ? authCopy('Invite', 'Guest') : authCopy('Joueur', 'Player');
        if (accountStats) accountStats.textContent = window.isGuest ? authCopy('Session invite', 'Guest session') : '-';
    }
}

function showAuthTab(tab, ev) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');

    tabs.forEach(item => item.classList.remove('active'));
    const target = ev?.target || (tab === 'login' ? tabs[0] : tabs[1]);
    if (target) target.classList.add('active');

    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
    }

    setAuthError('');
}

function updatePasswordStrength(password) {
    const bar = document.getElementById('passwordStrengthBar');
    if (!bar) return;

    const value = String(password || '');
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const colors = ['#B02500', '#B02500', '#D88400', '#2C673C', '#2C673C'];
    bar.style.width = widths[score];
    bar.style.background = colors[score];
}

async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword')?.value;

    const usernameError = validateUsername(normalizeUsername(username));
    const passwordError = validatePassword(password, false);
    if (usernameError || passwordError) {
        setAuthError(usernameError || passwordError);
        return;
    }

    setAuthError(authCopy('Connexion...', 'Signing in...'), 'info');
    setAuthBusy('loginForm', true, authCopy('Connexion...', 'Signing in...'));

    try {
        const result = await loginPlayer(username, password);
        if (result.success) {
            setAuthError('');
            updateAuthUI();
            if (typeof updateAllAvatarDisplays === 'function') updateAllAvatarDisplays();
            if (typeof closeAuthCard === 'function') closeAuthCard();
        } else {
            setAuthError(result.error || authCopy('Connexion impossible.', 'Login failed.'));
        }
    } finally {
        setAuthBusy('loginForm', false);
    }
}

async function handleRegister() {
    const username = document.getElementById('registerUsername')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm')?.value;

    const usernameError = validateUsername(normalizeUsername(username));
    const passwordError = validatePassword(password, true);
    if (usernameError || passwordError) {
        setAuthError(usernameError || passwordError);
        return;
    }

    if (password !== passwordConfirm) {
        setAuthError(authCopy('Les mots de passe ne correspondent pas.', 'Passwords do not match.'));
        return;
    }

    setAuthError(authCopy('Creation du compte...', 'Creating account...'), 'info');
    setAuthBusy('registerForm', true, authCopy('Creation...', 'Creating...'));

    try {
        const result = await registerPlayer(username, password);
        if (result.success) {
            setAuthError('');
            updateAuthUI();
            if (typeof updateAllAvatarDisplays === 'function') updateAllAvatarDisplays();
            if (typeof closeAuthCard === 'function') closeAuthCard();
        } else {
            setAuthError(result.error || authCopy('Inscription impossible.', 'Registration failed.'));
        }
    } finally {
        setAuthBusy('registerForm', false);
    }
}

// ============================================
// CLASSEMENT GLOBAL
// ============================================

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
                <h2>Classement mondial</h2>
                <div class="global-leaderboard-list">
    `;

    if (errorMsg) {
        html += `<p class="no-data">${escapeHtml(errorMsg)}</p>`;
    } else if (leaderboard.length === 0) {
        html += `<p class="no-data">${authCopy("Aucun joueur pour l'instant. Soyez le premier !", 'No players yet. Be the first!')}</p>`;
    } else {
        leaderboard.forEach((player, idx) => {
            const rank = idx < 3 ? ['1', '2', '3'][idx] : `#${idx + 1}`;
            const username = escapeHtml(player.username);
            const avatarUrl = player.avatar_config
                ? generateAvatarUrl(player.avatar_config)
                : generateAvatarUrlFromName(player.username);

            html += `
                <div class="leaderboard-row ${idx < 3 ? 'top-three' : ''}">
                    <span class="lb-rank">${rank}</span>
                    <img src="${avatarUrl}" alt="${username}" class="lb-avatar">
                    <span class="lb-name">${username}</span>
                    <span class="lb-score">${Number(player.total_score || 0)} pts</span>
                    <span class="lb-stats">${Number(player.games_won || 0)}W / ${Number(player.games_played || 0)}G</span>
                </div>
            `;
        });
    }

    html += `
                </div>
                <button class="btn" onclick="closeGlobalLeaderboard()">${authCopy('Fermer', 'Close')}</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

function closeGlobalLeaderboard(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.querySelector('.global-leaderboard-overlay');
    if (overlay) overlay.remove();
}

// ============================================
// SYSTEME D AVATAR DICEBEAR
// ============================================
