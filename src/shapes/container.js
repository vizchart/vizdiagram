import { ceil, child, classAdd, positionSet } from '../infrastructure/util.js';
import { shapeCreate } from './shape-evt-proc.js';
import { settingsPnlCreate } from './shape-settings.js';
import { ShapeSmbl } from './shape-smbl.js';

/**
 * @param {CanvasElement} canvas
 * @param {ContainerData} containerData
 */
export function container(canvas, containerData) {
	containerData.w = containerData.w ?? 120;
	containerData.h = containerData.h ?? 80;

	const templ = `
		<rect data-key="outer" data-evt-no data-evt-index="2" width="168" height="128" x="-84" y="-64" fill="transparent" stroke="transparent" stroke-width="0" />
		<rect data-key="main" width="120" height="80" x="-60" y="-40" rx="8" ry="8" fill="transparent" stroke="#1aaee5" stroke-width="2" />
		<circle data-key="corner-tl" cx="-60" cy="-40" r="4" fill="transparent" stroke="#1aaee5" stroke-width="1.5" />
		<circle data-key="corner-tr" cx="60" cy="-40" r="4" fill="transparent" stroke="#1aaee5" stroke-width="1.5" />
		<circle data-key="corner-bl" cx="-60" cy="40" r="4" fill="transparent" stroke="#1aaee5" stroke-width="1.5" />
		<circle data-key="corner-br" cx="60" cy="40" r="4" fill="transparent" stroke="#1aaee5" stroke-width="1.5" />
		<text data-key="text" y="0" x="0" text-anchor="middle" style="pointer-events: none; font-size: 12px;" fill="#fff">&nbsp;</text>`;

	const shape = shapeCreate(canvas, containerData, templ,
		{
			right: { dir: 'right', position: { x: 60, y: 0 } },
			left: { dir: 'left', position: { x: -60, y: 0 } },
			bottom: { dir: 'bottom', position: { x: 0, y: 40 } },
			top: { dir: 'top', position: { x: 0, y: -40 } }
		},
		// onTextChange
		txtEl => {
			const textBox = txtEl.getBBox();
			const minWidth = ceil(120, 40, textBox.width + 20); // 20px padding
			const minHeight = ceil(80, 40, textBox.height + 20);

			// Only expand the container if text doesn't fit, don't shrink if user manually resized
			const newWidth = Math.max(containerData.w, minWidth);
			const newHeight = Math.max(containerData.h, minHeight);

			if (containerData.w !== newWidth || containerData.h !== newHeight) {
				containerData.w = newWidth;
				containerData.h = newHeight;
				resize();
			}
		},
		// settingsPnlCreateFn
		settingsPnlCreate);

	classAdd(shape.el, 'shcontainer');

	function resize() {
		const mainX = containerData.w / -2;
		const mainY = containerData.h / -2;
		const rightX = -mainX;
		const bottomY = -mainY;

		// Update connectors
		shape.cons.right.position.x = rightX;
		shape.cons.left.position.x = mainX;
		shape.cons.bottom.position.y = bottomY;
		shape.cons.top.position.y = mainY;
		for (const connectorKey in shape.cons) {
			positionSet(child(shape.el, connectorKey), shape.cons[connectorKey].position);
		}

		// Update main rectangle
		rectSet(shape.el, 'main', containerData.w, containerData.h, mainX, mainY);
		rectSet(shape.el, 'outer', containerData.w + 48, containerData.h + 48, mainX - 24, mainY - 24);

		// Update corner circles
		const cornerTL = child(shape.el, 'corner-tl');
		const cornerTR = child(shape.el, 'corner-tr');
		const cornerBL = child(shape.el, 'corner-bl');
		const cornerBR = child(shape.el, 'corner-br');

		cornerTL.cx.baseVal.value = mainX;
		cornerTL.cy.baseVal.value = mainY;
		cornerTR.cx.baseVal.value = rightX;
		cornerTR.cy.baseVal.value = mainY;
		cornerBL.cx.baseVal.value = mainX;
		cornerBL.cy.baseVal.value = bottomY;
		cornerBR.cx.baseVal.value = rightX;
		cornerBR.cy.baseVal.value = bottomY;

		shape.draw();
	}

	if (containerData.w !== 120 || containerData.h !== 80) { 
		resize(); 
	} else { 
		shape.draw(); 
	}

	// Set custom draw method for resize handle
	shape.el[ShapeSmbl].draw = resize;

	return shape.el;
}

/**
 * @param {Element} svgGrp, @param {string} key,
 * @param {number} w, @param {number} h
 * @param {number} x, @param {number} y
 */
function rectSet(svgGrp, key, w, h, x, y) {
	/** @type {SVGRectElement} */ const rect = child(svgGrp, key);
	rect.width.baseVal.value = w;
	rect.height.baseVal.value = h;
	rect.x.baseVal.value = x;
	rect.y.baseVal.value = y;
}

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
/** @typedef { import('./shape-evt-proc').CanvasData } CanvasData */
/** @typedef { import('./shape-evt-proc').ConnectorsData } ConnectorsData */
/**
@typedef {{
	type:number, position: Point, title?: string, styles?: string[],
	w?:number, h?:number
}} ContainerData */ 