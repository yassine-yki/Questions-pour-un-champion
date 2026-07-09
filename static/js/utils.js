/*
Resume du fichier :
Ce fichier est reserve aux petites fonctions reutilisables.
Il peut accueillir des aides communes comme du formatage, de petits calculs ou des fonctions de securite.
*/

// Fichier reserve aux petits outils partages.
// Ajoutez ici les petites fonctions reutilisables quand elles servent a plusieurs fichiers.

function resetPicguessImageReveal(img) {
    if (!img) return;
    img.dataset.picguessRevealToken = '';
    img.style.transition = '';
    img.style.filter = '';
    img.style.transform = '';
}

function startPicguessImageReveal(img, options = {}) {
    if (!img) return;

    const blurStart = Number(options.blurStart || 20);
    const durationMs = Math.max(1000, Number(options.durationMs || 15000));
    const token = `${Date.now()}-${Math.random()}`;

    img.dataset.picguessRevealToken = token;
    img.style.transition = 'none';
    img.style.filter = `blur(${blurStart}px) brightness(0.72) saturate(0.8)`;
    img.style.transform = 'scale(1.06)';

    // Force the blurred state to become the current layout state before
    // starting the reveal. Cached images otherwise skip straight to clear.
    void img.offsetWidth;

    const reveal = () => {
        if (img.dataset.picguessRevealToken !== token) return;

        img.style.transition = `filter ${durationMs}ms linear, transform ${durationMs}ms linear`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (img.dataset.picguessRevealToken !== token) return;
                img.style.filter = 'blur(0px) brightness(1) saturate(1)';
                img.style.transform = 'scale(1)';
            });
        });
    };

    if (typeof img.decode === 'function') {
        img.decode().then(reveal).catch(reveal);
    } else if (img.complete) {
        reveal();
    } else {
        img.addEventListener('load', reveal, { once: true });
        img.addEventListener('error', reveal, { once: true });
    }
}

window.resetPicguessImageReveal = resetPicguessImageReveal;
window.startPicguessImageReveal = startPicguessImageReveal;
