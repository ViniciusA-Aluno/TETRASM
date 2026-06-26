// script.js - Orquestrador Geral e Controle de Fluxo
let isExecutionRunning = false;
let executionTimeoutId = null;
let currentInstructionIndex = 0;
let linesOfCode = [];

function initGame() {
    for (let i = 0; i < NUM_CARDS; i++) {
        gameState.cards[i] = generateRandomMatrix(i + 1);
    }
    gameState.regR0 = generateRandomMatrix(5);
    gameState.accA = null;
    gameState.accB = null;
    gameState.stackP = [];
    
    saveInitialState();
    renderGame();
}

function stopExecution(completed = true) {
    isExecutionRunning = false;
    currentInstructionIndex = 0;
    
    setHighlightVisible(false);
    
    const runBtn = document.getElementById('btn-run');
    if (runBtn) runBtn.textContent = '▶ Executar';
    
    if (executionTimeoutId) {
        clearTimeout(executionTimeoutId);
        executionTimeoutId = null;
    }
}

function stepExecution() {
    const textarea = document.getElementById('notebook-input');
    if (!textarea) return;
    
    linesOfCode = textarea.value.split('\n');
    if (linesOfCode.length === 0 || (linesOfCode.length === 1 && linesOfCode[0].trim() === '')) {
        updateStatus("Nenhum código encontrado", "error");
        return;
    }

    if (currentInstructionIndex === 0 && !isExecutionRunning) {
        saveInitialState();
        isExecutionRunning = true;
    }

    let executed = false;
    while (currentInstructionIndex < linesOfCode.length && !executed) {
        const lineText = linesOfCode[currentInstructionIndex];
        
        try {
            const parsed = parseInstruction(lineText);
            
            if (parsed.type === 'instruction') {
                setHighlightVisible(true);
                updateHighlightPosition(currentInstructionIndex);
                scrollToLine(currentInstructionIndex);
                
                if (parsed.op === 'MOV') {
                    executeMov(parsed.dest, parsed.src);
                }
                
                renderGame();
                updateStatus(`Linha ${currentInstructionIndex + 1}: ${parsed.originalText}`, "success");
                
                currentInstructionIndex++;
                executed = true;
            } else {
                currentInstructionIndex++;
            }
        } catch (err) {
            setHighlightVisible(true);
            updateHighlightPosition(currentInstructionIndex);
            scrollToLine(currentInstructionIndex);
            
            updateStatus(`Erro na Linha ${currentInstructionIndex + 1}: ${err.message}`, "error");
            stopExecution(false);
            return;
        }
    }

    if (currentInstructionIndex >= linesOfCode.length && !executed) {
        updateStatus("Programa executado com sucesso", "success");
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
    if (!runBtn) return;

    if (isExecutionRunning && executionTimeoutId) {
        clearTimeout(executionTimeoutId);
        executionTimeoutId = null;
        runBtn.textContent = '▶ Executar';
        updateStatus("Execução pausada");
    } else {
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
    
    if (isStateModified) {
        restoreInitialState();
        updateStatus("Estado resetado", "success");
    } else {
        initGame();
        updateStatus("Novas peças geradas", "success");
    }
}

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
                updateStatus("Código alterado. Pronto.");
            }
        });
    }
}

// Inicialização
initGame();
setupNotebookEvents();
