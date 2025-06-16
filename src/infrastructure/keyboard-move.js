import { CanvasSmbl } from './canvas-smbl.js';
import { ShapeSmbl } from '../shapes/shape-smbl.js';
import { PathSmbl } from '../shapes/path-smbl.js';

/**
 * Initialize keyboard move functionality for the canvas
 * @param {import('./canvas-smbl.js').CanvasElement} canvas
 */
export function keyboardMoveApply(canvas) {
    // Get canvas data for cell size (grid unit)
    const canvasData = canvas[CanvasSmbl].data;
    const moveStep = canvasData.cell || 24; // Default to 24px if cell is not defined

    /**
     * Handle keydown events for move functionality
     * @param {KeyboardEvent} evt
     */
    function handleKeydown(evt) {
        // Only handle arrow keys
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key)) {
            return;
        }
        
        console.log('🎯 Arrow key pressed:', evt.key);

        // Don't handle move if user is typing in an input field
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
        console.log('🔍 Selected shapes found:', selectedShapes.length);
        
        // If no shapes are selected, don't do anything
        if (selectedShapes.length === 0) {
            console.log('❌ No shapes selected');
            return;
        }

        // Check if we should allow movement based on focus
        const svg = canvas.ownerSVGElement;
        const currentActiveElement = document.activeElement;
        
        // Allow movement if:
        // 1. SVG has focus, OR
        // 2. No specific input element has focus (body or html), OR  
        // 3. Canvas or its children have focus
        const shouldAllowMovement = 
            currentActiveElement === svg ||
            currentActiveElement === document.body ||
            currentActiveElement === document.documentElement ||
            svg.contains(currentActiveElement);
            
        if (!shouldAllowMovement) {
            return;
        }
        
        if (selectedShapes.length > 0) {
            evt.preventDefault();
            
            // Calculate movement delta based on arrow key
            let deltaX = 0;
            let deltaY = 0;
            
            switch (evt.key) {
                case 'ArrowUp':
                    deltaY = -moveStep;
                    break;
                case 'ArrowDown':
                    deltaY = moveStep;
                    break;
                case 'ArrowLeft':
                    deltaX = -moveStep;
                    break;
                case 'ArrowRight':
                    deltaX = moveStep;
                    break;
            }
            
            // Move all selected shapes
            console.log('🚀 Moving shapes by:', deltaX, deltaY);
            selectedShapes.forEach(shape => {
                moveShape(shape, deltaX, deltaY);
            });

            // Trigger history save after movement
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
 * Move a shape by the specified delta
 * @param {import('../shapes/shape-smbl.js').ShapeElement | import('../shapes/path-smbl.js').PathElement} shape
 * @param {number} deltaX
 * @param {number} deltaY
 */
function moveShape(shape, deltaX, deltaY) {
    console.log('📦 Moving shape:', shape.tagName, shape.classList.toString());
    if (shape[ShapeSmbl]) {
        // Handle regular shapes
        const shapeData = shape[ShapeSmbl].data;
        console.log('📍 Old position:', shapeData.position.x, shapeData.position.y);
        shapeData.position.x += deltaX;
        shapeData.position.y += deltaY;
        console.log('📍 New position:', shapeData.position.x, shapeData.position.y);
        shape[ShapeSmbl].drawPosition();
    } else if (shape[PathSmbl]) {
        // Handle paths (connections)
        const pathData = shape[PathSmbl].data;
        
        // Move start point if it's not connected to a shape
        if (!pathData.s.shape && pathData.s.data && pathData.s.data.position) {
            pathData.s.data.position.x += deltaX;
            pathData.s.data.position.y += deltaY;
        }
        
        // Move end point if it's not connected to a shape
        if (!pathData.e.shape && pathData.e.data && pathData.e.data.position) {
            pathData.e.data.position.x += deltaX;
            pathData.e.data.position.y += deltaY;
        }
        
        // Redraw the path
        shape[PathSmbl].draw();
    }
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