/*
Resume du fichier :
Ce fichier affiche les sujets de quiz et gere leur selection.
Il sert aux ecrans solo et creation de salle multijoueur.
*/

// Lance le rendu des sujets aux endroits ou ils sont utilises.
function renderSubjects() {
    const soloScreen = document.getElementById('soloSetupScreen');
    const createScreen = document.getElementById('createMultiScreen');
    // Affiche les sujets dans les deux zones, meme si un ecran n est pas actif
    renderSubjectsToContainer('soloSubjects');
    renderSubjectsToContainer('createSubjects');
}

function renderSubjectsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const subjectEmojis = {
        science: 'ðŸ”¬', history: 'ðŸ›ï¸', geography: 'ðŸŒ', sports: 'âš½',
        music: 'ðŸŽµ', food: 'ðŸ³', tv_shows: 'ðŸ“º', anime: 'ðŸŽŒ',
        image_riddles: 'ðŸ–¼ï¸', flags: 'ðŸ³ï¸', picguess: 'ðŸ”'
    };
    
    const subjectDescs = {
        science: 'Physique, chimie, bio...', history: 'Événements et dates clés',
        geography: 'Pays, capitales, reliefs', sports: 'Football, JO, records',
        music: 'Artistes, genres, hits', food: 'Cuisine du monde entier',
        tv_shows: 'Séries et émissions TV', anime: 'Manga et animation',
        image_riddles: 'Devinez l\'image', flags: 'Drapeaux du monde',
        picguess: 'Image floue → devinez !'
    };
    
    SUBJECTS.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'setup-cat-card selected';
        card.dataset.subject = subject;
        card.innerHTML = `
            <div class="cat-check">✓</div>
            <div class="cat-emoji">${subjectEmojis[subject] || '📚'}</div>
            <div class="cat-name">${t('subjects.' + subject)}</div>
            <div class="cat-desc">${subjectDescs[subject] || ''}</div>
        `;
        card.onclick = () => {
            card.classList.toggle('selected');
        };
        container.appendChild(card);
    });
}

// Retourne seulement les sujets que le joueur a coches/selectionnes.
function getSelectedSubjects(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.setup-cat-card.selected'))
        .map(card => card.dataset.subject)
        .filter(Boolean);
}

function toggleAllSubjects(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = container.querySelectorAll('.setup-cat-card');
    const allSelected = Array.from(cards).every(c => c.classList.contains('selected'));
    cards.forEach(c => {
        if (allSelected) c.classList.remove('selected');
        else c.classList.add('selected');
    });
}

// Etat de difficulte adaptative du mode solo
