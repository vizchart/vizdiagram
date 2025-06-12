import { svgToPng } from './svg-to-png.js';
import { CanvasSmbl } from './canvas-smbl.js';

/**
 * Generate PNG cover image from diagram canvas using the same logic as dgrmPngCreate
 * @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas
 * @returns {Promise<File>}
 */
export function generateDiagramCover(canvas) {
	return new Promise((resolve, reject) => {
		try {
			// Handle regular HTML Canvas (for testing)
			if (canvas instanceof HTMLCanvasElement) {
				generateCoverFromHTMLCanvas(canvas).then(resolve).catch(reject);
				return;
			}
			
			// Use the same logic as dgrmPngCreate to capture the actual diagram content
			const rectToShow = canvas.getBoundingClientRect();
			
			// If diagram is empty, create a default cover
			if (rectToShow.width === 0 || rectToShow.height === 0 || canvas.children.length === 0) {
				createDefaultCover().then(resolve).catch(reject);
				return;
			}

			// Clone the SVG and clean it up (same as dgrmPngCreate)
			const svgVirtual = /** @type {SVGSVGElement} */(canvas.ownerSVGElement.cloneNode(true));
			svgVirtual.style.backgroundImage = null;
			svgVirtual.querySelectorAll('.select, .highlight').forEach(el => el.classList.remove('select', 'highlight'));

			// Remove foreign objects (same as dgrmPngCreate)
			const nonSvgElems = svgVirtual.getElementsByTagName('foreignObject');
			while (nonSvgElems[0]) { nonSvgElems[0].parentNode.removeChild(nonSvgElems[0]); }

			const canvasData = canvas[CanvasSmbl].data;

			// Position diagram to left corner (same as dgrmPngCreate)
			const canvasElVirtual = /** @type{SVGGraphicsElement} */(svgVirtual.children[1]);
			const divis = 1 / canvasData.scale;
			canvasElVirtual.style.transform = `matrix(1, 0, 0, 1, ${divis * (canvasData.position.x + 15 * canvasData.scale - rectToShow.x)}, ${divis * (canvasData.position.y + 15 * canvasData.scale - rectToShow.y)})`;

			// Generate PNG with the same parameters as dgrmPngCreate
			svgToPng(svgVirtual,
				{ x: 0, y: 0, height: rectToShow.height / canvasData.scale + 30, width: rectToShow.width / canvasData.scale + 30 },
				// scale
				3,
				// callBack
				async (blob) => {
					if (!blob) {
						reject(new Error('Failed to generate PNG'));
						return;
					}

					try {
						// Resize to standard cover size (1024x1024) for thumbnail
						const resizedBlob = await resizeToCoverSize(blob);
						const file = new File([resizedBlob], 'diagram-cover.png', { type: 'image/png' });
						resolve(file);
					} catch (error) {
						reject(error);
					}
				}
			);
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Generate cover from HTML Canvas (for testing)
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<File>}
 */
function generateCoverFromHTMLCanvas(canvas) {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob(async (blob) => {
				if (!blob) {
					reject(new Error('Failed to generate blob from canvas'));
					return;
				}

				try {
					// Resize to standard cover size (1024x1024)
					const resizedBlob = await resizeToCoverSize(blob);
					const file = new File([resizedBlob], 'test-diagram-cover.png', { type: 'image/png' });
					resolve(file);
				} catch (error) {
					reject(error);
				}
			}, 'image/png');
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Resize image blob to standard cover size (1024x1024)
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
function resizeToCoverSize(blob) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			
			const targetSize = 1024;
			canvas.width = targetSize;
			canvas.height = targetSize;
			
			// Set white background
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, targetSize, targetSize);
			
			// Calculate scale to fit image while maintaining aspect ratio
			const scale = Math.min(targetSize / img.width, targetSize / img.height);
			const scaledWidth = img.width * scale;
			const scaledHeight = img.height * scale;
			const x = (targetSize - scaledWidth) / 2;
			const y = (targetSize - scaledHeight) / 2;
			
			// Draw image centered
			ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
			
			canvas.toBlob((resizedBlob) => {
				if (resizedBlob) {
					resolve(resizedBlob);
				} else {
					reject(new Error('Failed to resize image'));
				}
			}, 'image/png');
		};
		
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(blob);
	});
}

/**
 * Create a default cover image for empty diagrams
 * @returns {Promise<File>}
 */
function createDefaultCover() {
	return new Promise((resolve) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		const size = 1024;
		canvas.width = size;
		canvas.height = size;
		
		// Create gradient background
		const gradient = ctx.createLinearGradient(0, 0, size, size);
		gradient.addColorStop(0, '#f8f9fa');
		gradient.addColorStop(1, '#e9ecef');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);
		
		// Add diagram icon
		ctx.fillStyle = '#6c757d';
		ctx.font = 'bold 120px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('📊', size / 2, size / 2 - 50);
		
		// Add text
		ctx.fillStyle = '#495057';
		ctx.font = '48px Arial';
		ctx.fillText('Empty Diagram', size / 2, size / 2 + 80);
		
		canvas.toBlob((blob) => {
			const file = new File([blob], 'default-cover.png', { type: 'image/png' });
			resolve(file);
		}, 'image/png');
	});
} 