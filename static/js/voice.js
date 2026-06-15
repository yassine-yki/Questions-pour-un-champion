/*
Resume du fichier :
Ce fichier gere le chat vocal avec Agora : rejoindre/quitter la voix, micro muet, participants et indicateurs de parole.
Il est concu pour ne pas bloquer le jeu si Agora n'est pas disponible.
*/

let agoraClient = null;
let localAudioTrack = null;
let isInVoiceChat = false;
let isMuted = false;
let voiceParticipants = new Map(); // odUserId -> {name, odUserId}

// Prepare Agora pour le chat vocal, si la librairie est disponible.
async function initAgoraClient() {
    if (!window.AgoraRTC) {
        console.error('Agora SDK not loaded');
        return false;
    }
    
    if (!agoraClient) {
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Quand un utilisateur publie son audio (quelqu un rejoint le vocal)
        agoraClient.on('user-published', async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack.play();
                addVoiceParticipant(user.uid, 'Player');
            }
        });
        
        // Quand un utilisateur coupe/retire son audio
        agoraClient.on('user-unpublished', (user) => {
            removeVoiceParticipant(user.uid);
        });
        
        // Quand un utilisateur quitte le vocal
        agoraClient.on('user-left', (user) => {
            removeVoiceParticipant(user.uid);
        });
        
        // Gere l indicateur de volume pour l animation de parole
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

// Bouton principal du vocal : rejoindre ou quitter selon l etat actuel.
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
        
        // Utilise le code de salle comme nom de canal
        const channelName = currentRoomCode || 'default';
        
        // Rejoint le canal (token vide pour les tests, odUserId aleatoire)
        const odUserId = Math.floor(Math.random() * 100000);
        await agoraClient.join(AGORA_APP_ID, channelName, null, odUserId);
        
        // Cree et publie la piste audio locale
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        isInVoiceChat = true;
        isMuted = false;
        
        // Met a jour l interface
        updateVoiceStatus('connected', t('voiceConnected'));
        updateVoiceButtons();
        
        // Ajoute le joueur local aux participants
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
        
        // Met a jour l interface
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

// Affiche les joueurs presents dans le chat vocal.
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

// Nettoie le vocal quand on quitte la partie
function cleanupVoiceChat() {
    if (isInVoiceChat) {
        leaveVoiceChat();
    }
}

// Ajoute le nettoyage quand on revient a l accueil
const originalShowHome = showHome;
showHome = function() {
    cleanupVoiceChat();
    originalShowHome();
};
