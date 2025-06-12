import { CanvasSmbl } from './canvas-smbl.js';
import { ShapeSmbl } from '../shapes/shape-smbl.js';
import { PathSmbl } from '../shapes/path-smbl.js';

/**
 * Initialize keyboard delete functionality for the canvas
 * @param {import('./canvas-smbl.js').CanvasElement} canvas
 */
export function keyboardDeleteApply(canvas) {
    /**
     * Handle keydown events for delete functionality
     * @param {KeyboardEvent} evt
     */
    function handleKeydown(evt) {
        // Only handle Delete key
        if (evt.key !== 'Delete' && evt.key !== 'Backspace') {
            return;
        }

        // Don't handle delete if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            /** @type {HTMLElement} */(activeElement).contentEditable === 'true' ||
            /** @type {HTMLElement} */(activeElement).isContentEditable
        )) {
            return;
        }

        // Find currently selected shapes first
        const selectedShapes = findSelectedShapes(canvas);
        
        // If no shapes are selected, don't do anything
        if (selectedShapes.length === 0) {
            return;
        }

        // Check if we should allow deletion based on focus
        const svg = canvas.ownerSVGElement;
        const currentActiveElement = document.activeElement;
        
        // Allow deletion if:
        // 1. SVG has focus, OR
        // 2. No specific input element has focus (body or html), OR  
        // 3. Canvas or its children have focus
        const shouldAllowDeletion = 
            currentActiveElement === svg ||
            currentActiveElement === document.body ||
            currentActiveElement === document.documentElement ||
            svg.contains(currentActiveElement);
            
        if (!shouldAllowDeletion) {
            return;
        }
        
        if (selectedShapes.length > 0) {
            evt.preventDefault();
            
            // Delete all selected shapes
            selectedShapes.forEach(shape => {
                if (shape[ShapeSmbl]) {
                    shape[ShapeSmbl].del();
                } else if (shape[PathSmbl]) {
                    shape[PathSmbl].del();
                }
            });

            // Trigger history save after deletion
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('diagramchange'));
            }, 100);
        }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeydown);

    // Return cleanup function
    return function cleanup() {
        document.removeEventListener('keydown', handleKeydown);
    };
}

/**
 * Find all currently selected shapes in the canvas
 * @param {import('./canvas-smbl.js').CanvasElement} canvas
 * @returns {Array<import('../shapes/shape-smbl.js').ShapeElement | import('../shapes/path-smbl.js').PathElement>}
 */
function findSelectedShapes(canvas) {
    /** @type {Array<import('../shapes/shape-smbl.js').ShapeElement | import('../shapes/path-smbl.js').PathElement>} */
    const selectedShapes = [];
    
    // Iterate through all children of the canvas
    for (const child of canvas.children) {
        // Check if shape is selected (has 'select' or 'highlight' class)
        if (child.classList.contains('select') || child.classList.contains('highlight')) {
            selectedShapes.push(/** @type {import('../shapes/shape-smbl.js').ShapeElement | import('../shapes/path-smbl.js').PathElement} */(child));
        }
    }
    
    return selectedShapes;
} 