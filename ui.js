// ui.js - Lógica de Visualização e Renderização da UI
const cardsContainer = document.getElementById('cards-container');

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

function renderGame() {
    cardsContainer.innerHTML = '';
    for (let i = 0; i < NUM_CARDS; i++) {
        renderCard(i);
    }
    
    renderGrid(document.getElementById('grid-a'), gameState.accA);
    renderGrid(document.getElementById('grid-b'), gameState.accB);
    renderGrid(document.getElementById('grid-r0'), gameState.regR0);
    renderStack();
}

function scrollToLine(index) {
    const textarea = document.getElementById('notebook-input');
    if (!textarea) return;
    const lineHeight = 24;
    const padding = 18;
    const lineY = padding + (index * lineHeight);
    const visibleHeight = textarea.clientHeight;
    const currentScroll = textarea.scrollTop;

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
    
    const textareaHeight = textarea.clientHeight;
    if (lineY < 12 || lineY > textareaHeight - 12) {
        highlight.style.display = 'none';
    } else {
        highlight.style.display = 'block';
    }
}

function setHighlightVisible(visible) {
    const highlight = document.getElementById('line-highlight');
    if (highlight) {
        highlight.style.display = visible ? 'block' : 'none';
    }
}

function updateStatus(text, type = '') {
    const status = document.getElementById('notebook-status');
    if (!status) return;
    status.textContent = text;
    status.className = 'notebook-status';
    if (type) {
        status.classList.add(type);
    }
}
