/*
Resume du fichier :
Ce fichier gere les avatars : generation, personnalisation, sauvegarde et affichage dans le salle de personnalisation.
Il transforme les choix du joueur en image/avatar visible dans l'interface.
*/

const avatarOptions = {
    skinColor: ['9e5622', 'f5d6c3', 'f2c7a5', 'd4a574', '8d5524', '6d4228', 'ffdbac', 'e8beac'],
    hair: ['short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15', 'short16', 'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10', 'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20', 'long21'],
    hairColor: ['0e0e0e', '3d2314', '5a3825', '85461e', 'a55728', 'b7652c', 'cb8442', 'd9a84a', 'e8c888', 'f4d7a4', 'b55239', 'c93305', '562b00', '796a45', '9a8b6f'],
    eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26'],
    eyebrows: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15'],
    mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26', 'variant27', 'variant28', 'variant29', 'variant30'],
    glasses: ['', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
    earrings: ['', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06'],
    features: ['', 'blush', 'freckles', 'birthmark']
};

const categoryConfig = {
    skinColor: { icon: '🎨', label: { en: 'Skin', fr: 'Peau' }, type: 'color' },
    hair: { icon: '💇', label: { en: 'Hair', fr: 'Cheveux' }, type: 'option' },
    hairColor: { icon: '🎨', label: { en: 'Hair Color', fr: 'Couleur' }, type: 'color' },
    eyes: { icon: 'ðŸ‘ï¸', label: { en: 'Eyes', fr: 'Yeux' }, type: 'option' },
    eyebrows: { icon: '🤨', label: { en: 'Brows', fr: 'Sourcils' }, type: 'option' },
    mouth: { icon: '👄', label: { en: 'Mouth', fr: 'Bouche' }, type: 'option' },
    glasses: { icon: '👓', label: { en: 'Glasses', fr: 'Lunettes' }, type: 'option' },
    earrings: { icon: '💎', label: { en: 'Earrings', fr: 'Boucles' }, type: 'option' },
    features: { icon: '✨', label: { en: 'Features', fr: 'Traits' }, type: 'option' }
};

const skinColorHex = {
    '9e5622': '#9e5622', 'f5d6c3': '#f5d6c3', 'f2c7a5': '#f2c7a5', 'd4a574': '#d4a574',
    '8d5524': '#8d5524', '6d4228': '#6d4228', 'ffdbac': '#ffdbac', 'e8beac': '#e8beac'
};

const hairColorHex = {
    '0e0e0e': '#0e0e0e', '3d2314': '#3d2314', '5a3825': '#5a3825', '85461e': '#85461e',
    'a55728': '#a55728', 'b7652c': '#b7652c', 'cb8442': '#cb8442', 'd9a84a': '#d9a84a',
    'e8c888': '#e8c888', 'f4d7a4': '#f4d7a4', 'b55239': '#b55239', 'c93305': '#c93305',
    '562b00': '#562b00', '796a45': '#796a45', '9a8b6f': '#9a8b6f'
};

var currentAvatar = loadAvatarFromStorage() || generateRandomAvatar();
let currentCategory = 'hair';

function loadAvatarFromStorage() {
    const saved = localStorage.getItem('playerAvatar');
    if (saved) { try { return JSON.parse(saved); } catch (e) { return null; } }
    return null;
}

function saveAvatarToStorage() {
    localStorage.setItem('playerAvatar', JSON.stringify(currentAvatar));
    // Sauvegarde aussi dans Supabase si le joueur est connecte
    if (currentPlayer) {
        saveAvatarToSupabase();
    }
}

function generateRandomAvatar() {
    return {
        skinColor: avatarOptions.skinColor[Math.floor(Math.random() * avatarOptions.skinColor.length)],
        hair: avatarOptions.hair[Math.floor(Math.random() * avatarOptions.hair.length)],
        hairColor: avatarOptions.hairColor[Math.floor(Math.random() * avatarOptions.hairColor.length)],
        eyes: avatarOptions.eyes[Math.floor(Math.random() * avatarOptions.eyes.length)],
        eyebrows: avatarOptions.eyebrows[Math.floor(Math.random() * avatarOptions.eyebrows.length)],
        mouth: avatarOptions.mouth[Math.floor(Math.random() * avatarOptions.mouth.length)],
        glasses: avatarOptions.glasses[Math.floor(Math.random() * 3) === 0 ? Math.floor(Math.random() * avatarOptions.glasses.length) : 0],
        earrings: avatarOptions.earrings[Math.floor(Math.random() * 4) === 0 ? Math.floor(Math.random() * avatarOptions.earrings.length) : 0],
        features: avatarOptions.features[Math.floor(Math.random() * 3) === 0 ? Math.floor(Math.random() * avatarOptions.features.length) : 0]
    };
}

// Construit l URL de l avatar a partir des choix du joueur.
function generateAvatarUrl(options) {
    const opts = options || currentAvatar;
    const params = new URLSearchParams();
    if (opts.skinColor) params.append('skinColor', opts.skinColor);
    if (opts.hair) params.append('hair', opts.hair);
    if (opts.hairColor) params.append('hairColor', opts.hairColor);
    if (opts.eyes) params.append('eyes', opts.eyes);
    if (opts.eyebrows) params.append('eyebrows', opts.eyebrows);
    if (opts.mouth) params.append('mouth', opts.mouth);
    if (opts.glasses) { params.append('glasses', opts.glasses); params.append('glassesProbability', '100'); }
    if (opts.earrings) { params.append('earrings', opts.earrings); params.append('earringsProbability', '100'); }
    if (opts.features) { params.append('features', opts.features); params.append('featuresProbability', '100'); }
    return 'https://api.dicebear.com/7.x/adventurer/svg?' + params.toString();
}

function generateAvatarUrlFromName(name) {
    const seed = name || 'Player';
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}

function updateAllAvatarDisplays() {
    const url = generateAvatarUrl(currentAvatar);
    const homeImg = document.getElementById('homeAvatarImg');
    const dressingImg = document.getElementById('dressingAvatarImg');
    if (homeImg) homeImg.src = url;
    if (dressingImg) dressingImg.src = url;
}

function randomizeAvatar() {
    currentAvatar = generateRandomAvatar();
    updateAllAvatarDisplays();
    showAvatarReaction();
}

function showAvatarReaction() {
    const reactions = ['ðŸ˜', 'ðŸ¤©', 'âœ¨', 'ðŸŽ‰', 'ðŸ’«', 'ðŸŒŸ', 'ðŸ˜Ž', 'ðŸ”¥'];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    const el = document.getElementById('avatarReaction');
    if (el) {
        el.textContent = reaction;
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1500);
    }
}

function saveAvatar() {
    saveAvatarToStorage();
    showAvatarReaction();
    closeDressingRoom();
}

function selectAvatarOption(category, value) {
    currentAvatar[category] = value;
    updateAllAvatarDisplays();
    renderAvatarOptions();
    showAvatarReaction();
}

function openDressingRoom() {
    showScreen('dressingRoomScreen');
    updateAllAvatarDisplays();
    renderCategoryTabs();
    renderAvatarOptions();
}

function closeDressingRoom() {
    showHome();
}

function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;
    
    container.innerHTML = Object.entries(categoryConfig).map(([key, config]) => `
        <div class="avatar-category-tab ${currentCategory === key ? 'active' : ''}" onclick="selectCategory('${key}')">
            <span class="tab-icon">${config.icon}</span>
            <span class="tab-label">${config.label[selectedLanguage] || config.label.en}</span>
        </div>
    `).join('');
}

function selectCategory(category) {
    currentCategory = category;
    renderCategoryTabs();
    renderAvatarOptions();
}

// Affiche les choix de personnalisation dans le salle de personnalisation.
function renderAvatarOptions() {
    const container = document.getElementById('avatarOptionsContainer');
    if (!container) return;
    
    const config = categoryConfig[currentCategory];
    const options = avatarOptions[currentCategory];
    const isColor = config.type === 'color';
    
    let html = '';
    
    if (isColor) {
        const colorMap = currentCategory === 'skinColor' ? skinColorHex : hairColorHex;
        html += `<div class="avatar-color-grid">`;
        options.forEach(opt => {
            const selected = currentAvatar[currentCategory] === opt;
            const hexColor = colorMap[opt] || '#' + opt;
            html += `<button class="avatar-color-btn ${selected ? 'selected' : ''}" 
                style="background-color: ${hexColor};" 
                onclick="selectAvatarOption('${currentCategory}', '${opt}')"
                title="${opt}">
            </button>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="avatar-options-grid">`;
        options.forEach((opt, idx) => {
            const selected = currentAvatar[currentCategory] === opt;
            
            // Genere un apercu de l avatar avec cette option
            const previewAvatar = { ...currentAvatar };
            previewAvatar[currentCategory] = opt;
            const previewUrl = generateAvatarUrl(previewAvatar);
            
            // Libelle special pour l option vide
            const isEmpty = opt === '';
            
            html += `<button class="avatar-option-btn ${selected ? 'selected' : ''}" 
                onclick="selectAvatarOption('${currentCategory}', '${opt}')">
                ${isEmpty ? '<span style="font-size:20px">âŒ</span>' : `<img src="${previewUrl}" alt="${opt || 'None'}" loading="lazy">`}
            </button>`;
        });
        html += `</div>`;
    }
    
    container.innerHTML = html;
}

// ============================================
// PAGE D ACCUEIL
// ============================================

// VERIFICATION DE VERSION - a retirer apres debug


// Initialise le jeu au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialise l affichage de l avatar
    setTimeout(() => {
        if (!currentAvatar) currentAvatar = generateRandomAvatar();
        updateAllAvatarDisplays();
    }, 100);
    
    // Essaie de charger la session sauvegardee
    try {
        await loadPlayerSession();
        updateAuthUI();
    } catch (e) {
        console.log('No saved session');
    }
});

// ============================================
// TRADUCTIONS
// ============================================

