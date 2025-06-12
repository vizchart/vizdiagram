import { serialize, deserialize } from '../diagram/dgrm-serialization.js';

/**
 * History Manager for Undo/Redo functionality
 */
class HistoryManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        
        // Save initial state
        this.saveState();
    }

    /**
     * Save current state to history
     */
    saveState() {
        try {
            const currentState = serialize(this.canvas);
            
            // Remove any states after current index (when user made changes after undo)
            this.history = this.history.slice(0, this.currentIndex + 1);
            
            // Add new state
            this.history.push(JSON.stringify(currentState));
            this.currentIndex++;
            
            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.currentIndex--;
            }
            
            this.notifyStateChange();
        } catch (error) {
            console.warn('Failed to save state:', error);
        }
    }

    /**
     * Undo last action
     */
    undo() {
        if (!this.canUndo()) return false;
        
        this.currentIndex--;
        this.restoreState();
        this.notifyStateChange();
        return true;
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (!this.canRedo()) return false;
        
        this.currentIndex++;
        this.restoreState();
        this.notifyStateChange();
        return true;
    }

    /**
     * Check if undo is possible
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is possible
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Restore state at current index
     */
    restoreState() {
        try {
            if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
                const stateData = JSON.parse(this.history[this.currentIndex]);
                
                // Clear canvas first
                while (this.canvas.firstChild) {
                    this.canvas.removeChild(this.canvas.firstChild);
                }
                
                // Restore state
                deserialize(this.canvas, stateData);
            }
        } catch (error) {
            console.error('Failed to restore state:', error);
        }
    }

    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.saveState();
    }

    /**
     * Notify listeners about state changes
     */
    notifyStateChange() {
        // Dispatch custom event for UI updates
        const event = new CustomEvent('historychange', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                historyLength: this.history.length,
                currentIndex: this.currentIndex
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current history info
     */
    getInfo() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            historyLength: this.history.length,
            currentIndex: this.currentIndex
        };
    }
}

export { HistoryManager }; 