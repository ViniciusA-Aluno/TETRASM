function closeDialog() {
    const overlay = document.getElementById('game-dialog-overlay');
    if (overlay) {
        overlay.style.display = 'none';
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
                <label for="volume-slider">Volume do Som</label>
                <div class="slider-row">
                    <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${currentVol / 100}">
                    <span id="volume-value" style="font-family: monospace; min-width: 45px; font-weight: bold; color: #000;">${currentVol}%</span>
                </div>
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

    // Adiciona evento ao slider após renderizar
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
    }, 50);
}
