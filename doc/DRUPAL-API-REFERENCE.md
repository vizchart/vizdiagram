# DgrmJS - Drupal API 参考文档

## 📋 概述

本文档详细列出了 DgrmJS 项目中对接 Drupal 系统的所有 API 端点，包括认证、文件上传、内容管理等功能。

## 🔐 认证相关 API

### 1. 检查登录状态
**端点**: `GET /user/login_status?_format=json`

**描述**: 检查用户当前登录状态

**请求头**:
```http
Accept: application/json
Cookie: [session_cookie]
```

**响应**:
```json
// 已登录
1

// 未登录
0
```

**使用示例**:
```javascript
const response = await fetch('/user/login_status?_format=json', {
    credentials: 'include',
    headers: {
        'Accept': 'application/json'
    }
});
const loginStatus = await response.json();
const isLoggedIn = loginStatus === 1;
```

**说明**: 项目使用 Drupal 标准登录页面 (`/user/login`)，通过弹窗引导用户登录，登录后返回应用并检查状态。

### 2. 获取 CSRF Token
**端点**: `GET /session/token`

**描述**: 获取用于API请求的CSRF令牌

**请求头**:
```http
Cookie: [session_cookie]
```

**响应**:
```
csrf_token_string
```

## 📁 文件上传 API

### 3. 上传封面图片文件
**端点**: `POST /jsonapi/media/image/field_media_image`

**描述**: 上传文件到Drupal媒体实体的图片字段（仅用于封面图片）

**使用场景**: 保存图表时上传封面图片

**请求头**:
```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="filename.png"
Accept: application/vnd.api+json
X-CSRF-Token: [csrf_token]
Cookie: [session_cookie]
```

**请求体**: 二进制文件数据

**响应**:
```json
{
    "data": {
        "type": "file--file",
        "id": "file_uuid",
        "attributes": {
            "filename": "filename.png",
            "uri": {
                "value": "public://filename.png",
                "url": "/sites/default/files/filename.png"
            },
            "filesize": 12345,
            "status": true,
            "created": "2024-01-01T00:00:00+00:00"
        }
    }
}
```

### 4. 上传图片组件文件
**端点**: `POST /jsonapi/node/aigc/ref_images`

**描述**: 上传文件到AIGC节点的ref_images字段（用于图表中的图片组件）

**使用场景**: 在图表中添加图片组件时直接上传

**请求头**:
```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="filename.png"
Accept: application/vnd.api+json
X-CSRF-Token: [csrf_token]
Cookie: [session_cookie]
```

**请求体**: 二进制文件数据

**响应**:
```json
{
    "data": {
        "type": "file--file",
        "id": "file_uuid",
        "attributes": {
            "filename": "filename.png",
            "uri": {
                "value": "public://ref_images/filename.png",
                "url": "/sites/default/files/ref_images/filename.png"
            },
            "filesize": 12345,
            "status": true
        }
    }
}
```

## 🖼️ 媒体管理 API

### 5. 创建媒体实体
**端点**: `POST /jsonapi/media/image`

**描述**: 创建图片媒体实体（仅用于封面图片）

**使用场景**: 保存图表时，将上传的封面文件创建为媒体实体

**请求头**:
```http
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
X-CSRF-Token: [csrf_token]
Cookie: [session_cookie]
```

**请求体**:
```json
{
    "data": {
        "type": "media--image",
        "attributes": {
            "name": "媒体名称"
        },
        "relationships": {
            "field_media_image": {
                "data": {
                    "type": "file--file",
                    "id": "file_uuid"
                }
            }
        }
    }
}
```

**响应**:
```json
{
    "data": {
        "type": "media--image",
        "id": "media_uuid",
        "attributes": {
            "name": "媒体名称",
            "status": true,
            "created": "2024-01-01T00:00:00+00:00",
            "changed": "2024-01-01T00:00:00+00:00"
        },
        "relationships": {
            "field_media_image": {
                "data": {
                    "type": "file--file",
                    "id": "file_uuid"
                }
            }
        }
    }
}
```

## 📄 内容节点 API

### 6. 创建AIGC节点
**端点**: `POST /jsonapi/node/aigc`

**描述**: 创建新的AIGC内容节点

**请求头**:
```http
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
X-CSRF-Token: [csrf_token]
Cookie: [session_cookie]
```

**请求体**:
```json
{
    "data": {
        "type": "node--aigc",
        "attributes": {
            "title": "图表标题",
            "content_data": "{\"v\":\"1.1\",\"s\":[...]}",
            "content_type": ["diagram"],
            "prompt": "DgrmJS diagram: 图表标题"
        },
        "relationships": {
            "cover": {
                "data": {
                    "type": "media--image",
                    "id": "media_uuid"
                }
            }
        }
    }
}
```

**响应**:
```json
{
    "data": {
        "type": "node--aigc",
        "id": "node_uuid",
        "attributes": {
            "title": "图表标题",
            "content_data": "{\"v\":\"1.1\",\"s\":[...]}",
            "content_type": ["diagram"],
            "prompt": "DgrmJS diagram: 图表标题",
            "drupal_internal__nid": 123,
            "created": "2024-01-01T00:00:00+00:00",
            "changed": "2024-01-01T00:00:00+00:00"
        }
    }
}
```

### 7. 更新AIGC节点
**端点**: `PATCH /jsonapi/node/aigc/{uuid}`

**描述**: 更新现有的AIGC内容节点

**请求头**:
```http
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
X-CSRF-Token: [csrf_token]
Cookie: [session_cookie]
```

**请求体**:
```json
{
    "data": {
        "type": "node--aigc",
        "id": "node_uuid",
        "attributes": {
            "title": "更新的标题",
            "content_data": "{\"v\":\"1.1\",\"s\":[...]}",
            "prompt": "DgrmJS diagram: 更新的标题 (updated)"
        },
        "relationships": {
            "cover": {
                "data": {
                    "type": "media--image",
                    "id": "new_media_uuid"
                }
            }
        }
    }
}
```

### 8. 获取AIGC节点
**端点**: `GET /jsonapi/node/aigc?filter[id]={uuid}&include=cover,cover.field_media_image`

**描述**: 通过UUID获取AIGC节点数据

**请求头**:
```http
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
Cookie: [session_cookie]
```

**响应**:
```json
{
    "data": [
        {
            "type": "node--aigc",
            "id": "node_uuid",
            "attributes": {
                "title": "图表标题",
                "content_data": "{\"v\":\"1.1\",\"s\":[...]}",
                "content_type": ["diagram"],
                "drupal_internal__nid": 123,
                "created": "2024-01-01T00:00:00+00:00"
            },
            "relationships": {
                "cover": {
                    "data": {
                        "type": "media--image",
                        "id": "media_uuid"
                    }
                }
            }
        }
    ],
    "included": [...]
}
```

### 9. 获取节点的ref_images字段
**端点**: `GET /jsonapi/node/aigc/{uuid}?fields[node--aigc]=ref_images`

**描述**: 获取AIGC节点的ref_images字段数据

**使用场景**: 在添加图片组件时，获取现有的ref_images数据以便合并新上传的文件

**请求头**:
```http
Accept: application/vnd.api+json
Cookie: [session_cookie]
```

**响应**:
```json
{
    "data": {
        "type": "node--aigc",
        "id": "node_uuid",
        "attributes": {
            "ref_images": [
                {
                    "target_id": "file_id_1",
                    "alt": "",
                    "title": "",
                    "width": 800,
                    "height": 600
                }
            ]
        }
    }
}
```

## 🔧 开发环境配置

### 代理配置
开发服务器配置了以下路径的代理转发到Drupal服务器：

```javascript
const API_PATHS = ['/user', '/api', '/jsonapi', '/session', '/sites'];
```

### CORS 配置
所有API响应都包含以下CORS头：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, Accept
Access-Control-Allow-Credentials: true
```

### Session Cookie 配置
Drupal需要配置以下session参数以支持跨域认证：

```yaml
# sites/default/services.yml
parameters:
  session.storage.options:
    cookie_httponly: false       # 允许 JS 访问 cookie
    cookie_secure: false         # 非 HTTPS 环境下允许发送 cookie
    cookie_samesite: 'None'      # 允许跨域发送 cookie
```

## 📊 API 使用流程

### 图片上传的两种场景

#### 场景1: 封面图片（保存图表时）
1. **检查登录状态** → `GET /user/login_status`
2. **获取CSRF Token** → `GET /session/token`
3. **上传封面文件** → `POST /jsonapi/media/image/field_media_image`
4. **创建媒体实体** → `POST /jsonapi/media/image`
5. **创建/更新节点** → `POST/PATCH /jsonapi/node/aigc`

#### 场景2: 图片组件（图表中的图片元素）
1. **检查登录状态** → `GET /user/login_status`
2. **获取CSRF Token** → `GET /session/token`
3. **上传图片文件** → `POST /jsonapi/node/aigc/ref_images`
4. **获取现有ref_images** → `GET /jsonapi/node/aigc/{uuid}?fields[node--aigc]=ref_images`
5. **更新ref_images字段** → `PATCH /jsonapi/node/aigc/{uuid}`

### 完整的保存流程
1. **检查登录状态** → `GET /user/login_status`
2. **获取CSRF Token** → `GET /session/token`
3. **上传封面文件** → `POST /jsonapi/media/image/field_media_image`
4. **创建媒体实体** → `POST /jsonapi/media/image`
5. **创建/更新节点** → `POST/PATCH /jsonapi/node/aigc`

### 加载图表流程
1. **获取节点数据** → `GET /jsonapi/node/aigc?filter[id]={uuid}`
2. **解析content_data字段**
3. **在画布中渲染图表**

### 登录流程
1. **检查登录状态** → `GET /user/login_status`
2. **如未登录，显示登录弹窗**
3. **用户点击链接跳转到** → `/user/login`
4. **用户在Drupal登录页面完成登录**
5. **返回应用，重新检查登录状态**

## ⚠️ 错误处理

### 常见错误码
- `401 Unauthorized` - 用户未登录或认证失败
- `403 Forbidden` - 权限不足或CSRF Token无效
- `404 Not Found` - 资源不存在
- `422 Unprocessable Entity` - 请求数据格式错误
- `500 Internal Server Error` - 服务器内部错误

### 错误响应格式
```json
{
    "errors": [
        {
            "title": "Unauthorized",
            "status": "401",
            "detail": "The current user is not authenticated."
        }
    ]
}
```

## 🧪 测试工具

项目提供了以下测试页面：
- `doc/save-test.html` - 完整保存流程测试
- `test-base64-image.html` - Base64图片功能测试
- `test-ui-fixes.html` - UI修复验证

## 📚 相关文档

- [项目配置文档](./CONFIGURATION.md)
- [图片组件文档](./IMAGE-COMPONENT.md)
- [文件上传流程](./JSONAPI-FIleUpload.md)
- [登录检查改进](./login-check-improvements.md)

---

**最后更新**: 2024年6月10日  
**版本**: DgrmJS v1.0  
**Drupal版本**: 9.x/10.x  
**JSON:API版本**: 2.x 