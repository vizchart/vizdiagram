import { CanvasSmbl } from '../infrastructure/canvas-smbl.js';
import { movementApplay, ProcessedSmbl, shapeSelect } from '../infrastructure/move-evt-proc.js';
import { placeToCell, pointInCanvas } from '../infrastructure/move-scale-applay.js';
import { arrPop, classAdd, classDel, deepCopy, listen, listenDel, positionSet, svgEl } from '../infrastructure/util.js';
import { PathSmbl } from '../shapes/path-smbl.js';
import { ShapeSmbl } from '../shapes/shape-smbl.js';
import { GroupSettings } from './group-settings.js';
import { modalCreate } from '../shapes/modal-create.js';
import { groupMoveToCenter } from './group-move.js';
import { deserialize, serializeShapes } from './dgrm-serialization.js';
import { canvasSelectionClear, canvasSelectionClearSet } from './canvas-clear.js';
import { tipShow } from '../ui/ui.js';

//
// copy past

const clipboardDataKey = 'dgrm';

/** @param {() => Array<ShapeElement & PathElement>} shapesToClipboardGetter */
export function listenCopy(shapesToClipboardGetter) {
	/** @param {ClipboardEvent & {target:HTMLElement | SVGElement}} evt */
	function onCopy(evt) {
		const shapes = shapesToClipboardGetter();
		if (document.activeElement === shapes[0].ownerSVGElement) {
			evt.preventDefault();
			evt.clipboardData.setData(
				clipboardDataKey,
				JSON.stringify(copyDataCreate(shapes)));
		}
	}
	document.addEventListener('copy', onCopy);

	// dispose fn
	return function() {
		listenDel(document, 'copy', onCopy);
	};
}

/** @param {CanvasElement} canvas */
export function copyPastApplay(canvas) {
	listen(document, 'paste', /** @param {ClipboardEvent & {target:HTMLElement | SVGElement}} evt */ evt => {
		if (evt.target.tagName.toUpperCase() === 'TEXTAREA') { return; }
		// if (document.activeElement !== canvas.ownerSVGElement) { return; }

		const dataStr = evt.clipboardData.getData(clipboardDataKey);
		if (!dataStr) { return; }

		tipShow(false);
		canvasSelectionClear(canvas);
		past(canvas, JSON.parse(dataStr));
	});
}

/** @param {CanvasElement} canvas, @param {Array<ShapeElement & PathElement>} shapes */
export const copyAndPast = (canvas, shapes) => past(canvas, copyDataCreate(shapes));

/** @param {Array<ShapeElement & PathElement>} shapes */
const copyDataCreate = shapes => deepCopy(serializeShapes(shapes));

/** @param {CanvasElement} canvas, @param {DiagramSerialized} data */
function past(canvas, data) {
	canvasSelectionClear(canvas);
	groupMoveToCenter(canvas, data);
	groupSelect(canvas, deserialize(canvas, data, true));
}

//
// group select

const highlightSClass = 'highlight-s';
const highlightEClass = 'highlight-e';
const highlightClass = 'highlight';

/** wait long press and draw selected rectangle, or right-click drag
 * @param {CanvasElement} canvas
 */
export function groupSelectApplay(canvas) {
	const svg = canvas.ownerSVGElement;
	let timer;
	/** @type {Point} */ let selectStart;
	/** @type {SVGCircleElement} */ let startCircle;
	/** @type {SVGRectElement} */ let selectRect;
	/** @type {Point} */ let selectRectPos;
	let isRightClickDrag = false;
	let hasMovedDuringRightClick = false;

	/** @param {PointerEvent} evt */
	function onMove(evt) {
		if (evt[ProcessedSmbl] || !selectRect) { reset(); return; }
		evt[ProcessedSmbl] = true;

		if (startCircle) { startCircle.remove(); startCircle = null; }

		// Track if we've moved during right-click to prevent context menu
		if (isRightClickDrag) {
			hasMovedDuringRightClick = true;
		}

		// draw rect
		const x = evt.clientX - selectStart.x;
		const y = evt.clientY - selectStart.y;
		selectRect.width.baseVal.value = Math.abs(x);
		selectRect.height.baseVal.value = Math.abs(y);
		if (x < 0) { selectRectPos.x = evt.clientX; }
		if (y < 0) { selectRectPos.y = evt.clientY; }
		selectRect.style.transform = `translate(${selectRectPos.x}px, ${selectRectPos.y}px)`;
	}

	function onUp() {
		if (selectRect) {
			/** @param {Point} point */
			const inRect = point => pointInRect(
				pointInCanvas(canvas[CanvasSmbl].data, selectRectPos.x, selectRectPos.y),
				selectRect.width.baseVal.value / canvas[CanvasSmbl].data.scale,
				selectRect.height.baseVal.value / canvas[CanvasSmbl].data.scale,
				point.x, point.y);

			// select shapes in rect
			groupSelect(
				canvas,
				/** @type {Iterable<ShapeOrPathElement>} */(canvas.children),
				inRect);
		}

		// Small delay to ensure group selection is fully processed before reset
		setTimeout(() => {
			reset();
		}, 10);
	}

	function reset() {
		clearTimeout(timer); timer = null;
		startCircle?.remove(); startCircle = null;
		selectRect?.remove(); selectRect = null;
		
		// Reset right-click flags after a delay to prevent context menu
		if (isRightClickDrag) {
			setTimeout(() => {
				isRightClickDrag = false;
				hasMovedDuringRightClick = false;
			}, 100);
		} else {
			isRightClickDrag = false;
			hasMovedDuringRightClick = false;
		}

		listenDel(svg, 'pointermove', onMove);
		listenDel(svg, 'wheel', reset);
		listenDel(svg, 'pointerup', onUp);
	}

	/** @param {Event} evt */
	function onContextMenu(evt) {
		// Prevent context menu when doing right-click drag selection or if we moved during right-click
		if (isRightClickDrag || hasMovedDuringRightClick) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	/** @param {PointerEvent} evt */
	function startSelection(evt) {
		canvasSelectionClear(canvas);

		selectStart = { x: evt.clientX, y: evt.clientY };
		selectRectPos = { x: evt.clientX, y: evt.clientY };
		selectRect = svgEl('rect');
		classAdd(selectRect, 'selection-rect');
		
		// Different visual style for right-click vs long press
		if (isRightClickDrag) {
			selectRect.style.cssText = 'rx:8px; fill: rgb(108 187 247 / 15%); stroke: rgb(108 187 247); stroke-width: 2; stroke-dasharray: 8,4;';
		} else {
			selectRect.style.cssText = 'rx:10px; fill: rgb(108 187 247 / 20%); stroke: rgb(108 187 247); stroke-width: 1; stroke-dasharray: 5,5;';
		}
		
		positionSet(selectRect, selectRectPos);
		svg.append(selectRect);
	}

	// Add global context menu prevention
	listen(svg, 'contextmenu', onContextMenu);

	listen(svg, 'pointerdown', /** @param {PointerEvent} evt */ evt => {
		if (evt[ProcessedSmbl] || !evt.isPrimary) { reset(); return; }

		// Check for right-click (button 2)
		if (evt.button === 2) {
			evt.preventDefault(); // Prevent default right-click behavior immediately
			isRightClickDrag = true;
			hasMovedDuringRightClick = false;
			startSelection(evt);
			
			listen(svg, 'pointermove', onMove);
			listen(svg, 'wheel', reset, true);
			listen(svg, 'pointerup', onUp, true);
			return;
		}

		// Original left-click long press behavior
		listen(svg, 'pointermove', onMove);
		listen(svg, 'wheel', reset, true);
		listen(svg, 'pointerup', onUp, true);

		timer = setTimeout(_ => {
			startSelection(evt);

			// Add visual indicator for long press
			startCircle = svgEl('circle');
			classAdd(startCircle, 'ative-elem');
			startCircle.style.cssText = 'r:10px; fill: rgb(108 187 247 / 51%)';
			positionSet(startCircle, { x: evt.clientX, y: evt.clientY });
			svg.append(startCircle);
		}, 500);
	});
}

/**
 * Highlight selected shapes and procces group operations (move, del, copy)
 * @param {CanvasElement} canvas
 * @param {Iterable<ShapeOrPathElement>} elems
 * @param {{(position:Point):boolean}=} inRect
 */
export function groupSelect(canvas, elems, inRect) {
	/** @param {{position:Point}} data */
	const shapeInRect = data => inRect ? inRect(data.position) : true;

	/** @type {Selected} */
	const selected = {
		shapes: [],
		shapesPaths: [],
		pathEnds: [],
		pathEndsPaths: []
	};

	/**
	 * @param {ShapeOrPathElement} pathEl,  @param {PathEnd} pathEnd, @param {string} highlightClass
	 * @returns {1|2|0}
	 */
	function pathEndInRect(pathEl, pathEnd, highlightClass) {
		if (!pathEnd.shape && shapeInRect(pathEnd.data)) {
			selected.pathEnds.push(pathEnd);
			classAdd(pathEl, highlightClass);
			return 1; // connect to end in rect
		} else if (pathEnd.shape && shapeInRect(pathEnd.shape.shapeEl[ShapeSmbl].data)) {
			return 2; // connect to shape in rect
		}
		return 0; // not in rect
	}

	for (const shapeEl of elems) {
		if (shapeEl[ShapeSmbl]) {
			if (shapeInRect(shapeEl[ShapeSmbl].data)) {
				classAdd(shapeEl, highlightClass);
				selected.shapes.push(shapeEl);
			}
		} else if (shapeEl[PathSmbl]) {
			const isStartIn = pathEndInRect(shapeEl, shapeEl[PathSmbl].data.s, highlightSClass);
			const isEndIn = pathEndInRect(shapeEl, shapeEl[PathSmbl].data.e, highlightEClass);

			if (isStartIn === 1 || isEndIn === 1) {
				selected.pathEndsPaths.push(shapeEl);
			}

			if (isStartIn === 2 || isEndIn === 2) {
				selected.shapesPaths.push(shapeEl);
			}
		}
	}

	groupEvtProc(canvas, selected);
}

/**
 * @param {CanvasElement} canvas
 * @param {Selected} selected
 */
function groupEvtProc(canvas, selected) {
	// only one shape selected
	if (selected.shapes?.length === 1 && !selected.pathEnds?.length) {
		classDel(selected.shapes[0], 'highlight');
		shapeSelect(selected.shapes[0]);
		return;
	}

	// only one pathEnd selected
	if (!selected.shapes?.length && selected.pathEnds?.length === 1) {
		pathUnhighlight(selected.pathEndsPaths[0]);
		return;
	}

	// only one path selected
	if (!selected.shapes?.length && selected.pathEnds?.length === 2 && selected.pathEndsPaths?.length === 1) {
		pathUnhighlight(selected.pathEndsPaths[0]);
		shapeSelect(selected.pathEndsPaths[0]);
		return;
	}

	const svg = canvas.ownerSVGElement;
	let isMove = false;
	let isDownOnSelectedShape = false;

	/** @type {{del():void}} */
	let settingsPnl;
	const pnlDel = () => { settingsPnl?.del(); settingsPnl = null; };

	/** @param {PointerEvent & {target:Node}} evt */
	function down(evt) {
		pnlDel();
		isDownOnSelectedShape =
			selected.shapes?.some(shapeEl => shapeEl.contains(evt.target)) ||
			selected.pathEnds?.some(pathEnd => pathEnd.el.contains(evt.target));

		// down on not selected shape
		if (!isDownOnSelectedShape && evt.target !== svg) {
			dispose();
			return;
		}

		if (isDownOnSelectedShape) {
			evt.stopImmediatePropagation();
		}

		svg.setPointerCapture(evt.pointerId);
		listen(svg, 'pointerup', up, true);
		listen(svg, 'pointermove', move);
	}

	/** @param { {(point:Point):void} } pointMoveFn */
	function drawSelection(pointMoveFn) {
		selected.shapes?.forEach(shapeEl => {
			pointMoveFn(shapeEl[ShapeSmbl].data.position);
			shapeEl[ShapeSmbl].drawPosition();
		});
		selected.pathEnds?.forEach(pathEnd => pointMoveFn(pathEnd.data.position));
		selected.pathEndsPaths?.forEach(path => path[PathSmbl].draw());
	}

	/** @param {PointerEvent} evt */
	function up(evt) {
		if (!isMove) {
			// click on canvas
			if (!isDownOnSelectedShape) { dispose(); return; }

			// click on selected shape - show settings panel
			settingsPnl = modalCreate(evt.clientX - 10, evt.clientY - 10, new GroupSettings(cmd => {
				switch (cmd) {
					case 'del':
						arrPop(selected.shapes, shapeEl => shapeEl[ShapeSmbl].del());
						arrPop(selected.pathEndsPaths, pathEl => pathEl[PathSmbl].del());
						dispose();
						// Trigger history save after deletion
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
						break;
					case 'copy': {
						copyAndPast(canvas, elemsToCopyGet(selected)); // will call dispose
						// Trigger history save after copy/paste
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
						break;
					}
					case 'layer-up': {
						moveGroupLayerUp(canvas, selected);
						// Trigger history save after layer change
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
						break;
					}
					case 'layer-down': {
						moveGroupLayerDown(canvas, selected);
						// Trigger history save after layer change
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
						break;
					}
				}
			}));
		} else {
			// move end
			drawSelection(point => placeToCell(point, canvas[CanvasSmbl].data.cell));
			// Trigger history save after group move
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('diagramchange'));
			}, 100);
		}

		dispose(true);
	}

	/** @param {PointerEventFixMovement} evt */
	function move(evt) {
		// move canvas
		if (!isDownOnSelectedShape) { dispose(true); return; }

		// move selected shapes
		isMove = true;
		drawSelection(point => movementApplay(point, canvas[CanvasSmbl].data.scale, evt));
	}

	/** @param {boolean=} saveOnDown */
	function dispose(saveOnDown) {
		listenDel(svg, 'pointerup', up);
		listenDel(svg, 'pointermove', move);
		isMove = false;
		isDownOnSelectedShape = false;

		if (!saveOnDown) {
			canvasSelectionClearSet(canvas, null);
			if (listenCopyDispose) { listenCopyDispose(); listenCopyDispose = null; }

			listenDel(svg, 'pointerdown', down, true);
			pnlDel();
			arrPop(selected.shapes, shapeEl => classDel(shapeEl, highlightClass));
			arrPop(selected.pathEndsPaths, pathEl => pathUnhighlight(pathEl));
			selected.pathEnds = null;
			selected.shapesPaths = null;
		}
	}

	svg.addEventListener('pointerdown', down, { passive: true, capture: true });

	canvasSelectionClearSet(canvas, dispose);
	let listenCopyDispose = listenCopy(() => elemsToCopyGet(selected));
}

/** @param {Selected} selected */
function elemsToCopyGet(selected) {
	/** @type {Set<PathElement>} */
	const fullSelectedPaths = new Set();

	/** @param {PathEnd} pathEnd */
	const pathEndSelected = pathEnd =>
		selected.shapes.includes(pathEnd.shape?.shapeEl) || selected.pathEnds.includes(pathEnd);

	/** @param {PathElement} pathEl */
	function fullSelectedPathAdd(pathEl) {
		if (pathEndSelected(pathEl[PathSmbl].data.s) && pathEndSelected(pathEl[PathSmbl].data.e)) {
			fullSelectedPaths.add(pathEl);
		}
	}

	selected.shapesPaths?.forEach(fullSelectedPathAdd);
	selected.pathEndsPaths?.forEach(fullSelectedPathAdd);

	return [...selected.shapes, ...fullSelectedPaths];
}

/** @param {PathElement} pathEl`` */
function pathUnhighlight(pathEl) {
	classDel(pathEl, highlightSClass);
	classDel(pathEl, highlightEClass);
}

/**
 * 将群组中的所有元素层级上移一层
 * @param {CanvasElement} canvas
 * @param {Selected} selected
 */
function moveGroupLayerUp(canvas, selected) {
	// 获取所有选中的元素
	const allElements = [...(selected.shapes || []), ...(selected.pathEndsPaths || [])];
	
	// 按照在DOM中的顺序排序（从后往前），这样移动时不会影响其他元素的位置
	allElements.sort((a, b) => {
		const aIndex = Array.from(canvas.children).indexOf(a);
		const bIndex = Array.from(canvas.children).indexOf(b);
		return bIndex - aIndex; // 倒序
	});
	
	// 对每个元素执行上移操作
	allElements.forEach(element => {
		const nextSibling = element.nextElementSibling;
		if (nextSibling) {
			// 在SVG中，后面的元素显示在前面，所以要上移需要往后移动
			canvas.insertBefore(nextSibling, element);
		}
	});
}

/**
 * 将群组中的所有元素层级下移一层
 * @param {CanvasElement} canvas
 * @param {Selected} selected
 */
function moveGroupLayerDown(canvas, selected) {
	// 获取所有选中的元素
	const allElements = [...(selected.shapes || []), ...(selected.pathEndsPaths || [])];
	
	// 按照在DOM中的顺序排序（从前往后），这样移动时不会影响其他元素的位置
	allElements.sort((a, b) => {
		const aIndex = Array.from(canvas.children).indexOf(a);
		const bIndex = Array.from(canvas.children).indexOf(b);
		return aIndex - bIndex; // 正序
	});
	
	// 对每个元素执行下移操作
	allElements.forEach(element => {
		const previousSibling = element.previousElementSibling;
		if (previousSibling) {
			// 在SVG中，前面的元素显示在后面，所以要下移需要往前移动
			canvas.insertBefore(element, previousSibling);
		}
	});
}

/**
 * @param {Point} rectPosition
 * @param {number} rectWidth, @param {number} rectHeight
 * @param {number} x, @param {number} y
 */
const pointInRect = (rectPosition, rectWidth, rectHeight, x, y) =>
	rectPosition.x <= x && x <= rectPosition.x + rectWidth &&
	rectPosition.y <= y && y <= rectPosition.y + rectHeight;

/**
 * @typedef { {
 * 	shapes:ShapeElement[]
 * 	shapesPaths:PathElement[]
 * 	pathEnds: PathEnd[]
 *	pathEndsPaths: PathElement[]
 * } } Selected
 */
/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
/** @typedef { import('../shapes/shape-smbl').ShapeElement } ShapeElement */
/** @typedef { import('../shapes/shape-evt-proc').Shape } Shape */
/** @typedef { import('../shapes/path').Path } Path */
/** @typedef { import('../shapes/path').PathEnd } PathEnd */
/** @typedef { import('../shapes/path-smbl').PathElement } PathElement */
/** @typedef { SVGGraphicsElement & { [ShapeSmbl]?: Shape, [PathSmbl]?:Path }} ShapeOrPathElement */
/** @typedef { import('../infrastructure/move-evt-mobile-fix.js').PointerEventFixMovement} PointerEventFixMovement */
/** @typedef { import('./dgrm-serialization.js').DiagramSerialized } DiagramSerialized */
