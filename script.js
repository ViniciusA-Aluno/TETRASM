// script.js - Orquestrador Geral e Controle de Fluxo
let isExecutionRunning = false;
let executionTimeoutId = null;
let currentInstructionIndex = 0;
let currentLineCode = 'Pronto';
let helpOpen = false;
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
    if (typeof clearActiveAnimations === 'function') {
        clearActiveAnimations();
    }
    
    const runBtn = document.getElementById('btn-run');
    if (runBtn) runBtn.textContent = '▶ Executar';
    
    if (executionTimeoutId) {
        clearTimeout(executionTimeoutId);
        executionTimeoutId = null;
    }
}

async function stepExecution() {
    isExecutionRunning = true;
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
                
                // Animação de transladação ou efeito baseada no comando
                if (typeof animatePieceMove === 'function') {
                    if (['MOV', 'AND', 'OR', 'XOR'].includes(parsed.op)) {
                        const matrixToMove = getMatrixForName(parsed.src);
                        await animatePieceMove(parsed.src, parsed.dest, matrixToMove);
                    } else if (parsed.op === 'PUSH') {
                        const matrixToMove = getMatrixForName(parsed.src);
                        await animatePieceMove(parsed.src, 'P', matrixToMove);
                    } else if (parsed.op === 'POP') {
                        const topMatrix = gameState.stackP.length > 0 ? gameState.stackP[gameState.stackP.length - 1] : null;
                        await animatePieceMove('P', parsed.dest, topMatrix);
                    } else if (parsed.op === 'NOT') {
                        if (typeof animateNot === 'function') {
                            await animateNot(parsed.dest);
                        }
                    }
                }

                // Se a execução foi parada ou reiniciada durante a animação
                if (!isExecutionRunning && currentInstructionIndex === 0) {
                    return;
                }
                
                executeInstruction(parsed);
                renderGame();
                
                if (parsed.op === 'HELP') {
                    updateStatus(getHelpSummary(), "success");
                } else {
                    if (isExecutionRunning) {
                        currentLineCode = `Linha ${currentInstructionIndex + 1}: ${parsed.originalText}`;
                        updateStatus(currentLineCode, "success");
                    }
                }
                
                if (gameState.hasWon) {
                    if (window.soundManager) window.soundManager.play('win');
                    updateStatus("Programa executado com sucesso!", "success");
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
            
            if (window.soundManager) window.soundManager.play('error');
            updateStatus(`Erro na Linha ${currentInstructionIndex + 1}`, "error");
            
            if (typeof showErrorDialog === 'function') {
                showErrorDialog(err.message);
            }
            
            stopExecution(false);
            return;
        }
    }

    if (currentInstructionIndex >= linesOfCode.length && !executed) {
        updateStatus("Programa executado com sucesso", "success");
        stopExecution(true);
    }
}

async function runNextStepAuto() {
    if (!isExecutionRunning) return;
    
    await stepExecution();
    
    if (isExecutionRunning && currentInstructionIndex < linesOfCode.length) {
        executionTimeoutId = setTimeout(runNextStepAuto, 150);
    } else if (isExecutionRunning) {
        stopExecution(true);
    }
}

function toggleRun() {
    const runBtn = document.getElementById('btn-run');
    if (!runBtn) return;

    if (isExecutionRunning) {
        if (executionTimeoutId) {
            clearTimeout(executionTimeoutId);
            executionTimeoutId = null;
        }
        isExecutionRunning = false;
        runBtn.textContent = '▶ Executar';
        updateStatus("Execução pausada");
    } else {
        if (currentInstructionIndex === 0) {
            restoreInitialState();
        }
        else {
            updateStatus(currentLineCode, "success");
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
    closeDialog();
    if (window.soundManager) window.soundManager.play('newgame');
    updateStatus("Nível reiniciado", "success");
}

function newTargetExecution() {
    stopExecution();
    initGame();
    if (window.soundManager) window.soundManager.play('newgame');
    updateStatus("Novo alvo e peças geradas", "success");
}

function showVictoryCelebration() {
    if (typeof showVictoryDialog === 'function') {
        showVictoryDialog(() => {
            initGame();
            if (window.soundManager) window.soundManager.play('newgame');
            updateStatus("Próxima fase iniciada!");
        });
    }
}

function setupNotebookEvents() {
    const btnRun = document.getElementById('btn-run');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const btnSettings = document.getElementById('btn-settings');
    const textarea = document.getElementById('notebook-input');

    if (btnRun) btnRun.addEventListener('click', toggleRun);
    if (btnStep) btnStep.addEventListener('click', async ()=>{await stepExecution();isExecutionRunning=false;});
    if (btnReset) btnReset.addEventListener('click', resetExecution);
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            if (typeof showSettingsDialog === 'function') {
                showSettingsDialog();
            }
        });
    }
    
    const btnNewTarget = document.getElementById('btn-new-target');
    if (btnNewTarget) btnNewTarget.addEventListener('click', newTargetExecution);

    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) {
        btnHelp.addEventListener('click', () => {
            if (helpOpen) {
                updateStatus(currentLineCode);
            }
            else {
                updateStatus(getHelpSummary(), "success");
            }
            helpOpen = !helpOpen;
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

function getHelpSummary() {
    return `COMANDOS TETRASM DISPONÍVEIS:
• MOV dest, src  
    ⮩ Copia src para dest

• AND dest, src  
    ⮩ E lógico (dest & src) -> dest

• OR dest, src   
    ⮩ OU lógico (dest | src) -> dest

• XOR dest, src  
    ⮩ OU Exclusivo (dest ^ src) -> dest

• NOT dest       
    ⮩ Inverte pixels de dest

• PUSH src       
    ⮩ Insere src no topo de P

• POP dest       
    ⮩ Retira do topo de P para dest

• SYSCALL        
    ⮩ Valida R0 com o ALVO

• HELP           
    ⮩ Mostra este sumário de ajuda


[Destinos válidos: A, B, R0]
[Origens válidas: A, B, R0, C0, C1, C2, C3]`;
}

// Inicialização
initGame();
setupNotebookEvents();
