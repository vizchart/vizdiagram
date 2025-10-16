import { canvasClear } from '../diagram/canvas-clear.js';
import { dgrmPngChunkGet, dgrmPngCreate } from '../diagram/dgrm-png.js';
import { deserialize, serialize } from '../diagram/dgrm-serialization.js';
import { fileOpen, fileSave } from '../infrastructure/file.js';
import { tipShow, uiDisable } from './ui.js';
import drupalAPI from '../infrastructure/drupal-api.js';
import { showSaveInputDialog, showSaveSuccessDialog, showSaveErrorDialog, showInfoDialog, showInfoDialogWithLogin } from './save-popup.js';

export class Menu extends HTMLElement {
	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.innerHTML = `
			<style>
			.menu {
				position: fixed;
				top: 15px;
				left: 15px;
				cursor: pointer;
			}
			#options {
				position: fixed;
				padding: 15px;
				box-shadow: 0px 0px 58px 2px rgb(34 60 80 / 20%);
				border-radius: 16px;
				background-color: rgba(255,255,255, .9);

				top: 0px;
				left: 0px;

				z-index: 1;
			}

			#options div, #options a { 
				color: rgb(13, 110, 253); 
				cursor: pointer; margin: 10px 0;
				display: flex;
				align-items: center;
				line-height: 25px;
				text-decoration: none;
			}
			#options div svg, #options a svg { margin-right: 10px; }
			</style>
			<svg id="menu" class="menu" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" fill="rgb(52,71,103)"/></svg>
			<div id="options" style="visibility: hidden;">
			 	<div id="menu2" style="margin: 0 0 15px;"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" fill="rgb(52,71,103)"/></svg></div>
				<div id="new"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M9 2.003V2h10.998C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8l6-5.997zM5.83 8H9V4.83L5.83 8zM11 4v5a1 1 0 0 1-1 1H5v10h14V4h-8z" fill="rgb(52,71,103)"/></svg>New Diagram</div>
				<div id="open"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 21a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7.414l2 2H20a1 1 0 0 1 1 1v3h-2V7h-7.414l-2-2H4v11.998L5.5 11h17l-2.31 9.243a1 1 0 0 1-.97.757H3zm16.938-8H7.062l-1.5 6h12.876l1.5-6z" fill="rgb(52,71,103)"/></svg>Open Diagram Image</div>
				<div id="import"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M4 19h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2v7zM14 9h3l-5 6-5-6h3V3h4v6z" fill="rgb(52,71,103)"/></svg>Import Metadata</div>
				<div id="export"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2zm7-10l5 6h-3v6h-4V8H6l5-6z" fill="rgb(52,71,103)"/></svg>Export Metadata</div>
				<div id="save"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2zM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm5 12v4h6v-4H9z" fill="rgb(52,71,103)"/></svg>Save to Cloud</div>
				<div id="download"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z" fill="rgb(52,71,103)"/></svg>Download Image</div>
		 	</div>`;

		const options = shadow.getElementById('options');
		function toggle() { options.style.visibility = options.style.visibility === 'visible' ? 'hidden' : 'visible'; }

		/** @param {string} id, @param {()=>void} handler */
		function click(id, handler) {
			shadow.getElementById(id).onclick = _ => {
				uiDisable(true);
				handler();
				toggle();
				uiDisable(false);
			};
		}

		shadow.getElementById('menu').onclick = toggle;
		shadow.getElementById('menu2').onclick = toggle;

		click('new', () => { 
			canvasClear(this._canvas); 
			tipShow(true);
			// 重置当前图表状态
			drupalAPI.resetCurrentDiagram();
			// Trigger history save after clearing
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('diagramchange'));
			}, 100);
		});

		// Save to Drupal Cloud
		click('save', async () => {
			try {
				// 检查登录状态
				console.log('🔍 Checking login status...')
				const loginStatus = await drupalAPI.checkLoginStatus()
				
				if (!loginStatus.isLoggedIn) {
					await showInfoDialogWithLogin('Login Required', `Please login to save diagrams to cloud\n\n<a href="${drupalAPI.getLoginURL()}">Click here to login</a>, then return to save`, 'warning')
					return
				}
				
				console.log('✅ User is logged in:', loginStatus.user)
				
				// 获取图表标题 - 使用自定义弹窗，如果是已有图表则使用当前标题
				const currentDiagram = drupalAPI.getCurrentDiagram();
				const defaultTitle = currentDiagram.title || 'My Diagram';
				const title = await showSaveInputDialog(defaultTitle)
				if (!title) {
					console.log('❌ Save cancelled: No title provided')
					return
				}
				
				console.log('📊 Generating diagram image with embedded data...')
				const button = shadow.getElementById('save')
				if (button && 'disabled' in button) {
					button.disabled = true;
					button.textContent = 'Generating image...';
				}
				
				// 序列化图表数据
				const serialized = serialize(this._canvas);
				if (serialized.s.length === 0) {
					throw new Error('Diagram is empty');
				}
				
				// 生成包含图表数据的PNG图片（使用与Download Image相同的方法）
				const coverBlob = await new Promise((resolve, reject) => {
					dgrmPngCreate(
						this._canvas,
						JSON.stringify(serialized),
						(png) => {
							if (png) {
								resolve(png);
							} else {
								reject(new Error('Failed to generate diagram image'));
							}
						}
					);
				});
				
				console.log('☁️ Saving to cloud...')
				if (button) {
					button.textContent = 'Saving to cloud...';
				}
				
				// 保存到云端
				const result = await drupalAPI.saveDiagramToCloud(title, coverBlob, this._canvas)
				
				if (result.success) {
					console.log('🎉 Save successful:', result)
					const action = result.isNew ? 'created' : 'updated';
					
					// 使用自定义成功弹窗
					const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
						? 'graphmaker.intra.vizcms.cn' 
						: window.location.hostname;
					
					await showSaveSuccessDialog({
						title: title,
						action: action,
						nodeId: result.nodeId,
						domain: domain
					})
				} else {
					throw new Error(result.error)
				}
				
			} catch (error) {
				console.error('❌ Save to cloud failed:', error)
				await showSaveErrorDialog('Failed to save diagram to cloud.\n\nPlease check your login status and try again.')
			} finally {
				const button = shadow.getElementById('save')
				if (button) {
					if ('disabled' in button) {
						button.disabled = false;
					}
					button.innerHTML = `
						<svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2zM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm5 12v4h6v-4H9z" fill="rgb(52,71,103)"/></svg>Save to Cloud
					`;
				}
			}
		});

		// Download diagram image (original save functionality)
		click('download', async () => {
			const serialized = serialize(this._canvas);
			if (serialized.s.length === 0) { 
				await showInfoDialog('Download Failed', 'Diagram is empty', 'warning');
				return; 
			}

			dgrmPngCreate(
				this._canvas,
				JSON.stringify(serialized),
				png => fileSave(png, 'dgrm.png'));
		});

		click('open', () =>
			fileOpen('.png', async png => await loadData(this._canvas, png))
		);

		// Import metadata (JSON format)
		click('import', async () => {
			// Create file input for JSON files
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json,application/json';
			input.style.display = 'none';
			
			input.onchange = async (event) => {
				const target = /** @type {HTMLInputElement} */(event.target);
				const file = target.files?.[0];
				if (!file) return;
				
				try {
					const text = await file.text();
					const jsonData = JSON.parse(text);
					
					// Validate JSON format
					if (!jsonData.v || !Array.isArray(jsonData.s)) {
						throw new Error('Invalid diagram format. Expected format: {v: "1.1", s: [...]}');
					}
					
					// Clear current canvas and import new diagram
					canvasClear(this._canvas);
					const result = deserialize(this._canvas, jsonData, true);
					
					if (result && result.length > 0) {
						tipShow(false);
						// Reset current diagram state
						drupalAPI.resetCurrentDiagram();
						// Trigger history save after importing
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
						await showInfoDialog('Import Successful', `Successfully imported diagram with ${result.length} elements`, 'success');
					} else {
						await showInfoDialog('Import Warning', 'No elements were imported. Please check the JSON format.', 'warning');
					}
					
				} catch (error) {
					console.error('Import error:', error);
					await showInfoDialog('Import Failed', `Failed to import diagram:\n\n${error.message}\n\nPlease ensure the file contains valid diagram JSON data.`, 'error');
				}
				
				// Clean up
				document.body.removeChild(input);
			};
			
			// Trigger file selection
			document.body.appendChild(input);
			input.click();
		});

		// Export metadata (JSON format)
		click('export', async () => {
			const serialized = serialize(this._canvas);
			if (serialized.s.length === 0) { 
				await showInfoDialog('Export Failed', 'Diagram is empty', 'warning');
				return; 
			}

			// Create JSON string with proper formatting
			const jsonString = JSON.stringify(serialized, null, 2);
			
			// Create blob and download
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			// Create download link
			const a = document.createElement('a');
			a.href = url;
			a.download = 'diagram-metadata.json';
			a.style.display = 'none';
			
			// Trigger download
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			
			// Clean up
			URL.revokeObjectURL(url);
			
			await showInfoDialog('Export Successful', `Diagram metadata exported successfully!\n\nFile: diagram-metadata.json\nElements: ${serialized.s.length}\n\nYou can edit this JSON file and import it back using "Import Metadata".`, 'success');
		});
	}

	/** @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas */
	init(canvas) {
		/** @private */ this._canvas = canvas;

		// file drag to window
		document.body.addEventListener('dragover', evt => { evt.preventDefault(); });
		document.body.addEventListener('drop', async evt => {
			evt.preventDefault();

			if (evt.dataTransfer?.items?.length !== 1 ||
				evt.dataTransfer.items[0].kind !== 'file' ||
				evt.dataTransfer.items[0].type !== 'image/png') {
				showInfoDialog('File Error', 'File cannot be read. Use the exact image file you got from the application.', 'error');
				return;
			}

			await loadData(this._canvas, evt.dataTransfer.items[0].getAsFile());
		});
	}
}
customElements.define('ap-menu', Menu);

/** @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas,  @param {Blob} png  */
async function loadData(canvas, png) {
	const dgrmChunk = await dgrmPngChunkGet(png);
	if (!dgrmChunk) { 
		await showInfoDialog('File Error', 'File cannot be read. Use the exact image file you got from the application.', 'error');
		return; 
	}
	if (deserialize(canvas, JSON.parse(dgrmChunk))) {
		tipShow(false);
	}
}

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
