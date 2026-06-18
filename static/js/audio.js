/*
Resume du fichier :
Ce fichier gere le son du jeu : musiques de theme, effets sonores, volume et boutons audio.
Il garde aussi les reglages audio dans le navigateur.
*/

let audioContext = null;

function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
    } catch(e) {}
}

// Init on first interaction (required by mobile browsers)
['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, function() { initAudio(); }, { once: true });
});

// Joue un petit son court : bonne reponse, erreur, buzzer, etc.
function playSfx(soundName) {
    if (masterMuted) return;
    if (!sfxEnabled) return;
    if (!audioContext) initAudio();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    
    try {
        const vol = (sfxVolume || 50) / 100;
        const t = audioContext.currentTime;
        
        switch(soundName) {
            case 'buzzer': {
                const g = audioContext.createGain();
                g.connect(audioContext.destination);
                g.gain.setValueAtTime(vol * 0.4, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                const o1 = audioContext.createOscillator();
                o1.type = 'square'; o1.frequency.value = 180;
                o1.frequency.exponentialRampToValueAtTime(80, t + 0.2);
                o1.connect(g); o1.start(t); o1.stop(t + 0.25);
                const o2 = audioContext.createOscillator();
                o2.type = 'sawtooth'; o2.frequency.value = 120;
                const g2 = audioContext.createGain();
                g2.connect(audioContext.destination);
                g2.gain.setValueAtTime(vol * 0.2, t);
                g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o2.connect(g2); o2.start(t); o2.stop(t + 0.15);
                break;
            }
            case 'correct': {
                [523, 659, 784].forEach((freq, i) => {
                    const ot = t + i * 0.08;
                    const o = audioContext.createOscillator();
                    const g = audioContext.createGain();
                    o.type = 'sine'; o.frequency.value = freq;
                    g.gain.setValueAtTime(vol * 0.3, ot);
                    g.gain.exponentialRampToValueAtTime(0.001, ot + 0.3);
                    o.connect(g); g.connect(audioContext.destination);
                    o.start(ot); o.stop(ot + 0.3);
                });
                break;
            }
            case 'wrong': {
                const o = audioContext.createOscillator();
                const g = audioContext.createGain();
                o.type = 'sawtooth'; o.frequency.value = 200;
                o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
                g.gain.setValueAtTime(vol * 0.3, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.connect(g); g.connect(audioContext.destination);
                o.start(t); o.stop(t + 0.5);
                break;
            }
            case 'victory': {
                [523, 659, 784, 1047].forEach((freq, i) => {
                    const ot = t + i * 0.12;
                    const o = audioContext.createOscillator();
                    const g = audioContext.createGain();
                    o.type = 'sine'; o.frequency.value = freq;
                    g.gain.setValueAtTime(vol * 0.25, ot);
                    g.gain.exponentialRampToValueAtTime(0.001, ot + 0.5);
                    o.connect(g); g.connect(audioContext.destination);
                    o.start(ot); o.stop(ot + 0.5);
                });
                break;
            }
            case 'tick': {
                const o = audioContext.createOscillator();
                const g = audioContext.createGain();
                o.type = 'sine'; o.frequency.value = 1000;
                g.gain.setValueAtTime(vol * 0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.connect(g); g.connect(audioContext.destination);
                o.start(t); o.stop(t + 0.05);
                break;
            }
            case 'countdown': {
                const o = audioContext.createOscillator();
                const g = audioContext.createGain();
                o.type = 'sine'; o.frequency.value = 440;
                g.gain.setValueAtTime(vol * 0.3, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.connect(g); g.connect(audioContext.destination);
                o.start(t); o.stop(t + 0.15);
                break;
            }
        }
    } catch(e) {}
}


function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem('triviaSfxEnabled', sfxEnabled);
    updateSfxToggleUI();
}

function setSfxVolume(value) {
    sfxVolume = parseInt(value);
    localStorage.setItem('triviaSfxVolume', sfxVolume);
    // Le volume est applique au moment ou les sons sont joues
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

function toggleMasterMute() {
    masterMuted = !masterMuted;
    localStorage.setItem('triviaMasterMuted', masterMuted ? 'true' : 'false');
    if (masterMuted && musicPlayer && isMusicPlaying) {
        musicPlayer.pause();
        isMusicPlaying = false;
    }
    updateMasterMuteUI();
    updateMusicUI();
    updateSfxToggleUI();
}

function updateMasterMuteUI() {
    const muteIcon = document.getElementById('muteIcon');
    const muteBtn = document.getElementById('muteBtn');
    if (muteIcon) muteIcon.textContent = masterMuted ? '🔇' : '🔊';
    if (muteBtn) {
        muteBtn.classList.toggle('is-off', masterMuted);
        muteBtn.classList.toggle('is-on', !masterMuted);
        muteBtn.setAttribute('aria-label', masterMuted ? 'Réactiver le son' : 'Couper le son');
    }
}

function loadThemeMusic(theme) {
    const musicUrl = themeMusicUrls[theme] || themeMusicUrls.neon;
    
    if (musicPlayer) {
        const wasPlaying = isMusicPlaying;
        
        // Met la musique actuelle en pause
        musicPlayer.pause();
        
        // Charge la nouvelle piste
        musicPlayer.src = musicUrl;
        musicPlayer.load();
        
        // Resume if was playing
        if (wasPlaying) {
            musicPlayer.play().catch(e => console.log('Music autoplay prevented:', e));
        }
    }
}

// Active ou coupe la musique de theme choisie.
function toggleMusic() {
    if (masterMuted) {
        masterMuted = false;
        localStorage.setItem('triviaMasterMuted', 'false');
        updateMasterMuteUI();
    }
    if (!musicPlayer) {
        initMusic();
    }
    
    if (isMusicPlaying) {
        musicPlayer.pause();
        isMusicPlaying = false;
        updateMusicUI();
    } else {
        // Verifie que la source audio est bien definie
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
    
    // Change la musique pour suivre le theme
    loadThemeMusic(themeName);
    
    // Lance les effets horreur si ce theme est choisi
    if (themeName === 'horror') {
        startHorrorEffects();
    } else {
        stopHorrorEffects();
    }
}

// ============================================
// EFFETS DU THEME HORREUR
// ============================================

