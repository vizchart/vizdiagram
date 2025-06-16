// Build timestamp: {{BUILD_TIMESTAMP}}
import { moveEvtMobileFix } from './infrastructure/move-evt-mobile-fix.js';
import { CanvasSmbl } from './infrastructure/canvas-smbl.js';
import { moveScaleApplay } from './infrastructure/move-scale-applay.js';
import { evtRouteApplay } from './infrastructure/evt-route-applay.js';
import { tipShow, uiDisable } from './ui/ui.js';
import { srvGet } from './diagram/dgrm-srv.js';
import { deserialize, serialize } from './diagram/dgrm-serialization.js';
import { groupMoveToCenter } from './diagram/group-move.js';
import { copyPastApplay, groupSelectApplay } from './diagram/group-select-applay.js';
import { shapeTypeMap } from './shapes/shape-type-map.js';
import './ui/menu.js';
import './ui/shape-menu.js';
import { HistoryManager } from './infrastructure/history-manager.js';
import './ui/history-buttons.js';
import { dgrmPngChunkGet } from './diagram/dgrm-png.js';
import drupalAPI from './infrastructure/drupal-api.js';
import { keyboardDeleteApply } from './infrastructure/keyboard-delete.js';
import { keyboardMoveApply } from './infrastructure/keyboard-move.js';

// Make drupalAPI globally available
/** @type {any} */(window).drupalAPI = drupalAPI;

// Initialize diagram from URL when page loads
document.addEventListener('DOMContentLoaded', () => {
	// @ts-ignore
	/** @type {import('./infrastructure/canvas-smbl.js').CanvasElement} */ const canvas = document.getElementById('canvas');
	
	if (!canvas) {
		console.error('Canvas element not found!');
		return;
	}
	
	// Get initial scale from URL parameter (but don't apply it yet)
	const urlParams = new URLSearchParams(window.location.search);
	const scaleParam = urlParams.get('scale');
	let targetScale = 1; // Default scale
	
	// Validate target scale (range: 0.1 - 4.0)
	if (scaleParam) {
		const parsedScale = parseFloat(scaleParam);
		if (!isNaN(parsedScale) && parsedScale >= 0.1 && parsedScale <= 4) {
			targetScale = parsedScale;
			console.log(`🔍 Target scale from URL parameter: ${targetScale}`);
		} else {
			console.warn(`⚠️ Invalid scale parameter: ${scaleParam}. Valid range is 0.1-4.0. Using default scale: 1`);
		}
	}
	
	canvas[CanvasSmbl] = {
		data: {
			position: { x: 0, y: 0 },
			scale: 1, // Always start with scale 1, apply target scale after loading
			cell: 24
		},
		shapeMap: shapeTypeMap(canvas)
	};

	// Now canvas.ownerSVGElement should work correctly
	moveEvtMobileFix(canvas.ownerSVGElement);
	evtRouteApplay(canvas.ownerSVGElement);
	copyPastApplay(canvas);
	groupSelectApplay(canvas); // groupSelectApplay must go before moveScaleApplay
	moveScaleApplay(canvas);
	keyboardDeleteApply(canvas); // Enable keyboard delete functionality
	keyboardMoveApply(canvas); // Enable keyboard move functionality

	// Initialize history manager
	const historyManager = new HistoryManager(canvas);

	// Initialize history buttons
	const historyButtons = /** @type { import('./ui/history-buttons.js').HistoryButtons } */(document.getElementById('history-buttons'));
	if (historyButtons) {
		historyButtons.init(historyManager);
	}

	// Set up automatic history saving for user actions
	let saveHistoryTimeout;
	function scheduleHistorySave() {
		clearTimeout(saveHistoryTimeout);
		saveHistoryTimeout = setTimeout(() => {
			historyManager.saveState();
		}, 500); // Save state 500ms after last action
	}

	// Listen for canvas changes to automatically save history
	// Only observe changes to child elements (shapes/paths), not canvas transform/style changes
	const observer = new MutationObserver((mutations) => {
		// Filter out mutations that are only view-related (canvas transform, style changes)
		const hasContentChanges = mutations.some(mutation => {
			// Ignore style changes on the canvas itself (these are view operations)
			if (mutation.type === 'attributes' && 
				mutation.target === canvas && 
				(mutation.attributeName === 'style' || mutation.attributeName === 'transform')) {
				return false;
			}
			
			// Ignore style changes on the SVG element (background, transform, etc.)
			if (mutation.type === 'attributes' && 
				mutation.target === canvas.ownerSVGElement && 
				(mutation.attributeName === 'style' || mutation.attributeName === 'transform')) {
				return false;
			}
			
			// Only care about actual content changes (adding/removing/modifying shapes and paths)
			return mutation.type === 'childList' || 
				   (mutation.type === 'attributes' && 
				    mutation.target !== canvas && 
				    mutation.target !== canvas.ownerSVGElement);
		});
		
		if (hasContentChanges) {
			scheduleHistorySave();
		}
	});

	observer.observe(canvas, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true
	});

	// Remove the general pointerup listener that was causing view operations to be saved
	// canvas.ownerSVGElement.addEventListener('pointerup', () => {
	// 	scheduleHistorySave();
	// });

	// Listen for custom diagram change events (from group operations, layer changes, etc.)
	document.addEventListener('diagramchange', () => {
		scheduleHistorySave();
	});

	// Prevent context menu on canvas to avoid interference with right-click selection
	canvas.ownerSVGElement.addEventListener('contextmenu', (evt) => {
		evt.preventDefault();
	});

	const menu = /** @type { import('./ui/menu').Menu } */(document.getElementById('menu'));
	const shapeMenu = /** @type { import('./ui/shape-menu').ShapeMenu } */(document.getElementById('menu-shape'));
	
	if (menu) menu.init(canvas);
	if (shapeMenu) shapeMenu.init(canvas);

	// load diagram by link
	let url = new URL(window.location.href);
	if (url.searchParams.get('k')) {
		uiDisable(true);
		srvGet(url.searchParams.get('k')).then(appData => {
			url.searchParams.delete('k');
			if (deserialize(canvas, appData)) { 
				tipShow(false); 
				// Clear history and save initial state after loading
				historyManager.clear();
			}
			history.replaceState(null, null, url);
			uiDisable(false);
			url = null;
		});
	} else { url = null; }

	// Function to apply target scale after diagram is loaded
	function applyTargetScale() {
		if (targetScale !== 1) {
			console.log(`🔍 Applying target scale: ${targetScale}`);
			// Use the canvas move function to apply scale while keeping the diagram centered
			const canvasData = canvas[CanvasSmbl].data;
			const centerX = window.innerWidth / 2;
			const centerY = window.innerHeight / 2;
			
			// Calculate new position to keep the diagram centered when scaling
			const newPosX = centerX - (centerX - canvasData.position.x) * (targetScale / canvasData.scale);
			const newPosY = centerY - (centerY - canvasData.position.y) * (targetScale / canvasData.scale);
			
			canvas[CanvasSmbl].move(newPosX, newPosY, targetScale);
		}
	}

	// Check for URL parameters to initialize diagram
	async function initializeFromURL() {
		const urlParams = new URLSearchParams(window.location.search);
		const type = urlParams.get('type');
		const file = urlParams.get('file');
		const uuid = urlParams.get('uuid');
		
		if (!type) {
			return; // No initialization parameters
		}
		
		try {
			console.log(`🔄 Initializing diagram from URL: type=${type}${file ? `, file=${file}` : ''}${uuid ? `, uuid=${uuid}` : ''}`);
			
			if (type === 'png') {
				if (!file) {
					throw new Error('File parameter is required for PNG type');
				}
				await loadFromPNG(file);
			} else if (type === 'json') {
				if (!file) {
					throw new Error('File parameter is required for JSON type');
				}
				await loadFromJSON(file);
			} else if (type === 'drupal') {
				if (!uuid) {
					throw new Error('UUID parameter is required for Drupal type');
				}
				await loadFromDrupal(uuid);
			} else {
				console.error('❌ Invalid type parameter. Use "png", "json", or "drupal"');
				alert('❌ Invalid type parameter. Use "png", "json", or "drupal"');
			}
		} catch (error) {
			console.error('❌ Failed to initialize diagram from URL:', error);
			alert(`❌ Failed to load diagram:\n\n${error.message}`);
		}
	}

	// Load diagram from PNG file
	async function loadFromPNG(filePath) {
		console.log(`📷 Loading PNG diagram from: ${filePath}`);
		
		// Fetch the PNG file
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`Failed to fetch PNG file: ${response.status} ${response.statusText}`);
		}
		
		const blob = await response.blob();
		
		// Extract diagram data from PNG
		const dgrmChunk = await dgrmPngChunkGet(blob);
		if (!dgrmChunk) {
			throw new Error('No diagram data found in PNG file');
		}
		
		// Parse and load the diagram
		const diagramData = JSON.parse(dgrmChunk);
		
		// Center the diagram data before deserializing
		console.log(`🎯 Centering diagram in viewport...`);
		groupMoveToCenter(canvas, diagramData);
		
		const result = deserialize(canvas, diagramData);
		
		if (result && result.length > 0) {
			console.log(`✅ Successfully loaded PNG diagram with ${result.length} elements`);
			
			// Apply target scale after loading
			applyTargetScale();
			
			// Hide the tip if diagram loaded successfully
			tipShow(false);
		} else {
			throw new Error('Failed to deserialize diagram data from PNG');
		}
	}

	// Load diagram from JSON file
	async function loadFromJSON(filePath) {
		console.log(`📄 Loading JSON diagram from: ${filePath}`);
		
		// Use the file path as-is since type is specified in URL parameter
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`Failed to fetch JSON file: ${response.status} ${response.statusText}`);
		}
		
		const diagramData = await response.json();
		
		// Validate JSON format
		if (!diagramData.v || !Array.isArray(diagramData.s)) {
			throw new Error('Invalid diagram format. Expected format: {v: "1.1", s: [...]}');
		}
		
		// Center the diagram data before deserializing
		console.log(`🎯 Centering diagram in viewport...`);
		groupMoveToCenter(canvas, diagramData);
		
		// Load the diagram
		const result = deserialize(canvas, diagramData);
		
		if (result && result.length > 0) {
			console.log(`✅ Successfully loaded JSON diagram with ${result.length} elements`);
			
			// Apply target scale after loading
			applyTargetScale();
			
			// Hide the tip if diagram loaded successfully
			tipShow(false);
			
			// Trigger history save after loading
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('diagramchange'));
			}, 100);
		} else {
			throw new Error('Failed to deserialize diagram data from JSON');
		}
	}

	// Load diagram from Drupal by UUID
	async function loadFromDrupal(uuid) {
		console.log(`🌐 Loading diagram from Drupal by UUID: ${uuid}`);
		
		// Fetch AIGC node data from Drupal
		const result = await drupalAPI.getAIGCNodeByUUID(uuid);
		
		if (!result.success) {
			throw new Error(`Failed to fetch Drupal node: ${result.error}`);
		}
		
		const { diagramData, title, nodeId, uuid: nodeUuid } = result.data;
		
		if (!diagramData) {
			throw new Error('No diagram data found in Drupal node content_data field');
		}
		
		// Validate diagram format
		if (!diagramData.v || !Array.isArray(diagramData.s)) {
			throw new Error('Invalid diagram format in Drupal node. Expected format: {v: "1.1", s: [...]}');
		}
		
		// Center the diagram data before deserializing
		console.log(`🎯 Centering diagram in viewport...`);
		groupMoveToCenter(canvas, diagramData);
		
		// Load the diagram
		const deserializeResult = deserialize(canvas, diagramData);
		
		if (deserializeResult && deserializeResult.length > 0) {
			console.log(`✅ Successfully loaded Drupal diagram "${title}" with ${deserializeResult.length} elements`);
			
			// Apply target scale after loading
			applyTargetScale();
			
			// Set current diagram state for future saves (use UUID for updates)
			drupalAPI.setCurrentDiagram(nodeUuid, title);
			
			// Hide the tip if diagram loaded successfully
			tipShow(false);
			
			// Clear history and save initial state after loading
			historyManager.clear();
			
			// Trigger history save after loading
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('diagramchange'));
			}, 100);
		} else {
			throw new Error('Failed to deserialize diagram data from Drupal node');
		}
	}

	// Initialize from URL after everything is set up
	initializeFromURL().then(() => {
		// If no diagram was loaded but scale parameter was provided, apply it to empty canvas
		const urlParams = new URLSearchParams(window.location.search);
		const type = urlParams.get('type');
		if (!type && targetScale !== 1) {
			console.log(`🔍 Applying scale to empty canvas: ${targetScale}`);
			applyTargetScale();
		}
	});
});
