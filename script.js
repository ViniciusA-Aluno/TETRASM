// Constantes globais
const GRID_SIZE = 4;
const NUM_CARDS = 4;
document.documentElement.style.setProperty('--grid-size', GRID_SIZE);

// Container principal para renderização dos cards
const cardsContainer = document.getElementById('cards-container');

// Estado global do jogo
const gameState = {
    cards: [null, null, null, null],
    accA: null,
    accB: null,
    stackP: [],
    regR0: null
};

// Cópia para resetar o jogo
let savedGameState = null;

// Função para copiar matriz
function copyMatrix(matrix) {
    if (!matrix) return null;
    return matrix.map(row => [...row]);
}

// Salva o estado inicial antes da execução começar
function saveInitialState() {
    savedGameState = {
        cards: gameState.cards.map(m => copyMatrix(m)),
        accA: copyMatrix(gameState.accA),
        accB: copyMatrix(gameState.accB),
        stackP: gameState.stackP.map(m => copyMatrix(m)),
        regR0: copyMatrix(gameState.regR0)
    };
}

// Restaura o estado inicial salvo
function restoreInitialState() {
    if (!savedGameState) return;
    gameState.cards = savedGameState.cards.map(m => copyMatrix(m));
    gameState.accA = copyMatrix(savedGameState.accA);
    gameState.accB = copyMatrix(savedGameState.accB);
    gameState.stackP = savedGameState.stackP.map(m => copyMatrix(m));
    gameState.regR0 = copyMatrix(savedGameState.regR0);
    renderGame();
}

// Função para gerar uma matriz 4x4 aleatória (com valor customizado para blocos preenchidos)
function generateRandomMatrix(valueForFilled = 1) {
    const matrix = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            // ~40% de chance de preencher a célula
            row.push(Math.random() < 0.4 ? valueForFilled : 0);
        }
        matrix.push(row);
    }
    return matrix;
}

// Renderiza o grid de uma matriz num container específico
function renderGrid(container, matrix) {
    if (!container) return;
    container.innerHTML = '';
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (matrix && matrix[r][c] > 0) {
                const val = matrix[r][c];
                cell.classList.add('filled');
                if (val === 5) {
                    cell.classList.add('gray');
                } else {
                    const hue = ((val - 1) * 45) % 360;
                    cell.style.filter = `hue-rotate(${hue}deg)`;
                }
            }
            container.appendChild(cell);
        }
    }
}

// Renderiza um Card de peça específico
function renderCard(index) {
    const matrix = gameState.cards[index];
    if (!matrix) return;

    const card = document.createElement('div');
    card.classList.add('card');

    const tag = document.createElement('div');
    tag.classList.add('tag');
    tag.textContent = `C${index}`;
    card.appendChild(tag);

    const grid = document.createElement('div');
    grid.classList.add('piece-grid');
    renderGrid(grid, matrix);
    card.appendChild(grid);

    cardsContainer.appendChild(card);
}

// Renderiza a Pilha P (mostra a peça do topo e atualiza o contador)
function renderStack() {
    const gridContainer = document.getElementById('grid-p');
    if (!gridContainer) return;
    
    const topMatrix = gameState.stackP.length > 0 ? gameState.stackP[gameState.stackP.length - 1] : null;
    renderGrid(gridContainer, topMatrix);

    const parent = gridContainer.parentElement;
    let stackCounter = parent.querySelector('.stack-counter');
    if (!stackCounter) {
        stackCounter = document.createElement('div');
        stackCounter.classList.add('stack-counter');
        parent.appendChild(stackCounter);
    }
    
    if (gameState.stackP.length > 0) {
        stackCounter.textContent = `x${gameState.stackP.length}`;
        stackCounter.style.display = 'block';
    } else {
        stackCounter.style.display = 'none';
    }
}

// Renderiza toda a interface do jogo baseada no gameState atual
function renderGame() {
    // Renderiza os cards
    cardsContainer.innerHTML = '';
    for (let i = 0; i < NUM_CARDS; i++) {
        renderCard(i);
    }
    
    // Renderiza acumuladores A e B
    renderGrid(document.getElementById('grid-a'), gameState.accA);
    renderGrid(document.getElementById('grid-b'), gameState.accB);
    
    // Renderiza registrador R0
    renderGrid(document.getElementById('grid-r0'), gameState.regR0);
    
    // Renderiza pilha P
    renderStack();
}

// Inicializa o jogo gerando peças aleatórias e renderizando a UI
function initGame() {
    // C0 a C3 recebem valores de preenchimento de 1 a 4 para cores dinâmicas
    for (let i = 0; i < NUM_CARDS; i++) {
        gameState.cards[i] = generateRandomMatrix(i + 1);
    }
    
    // R0 recebe preenchimento cinza (valor 5)
    gameState.regR0 = generateRandomMatrix(5);
    
    // Zera acumuladores e pilha
    gameState.accA = null;
    gameState.accB = null;
    gameState.stackP = [];
    
    saveInitialState();
    renderGame();
}

// Interpretador de Instruções
function parseInstruction(line) {
    // Remove comentários que começam com ';'
    const code = line.split(';')[0].trim();
    if (code === '') return { type: 'empty' };

    // Comando MOV: MOV destino, origem
    const movRegex = /^mov\s+(\w+)\s*,\s*(\w+)$/i;
    const movMatch = code.match(movRegex);

    if (movMatch) {
        const dest = movMatch[1].toUpperCase();
        const src = movMatch[2].toUpperCase();
        
        const validDest = ['A', 'B', 'R0'];
        const validSrc = ['A', 'B', 'R0', 'C0', 'C1', 'C2', 'C3'];

        if (!validDest.includes(dest)) {
            throw new Error(`Destino inválido: '${dest}'`);
        }
        if (!validSrc.includes(src)) {
            throw new Error(`Origem inválida: '${src}'`);
        }

        return {
            type: 'instruction',
            op: 'MOV',
            dest: dest,
            src: src,
            originalText: code
        };
    }

    // Erro explícito para comandos não suportados
    throw new Error(`Sintaxe incorreta ou comando não suportado: '${code}'`);
}

function executeMov(dest, src) {
    let sourceMatrix = null;
    
    // Pega a matriz de origem
    if (src.startsWith('C')) {
        const idx = parseInt(src.substring(1), 10);
        sourceMatrix = gameState.cards[idx];
    } else if (src === 'A') {
        sourceMatrix = gameState.accA;
    } else if (src === 'B') {
        sourceMatrix = gameState.accB;
    } else if (src === 'R0') {
        sourceMatrix = gameState.regR0;
    }

    const copy = copyMatrix(sourceMatrix);

    // Salva no destino
    if (dest === 'A') {
        gameState.accA = copy;
    } else if (dest === 'B') {
        gameState.accB = copy;
    } else if (dest === 'R0') {
        gameState.regR0 = copy;
    }
}

// Controle de Execução de Código
let isExecutionRunning = false;
let executionTimeoutId = null;
let currentInstructionIndex = 0;
let linesOfCode = [];

function getLinesFromInput() {
    const textarea = document.getElementById('notebook-input');
    return textarea ? textarea.value.split('\n') : [];
}

function scrollToLine(index) {
    const textarea = document.getElementById('notebook-input');
    if (!textarea) return;
    const lineHeight = 24;
    const padding = 18;
    const lineY = padding + (index * lineHeight);
    const visibleHeight = textarea.clientHeight;
    const currentScroll = textarea.scrollTop;

    // Se estiver fora do visor da textarea, dá scroll suave
    if (lineY < currentScroll + lineHeight || lineY > currentScroll + visibleHeight - lineHeight * 2) {
        textarea.scrollTop = lineY - visibleHeight / 2;
    }
}

function updateHighlightPosition(lineIndex) {
    const textarea = document.getElementById('notebook-input');
    const highlight = document.getElementById('line-highlight');
    if (!textarea || !highlight) return;
    
    const lineHeight = 24;
    const padding = 18;
    const lineY = padding + (lineIndex * lineHeight) - textarea.scrollTop;
    
    highlight.style.top = `${lineY}px`;
    
    // Oculta se estiver oculto por scroll
    const textareaHeight = textarea.clientHeight;
    if (lineY < 12 || lineY > textareaHeight - 12) {
        highlight.style.display = 'none';
    } else {
        highlight.style.display = 'block';
    }
}

function stopExecution(completed = true) {
    isExecutionRunning = false;
    currentInstructionIndex = 0;
    
    const highlight = document.getElementById('line-highlight');
    if (highlight) highlight.style.display = 'none';
    
    const runBtn = document.getElementById('btn-run');
    if (runBtn) runBtn.textContent = '▶ Executar';
    
    if (executionTimeoutId) {
        clearTimeout(executionTimeoutId);
        executionTimeoutId = null;
    }
}

function stepExecution() {
    const textarea = document.getElementById('notebook-input');
    const highlight = document.getElementById('line-highlight');
    const status = document.getElementById('notebook-status');
    if (!textarea || !status || !highlight) return;
    
    linesOfCode = getLinesFromInput();
    if (linesOfCode.length === 0 || (linesOfCode.length === 1 && linesOfCode[0].trim() === '')) {
        status.textContent = "Nenhum código encontrado";
        status.className = "notebook-status error";
        return;
    }

    if (currentInstructionIndex === 0 && !isExecutionRunning) {
        saveInitialState();
        isExecutionRunning = true;
        status.className = "notebook-status";
    }

    let executed = false;
    while (currentInstructionIndex < linesOfCode.length && !executed) {
        const lineText = linesOfCode[currentInstructionIndex];
        
        try {
            const parsed = parseInstruction(lineText);
            
            if (parsed.type === 'instruction') {
                highlight.style.display = 'block';
                updateHighlightPosition(currentInstructionIndex);
                scrollToLine(currentInstructionIndex);
                
                if (parsed.op === 'MOV') {
                    executeMov(parsed.dest, parsed.src);
                }
                
                renderGame();
                status.textContent = `Linha ${currentInstructionIndex + 1}: ${parsed.originalText}`;
                status.className = "notebook-status success";
                
                currentInstructionIndex++;
                executed = true;
            } else {
                currentInstructionIndex++;
            }
        } catch (err) {
            highlight.style.display = 'block';
            updateHighlightPosition(currentInstructionIndex);
            scrollToLine(currentInstructionIndex);
            
            status.textContent = `Erro na Linha ${currentInstructionIndex + 1}: ${err.message}`;
            status.className = "notebook-status error";
            
            stopExecution(false);
            return;
        }
    }

    if (currentInstructionIndex >= linesOfCode.length && !executed) {
        status.textContent = "Programa executado com sucesso";
        status.className = "notebook-status success";
        stopExecution(true);
    }
}

function runNextStepAuto() {
    if (!isExecutionRunning) return;
    
    stepExecution();
    
    if (isExecutionRunning && currentInstructionIndex < linesOfCode.length) {
        executionTimeoutId = setTimeout(runNextStepAuto, 300);
    } else if (isExecutionRunning) {
        stopExecution(true);
    }
}

function toggleRun() {
    const runBtn = document.getElementById('btn-run');
    const status = document.getElementById('notebook-status');
    if (!runBtn || !status) return;

    if (isExecutionRunning && executionTimeoutId) {
        // Pausar
        clearTimeout(executionTimeoutId);
        executionTimeoutId = null;
        runBtn.textContent = '▶ Executar';
        status.textContent = "Execução pausada";
        status.className = "notebook-status";
    } else {
        // Executar
        if (currentInstructionIndex === 0) {
            restoreInitialState();
        }
        isExecutionRunning = true;
        runBtn.textContent = '⏸ Pausar';
        runNextStepAuto();
    }
}

function resetExecution() {
    stopExecution();
    
    const isStateModified = JSON.stringify(gameState) !== JSON.stringify(savedGameState);
    const status = document.getElementById('notebook-status');
    
    if (isStateModified) {
        restoreInitialState();
        if (status) {
            status.textContent = "Estado resetado";
            status.className = "notebook-status success";
        }
    } else {
        initGame();
        if (status) {
            status.textContent = "Novas peças geradas";
            status.className = "notebook-status success";
        }
    }
}

// Configura eventos da textarea e botões
function setupNotebookEvents() {
    const btnRun = document.getElementById('btn-run');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const textarea = document.getElementById('notebook-input');

    if (btnRun) btnRun.addEventListener('click', toggleRun);
    if (btnStep) btnStep.addEventListener('click', stepExecution);
    if (btnReset) btnReset.addEventListener('click', resetExecution);
    
    if (textarea) {
        textarea.addEventListener('scroll', () => {
            if (isExecutionRunning && currentInstructionIndex > 0) {
                updateHighlightPosition(currentInstructionIndex - 1);
            }
        });
        
        textarea.addEventListener('input', () => {
            if (isExecutionRunning || currentInstructionIndex > 0) {
                stopExecution();
                const status = document.getElementById('notebook-status');
                if (status) {
                    status.textContent = "Código alterado. Pronto.";
                    status.className = "notebook-status";
                }
            }
        });
    }
}

// Inicializa o jogo e eventos
initGame();
setupNotebookEvents();

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
