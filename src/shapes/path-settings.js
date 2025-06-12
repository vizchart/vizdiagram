import { copyAndPast } from '../diagram/group-select-applay.js';
import { classAdd, classDel, clickForAll, listen, classSingleAdd, evtTargetAttr } from '../infrastructure/util.js';
import { PathSmbl } from './path-smbl.js';

/**
 * 将路径层级上移一层
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./path-smbl').PathElement} pathElement
 */
function moveLayerUp(canvas, pathElement) {
	const nextSibling = pathElement.nextElementSibling;
	if (nextSibling) {
		// 在SVG中，后面的元素显示在前面，所以要上移需要往后移动
		canvas.insertBefore(nextSibling, pathElement);
		// 触发历史记录保存
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('diagramchange'));
		}, 100);
	}
}

/**
 * 将路径层级下移一层
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./path-smbl').PathElement} pathElement
 */
function moveLayerDown(canvas, pathElement) {
	const previousSibling = pathElement.previousElementSibling;
	if (previousSibling) {
		// 在SVG中，前面的元素显示在后面，所以要下移需要往前移动
		canvas.insertBefore(pathElement, previousSibling);
		// 触发历史记录保存
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('diagramchange'));
		}, 100);
	}
}

export class PathSettings extends HTMLElement {
	/**
 	 * @param {CanvasElement} canvas
	 * @param {PathElement} pathElement
	 */
	constructor(canvas, pathElement) {
		super();
		/** @private */
		this._pathElement = pathElement;

		/** @private */
		this._canvas = canvas;
	}

	connectedCallback() {
		const pathStyles = this._pathElement[PathSmbl].data.styles;
		const actStyle = style => this._pathElement[PathSmbl].data.styles?.includes(style) ? 'class="actv"' : '';

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
			.actv { 
				fill-opacity: 1;
				stroke-opacity: 1;
			}
		</style>
		<ap-shape-edit id="edit" edit-btn="true">
			<div class="ln">
				<svg data-cmd data-cmd-arg="arw-s" ${actStyle('arw-s')} viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="arw-e" ${actStyle('arw-e')} viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="dash" ${actStyle('dash')} viewBox="0 0 24 24" width="24" height="24"><path d="M 2,11 L 20,11" stroke="rgb(52,71,103)" style="stroke-dasharray: 4,3; stroke-width: 3;"></path></svg>
			</div>
		</ap-shape-edit>`;

		// colors, del, layer controls
		listen(shadow.getElementById('edit'), 'cmd', /** @param {CustomEvent<{cmd:string, arg:string}>} evt */ evt => {
			switch (evt.detail.cmd) {
				case 'style': classSingleAdd(this._pathElement, this._pathElement[PathSmbl].data, 'cl-', evt.detail.arg); break;
				case 'del': this._pathElement[PathSmbl].del(); break;
				case 'copy': copyAndPast(this._canvas, [this._pathElement]); break;
				case 'layer-up': moveLayerUp(this._canvas, this._pathElement); break;
				case 'layer-down': moveLayerDown(this._canvas, this._pathElement); break;
			}
		});

		// path styles
		clickForAll(shadow, '[data-cmd]', evt => {
			const styleToToggle = evtTargetAttr(evt, 'data-cmd-arg');
			if (!styleToToggle) { return; }

			const pathData = this._pathElement[PathSmbl].data;
			if (!pathData.styles) { pathData.styles = []; }

			const styleIndex = pathData.styles.indexOf(styleToToggle);
			if (styleIndex > -1) {
				// Remove style
				pathData.styles.splice(styleIndex, 1);
				classDel(this._pathElement, styleToToggle);
			} else {
				// Add style
				pathData.styles.push(styleToToggle);
				classAdd(this._pathElement, styleToToggle);
			}

			this._pathElement[PathSmbl].draw();
		});
	}
}
customElements.define('ap-path-settings', PathSettings);

/** @typedef { import('./path-smbl').PathElement } PathElement */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
