function closeDialog() {
    const overlay = document.getElementById('game-dialog-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Garante acesso global
window.closeDialog = closeDialog;

function showDialog({ title, type = 'info', bodyHtml = '', buttons = [] }) {
    const overlay = document.getElementById('game-dialog-overlay');
    const card = document.getElementById('game-dialog-card');
    const titleElem = document.getElementById('game-dialog-title');
    const bodyElem = document.getElementById('game-dialog-body');
    const footerElem = document.getElementById('game-dialog-footer');

    if (!overlay || !card || !titleElem || !bodyElem || !footerElem) return;

    titleElem.textContent = title;
    bodyElem.innerHTML = bodyHtml;

    card.className = 'game-dialog-card dialog-' + type;

    footerElem.innerHTML = '';
    buttons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = 'game-dialog-btn ' + (btnConfig.className || '');
        btn.textContent = btnConfig.text || 'OK';
        btn.addEventListener('click', (e) => {
            if (btnConfig.onClick) {
                btnConfig.onClick(e);
            } else {
                closeDialog();
            }
        });
        footerElem.appendChild(btn);
    });

    overlay.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function showVictoryDialog(onNextLevel) {
    showDialog({
        title: 'SISTEMA DECORADO',
        type: 'victory',
        bodyHtml: `
            <div class="win95-content-box">
                <div>
                    <p class="modal-congrats">PARABÉNS, OPERADOR!</p>
                    <p style="margin-bottom: 8px;">A peça em <strong>R0</strong> corresponde à demanda do <strong>ALVO</strong>.</p>
                    <p>Seus comandos assembly integraram a estrutura com sucesso.</p>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Novo Jogo',
                className: 'btn-primary-victory',
                onClick: () => {
                    closeDialog();
                    if (onNextLevel) onNextLevel();
                }
            }
        ]
    });
}

function showErrorDialog(message) {
    showDialog({
        title: 'FALHA DE EXECUÇÃO',
        type: 'error',
        bodyHtml: `
            <div class="win95-content-box">
                <p class="error-dialog-msg" style="color: #800000; font-weight: bold; font-size: 17px;">❌ ERRO DE SINTAXE OU LÓGICA</p>
                <div class="win95-inset-panel" style="color: #000; font-family: monospace; font-size: 18px;">
                    ${message}
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Entendido',
                className: 'btn-primary-error',
                onClick: () => {
                    closeDialog();
                }
            }
        ]
    });
}

function showSettingsDialog() {
    const currentVol = window.soundManager ? Math.round(window.soundManager.getVolume() * 100) : 100;
    
    const bodyHtml = `
        <div class="win95-content-box">
            <div class="settings-control win95-inset-panel">
                <label for="volume-slider" style="display: block; font-weight: bold; margin-bottom: 4px;">Volume do Som</label>
                <div class="slider-row" style="display: flex; align-items: center; gap: 8px;">
                    <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${currentVol / 100}">
                    <span id="volume-value" style="font-family: monospace; min-width: 45px; font-weight: bold; color: #000;">${currentVol}%</span>
                </div>
            </div>
            
            <div class="settings-control win95-inset-panel" style="margin-top: 12px; padding: 8px;">
                <label for="seed-input" style="display: block; font-weight: bold; margin-bottom: 4px; color: #000;">Semente do Mapa (Seed)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="seed-input" value="${gameState.seed || ''}" 
                           placeholder="Deixe em branco para aleatório" 
                           style="flex: 1; padding: 4px; font-family: monospace; border: 2px solid #7f7f7f; border-right-color: #fff; border-bottom-color: #fff; background: #fff; color: #000;">
                    <button id="btn-apply-seed" class="game-dialog-btn" style="padding: 2px 8px; font-size: 12px;">Aplicar</button>
                </div>
                <small style="color: #555; display: block; margin-top: 4px;">Compartilhe a semente ou digite uma para carregar um nível específico.</small>
            </div>
        </div>
    `;

    showDialog({
        title: 'CONFIGURAÇÕES DO SISTEMA',
        type: 'settings',
        bodyHtml: bodyHtml,
        buttons: [
            {
                text: 'Fechar',
                className: 'btn-primary-settings',
                onClick: () => closeDialog()
            }
        ]
    });

    // Adiciona eventos após renderizar
    setTimeout(() => {
        const slider = document.getElementById('volume-slider');
        const valueSpan = document.getElementById('volume-value');
        if (slider && valueSpan) {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const percent = Math.round(val * 100);
                valueSpan.textContent = `${percent}%`;
                if (window.soundManager) {
                    window.soundManager.setVolume(val);
                }
            });
        }

        const seedInput = document.getElementById('seed-input');
        const applyBtn = document.getElementById('btn-apply-seed');
        if (seedInput && applyBtn) {
            applyBtn.addEventListener('click', () => {
                const cleanSeed = seedInput.value.trim();
                gameState.seed = cleanSeed === '' ? null : cleanSeed;
                closeDialog();
                if (typeof initGame === 'function') {
                    initGame();
                }
            });
        }
    }, 50);
}

function openCustomSeedPrompt() {
    const bodyHtml = `
        <div class="win95-content-box">
            <div class="settings-control win95-inset-panel" style="padding: 10px;">
                <label for="menu-seed-input" style="display: block; font-weight: bold; margin-bottom: 6px; color: #000;">Semente do Mapa (Seed)</label>
                <input type="text" id="menu-seed-input" placeholder="Ex: 12345 ou fase_facil" 
                       style="width: 100%; padding: 6px; font-family: monospace; border: 2px solid #7f7f7f; border-right-color: #fff; border-bottom-color: #fff; background: #fff; color: #000;" />
                <small style="color: #555; display: block; margin-top: 6px;">Deixe em branco para uma semente aleatória.</small>
            </div>
        </div>
    `;

    showDialog({
        title: 'PARTIDA PERSONALIZADA',
        type: 'settings',
        bodyHtml: bodyHtml,
        buttons: [
            {
                text: '▶ Iniciar',
                className: 'btn-primary-settings',
                onClick: () => {
                    const inputElem = document.getElementById('menu-seed-input');
                    const seedVal = inputElem ? inputElem.value.trim() : '';
                    closeDialog();
                    if (typeof hideMainMenu === 'function') hideMainMenu();
                    if (typeof gameState !== 'undefined') {
                        gameState.seed = seedVal !== '' ? seedVal : null;
                    }
                    if (typeof initGame === 'function') {
                        initGame();
                    }
                }
            },
            {
                text: 'Cancelar',
                className: 'btn-secondary',
                onClick: () => closeDialog()
            }
        ]
    });

    setTimeout(() => {
        const inputElem = document.getElementById('menu-seed-input');
        if (inputElem) {
            inputElem.focus();
            inputElem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const seedVal = inputElem.value.trim();
                    closeDialog();
                    if (typeof hideMainMenu === 'function') hideMainMenu();
                    if (typeof gameState !== 'undefined') {
                        gameState.seed = seedVal !== '' ? seedVal : null;
                    }
                    if (typeof initGame === 'function') {
                        initGame();
                    }
                }
            });
        }
    }, 50);
}

function showHelpDialog() {
    const helpText = typeof getHelpSummary === 'function' ? getHelpSummary() : '';
    const bodyHtml = `
        <div class="win95-content-box">
            <div class="win95-inset-panel" style="color: #000; font-family: monospace; font-size: 13px; white-space: pre-wrap; text-align: left; max-height: 240px; overflow-y: auto;">
${helpText}
            </div>
        </div>
    `;

    showDialog({
        title: 'AJUDA & COMANDOS',
        type: 'settings',
        bodyHtml: bodyHtml,
        buttons: [
            {
                text: 'Fechar',
                className: 'btn-primary-settings',
                onClick: () => closeDialog()
            }
        ]
    });
}
