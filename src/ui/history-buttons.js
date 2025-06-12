/**
 * History buttons component for undo/redo functionality
 */
export class HistoryButtons extends HTMLElement {
    constructor() {
        super();
        this.historyManager = null;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'closed' });
        shadow.innerHTML = `
            <style>
                .history-buttons {
                    position: fixed;
                    top: 15px;
                    right: 15px;
                    display: flex;
                    gap: 8px;
                    z-index: 1;
                }
                
                .history-btn {
                    background: rgba(255,255,255, .9);
                    border: none;
                    border-radius: 8px;
                    padding: 8px;
                    cursor: pointer;
                    box-shadow: 0px 0px 20px 2px rgb(34 60 80 / 15%);
                    transition: all 0.2s;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                }
                
                .history-btn:hover:not(:disabled) {
                    background: rgba(255,255,255, 1);
                    box-shadow: 0px 0px 25px 3px rgb(34 60 80 / 25%);
                    transform: translateY(-1px);
                }
                
                .history-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    background: rgba(255,255,255, .6);
                }
                
                .history-btn:active:not(:disabled) {
                    transform: translateY(0px);
                    box-shadow: 0px 0px 15px 1px rgb(34 60 80 / 20%);
                }
                
                .history-btn svg {
                    width: 20px;
                    height: 20px;
                }
            </style>
            
            <div class="history-buttons">
                <button class="history-btn" id="undo-btn" title="撤销 (Ctrl+Z)">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H9v-2h4a6 6 0 1 0 0-12H5.828z" fill="rgb(52,71,103)"/>
                    </svg>
                </button>
                
                <button class="history-btn" id="redo-btn" title="重做 (Ctrl+Y)">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M18.172 7H11a6 6 0 1 0 0 12h4v2H11a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z" fill="rgb(52,71,103)"/>
                    </svg>
                </button>
            </div>
        `;

        this.undoBtn = shadow.querySelector('#undo-btn');
        this.redoBtn = shadow.querySelector('#redo-btn');

        // Bind event listeners
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Update button states initially
        this.updateButtonStates();
    }

    init(historyManager) {
        this.historyManager = historyManager;
        
        // Listen for history changes to update button states
        document.addEventListener('historychange', () => {
            this.updateButtonStates();
        });
        
        this.updateButtonStates();
    }

    undo() {
        if (this.historyManager && this.historyManager.canUndo()) {
            this.historyManager.undo();
            this.updateButtonStates();
        }
    }

    redo() {
        if (this.historyManager && this.historyManager.canRedo()) {
            this.historyManager.redo();
            this.updateButtonStates();
        }
    }

    updateButtonStates() {
        if (!this.historyManager) {
            /** @type {HTMLButtonElement} */(this.undoBtn).disabled = true;
            /** @type {HTMLButtonElement} */(this.redoBtn).disabled = true;
            return;
        }

        /** @type {HTMLButtonElement} */(this.undoBtn).disabled = !this.historyManager.canUndo();
        /** @type {HTMLButtonElement} */(this.redoBtn).disabled = !this.historyManager.canRedo();
    }

    handleKeydown(e) {
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Ctrl+Y or Ctrl+Shift+Z for redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            this.redo();
        }
    }
}

// Register the custom element
customElements.define('ap-history-buttons', HistoryButtons); 