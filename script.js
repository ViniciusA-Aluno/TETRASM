// Função para gerar uma matriz 4x4 aleatória (não necessariamente peças de tetris)
function generateRandomMatrix() {
    const matrix = [];
    for (let r = 0; r < 4; r++) {
        const row = [];
        for (let c = 0; c < 4; c++) {
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
const NUM_CARDS = 8;

// Função para criar e renderizar um card com sua respectiva matriz
function createPieceCard(index, matrix) {
    // Cria a estrutura do Card
    const card = document.createElement('div');
    card.classList.add('card');

    // Grid 4x4 da Peça
    const grid = document.createElement('div');
    grid.classList.add('grid-4x4');

    // Define uma variação de matiz baseada no índice do card
    const hue = (index * 45) % 360;

    // Preenche o Grid com as células com base na matriz
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
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
    const randomMatrix = generateRandomMatrix();
    createPieceCard(i, randomMatrix);
}
