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
