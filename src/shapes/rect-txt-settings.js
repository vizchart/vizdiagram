import { copyAndPast } from '../diagram/group-select-applay.js';
import { classAdd, classDel, clickForAll, listen, classSingleAdd, evtTargetAttr } from '../infrastructure/util.js';
import { modalCreate } from './modal-create.js';
import { ShapeSmbl } from './shape-smbl.js';

/**
 * @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 * @param {number} bottomX positon of the bottom left corner of the panel
 * @param {number} bottomY positon of the bottom left corner of the panel
 */
export const rectTxtSettingsPnlCreate = (canvas, shapeElement, bottomX, bottomY) =>
	modalCreate(bottomX, bottomY, new RectTxtSettings(canvas, shapeElement));

/**
 * 将组件层级上移一层
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 */
function moveLayerUp(canvas, shapeElement) {
	const nextSibling = shapeElement.nextElementSibling;
	if (nextSibling) {
		// 在SVG中，后面的元素显示在前面，所以要上移需要往后移动
		canvas.insertBefore(nextSibling, shapeElement);
		// 触发历史记录保存
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('diagramchange'));
		}, 100);
	}
}

/**
 * 将组件层级下移一层
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 */
function moveLayerDown(canvas, shapeElement) {
	const previousSibling = shapeElement.previousElementSibling;
	if (previousSibling) {
		// 在SVG中，前面的元素显示在后面，所以要下移需要往前移动
		canvas.insertBefore(shapeElement, previousSibling);
		// 触发历史记录保存
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('diagramchange'));
		}, 100);
	}
}

class RectTxtSettings extends HTMLElement {
	/**
 	 * @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas
	 * @param {import('./shape-smbl').ShapeElement} rectElement
	 */
	constructor(canvas, rectElement) {
		super();
		/** @private */
		this._rectElement = rectElement;

		/** @private */
		this._canvas = canvas;
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.innerHTML = `
		<style>
			.ln { display: flex; }
			.ln > * {
				height: 24px;
				padding: 10px;
				fill-opacity: 0.3;
				stroke-opacity: 0.3;
			}
			[data-cmd] { cursor: pointer; }

			.ta-1 [data-cmd-arg="1"],
			.ta-2 [data-cmd-arg="2"],
			.ta-3 [data-cmd-arg="3"]
			{ fill-opacity: 1; stroke-opacity: 1; }
		</style>
		<ap-shape-edit id="edit" edit-btn="true">
			<div class="ln">
				<svg data-cmd data-cmd-arg="1" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 15h14v2H3v-2zm0-5h18v2H3v-2zm0-5h14v2H3V9z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="2" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm2 15h14v2H5v-2zm-2-5h18v2H3v-2zm2-5h14v2H5V9z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="3" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm4 15h14v2H7v-2zm-4-5h18v2H3v-2zm4-5h14v2H7V9z" fill="rgb(52,71,103)"/></svg>
			</div>
		</ap-shape-edit>`;

		const rectData = /** @type {import('./rect.js').RectData} */(this._rectElement[ShapeSmbl].data);

		const editEl = shadow.getElementById('edit');
		classAdd(editEl, `ta-${rectData.a}`);

		// colors, del, layer controls
		listen(editEl, 'cmd', /** @param {CustomEvent<{cmd:string, arg:string}>} evt */ evt => {
			switch (evt.detail.cmd) {
				case 'style': classSingleAdd(this._rectElement, rectData, 'cl-', evt.detail.arg); break;
				case 'del': this._rectElement[ShapeSmbl].del(); break;
				case 'copy': copyAndPast(this._canvas, [this._rectElement]); break;
				case 'layer-up': moveLayerUp(this._canvas, this._rectElement); break;
				case 'layer-down': moveLayerDown(this._canvas, this._rectElement); break;
			}
		});

		// text align
		clickForAll(shadow, '[data-cmd]', evt => {
			const alignNew = /** @type {1|2|3} */(Number.parseInt(evtTargetAttr(evt, 'data-cmd-arg')));
			if (alignNew === rectData.a) { return; }

			const alignOld = rectData.a;

			// applay text align to shape
			rectData.a = alignNew;
			this._rectElement[ShapeSmbl].draw();

			// highlight text align btn in settings panel
			classDel(editEl, `ta-${alignOld}`);
			classAdd(editEl, `ta-${rectData.a}`);
		});
	}
}
customElements.define('ap-rect-txt-settings', RectTxtSettings);
