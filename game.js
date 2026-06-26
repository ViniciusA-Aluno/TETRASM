// game.js - Lógica do Jogo e Interpretador Assembly
const GRID_SIZE = 4;
const NUM_CARDS = 4;

const gameState = {
    cards: [null, null, null, null],
    accA: null,
    accB: null,
    stackP: [],
    regR0: null
};

let savedGameState = null;

function copyMatrix(matrix) {
    if (!matrix) return null;
    return matrix.map(row => [...row]);
}

function saveInitialState() {
    savedGameState = {
        cards: gameState.cards.map(m => copyMatrix(m)),
        accA: copyMatrix(gameState.accA),
        accB: copyMatrix(gameState.accB),
        stackP: gameState.stackP.map(m => copyMatrix(m)),
        regR0: copyMatrix(gameState.regR0)
    };
}

function restoreInitialState() {
    if (!savedGameState) return;
    gameState.cards = savedGameState.cards.map(m => copyMatrix(m));
    gameState.accA = copyMatrix(savedGameState.accA);
    gameState.accB = copyMatrix(savedGameState.accB);
    gameState.stackP = savedGameState.stackP.map(m => copyMatrix(m));
    gameState.regR0 = copyMatrix(savedGameState.regR0);
}

function generateRandomMatrix(valueForFilled = 1) {
    const matrix = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            row.push(Math.random() < 0.4 ? valueForFilled : 0);
        }
        matrix.push(row);
    }
    return matrix;
}

function parseInstruction(line) {
    const code = line.split(';')[0].trim();
    if (code === '') return { type: 'empty' };

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

    throw new Error(`Sintaxe incorreta ou comando não suportado: '${code}'`);
}

function executeMov(dest, src) {
    let sourceMatrix = null;
    
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

    if (dest === 'A') {
        gameState.accA = copy;
    } else if (dest === 'B') {
        gameState.accB = copy;
    } else if (dest === 'R0') {
        gameState.regR0 = copy;
    }
}
