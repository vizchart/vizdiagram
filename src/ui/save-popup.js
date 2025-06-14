/**
 * Save Popup System - Custom JavaScript dialogs for save functionality
 */

/**
 * Show input dialog for diagram name
 * @param {string} defaultName - Default diagram name
 * @returns {Promise<string|null>} - Returns the entered name or null if cancelled
 */
export function showSaveInputDialog(defaultName = 'My Diagram') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
        `;

        modal.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 600;">Save to Cloud</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">Please enter a name for your diagram:</p>
            </div>
            <div style="margin-bottom: 25px;">
                <input type="text" id="diagram-name-input" 
                       style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box;"
                       placeholder="Enter diagram name..." />
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-btn" 
                        style="padding: 10px 20px; border: 2px solid #6c757d; background: white; color: #6c757d; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    Cancel
                </button>
                <button id="save-btn" 
                        style="padding: 10px 20px; border: 2px solid #007bff; background: #007bff; color: white; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    Save
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const input = /** @type {HTMLInputElement} */(modal.querySelector('#diagram-name-input'));
        const saveBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#save-btn'));
        const cancelBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#cancel-btn'));

        // Set default value and focus
        input.value = defaultName;
        input.focus();
        input.select();

        // Handle save
        const handleSave = () => {
            const name = input.value.trim();
            if (name) {
                cleanup();
                resolve(name);
            } else {
                input.style.borderColor = '#dc3545';
                input.focus();
            }
        };

        // Handle cancel
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        // Cleanup function
        const cleanup = () => {
            document.body.removeChild(backdrop);
        };

        // Event listeners
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Enter key to save, Escape to cancel
        input.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        });

        // Reset border color on input
        input.addEventListener('input', () => {
            input.style.borderColor = '#e9ecef';
        });

        // Click backdrop to cancel
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                handleCancel();
            }
        });
    });
}

/**
 * Show success dialog after save
 * @param {Object} options - Success dialog options
 * @param {string} options.title - Diagram title
 * @param {string} options.action - Action performed (created/updated)
 * @param {string} options.nodeId - Node ID
 * @param {string} options.domain - Domain name
 */
export function showSaveSuccessDialog({ title, action, nodeId, domain }) {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 450px;
            max-width: 550px;
        `;

        const actionText = action === 'created' ? 'New diagram created' : 'Diagram updated';
        const successIcon = `
            <svg width="48" height="48" viewBox="0 0 24 24" style="color: #28a745;">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        `;

        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                ${successIcon}
                <h3 style="margin: 15px 0 10px 0; color: #28a745; font-size: 20px; font-weight: 600;">Save Successfully!</h3>
                <p style="margin: 0; color: #333; font-size: 16px; font-weight: 500;">${actionText}: ${title}</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <div style="margin-bottom: 15px;">
                    <strong style="color: #495057; font-size: 14px;">View address:</strong>
                    <div style="margin-top: 5px;">
                        <a href="https://${domain}/node/${nodeId}" target="_blank" 
                           style="color: #007bff; text-decoration: none; font-size: 14px; word-break: break-all;">
                            ${title}
                        </a>
                    </div>
                </div>
                
                <div>
                    <strong style="color: #495057; font-size: 14px;">Manage in your dashboard:</strong>
                    <div style="margin-top: 5px;">
                        <a href="https://${domain}/dashboard" target="_blank" 
                           style="color: #007bff; text-decoration: none; font-size: 14px;">
                            https://${domain}/dashboard
                        </a>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button id="ok-btn" 
                        style="padding: 12px 30px; border: 2px solid #28a745; background: #28a745; color: white; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
                    OK
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const okBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#ok-btn'));

        // Handle OK
        const handleOk = () => {
            cleanup();
            resolve();
        };

        // Cleanup function
        const cleanup = () => {
            document.body.removeChild(backdrop);
        };

        // Event listeners
        okBtn.addEventListener('click', handleOk);
        
        // Enter or Escape to close
        document.addEventListener('keydown', function keyHandler(/** @type {KeyboardEvent} */ e) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', keyHandler);
                handleOk();
            }
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                handleOk();
            }
        });

        // Focus the OK button
        okBtn.focus();
    });
}

/**
 * Show error dialog after save
 * @param {string} message - Error message to display
 */
export function showSaveErrorDialog(message) {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 450px;
            max-width: 550px;
        `;

        const errorIcon = `
            <svg width="48" height="48" viewBox="0 0 24 24" style="color: #dc3545;">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
        `;

        modal.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                ${errorIcon}
                <div style="margin-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; color: #dc3545; font-size: 18px; font-weight: 600;">Error</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">Something went wrong</p>
                </div>
            </div>
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #dc3545;">
                <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="ok-btn" 
                        style="padding: 10px 20px; border: 2px solid #dc3545; background: #dc3545; color: white; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    OK
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const okBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#ok-btn'));

        // Event handlers
        const cleanup = () => {
            document.body.removeChild(backdrop);
            resolve();
        };

        okBtn.addEventListener('click', cleanup);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup();
        });

        // Focus the OK button
        okBtn.focus();

        // Handle Escape key
        const handleKeydown = (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

/**
 * Show information dialog with clickable login link
 * @param {string} title - Dialog title
 * @param {string} message - Information message to display
 * @param {string} type - Dialog type: 'success', 'error', 'info', 'warning'
 */
export function showInfoDialogWithLogin(title, message, type = 'info') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
        `;

        // Define icons and colors for different types
        const typeConfig = {
            success: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #28a745;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>`,
                color: '#28a745',
                borderColor: '#28a745'
            },
            error: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #dc3545;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>`,
                color: '#dc3545',
                borderColor: '#dc3545'
            },
            warning: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #ffc107;">
                    <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>`,
                color: '#ffc107',
                borderColor: '#ffc107'
            },
            info: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #17a2b8;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>`,
                color: '#17a2b8',
                borderColor: '#17a2b8'
            }
        };

        const config = typeConfig[type] || typeConfig.info;

        // Process message to make login link clickable - keep existing HTML links and style them
        const processedMessage = message.replace(
            /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g, 
            '<a href="$1" target="_blank" style="color: #007bff; text-decoration: underline;">$2</a>'
        );

        modal.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                ${config.icon}
                <div style="margin-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; color: ${config.color}; font-size: 18px; font-weight: 600;">${title}</h3>
                </div>
            </div>
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${config.borderColor};">
                <div style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${processedMessage}</div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="ok-btn" 
                        style="padding: 10px 20px; border: 2px solid ${config.borderColor}; background: ${config.borderColor}; color: white; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    OK
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const okBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#ok-btn'));

        // Event handlers
        const cleanup = () => {
            document.body.removeChild(backdrop);
            resolve();
        };

        okBtn.addEventListener('click', cleanup);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup();
        });

        // Focus the OK button
        okBtn.focus();

        // Handle Escape key
        const handleKeydown = (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

/**
 * Show general information dialog
 * @param {string} title - Dialog title
 * @param {string} message - Information message to display
 * @param {string} type - Dialog type: 'success', 'error', 'info', 'warning'
 */
export function showInfoDialog(title, message, type = 'info') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
        `;

        // Define icons and colors for different types
        const typeConfig = {
            success: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #28a745;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>`,
                color: '#28a745',
                borderColor: '#28a745'
            },
            error: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #dc3545;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>`,
                color: '#dc3545',
                borderColor: '#dc3545'
            },
            warning: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #ffc107;">
                    <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>`,
                color: '#ffc107',
                borderColor: '#ffc107'
            },
            info: {
                icon: `<svg width="48" height="48" viewBox="0 0 24 24" style="color: #17a2b8;">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>`,
                color: '#17a2b8',
                borderColor: '#17a2b8'
            }
        };

        const config = typeConfig[type] || typeConfig.info;

        modal.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                ${config.icon}
                <div style="margin-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; color: ${config.color}; font-size: 18px; font-weight: 600;">${title}</h3>
                </div>
            </div>
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${config.borderColor};">
                <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="ok-btn" 
                        style="padding: 10px 20px; border: 2px solid ${config.borderColor}; background: ${config.borderColor}; color: white; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    OK
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const okBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#ok-btn'));

        // Event handlers
        const cleanup = () => {
            document.body.removeChild(backdrop);
            resolve();
        };

        okBtn.addEventListener('click', cleanup);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup();
        });

        // Focus the OK button
        okBtn.focus();

        // Handle Escape key
        const handleKeydown = (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 */
export function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
        `;

        const questionIcon = `
            <svg width="48" height="48" viewBox="0 0 24 24" style="color: #ffc107;">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
        `;

        modal.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                ${questionIcon}
                <div style="margin-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffc107; font-size: 18px; font-weight: 600;">${title}</h3>
                </div>
            </div>
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-btn" 
                        style="padding: 10px 20px; border: 2px solid #6c757d; background: white; color: #6c757d; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    ${cancelText}
                </button>
                <button id="confirm-btn" 
                        style="padding: 10px 20px; border: 2px solid #ffc107; background: #ffc107; color: white; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    ${confirmText}
                </button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const confirmBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#confirm-btn'));
        const cancelBtn = /** @type {HTMLButtonElement} */(modal.querySelector('#cancel-btn'));

        // Event handlers
        const cleanup = (result) => {
            document.body.removeChild(backdrop);
            resolve(result);
        };

        confirmBtn.addEventListener('click', () => cleanup(true));
        cancelBtn.addEventListener('click', () => cleanup(false));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup(false);
        });

        // Focus the confirm button
        confirmBtn.focus();

        // Handle Escape key
        const handleKeydown = (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Escape') {
                cleanup(false);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
} 