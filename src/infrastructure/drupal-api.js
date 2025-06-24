import { serialize } from '../diagram/dgrm-serialization.js';

/**
 * Drupal JSON:API 客户端
 * 支持开发环境（代理）和生产环境（直接调用）
 */
class DrupalAPI {
	constructor() {
		// 环境检测
		this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
		this.baseURL = this.isDevelopment ? '' : window.location.origin;
		
		this.csrfToken = null;
		this.logoutToken = null;
		this.currentUser = null;
		this.isAuthenticated = false;
		// 添加当前图表状态管理
		this.currentDiagram = {
			nodeId: null,
			title: null,
			isNew: true
		};
		
		console.log(`🌍 DrupalAPI initialized for ${this.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} environment`);
		console.log(`📍 Base URL: ${this.baseURL || 'proxy'}`);
		console.log(`🌐 Current domain: ${window.location.hostname}`);
	}

	/**
	 * 检查用户登录状态
	 */
	async checkLoginStatus() {
		try {
			console.log('🔍 Checking user login status...');
			
			const response = await fetch('/user/login_status?_format=json', {
				credentials: 'include',
				headers: {
					'Accept': 'application/json'
				}
			});

			if (response.ok) {
				const loginStatus = await response.json();
				console.log('📊 Login status response:', loginStatus);
				
				// 根据API文档：0表示未登录，1表示已登录
				const isLoggedIn = loginStatus === 1;
				
				if (isLoggedIn) {
					console.log('✅ User is logged in');
					this.isAuthenticated = true;
					
					// 如果已登录但没有用户信息，尝试获取用户信息
					if (!this.currentUser) {
						try {
							const userResponse = await fetch('/api/user/retrieve', {
								credentials: 'include',
								headers: {
									'Accept': 'application/json'
								}
							});
							if (userResponse.ok) {
								this.currentUser = await userResponse.json();
								console.log('👤 User info retrieved:', this.currentUser);
							}
						} catch (userError) {
							console.warn('⚠️ Failed to retrieve user info:', userError);
						}
					}
					
					return {
						isLoggedIn: true,
						user: this.currentUser
					};
				} else {
					console.log('❌ User is not logged in');
					this.isAuthenticated = false;
					this.currentUser = null;
					return {
						isLoggedIn: false,
						error: 'User not logged in'
					};
				}
			} else {
				console.log('❌ Failed to check login status:', response.status);
				this.isAuthenticated = false;
				this.currentUser = null;
				return {
					isLoggedIn: false,
					error: `Login status check failed: ${response.status}`
				};
			}
		} catch (error) {
			console.error('❌ Error checking login status:', error);
			this.isAuthenticated = false;
			this.currentUser = null;
			return {
				isLoggedIn: false,
				error: error.message
			};
		}
	}

	/**
	 * 用户登录
	 */
	async login(username, password) {
		try {
			console.log('🔐 Attempting to login...');
			
			// 首先检查是否已经登录
			const loginStatus = await this.checkLoginStatus();
			if (loginStatus.isLoggedIn) {
				console.log('✅ User is already logged in');
				this.currentUser = loginStatus.user;
				this.isAuthenticated = true;
				return {
					success: true,
					user: loginStatus.user,
					message: 'User is already logged in'
				};
			}
			
			// 1. 获取CSRF令牌
			const tokenResponse = await fetch('/session/token', {
				credentials: 'include'
			});
			
			if (!tokenResponse.ok) {
				throw new Error(`Failed to get CSRF token: ${tokenResponse.status}`);
			}
			
			const csrfToken = await tokenResponse.text();
			console.log('✅ CSRF token obtained');
			
			// 2. 执行登录
			const loginResponse = await fetch('/user/login?_format=json', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-Token': csrfToken,
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					name: username,
					pass: password
				})
			});

			if (!loginResponse.ok) {
				const errorData = await loginResponse.json();
				throw new Error(errorData.message || `Login failed: ${loginResponse.status}`);
			}

			const loginData = await loginResponse.json();
			console.log('✅ Login successful:', loginData);
			
			// 保存认证信息
			this.csrfToken = loginData.csrf_token;
			this.logoutToken = loginData.logout_token;
			this.currentUser = loginData.current_user;
			this.isAuthenticated = true;
			
			return {
				success: true,
				user: loginData.current_user,
				csrfToken: loginData.csrf_token,
				logoutToken: loginData.logout_token
			};
			
		} catch (error) {
			console.error('❌ Login failed:', error);
			this.isAuthenticated = false;
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 获取当前CSRF令牌
	 */
	async getCurrentCSRFToken() {
		if (this.csrfToken) {
			return this.csrfToken;
		}
		
		try {
			const response = await fetch('/session/token', {
				credentials: 'include'
			});
			
			if (response.ok) {
				this.csrfToken = await response.text();
				return this.csrfToken;
			}
		} catch (error) {
			console.error('❌ Failed to get CSRF token:', error);
		}
		
		return null;
	}

	/**
	 * 上传文件到Drupal媒体系统
	 */
	async uploadFile(file, filename) {
		try {
			console.log('📤 Uploading file to Drupal media system...');
			
			if (!this.isAuthenticated) {
				// 重新检查登录状态
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('User not authenticated');
				}
			}
			
			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			// 上传文件 - 使用正确的Content-Type
			const uploadResponse = await fetch('/jsonapi/media/image/field_media_image', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: file
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
			}

			const uploadData = await uploadResponse.json();
			console.log('✅ File uploaded successfully:', uploadData);

			return {
				success: true,
				fileData: uploadData.data
			};
		} catch (error) {
			console.error('❌ File upload failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 创建媒体实体
	 */
	async createMediaEntity(fileData, filename) {
		try {
			console.log('🖼️ Creating media entity...');
			
			if (!this.isAuthenticated) {
				// 重新检查登录状态
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('User not authenticated');
				}
			}
			
			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			const mediaData = {
				data: {
					type: 'media--image',
					attributes: {
						name: filename
					},
					relationships: {
						field_media_image: {
							data: {
								type: 'file--file',
								id: fileData.id
							}
						}
					}
				}
			};

			const mediaResponse = await fetch('/jsonapi/media/image', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/vnd.api+json',
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: JSON.stringify(mediaData)
			});

			if (!mediaResponse.ok) {
				const errorText = await mediaResponse.text();
				throw new Error(`Media creation failed: ${mediaResponse.status} - ${errorText}`);
			}

			const mediaResult = await mediaResponse.json();
			console.log('✅ Media entity created successfully:', mediaResult);

			return {
				success: true,
				mediaData: mediaResult.data
			};

		} catch (error) {
			console.error('❌ Media creation failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 创建AIGC内容节点
	 */
	async createAIGCNode(title, mediaData, diagramData = null) {
		try {
			console.log('📝 Creating AIGC content node...');
			
			if (!this.isAuthenticated) {
				// 重新检查登录状态
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('User not authenticated');
				}
			}
			
			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			// 准备图表数据
			const contentData = diagramData ? JSON.stringify(diagramData) : JSON.stringify({
				version: "1.1",
				shapes: [],
				metadata: {
					created: new Date().toISOString(),
					title: title
				}
			});

			// 检查localStorage中是否有user-prompt
			let promptValue = `DgrmJS diagram: ${title}`;
			try {
				const userPrompt = localStorage.getItem('user-prompt');
				if (userPrompt && userPrompt.trim()) {
					promptValue = userPrompt.trim();
					console.log('📝 Using user prompt from localStorage:', promptValue);
				}
			} catch (error) {
				console.warn('⚠️ Failed to read user-prompt from localStorage:', error);
			}

			const nodeData = {
				data: {
					type: 'node--aigc',
					attributes: {
						title: title,
						content_data: contentData,
						content_type: ['diagram'],
						prompt: promptValue
					},
					relationships: {
						cover: {
							data: {
								type: 'media--image',
								id: mediaData.id
							}
						}
					}
				}
			};

			const nodeResponse = await fetch('/jsonapi/node/aigc', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/vnd.api+json',
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: JSON.stringify(nodeData)
			});

			if (!nodeResponse.ok) {
				const errorText = await nodeResponse.text();
				throw new Error(`Node creation failed: ${nodeResponse.status} - ${errorText}`);
			}

			const nodeResult = await nodeResponse.json();
			console.log('✅ AIGC node created successfully:', nodeResult);

			return {
				success: true,
				nodeData: nodeResult.data,
				nodeUrl: `/node/${nodeResult.data.attributes.drupal_internal__nid}`
			};

		} catch (error) {
			console.error('❌ Node creation failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 更新现有AIGC内容节点
	 * @param {string} nodeUuid - 节点的UUID（不是内部ID）
	 * @param {string} title - 节点标题
	 * @param {Object} mediaData - 媒体数据
	 * @param {Object} diagramData - 图表数据
	 */
	async updateAIGCNode(nodeUuid, title, mediaData, diagramData = null) {
		try {
			console.log(`📝 Updating AIGC content node with UUID: ${nodeUuid}...`);
			
			if (!this.isAuthenticated) {
				// 重新检查登录状态
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('User not authenticated');
				}
			}
			
			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			// 准备图表数据
			const contentData = diagramData ? JSON.stringify(diagramData) : JSON.stringify({
				version: "1.1",
				shapes: [],
				metadata: {
					updated: new Date().toISOString(),
					title: title
				}
			});

			const nodeData = {
				data: {
					type: 'node--aigc',
					id: nodeUuid,  // 使用UUID
					attributes: {
						title: title,
						content_data: contentData
						// 更新时不修改prompt字段
					},
					relationships: {
						cover: {
							data: {
								type: 'media--image',
								id: mediaData.id
							}
						}
					}
				}
			};

			// 对于PATCH请求，使用UUID作为路径参数
			const updateUrl = `/jsonapi/node/aigc/${nodeUuid}`;
			console.log(`🔗 Update URL: ${updateUrl}`);
			console.log(`📦 Request payload:`, JSON.stringify(nodeData, null, 2));
			
			const nodeResponse = await fetch(updateUrl, {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/vnd.api+json',
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: JSON.stringify(nodeData)
			});

			if (!nodeResponse.ok) {
				const errorText = await nodeResponse.text();
				console.error(`❌ Node update failed:`, {
					status: nodeResponse.status,
					statusText: nodeResponse.statusText,
					url: updateUrl,
					uuid: nodeUuid,
					errorText: errorText
				});
				throw new Error(`Node update failed: ${nodeResponse.status} ${nodeResponse.statusText} - ${errorText}`);
			}

			const nodeResult = await nodeResponse.json();
			console.log('✅ AIGC node updated successfully:', nodeResult);

			return {
				success: true,
				nodeData: nodeResult.data,
				nodeUrl: `/node/${nodeResult.data.attributes.drupal_internal__nid}`
			};

		} catch (error) {
			console.error('❌ Node update failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 删除媒体实体和相关文件
	 * @param {string} mediaId - 媒体实体的ID
	 */
	async deleteMediaEntity(mediaId) {
		try {
			console.log(`🗑️ Deleting media entity: ${mediaId}`);

			if (!this.isAuthenticated) {
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('User not authenticated');
				}
			}

			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			// 删除媒体实体
			const deleteResponse = await fetch(`/jsonapi/media/image/${mediaId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					Accept: 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				}
			});

			if (!deleteResponse.ok) {
				const errorText = await deleteResponse.text();
				throw new Error(`Media deletion failed: ${deleteResponse.status} - ${errorText}`);
			}

			console.log('✅ Media entity deleted successfully');
			return {
				success: true
			};

		} catch (error) {
			console.error('❌ Media deletion failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 获取节点的当前cover media ID
	 * @param {string} nodeUuid - 节点的UUID
	 */
	async getCurrentCoverMediaId(nodeUuid) {
		try {
			console.log(`🔍 Getting current cover media for node: ${nodeUuid}`);

			const nodeResponse = await fetch(`/jsonapi/node/aigc/${nodeUuid}?fields[node--aigc]=cover&include=cover`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					Accept: 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json'
				}
			});

			if (!nodeResponse.ok) {
				throw new Error(`Failed to get node cover: ${nodeResponse.status}`);
			}

			const nodeData = await nodeResponse.json();
			const coverMediaId = nodeData.data.relationships?.cover?.data?.id;

			if (coverMediaId) {
				console.log(`📷 Found current cover media ID: ${coverMediaId}`);
				return coverMediaId;
			} else {
				console.log('📷 No current cover media found');
				return null;
			}

		} catch (error) {
			console.error('❌ Failed to get current cover media:', error);
			return null;
		}
	}

	/**
	 * 保存图表到云端（完整流程）
	 */
	async saveDiagramToCloud(title, imageBlob, canvas = null) {
		try {
			console.log('☁️ Starting diagram save to cloud process...');
			
			// 1. 检查登录状态
			const loginStatus = await this.checkLoginStatus();
			if (!loginStatus.isLoggedIn) {
				throw new Error('Please login first to save diagrams to cloud');
			}

			// 2. 序列化当前图表数据
			let diagramData = null;
			if (canvas) {
				try {
					diagramData = serialize(canvas);
					console.log('📊 Diagram data serialized:', diagramData);
				} catch (error) {
					console.warn('⚠️ Failed to serialize diagram data:', error);
				}
			}

			// 3. 如果是更新操作，先获取当前的cover media ID
			let oldCoverMediaId = null;
			let isNewNode = this.currentDiagram.isNew || !this.currentDiagram.nodeId;
			
			if (!isNewNode && this.currentDiagram.nodeId) {
				oldCoverMediaId = await this.getCurrentCoverMediaId(this.currentDiagram.nodeId);
			}

			// 4. 上传封面文件
			const filename = `diagram-${Date.now()}.png`;
			const uploadResult = await this.uploadFile(imageBlob, filename);
			if (!uploadResult.success) {
				throw new Error(`File upload failed: ${uploadResult.error}`);
			}

			// 5. 创建媒体实体
			const mediaResult = await this.createMediaEntity(uploadResult.fileData, filename);
			if (!mediaResult.success) {
				throw new Error(`Media creation failed: ${mediaResult.error}`);
			}

			// 6. 决定是创建新节点还是更新现有节点
			let nodeResult;
			
			console.log(`💾 Save decision: isNew=${this.currentDiagram.isNew}, nodeId=${this.currentDiagram.nodeId}, action=${isNewNode ? 'CREATE' : 'UPDATE'}`);
			
			if (isNewNode) {
				// 创建新节点
				console.log('📝 Creating new AIGC node...');
				nodeResult = await this.createAIGCNode(title, mediaResult.mediaData, diagramData);
				if (nodeResult.success) {
					// 更新当前图表状态
					this.currentDiagram.nodeId = nodeResult.nodeData.id;
					this.currentDiagram.title = title;
					this.currentDiagram.isNew = false;
				}
			} else {
				// 更新现有节点
				console.log(`📝 Updating existing AIGC node (UUID: ${this.currentDiagram.nodeId})...`);
				nodeResult = await this.updateAIGCNode(this.currentDiagram.nodeId, title, mediaResult.mediaData, diagramData);
				if (nodeResult.success) {
					// 更新标题
					this.currentDiagram.title = title;
				}
			}

			if (!nodeResult.success) {
				throw new Error(`Node operation failed: ${nodeResult.error}`);
			}

			// 7. 删除旧的cover media（仅对更新操作执行）
			if (!isNewNode && oldCoverMediaId && oldCoverMediaId !== mediaResult.mediaData.id) {
				try {
					console.log('🗑️ Cleaning up old cover media...');
					await this.deleteMediaEntity(oldCoverMediaId);
				} catch (cleanupError) {
					console.warn('⚠️ Failed to cleanup old cover media:', cleanupError);
					// 不让清理失败影响整个保存流程
				}
			}

			// 8. 清理未使用的ref_images（仅对更新的节点执行）
			if (!isNewNode && diagramData && this.currentDiagram.nodeId) {
				try {
					console.log('🧹 Cleaning up unused ref_images...');
					await this.cleanupUnusedRefImages(this.currentDiagram.nodeId, diagramData);
				} catch (cleanupError) {
					console.warn('⚠️ Failed to cleanup unused ref_images:', cleanupError);
					// 不让清理失败影响整个保存流程
				}
			}

			const action = isNewNode ? 'created' : 'updated';
			console.log(`🎉 Diagram ${action} successfully!`);
			return {
				success: true,
				message: `Diagram ${action} successfully!`,
				nodeUrl: nodeResult.nodeUrl,
				nodeId: nodeResult.nodeData.attributes.drupal_internal__nid,
				isNew: isNewNode
			};

		} catch (error) {
			console.error('❌ Save to cloud failed:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 清理未使用的ref_images文件
	 * @param {string} nodeUuid - 节点的UUID
	 * @param {Object} diagramData - 图表数据
	 */
	async cleanupUnusedRefImages(nodeUuid, diagramData) {
		try {
			console.log('🔍 Analyzing diagram for used images...');
			
			// 1. 从图表数据中提取所有使用的图片URL
			const usedImageUrls = new Set();
			if (diagramData && diagramData.s) {
				for (const shape of diagramData.s) {
					// 检查图片组件 (type: 6)
					if (shape.type === 6 && shape.imageUrl) {
						usedImageUrls.add(shape.imageUrl);
						console.log('📷 Found used image URL:', shape.imageUrl);
					}
				}
			}
			
			console.log(`📊 Total used images: ${usedImageUrls.size}`);
			
			// 2. 从图表数据中提取文件ID（直接从shape数据获取）
			const usedFileIds = new Set();
			if (diagramData && diagramData.s) {
				for (const shape of diagramData.s) {
					// 检查图片组件 (type: 6) 并获取fileId
					if (shape.type === 6 && shape.fileId) {
						usedFileIds.add(shape.fileId);
						console.log(`🔗 Found used file ID: ${shape.fileId} (URL: ${shape.imageUrl || 'N/A'})`);
					}
				}
			}
			
			// 3. 获取当前节点的ref_images字段
			const nodeResponse = await fetch(`/jsonapi/node/aigc/${nodeUuid}?fields[node--aigc]=ref_images`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Accept': 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json'
				}
			});

			if (!nodeResponse.ok) {
				throw new Error(`Failed to get node ref_images: ${nodeResponse.status}`);
			}

			const nodeData = await nodeResponse.json();
			const currentRefImages = nodeData.data.relationships?.ref_images?.data || [];
			console.log(`📋 Current ref_images count: ${currentRefImages.length}`);
			
			// 4. 找出未使用的文件ID
			const unusedFileIds = [];
			for (const refImage of currentRefImages) {
				if (!usedFileIds.has(refImage.id)) {
					unusedFileIds.push(refImage.id);
					console.log(`🗑️ Found unused file ID: ${refImage.id}`);
				}
			}
			
			// 5. 如果有未使用的文件，更新ref_images字段
			if (unusedFileIds.length > 0) {
				console.log(`🧹 Removing ${unusedFileIds.length} unused files from ref_images...`);
				
				// 保留仍在使用的文件
				const keepRefImages = currentRefImages.filter(refImage => 
					usedFileIds.has(refImage.id)
				);
				
				const csrfToken = await this.getCurrentCSRFToken();
				if (!csrfToken) {
					throw new Error('Failed to get CSRF token for cleanup');
				}
				
				// 更新节点的ref_images字段
				const patchPayload = {
					data: {
						type: 'node--aigc',
						id: nodeUuid,
						relationships: {
							ref_images: {
								data: keepRefImages
							}
						}
					}
				};

				const patchResponse = await fetch(`/jsonapi/node/aigc/${nodeUuid}`, {
					method: 'PATCH',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/vnd.api+json',
						'Accept': 'application/vnd.api+json',
						'X-CSRF-Token': csrfToken
					},
					body: JSON.stringify(patchPayload)
				});

				if (!patchResponse.ok) {
					throw new Error(`Failed to update ref_images: ${patchResponse.status}`);
				}
				
				console.log(`✅ Successfully cleaned up ${unusedFileIds.length} unused files from ref_images`);
				console.log(`📊 Remaining ref_images count: ${keepRefImages.length}`);
			} else {
				console.log('✨ No unused files found in ref_images');
			}
			
		} catch (error) {
			console.error('❌ Failed to cleanup unused ref_images:', error);
			throw error;
		}
	}

	/**
	 * 从图片URL中提取文件ID（备用方法，现在主要从图表数据中直接获取fileId）
	 * @param {string} url - 图片URL
	 * @returns {string|null} - 文件ID或null
	 */
	extractFileIdFromUrl(url) {
		try {
			// 如果URL是blob URL，无法提取文件ID
			if (url.startsWith('blob:')) {
				return null;
			}
			
			// 尝试从URL路径中提取文件ID
			// 常见格式: /sites/graphmaker/files/aigc_ref_images/2025-06/filename.ext
			// 或者可能包含文件ID的其他格式
			
			// 方法1: 如果URL包含文件ID参数
			const urlObj = new URL(url, window.location.origin);
			const fileIdParam = urlObj.searchParams.get('file_id') || urlObj.searchParams.get('fid');
			if (fileIdParam) {
				return fileIdParam;
			}
			
			// 注意：现在我们主要从图表数据中的fileId字段获取文件ID，
			// 这个方法作为备用，在fileId字段不可用时使用
			
			return null;
		} catch (error) {
			console.warn('Failed to extract file ID from URL:', url, error);
			return null;
		}
	}

	/**
	 * 通过UUID获取AIGC节点数据
	 * @param {string} uuid - 节点的UUID
	 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
	 */
	async getAIGCNodeByUUID(uuid) {
		try {
			console.log(`🔍 Fetching AIGC node by UUID: ${uuid}`);
			
			// 构建JSON:API查询URL，通过UUID获取节点
			const url = `/jsonapi/node/aigc?filter[id]=${uuid}&include=cover,cover.field_media_image`;
			
			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Accept': 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json'
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch node: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			
			if (!result.data || result.data.length === 0) {
				throw new Error(`No AIGC node found with UUID: ${uuid}`);
			}

			const nodeData = result.data[0];
			console.log('✅ AIGC node fetched successfully:', nodeData);

			// 提取content_data字段中的图表JSON数据
			const contentData = nodeData.attributes.content_data;
			let diagramData = null;
			
			if (contentData) {
				try {
					diagramData = JSON.parse(contentData);
					console.log('📊 Diagram data extracted from content_data:', diagramData);
				} catch (parseError) {
					console.warn('⚠️ Failed to parse content_data as JSON:', parseError);
				}
			}

			return {
				success: true,
				data: {
					node: nodeData,
					diagramData: diagramData,
					title: nodeData.attributes.title,
					nodeId: nodeData.attributes.drupal_internal__nid,
					uuid: nodeData.id
				}
			};

		} catch (error) {
			console.error('❌ Failed to fetch AIGC node by UUID:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * 重置当前图表状态（用于新建图表）
	 */
	resetCurrentDiagram() {
		this.currentDiagram = {
			nodeId: null,
			title: null,
			isNew: true
		};
		console.log('🔄 Current diagram state reset');
	}

	/**
	 * 设置当前图表状态（用于加载现有图表）
	 * @param {string} nodeId - 节点的UUID（用于更新操作）
	 * @param {string} title - 图表标题
	 */
	setCurrentDiagram(nodeId, title) {
		this.currentDiagram = {
			nodeId: nodeId,
			title: title,
			isNew: false
		};
		console.log(`📋 Current diagram set: ${title} (UUID: ${nodeId})`);
	}

	/**
	 * 获取当前图表状态
	 * @returns {{nodeId: string|null, title: string|null, isNew: boolean}}
	 */
	getCurrentDiagram() {
		return { ...this.currentDiagram };
	}

	/**
	 * 添加图片到AIGC节点的ref_images字段
	 * @param {File} file - 图片文件
	 * @param {string} nodeUuid - 节点的UUID
	 * @returns {Promise<{success: boolean, error?: string, fileId?: string, fileUrl?: string}>}
	 */
	async addImageToRefImagesField(file, nodeUuid) {
		try {
			console.log(`📷 Adding image to ref_images field for node: ${nodeUuid}`);
			
			if (!this.isAuthenticated) {
				const loginStatus = await this.checkLoginStatus();
				if (!loginStatus.isLoggedIn) {
					throw new Error('请先登录才能上传图片。您可以在 https://graphmaker.intra.vizcms.cn/user/login 登录');
				}
			}
			
			const csrfToken = await this.getCurrentCSRFToken();
			if (!csrfToken) {
				throw new Error('Failed to get CSRF token');
			}

			const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

			// Step 1: Upload the file
			const uploadResponse = await fetch('/jsonapi/node/aigc/ref_images', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${sanitizedName}"`,
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: file
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
			}

			const uploadData = await uploadResponse.json();
			const newFid = uploadData.data.id;
			console.log('✅ File uploaded to ref_images field:', newFid);

			// Step 2: Get existing values
			const nodeResponse = await fetch(`/jsonapi/node/aigc/${nodeUuid}?fields[node--aigc]=ref_images`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Accept': 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json'
				}
			});

			if (!nodeResponse.ok) {
				const errorText = await nodeResponse.text();
				throw new Error(`Failed to get node data: ${nodeResponse.status} - ${errorText}`);
			}

			const nodeData = await nodeResponse.json();
			const currentFids = nodeData.data.relationships?.ref_images?.data || [];
			console.log('📋 Current ref_images:', currentFids);

			// Step 3: Patch with combined values
			const patchPayload = {
				data: {
					type: 'node--aigc',
					id: nodeUuid,
					relationships: {
						ref_images: {
							data: [...currentFids, { type: 'file--file', id: newFid }]
						}
					}
				}
			};

			const patchResponse = await fetch(`/jsonapi/node/aigc/${nodeUuid}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/vnd.api+json',
					'Accept': 'application/vnd.api+json',
					'X-CSRF-Token': csrfToken
				},
				body: JSON.stringify(patchPayload)
			});

			if (!patchResponse.ok) {
				const errorText = await patchResponse.text();
				throw new Error(`Failed to update node: ${patchResponse.status} - ${errorText}`);
			}

			// Step 4: Get the file URL from the uploaded file data
			const fileUrl = uploadData.data.attributes.uri?.url;
			console.log('📎 File URL:', fileUrl);

			console.log('✅ Image successfully added to ref_images field');
			return {
				success: true,
				fileId: newFid,
				fileUrl: fileUrl
			};

		} catch (error) {
			console.error('❌ Failed to add image to ref_images field:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}
}

// 导出单例实例
const drupalAPI = new DrupalAPI();
export default drupalAPI; 