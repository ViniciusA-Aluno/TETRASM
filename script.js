// Função para gerar uma matriz 4x4 aleatória (não necessariamente peças de tetris)
function generateRandomMatrix(matrixSize) {
    const matrix = [];
    for (let r = 0; r < matrixSize; r++) {
        const row = [];
        for (let c = 0; c < matrixSize; c++) {
            // ~40% de chance de preencher a célula (valor 1)
            row.push(Math.random() < 0.4 ? 1 : 0);
        }
        matrix.push(row);
    }
    return matrix;
}

// Container principal para renderização dos cards
const cardsContainer = document.getElementById('cards-container');

// Quantidade de cards de teste a serem gerados
const NUM_CARDS = 4;
const GRID_SIZE = 4;
document.documentElement.style.setProperty('--grid-size', GRID_SIZE);

// Função para criar e renderizar um card com sua respectiva matriz
function createPieceCard(index, matrix) {
    // Cria a estrutura do Card
    const card = document.createElement('div');
    card.classList.add('card');

    // Cria a tag C0 - C3 do Card
    const tag = document.createElement('div');
    tag.classList.add('tag');
    tag.textContent = `C${index}`;
    card.appendChild(tag);

    // Grid 4x4 da Peça
    const grid = document.createElement('div');
    grid.classList.add('piece-grid');

    // Define uma variação de matiz baseada no índice do card
    const hue = (index * 45) % 360;

    // Preenche o Grid com as células com base na matriz
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            // Se for 1 na matriz lógica, atribui a classe 'filled' que contém as bordas 3D
            if (matrix[r][c] === 1) {
                cell.classList.add('filled');
                // Aplica a rotação de matiz para variar a cor do bloco vermelho
                cell.style.filter = `hue-rotate(${hue}deg)`;
            }
            
            grid.appendChild(cell);
        }
    }

    card.appendChild(grid);
    cardsContainer.appendChild(card);
}

// Inicia a geração de múltiplos cards de teste
for (let i = 0; i < NUM_CARDS; i++) {
    const randomMatrix = generateRandomMatrix(GRID_SIZE);
    createPieceCard(i, randomMatrix);
}

// Função para inicializar o grid de um registrador com uma matriz aleatória cinza
function initRegister(registerGridId) {
    const gridContainer = document.getElementById(registerGridId);
    gridContainer.classList.add('piece-grid');
    if (!gridContainer) return;
    
    // Limpa se houver algo
    gridContainer.innerHTML = '';
    
    const matrix = generateRandomMatrix(GRID_SIZE);
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (matrix[r][c] === 1) {
                // Adiciona 'filled' e 'gray' para a coloração de ferro/pedra
                cell.classList.add('filled', 'gray');
            }
            
            gridContainer.appendChild(cell);
        }
    }
}

// Inicializa o registrador R0
initRegister('grid-r0');

// ==========================================================================
// ARRASTE, SNAP E ACOPLAMENTO (DOCKING) DO CADERNO DE COMANDOS
// ==========================================================================

const notebookPanel = document.getElementById('notebook-panel');
const notebookHeader = document.getElementById('notebook-header');
const appLayout = document.getElementById('app-layout');
const dockPreview = document.getElementById('dock-preview');

const btnDockLeft = document.getElementById('btn-dock-left');
const btnDockRight = document.getElementById('btn-dock-right');
const btnFloat = document.getElementById('btn-float');

// Posição flutuante padrão (Centralizado verticalmente à direita)
let floatX = window.innerWidth - 420;
let floatY = (window.innerHeight - 480) / 2;
let isDocked = false;

// Inicializa a posição flutuante
function initNotebookPosition() {
    const maxX = window.innerWidth - notebookPanel.offsetWidth;
    const maxY = window.innerHeight - notebookPanel.offsetHeight;
    floatX = Math.max(20, Math.min(floatX, maxX - 20));
    floatY = Math.max(20, Math.min(floatY, maxY - 20));
    
    notebookPanel.style.left = `${floatX}px`;
    notebookPanel.style.top = `${floatY}px`;
}

// Vincula ações dos botões do cabeçalho
btnDockLeft.addEventListener('click', () => dock('left'));
btnDockRight.addEventListener('click', () => dock('right'));
btnFloat.addEventListener('click', () => undock());

function dock(side) {
    isDocked = true;
    appLayout.classList.remove('docked-left', 'docked-right');
    appLayout.classList.add(`docked-${side}`);
    notebookHeader.classList.remove('undocked');
    
    // Reseta propriedades inline para que a flexibilidade do Grid/Flex do layout funcione
    notebookPanel.style.left = '';
    notebookPanel.style.top = '';
    notebookPanel.style.transform = '';
    
    // Controla visibilidade dos botões
    btnDockLeft.style.display = side === 'left' ? 'none' : 'flex';
    btnDockRight.style.display = side === 'right' ? 'none' : 'flex';
    btnFloat.style.display = 'flex';
}

function undock() {
    isDocked = false;
    appLayout.classList.remove('docked-left', 'docked-right');
    notebookHeader.classList.add('undocked')
    
    // Restaura coordenadas da janela flutuante
    notebookPanel.style.left = `${floatX}px`;
    notebookPanel.style.top = `${floatY}px`;
    
    // Controla visibilidade dos botões
    btnDockLeft.style.display = 'flex';
    btnDockRight.style.display = 'flex';
    btnFloat.style.display = 'none';
}

// Mecanismo de drag and drop para a janela flutuante
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
    
    // Evita rolagem da página em mobile enquanto arrasta
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    let x = clientX - startX;
    let y = clientY - startY;
    
    // Restringe movimento às bordas internas da tela
    const maxX = window.innerWidth - notebookPanel.offsetWidth;
    const maxY = window.innerHeight - notebookPanel.offsetHeight;
    
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    notebookPanel.style.left = `${x}px`;
    notebookPanel.style.top = `${y}px`;
    
    // Salva posições flutuantes atuais
    floatX = x;
    floatY = y;
    
    // Feedback visual do Snap nas laterais (tolerância de 80 pixels)
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
    
    // Se o usuário soltar a janela na zona de snap, acopla
    if (dockPreview.classList.contains('show-left')) {
        dock('left');
    } else if (dockPreview.classList.contains('show-right')) {
        dock('right');
    }
    
    dockPreview.className = '';
}

// Redimensionamento inteligente da tela (reposiciona o painel se a janela encolher)
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

// Inicialização de estado
initNotebookPosition();
