// script.js - Orquestrador Geral e Controle de Fluxo
let isExecutionRunning = false;
let executionTimeoutId = null;
let currentInstructionIndex = 0;
let linesOfCode = [];

function initGame() {
    for (let i = 0; i < NUM_CARDS; i++) {
        gameState.cards[i] = generateRandomMatrix(i + 1);
    }
    gameState.regR0 = null;
    gameState.accA = null;
    gameState.accB = null;
    gameState.stackP = [];
    gameState.hasWon = false;
    
    gameState.target = generateSolvableTarget();
    
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
        restoreInitialState();
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
                
                executeInstruction(parsed);
                
                renderGame();
                updateStatus(`Linha ${currentInstructionIndex + 1}: ${parsed.originalText}`, "success");
                
                if (gameState.hasWon) {
                    updateStatus("🎉 PARABÉNS! Você construiu a peça alvo com sucesso!", "success");
                    showVictoryCelebration();
                    stopExecution(true);
                    return;
                }
                
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
    restoreInitialState();
    renderGame();
    updateStatus("Nível reiniciado", "success");
}

function newTargetExecution() {
    stopExecution();
    initGame();
    updateStatus("Novo alvo e peças geradas", "success");
}

function showVictoryCelebration() {
    const modal = document.getElementById('victory-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function setupNotebookEvents() {
    const btnRun = document.getElementById('btn-run');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const btnNextLevel = document.getElementById('btn-next-level');
    const textarea = document.getElementById('notebook-input');

    if (btnRun) btnRun.addEventListener('click', toggleRun);
    if (btnStep) btnStep.addEventListener('click', stepExecution);
    if (btnReset) btnReset.addEventListener('click', resetExecution);
    
    const btnNewTarget = document.getElementById('btn-new-target');
    if (btnNewTarget) btnNewTarget.addEventListener('click', newTargetExecution);
    
    if (btnNextLevel) {
        btnNextLevel.addEventListener('click', () => {
            const modal = document.getElementById('victory-modal');
            if (modal) modal.style.display = 'none';
            initGame();
            updateStatus("Próxima fase iniciada!");
        });
    }
    
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
