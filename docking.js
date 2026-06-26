// docking.js - Drag, Snap e Acoplamento do Painel do Caderno de Comandos
const notebookPanel = document.getElementById('notebook-panel');
const notebookHeader = document.getElementById('notebook-header');
const appLayout = document.getElementById('app-layout');
const dockPreview = document.getElementById('dock-preview');

const btnDockLeft = document.getElementById('btn-dock-left');
const btnDockRight = document.getElementById('btn-dock-right');
const btnFloat = document.getElementById('btn-float');

let floatX = window.innerWidth - 420;
let floatY = (window.innerHeight - 480) / 2;
let isDocked = false;

function initNotebookPosition() {
    const maxX = window.innerWidth - notebookPanel.offsetWidth;
    const maxY = window.innerHeight - notebookPanel.offsetHeight;
    floatX = Math.max(20, Math.min(floatX, maxX - 20));
    floatY = Math.max(20, Math.min(floatY, maxY - 20));
    
    notebookPanel.style.left = `${floatX}px`;
    notebookPanel.style.top = `${floatY}px`;
}

btnDockLeft.addEventListener('click', () => dock('left'));
btnDockRight.addEventListener('click', () => dock('right'));
btnFloat.addEventListener('click', () => undock());

function dock(side) {
    isDocked = true;
    appLayout.classList.remove('docked-left', 'docked-right');
    appLayout.classList.add(`docked-${side}`);
    notebookHeader.classList.remove('undocked');
    
    notebookPanel.style.left = '';
    notebookPanel.style.top = '';
    notebookPanel.style.transform = '';
    
    btnDockLeft.style.display = side === 'left' ? 'none' : 'flex';
    btnDockRight.style.display = side === 'right' ? 'none' : 'flex';
    btnFloat.style.display = 'flex';
}

function undock() {
    isDocked = false;
    appLayout.classList.remove('docked-left', 'docked-right');
    notebookHeader.classList.add('undocked')
    
    notebookPanel.style.left = `${floatX}px`;
    notebookPanel.style.top = `${floatY}px`;
    
    btnDockLeft.style.display = 'flex';
    btnDockRight.style.display = 'flex';
    btnFloat.style.display = 'none';
}

let isDragging = false;
let startX = 0;
let startY = 0;

notebookHeader.addEventListener('mousedown', startDrag);
notebookHeader.addEventListener('touchstart', startDrag, { passive: true });

function startDrag(e) {
    if (isDocked) return;
    
    isDragging = true;
    notebookPanel.classList.add('is-dragging');
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    startX = clientX - notebookPanel.offsetLeft;
    startY = clientY - notebookPanel.offsetTop;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!isDragging) return;
    
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    let x = clientX - startX;
    let y = clientY - startY;
    
    const maxX = window.innerWidth - notebookPanel.offsetWidth;
    const maxY = window.innerHeight - notebookPanel.offsetHeight;
    
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    notebookPanel.style.left = `${x}px`;
    notebookPanel.style.top = `${y}px`;
    
    floatX = x;
    floatY = y;
    
    if (floatX < 80) {
        dockPreview.className = 'show-left';
    } else if (floatX > window.innerWidth - 80 - notebookPanel.offsetWidth) {
        dockPreview.className = 'show-right';
    } else {
        dockPreview.className = '';
    }
}

function stopDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    notebookPanel.classList.remove('is-dragging');
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    if (dockPreview.classList.contains('show-left')) {
        dock('left');
    } else if (dockPreview.classList.contains('show-right')) {
        dock('right');
    }
    
    dockPreview.className = '';
}

window.addEventListener('resize', () => {
    if (!isDocked) {
        const maxX = window.innerWidth - notebookPanel.offsetWidth;
        const maxY = window.innerHeight - notebookPanel.offsetHeight;
        floatX = Math.max(0, Math.min(floatX, maxX));
        floatY = Math.max(0, Math.min(floatY, maxY));
        notebookPanel.style.left = `${floatX}px`;
        notebookPanel.style.top = `${floatY}px`;
    }
});

// Inicialização da posição no carregamento
initNotebookPosition();
