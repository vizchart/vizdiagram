import { ceil, child, classAdd, classDel, positionSet } from '../infrastructure/util.js';
import { shapeCreate } from './shape-evt-proc.js';
import { settingsPnlCreate } from './shape-settings.js';
import { ShapeSmbl } from './shape-smbl.js';
import { showInfoDialog, showInfoDialogWithLogin } from '../ui/save-popup.js';

/**
 * Convert File to base64 data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(/** @type {string} */(reader.result));
		reader.onerror = error => reject(error);
		reader.readAsDataURL(file);
	});
}

/**
 * @param {CanvasElement} canvas
 * @param {ImageData} imageData
 */
export function image(canvas, imageData) {
	imageData.w = imageData.w ?? 120;
	imageData.h = imageData.h ?? 120;
	imageData.imageUrl = imageData.imageUrl ?? null;
	imageData.fileId = imageData.fileId ?? null;
	imageData.isBase64 = imageData.isBase64 ?? false;

	const templ = `
		<rect data-key="outer" data-evt-no data-evt-index="2" width="168" height="168" x="-84" y="-84" fill="transparent" stroke="transparent" stroke-width="0" />
		<rect data-key="main" width="120" height="120" x="-60" y="-60" rx="0" ry="0" fill="transparent" stroke="#dee2e6" stroke-width="2" />
		<g data-key="placeholder" style="pointer-events: none;">
			<path d="M-20,-20 L20,-20 L20,20 L-20,20 Z M-15,-10 L15,-10 L15,15 L-15,15 Z" fill="#6c757d" opacity="0.3"/>
			<circle cx="-5" cy="-5" r="3" fill="#6c757d" opacity="0.5"/>
			<path d="M-15,5 L-5,-5 L5,5 L15,-5" stroke="#6c757d" stroke-width="2" fill="none" opacity="0.5"/>
		</g>
		<image data-key="image" x="-60" y="-60" width="120" height="120" style="pointer-events: none; display: none;" preserveAspectRatio="xMidYMid meet"/>
		<text data-key="text" y="45" x="0" text-anchor="middle" style="pointer-events: none; font-size: 12px;" fill="#6c757d">双击上传图片</text>`;

	/** @type {ConnectorsData} */
	const initialConnectors = {
		right: { dir: 'right', position: { x: 60, y: 0 } },
		left: { dir: 'left', position: { x: -60, y: 0 } },
		bottom: { dir: 'bottom', position: { x: 0, y: 60 } },
		top: { dir: 'top', position: { x: 0, y: -60 } }
	};
	
	console.log('🖼️ Creating image with initial connectors:', initialConnectors);

	const shape = shapeCreate(canvas, imageData, templ, initialConnectors,
		// onTextChange - 图片组件不需要文本变化处理
		null,
		// settingsPnlCreateFn
		settingsPnlCreate);

	classAdd(shape.el, 'shimage');

	// 添加双击事件监听器
	shape.el.addEventListener('dblclick', handleDoubleClick);

	// 如果已有图片URL，显示图片
	if (imageData.imageUrl) {
		console.log('🖼️ Loading existing image URL:', imageData.imageUrl);
		showImage(imageData.imageUrl);
	}

	let currentW = imageData.w;
	let currentH = imageData.h;

	/** @param {boolean?=} force */
	function resize(force) {
		if (!force && currentW === imageData.w && currentH === imageData.h) {
			return;
		}



		const mainX = imageData.w / -2;
		const mainY = imageData.h / -2;
		const rightX = imageData.w / 2;
		const bottomY = imageData.h / 2;

		// 修复连接点位置计算 - 与其他组件保持一致
		// 注意：right连接器应该在正X方向，所以用-mainX (因为mainX是负值)
		// left连接器应该在负X方向，所以用mainX
		shape.cons.right.position.x = -mainX;  // -(-60) = 60
		shape.cons.left.position.x = mainX;    // -60
		shape.cons.bottom.position.y = -mainY; // -(-60) = 60
		shape.cons.bottom.position.x = 0;
		shape.cons.top.position.y = mainY;     // -60
		shape.cons.top.position.x = 0;

		for (const connectorKey in shape.cons) {
			const connectorEl = child(shape.el, connectorKey);
			positionSet(connectorEl, shape.cons[connectorKey].position);
		}

		rectSet(shape.el, 'main', imageData.w, imageData.h, mainX, mainY);
		rectSet(shape.el, 'outer', imageData.w + 48, imageData.h + 48, mainX - 24, mainY - 24);
		
		// 更新图片尺寸
		const imageEl = child(shape.el, 'image');
		imageEl.setAttribute('x', mainX);
		imageEl.setAttribute('y', mainY);
		imageEl.setAttribute('width', imageData.w);
		imageEl.setAttribute('height', imageData.h);

		currentW = imageData.w;
		currentH = imageData.h;

		shape.draw();
	}

	/**
	 * 处理双击事件
	 */
	async function handleDoubleClick(event) {
		event.stopPropagation();
		
		// 检查是否有当前图表节点
		const drupalAPI = /** @type {any} */(window).drupalAPI;
		if (!drupalAPI) {
			await showInfoDialog('系统错误', '❌ Drupal API 不可用', 'error');
			return;
		}

		const currentDiagram = drupalAPI.getCurrentDiagram();

		// 创建文件选择器
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.style.display = 'none';

		input.onchange = async (e) => {
			const target = /** @type {HTMLInputElement} */(e.target);
			const file = target.files?.[0];
			if (!file) return;

			try {
				// 显示加载状态
				showLoading();

				const fileSizeKB = file.size / 1024;
				console.log('📸 Processing image:');
				console.log('  - File name:', file.name);
				console.log('  - File size:', file.size, 'bytes', `(${fileSizeKB.toFixed(2)} KB)`);
				console.log('  - File type:', file.type);

				// 检查文件大小，如果小于100KB则使用base64嵌入到JSON中
				if (file.size < 100 * 1024) { // 100KB = 100 * 1024 bytes
					console.log('📦 File is less than 100KB, using base64 embedding...');
					
					// 转换为base64 data URL
					const base64Url = await fileToBase64(file);
					
					// 直接在本地显示图片，不上传到服务器
					// base64数据将自动嵌入到图表JSON中，无需服务器存储
					imageData.imageUrl = base64Url;
					imageData.fileId = null; // 标记为本地base64图片
					imageData.isBase64 = true; // 添加标记用于区分base64和服务器图片
					
					console.log('  - Using base64 URL (first 100 chars):', base64Url.substring(0, 100) + '...');
					console.log('  - Base64 image will be embedded in diagram JSON');
					
					// 上传新图片时自动调整组件大小
					showImage(base64Url, true);
					
					console.log('✅ Image embedded as base64 successfully');
					
					// 触发图表变化事件以保存历史
					setTimeout(() => {
						document.dispatchEvent(new CustomEvent('diagramchange'));
					}, 100);
				} else {
					console.log('📤 File is larger than 100KB, uploading to server...');
					
					// 检查用户登录状态（仅对需要上传的大文件）
					console.log('🔍 Checking login status before image upload...');
					const loginStatus = await drupalAPI.checkLoginStatus();
					if (!loginStatus.isLoggedIn) {
						await showInfoDialogWithLogin('Login Required', '🔐 Images >100KB need server upload\n\n<a href="/user/login">Click here to login</a>, then return to save image\n\n💡 Tip: Images <100KB can be embedded without login', 'warning');
						return;
					}

					// 检查图表是否已保存（仅对需要上传的大文件）
					if (!currentDiagram.nodeId) {
						await showInfoDialog('需要保存画布', '⚠️ 图片大于100KB需要上传到服务器\n\n请先保存您的画布，然后才能上传大图片\n\n💡 提示：如果使用小于100KB的图片，可以直接嵌入无需保存画布', 'warning');
						return;
					}
					
					// 上传图片到ref_images字段（原有逻辑）
					const result = await drupalAPI.addImageToRefImagesField(file, currentDiagram.nodeId);
					
					if (result.success) {
						console.log('  - File ID:', result.fileId);
						console.log('  - Server file URL:', result.fileUrl);
						
						// 使用服务器返回的文件URL，如果没有则使用本地预览URL
						let imageUrl;
						if (result.fileUrl) {
							// 使用服务器的实际文件URL
							imageUrl = result.fileUrl;
							console.log('  - Using server URL:', imageUrl);
						} else {
							// 回退到本地预览URL
							imageUrl = URL.createObjectURL(file);
							console.log('  - Fallback to blob URL:', imageUrl);
						}
						
						imageData.imageUrl = imageUrl;
						imageData.fileId = result.fileId;
						imageData.isBase64 = false; // 标记为服务器图片
						console.log('  - Stored in imageData.imageUrl:', imageData.imageUrl);
						console.log('  - Stored in imageData.fileId:', imageData.fileId);
						
						// 上传新图片时自动调整组件大小
						showImage(imageUrl, true);
						
						console.log('✅ Image uploaded successfully to ref_images field');
						
						// 触发图表变化事件以保存历史
						setTimeout(() => {
							document.dispatchEvent(new CustomEvent('diagramchange'));
						}, 100);
					} else {
						throw new Error(result.error || 'Upload failed');
					}
				}
			} catch (error) {
				console.error('❌ Image processing failed:', error);
				await showInfoDialog('图片处理失败', `❌ 图片处理失败:\n\n${error.message}`, 'error');
				hideLoading();
			}

			// 清理
			document.body.removeChild(input);
		};

		// 触发文件选择
		document.body.appendChild(input);
		input.click();
	}

	/**
	 * 显示图片
	 * @param {string} imageUrl
	 * @param {boolean} autoResize - 是否自动调整组件大小以适应图片
	 */
	function showImage(imageUrl, autoResize = false) {
		const imageEl = child(shape.el, 'image');
		const placeholderEl = child(shape.el, 'placeholder');
		const textEl = child(shape.el, 'text');
		const mainEl = child(shape.el, 'main');

		// 如果需要自动调整大小，先加载图片获取尺寸
		if (autoResize) {
			const img = new Image();
			img.onload = function() {
				// 计算合适的显示尺寸，保持宽高比
				const maxSize = 200; // 最大尺寸限制
				const minSize = 80;  // 最小尺寸限制
				
				let newWidth = img.naturalWidth;
				let newHeight = img.naturalHeight;
				
				// 如果图片太大，按比例缩小
				if (newWidth > maxSize || newHeight > maxSize) {
					const ratio = Math.min(maxSize / newWidth, maxSize / newHeight);
					newWidth = Math.round(newWidth * ratio);
					newHeight = Math.round(newHeight * ratio);
				}
				
				// 如果图片太小，按比例放大
				if (newWidth < minSize && newHeight < minSize) {
					const ratio = Math.max(minSize / newWidth, minSize / newHeight);
					newWidth = Math.round(newWidth * ratio);
					newHeight = Math.round(newHeight * ratio);
				}
				
				// 更新组件数据和尺寸
				imageData.w = newWidth;
				imageData.h = newHeight;
				
				// 重新调整组件大小
				resize(true);
				
				// 显示图片
				setImageDisplay();
			};
			img.onerror = function() {
				console.error('Failed to load image for size calculation');
				// 如果加载失败，使用默认显示
				setImageDisplay();
			};
			img.src = imageUrl;
		} else {
			setImageDisplay();
		}
		
		function setImageDisplay() {
			console.log('🎨 Setting image display:');
			console.log('  - Image URL being set:', imageUrl);
			console.log('  - Image element:', imageEl);
			console.log('  - Component size:', imageData.w, 'x', imageData.h);
			
			imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl);
			imageEl.style.display = 'block';
			placeholderEl.style.display = 'none';
			textEl.style.display = 'none';
			
			// 改变边框样式为实线，但不改变颜色（让CSS样式控制）
			mainEl.setAttribute('stroke-dasharray', 'none');
			// 移除硬编码的绿色，让CSS样式类控制颜色
			// mainEl.setAttribute('stroke', '#28a745');
			
			console.log('  - Image element after setting href:', imageEl.getAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href'));
		}
	}

	/**
	 * 显示加载状态
	 */
	function showLoading() {
		const textEl = child(shape.el, 'text');
		textEl.textContent = '上传中...';
		textEl.setAttribute('fill', '#007bff');
	}

	/**
	 * 隐藏加载状态
	 */
	function hideLoading() {
		const textEl = child(shape.el, 'text');
		textEl.textContent = '双击上传图片';
		textEl.setAttribute('fill', '#6c757d');
	}

	// 总是调用resize以确保连接点位置正确
	console.log('🖼️ Image component created with size:', imageData.w, 'x', imageData.h);
	console.log('🖼️ Initial connector positions:', {
		'right.x': shape.cons.right.position.x,
		'left.x': shape.cons.left.position.x,
		'bottom.y': shape.cons.bottom.position.y,
		'top.y': shape.cons.top.position.y
	});
	
	console.log('🖼️ About to call resize...');
	if (imageData.w !== 120 || imageData.h !== 120) { 
		console.log('🖼️ Calling resize(true) because size is not 120x120');
		resize(true); 
	} else { 
		console.log('🖼️ Calling resize(true) for default size 120x120');
		resize(true); // 即使是默认尺寸也要调用resize来设置正确的连接点位置
	}
	
	console.log('🖼️ Final connector positions after resize:', {
		'right.x': shape.cons.right.position.x,
		'left.x': shape.cons.left.position.x,
		'bottom.y': shape.cons.bottom.position.y,
		'top.y': shape.cons.top.position.y
	});

	shape.el[ShapeSmbl].draw = resize;

	return shape.el;
}

/**
 * @param {Element} svgGrp
 * @param {string} key
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
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
	w?:number, h?:number, imageUrl?: string, fileId?: string, isBase64?: boolean
}} ImageData */ 