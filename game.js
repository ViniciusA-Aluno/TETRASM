// game.js - Lógica do Jogo e Interpretador Assembly
const GRID_SIZE = 4;
const NUM_CARDS = 4;
document.documentElement.style.setProperty('--grid-size', GRID_SIZE);

const gameState = {
    cards: [null, null, null, null],
    accA: null,
    accB: null,
    stackP: [],
    regR0: null,
    target: null,
    hasWon: false
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
        regR0: copyMatrix(gameState.regR0),
        target: copyMatrix(gameState.target),
        hasWon: false
    };
}

function restoreInitialState() {
    if (!savedGameState) return;
    gameState.cards = savedGameState.cards.map(m => copyMatrix(m));
    gameState.accA = copyMatrix(savedGameState.accA);
    gameState.accB = copyMatrix(savedGameState.accB);
    gameState.stackP = savedGameState.stackP.map(m => copyMatrix(m));
    gameState.regR0 = copyMatrix(savedGameState.regR0);
    gameState.target = copyMatrix(savedGameState.target);
    gameState.hasWon = false;
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

function createEmptyMatrix() {
    const matrix = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            row.push(0);
        }
        matrix.push(row);
    }
    return matrix;
}

function matrixToKey(matrix) {
    if (!matrix) return '';
    return matrix.flat().map(cell => (cell > 0 ? '1' : '0')).join('');
}

function generateSolvableTarget() {
    const minOp = 2;
    const maxOp = 4;

    for (let attempt = 0; attempt < 20; attempt++) {
        const visitedKeys = new Set();
        
        // Adiciona as chaves de todas as cartas iniciais para impedir alvos idênticos a qualquer carta existente
        for (let i = 0; i < NUM_CARDS; i++) {
            if (gameState.cards[i]) {
                visitedKeys.add(matrixToKey(gameState.cards[i]));
            }
        }

        const initialCard = Math.floor(Math.random() * NUM_CARDS);
        let target = copyMatrix(gameState.cards[initialCard]);
        visitedKeys.add(matrixToKey(target));

        let answer = 'Answer (for cheaters and devs):\nMOV A, C' + initialCard + '\n'; // COLA
        
        const targetOpsCount = minOp + Math.floor(Math.random() * (maxOp - minOp + 1));
        let successfulOps = 0;

        for (let i = 0; i < targetOpsCount; i++) {
            let opSuccess = false;
            
            for (let retry = 0; retry < 30; retry++) {
                const op = ['OR', 'AND', 'XOR', 'NOT'][Math.floor(Math.random() * 4)];
                const nextCardIndex = Math.floor(Math.random() * NUM_CARDS);
                const otherCard = gameState.cards[nextCardIndex];

                let nextTarget = createEmptyMatrix();
                if (op === 'NOT') {
                    for (let r = 0; r < GRID_SIZE; r++) {
                        for (let c = 0; c < GRID_SIZE; c++) {
                            nextTarget[r][c] = target[r][c] > 0 ? 0 : 1;
                        }
                    }
                } else {
                    for (let r = 0; r < GRID_SIZE; r++) {
                        for (let c = 0; c < GRID_SIZE; c++) {
                            const valSelf = target[r][c] > 0;
                            const valOther = otherCard[r][c] > 0;
                            let active = false;
                            if (op === 'OR') active = valSelf || valOther;
                            else if (op === 'AND') active = valSelf && valOther;
                            else if (op === 'XOR') active = valSelf !== valOther;
                            
                            nextTarget[r][c] = active ? 1 : 0;
                        }
                    }
                }

                const key = matrixToKey(nextTarget);
                const filledCount = nextTarget.flat().filter(x => x > 0).length;

                // Aceita o passo somente se produzir uma matriz válida que NUNCA foi vista antes
                if (filledCount > 1 && filledCount < 15 && !visitedKeys.has(key)) {
                    visitedKeys.add(key);
                    target = nextTarget;
                    answer += op === 'NOT' ? `${op} A\n` : `${op} A, C${nextCardIndex}\n`;
                    opSuccess = true;
                    successfulOps++;
                    break;
                }
            }

            if (!opSuccess && successfulOps >= minOp) {
                break;
            }
        }

        if (successfulOps >= minOp) {
            answer += 'MOV R0, A\nSYSCALL';
            console.log(answer);

            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; r < GRID_SIZE && c < GRID_SIZE; c++) {
                    if (target[r][c] > 0) {
                        target[r][c] = 6;
                    }
                }
            }
            return target;
        }
    }

    return target;
}

function parseInstruction(line) {
    const code = line.split(';')[0].trim();
    if (code === '') return { type: 'empty' };

    const parts = code.split(/\s+/);
    const op = parts[0].toUpperCase();
    
    const validOps = ['MOV', 'AND', 'OR', 'XOR', 'NOT', 'PUSH', 'POP', 'SYSCALL', 'HELP'];
    if (!validOps.includes(op)) {
        throw new Error(`Comando desconhecido: '${op}'`);
    }

    if (op === 'SYSCALL' || op === 'HELP') {
        if (parts.length > 1) {
            throw new Error(`O comando ${op} não aceita argumentos`);
        }
        return { type: 'instruction', op: op, originalText: code };
    }

    const rest = code.substring(parts[0].length).trim();

    if (op === 'NOT' || op === 'PUSH' || op === 'POP') {
        if (rest === '') {
            throw new Error(`O comando ${op} precisa de um argumento`);
        }
        if (rest.includes(',')) {
            throw new Error(`O comando ${op} aceita apenas um argumento`);
        }
        const arg = rest.toUpperCase();
        
        if (op === 'NOT' || op === 'POP') {
            const validDest = ['A', 'B', 'R0'];
            if (!validDest.includes(arg)) {
                throw new Error(`Argumento inválido para ${op}: '${rest}'. Deve ser A, B ou R0.`);
            }
            return { type: 'instruction', op: op, dest: arg, originalText: code };
        } else {
            // PUSH
            const validSrc = ['A', 'B', 'R0', 'C0', 'C1', 'C2', 'C3'];
            if (!validSrc.includes(arg)) {
                throw new Error(`Argumento inválido para PUSH: '${rest}'. Deve ser A, B, R0, ou C0-C3.`);
            }
            return { type: 'instruction', op: 'PUSH', src: arg, originalText: code };
        }
    }

    if (op === 'MOV' || op === 'AND' || op === 'OR' || op === 'XOR') {
        const commaIndex = rest.indexOf(',');
        if (commaIndex === -1) {
            throw new Error(`O comando ${op} precisa de dois argumentos separados por vírgula (ex: ${op} A, B)`);
        }
        const dest = rest.substring(0, commaIndex).trim().toUpperCase();
        const src = rest.substring(commaIndex + 1).trim().toUpperCase();

        if (dest === '' || src === '') {
            throw new Error(`Argumentos inválidos para ${op}`);
        }

        const validDest = ['A', 'B', 'R0'];
        const validSrc = ['A', 'B', 'R0', 'C0', 'C1', 'C2', 'C3'];

        if (!validDest.includes(dest)) {
            throw new Error(`Destino inválido para ${op}: '${dest}'. Deve ser A, B ou R0.`);
        }
        if (!validSrc.includes(src)) {
            throw new Error(`Origem inválida para ${op}: '${src}'. Deve ser A, B, R0, ou C0-C3.`);
        }

        return {
            type: 'instruction',
            op: op,
            dest: dest,
            src: src,
            originalText: code
        };
    }

    throw new Error(`Erro desconhecido ao processar: '${code}'`);
}

function getMatrixForName(name) {
    if (name.startsWith('C')) {
        const idx = parseInt(name.substring(1), 10);
        return gameState.cards[idx];
    } else if (name === 'A') {
        return gameState.accA;
    } else if (name === 'B') {
        return gameState.accB;
    } else if (name === 'R0') {
        return gameState.regR0;
    }
    return null;
}

function setMatrixForName(name, matrix) {
    const copy = copyMatrix(matrix);
    if (name === 'A') {
        gameState.accA = copy;
    } else if (name === 'B') {
        gameState.accB = copy;
    } else if (name === 'R0') {
        gameState.regR0 = copy;
    }
}

function executeMov(dest, src) {
    const sourceMatrix = getMatrixForName(src);
    setMatrixForName(dest, sourceMatrix);
}

function executeLogical(op, destName, srcName) {
    const destMatrix = getMatrixForName(destName) || createEmptyMatrix();
    const srcMatrix = getMatrixForName(srcName) || createEmptyMatrix();
    
    const result = createEmptyMatrix();
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const valDest = destMatrix[r][c] > 0;
            const valSrc = srcMatrix[r][c] > 0;
            let active = false;
            
            if (op === 'AND') {
                active = valDest && valSrc;
            } else if (op === 'OR') {
                active = valDest || valSrc;
            } else if (op === 'XOR') {
                active = valDest !== valSrc;
            }
            
            if (active) {
                if (destMatrix[r][c] > 0) {
                    result[r][c] = destMatrix[r][c];
                } else if (srcMatrix[r][c] > 0) {
                    result[r][c] = srcMatrix[r][c];
                } else {
                    result[r][c] = 1;
                }
            } else {
                result[r][c] = 0;
            }
        }
    }
    
    setMatrixForName(destName, result);
}

function executeNot(destName) {
    const destMatrix = getMatrixForName(destName) || createEmptyMatrix();
    const result = createEmptyMatrix();
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (destMatrix[r][c] > 0) {
                result[r][c] = 0;
            } else {
                result[r][c] = 1;
            }
        }
    }
    
    setMatrixForName(destName, result);
}

function executePush(srcName) {
    const sourceMatrix = getMatrixForName(srcName);
    gameState.stackP.push(copyMatrix(sourceMatrix));
}

function executePop(destName) {
    if (gameState.stackP.length === 0) {
        throw new Error("Pilha vazia (Stack Underflow)!");
    }
    const matrix = gameState.stackP.pop();
    setMatrixForName(destName, matrix);
}

function executeSyscall() {
    const regMatrix = gameState.regR0 || createEmptyMatrix();
    const targetMatrix = gameState.target || createEmptyMatrix();
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const regActive = regMatrix[r][c] > 0;
            const targetActive = targetMatrix[r][c] > 0;
            if (regActive !== targetActive) {
                throw new Error("Erro de Comparação: R0 não corresponde ao Alvo!");
            }
        }
    }
    
    gameState.hasWon = true;
}

function executeInstruction(parsed) {
    if (parsed.type !== 'instruction') return;
    
    switch (parsed.op) {
        case 'MOV':
            executeMov(parsed.dest, parsed.src);
            break;
        case 'AND':
            executeLogical('AND', parsed.dest, parsed.src);
            break;
        case 'OR':
            executeLogical('OR', parsed.dest, parsed.src);
            break;
        case 'XOR':
            executeLogical('XOR', parsed.dest, parsed.src);
            break;
        case 'NOT':
            executeNot(parsed.dest);
            break;
        case 'PUSH':
            executePush(parsed.src);
            break;
        case 'POP':
            executePop(parsed.dest);
            break;
        case 'SYSCALL':
            executeSyscall();
            break;
        case 'HELP':
            // Comando HELP apenas loga o sumário (gerenciado em script.js)
            break;
        default:
            throw new Error(`Instrução desconhecida: ${parsed.op}`);
    }
}
