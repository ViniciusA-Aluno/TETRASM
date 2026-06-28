// docking.js - Alternância de lado do Caderno de Comandos (Esquerda / Direita)
const notebookPanel = document.getElementById('notebook-panel');
const btnToggleSide = document.getElementById('btn-toggle-side');

if (btnToggleSide && notebookPanel) {
    btnToggleSide.addEventListener('click', () => {
        const isLeft = notebookPanel.classList.toggle('left-side');
        btnToggleSide.textContent = isLeft ? '>' : '<';
        btnToggleSide.title = isLeft ? 'Mover para Direita' : 'Mover para Esquerda';
    });
}
