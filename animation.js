// animation.js - Sistema de Animações das Peças (Translate e Efeitos Visual)
let activeFloatingClones = [];

function clearActiveAnimations() {
    activeFloatingClones.forEach(clone => {
        if (clone && clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    });
    activeFloatingClones = [];
}

function getGridElement(name) {
    if (!name) return null;
    const cleanName = name.toUpperCase();
    if (cleanName.startsWith('C')) {
        const idx = parseInt(cleanName.substring(1), 10);
        const cards = document.querySelectorAll('#cards-container .card .piece-grid');
        return cards[idx] || null;
    }
    if (cleanName === 'A') return document.getElementById('grid-a');
    if (cleanName === 'B') return document.getElementById('grid-b');
    if (cleanName === 'R0') return document.getElementById('grid-r0');
    if (cleanName === 'P') return document.getElementById('grid-p');
    if (cleanName === 'TARGET') return document.getElementById('grid-target');
    return null;
}

function animatePieceMove(srcName, destName, matrixToMove) {
    return new Promise((resolve) => {
        const srcElem = getGridElement(srcName);
        const destElem = getGridElement(destName);

        if (!srcElem || !destElem || !matrixToMove) {
            resolve();
            return;
        }

        const srcRect = srcElem.getBoundingClientRect();
        const destRect = destElem.getBoundingClientRect();

        // Se os elementos não tiverem dimensão visível, pula a animação
        if (srcRect.width === 0 || destRect.width === 0) {
            resolve();
            return;
        }

        // Som de início do movimento
        if (window.soundManager) {
            window.soundManager.play('move');
        }
        
        setTimeout(() => {
            if (window.soundManager) {
                window.soundManager.play('snap');
            }
        }, 50);
        

        // Cria o elemento clonado voador
        const clone = document.createElement('div');
        clone.className = 'piece-grid floating-piece-grid';
        renderGrid(clone, matrixToMove);

        // Posicionamento absoluto inicial sobre a origem
        clone.style.position = 'fixed';
        clone.style.left = `${srcRect.left-5}px`;
        clone.style.top = `${srcRect.top-5}px`;
        clone.style.zIndex = '9999';
        clone.style.pointerEvents = 'none';

        document.body.appendChild(clone);
        activeFloatingClones.push(clone);

        const deltaX = destRect.left - srcRect.left;
        const deltaY = destRect.top - srcRect.top;
        const scaleX = destRect.width / srcRect.width;
        const scaleY = destRect.height / srcRect.height;

        const animation = clone.animate([
            {
                transform: 'translate(0px, 0px) scale(1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                opacity: 0.95
            },
            {
                transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5 - 25}px) scale(${1 + (scaleX - 1) * 0.5 + 0.08})`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                opacity: 1,
                offset: 0.5
            },
            {
                transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                opacity: 0.95
            }
        ], {
            duration: 320,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            fill: 'forwards'
        });

        animation.onfinish = () => {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
            }
            const index = activeFloatingClones.indexOf(clone);
            if (index > -1) {
                activeFloatingClones.splice(index, 1);
            }
            resolve();
        };
    });
}

function animateNot(destName) {
    return new Promise((resolve) => {
        const destElem = getGridElement(destName);

        if (window.soundManager) {
            window.soundManager.play('not');
        }

        if (!destElem) {
            resolve();
            return;
        }

        const animation = destElem.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.06)', filter: 'brightness(1.6) hue-rotate(90deg)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], {
            duration: 250,
            easing: 'ease-in-out'
        });

        animation.onfinish = () => resolve();
    });
}
