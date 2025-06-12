# DgrmJS 配置指南

本文档说明如何为不同的 Drupal 服务器配置 DgrmJS 开发和生产环境。

## 🎯 环境配置

### 开发环境配置

开发环境支持通过环境变量配置目标 Drupal 服务器：

#### 方法 1: 环境变量
```bash
# Windows (PowerShell)
$env:DRUPAL_SERVER="https://your-drupal-server.com"
npm run dev:simple

# Windows (CMD)
set DRUPAL_SERVER=https://your-drupal-server.com
npm run dev:simple

# Linux/macOS
DRUPAL_SERVER=https://your-drupal-server.com npm run dev:simple
```

#### 方法 2: .env 文件
创建 `.env` 文件：
```bash
# .env
DRUPAL_SERVER=https://your-drupal-server.com
PORT=3001
```

然后运行：
```bash
npm run dev:simple
```

#### 方法 3: 修改配置文件
直接修改 `simple-dev-server.js` 中的默认值：
```javascript
// simple-dev-server.js
const TARGET_SERVER = process.env.DRUPAL_SERVER || 'https://your-drupal-server.com';
```

### 生产环境配置

生产环境自动使用当前域名，无需额外配置：

#### 生产环境打包编译的命令:
```
npm run build:prod
```


```javascript
// 自动检测当前域名
this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
this.baseURL = this.isDevelopment ? '' : window.location.origin;
```

## 🌐 支持的部署场景

### 场景 1: 独立域名部署
```
应用域名: https://dgrm.example.com
Drupal API: https://dgrm.example.com/api
配置: 无需特殊配置，自动使用当前域名
```

### 场景 2: 子路径部署
```
应用域名: https://example.com/dgrm
Drupal API: https://example.com/api
配置: 无需特殊配置，自动使用当前域名
```

### 场景 3: 开发环境代理
```
开发地址: http://localhost:3001
目标服务器: https://your-server.com
配置: 设置 环境变量
```

## 🔧 Drupal 服务器要求

确保目标 Drupal 服务器配置了以下端点：

### 必需的 API 端点
- `/api/user/retrieve` - 用户认证状态检查
- `/session/token` - CSRF Token 获取
- `/jsonapi/media/image/field_media_image` - 文件上传
- `/jsonapi/media/image` - 媒体实体创建
- `/jsonapi/node/aigc` - AIGC 节点创建

### 必需的内容类型
1. **AIGC 内容类型** (`node--aigc`)
   - `title`: 标题字段
   - `content_type`: 内容类型字段
   - `field_cover`: 封面图片字段

2. **媒体类型** (`media--image`)
   - `name`: 媒体名称
   - `field_media_image`: 图片文件字段

### Drupal Session Cookie 配置

为了支持跨域认证和开发环境，需要在 Drupal 的 `services.yml` 或 `settings.php` 中配置 session 参数：

```yaml
# sites/default/services.yml
parameters:
  session.storage.options:
    cookie_httponly: false       # 允许 JS 访问 cookie
    cookie_secure: false         # 非 HTTPS 环境下允许发送 cookie
    cookie_samesite: 'None'      # 允许跨域发送 cookie（如 iframe、跨站请求）
```

或者在 `settings.php` 中配置：

```php
// sites/default/settings.php
$settings['session_configuration'] = [
  'cookie_httponly' => FALSE,    // 允许 JavaScript 访问 cookie
  'cookie_secure' => FALSE,      // 允许在 HTTP 环境下发送 cookie
  'cookie_samesite' => 'None',   // 允许跨域发送 cookie
];
```

**配置说明**：
- `cookie_httponly: false` - 允许 JavaScript 访问 session cookie，这对于前端检测登录状态很重要
- `cookie_secure: false` - 允许在非 HTTPS 环境（如开发环境）下发送 cookie
- `cookie_samesite: 'None'` - 允许跨域请求携带 cookie，这对于开发环境的代理转发至关重要

**安全注意事项**：
- 生产环境建议设置 `cookie_secure: true` 并使用 HTTPS
- 生产环境可以考虑设置 `cookie_httponly: true` 增强安全性
- `cookie_samesite: 'None'` 主要用于开发环境，生产环境可根据需要调整

### CORS 配置（如果需要）
如果使用跨域部署，确保 Drupal 配置了正确的 CORS 头：
```php
// 在 Drupal 的 .htaccess 或服务器配置中
Header always set Access-Control-Allow-Origin "https://your-frontend-domain.com"
Header always set Access-Control-Allow-Credentials "true"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
```


## 🔍 故障排除

### 常见问题

#### 1. 代理连接失败
```
❌ Proxy Error: ENOTFOUND your-drupal-server.com
```
**解决方案**: 检查 DRUPAL_SERVER 环境变量是否正确设置

#### 2. CORS 错误
```
Access to fetch at 'https://...' from origin 'http://localhost:3001' has been blocked by CORS policy
```
**解决方案**: 确保目标服务器配置了正确的 CORS 头

#### 3. 认证失败
```
❌ User is not logged in: 403
```
**解决方案**: 
- 确保在目标 Drupal 系统中已登录
- 检查 Session Cookie 是否正确转发
- 验证 CSRF Token 配置
- **检查 Drupal Session Cookie 配置**：确保设置了 `cookie_httponly: false` 和 `cookie_samesite: 'None'`

#### 4. Cookie 无法跨域传递
```
❌ Session cookie not being sent in cross-origin requests
```
**解决方案**: 
- 确保 Drupal 配置了 `cookie_samesite: 'None'`
- 验证开发服务器的 CORS 配置包含 `credentials: 'include'`
- 检查浏览器是否阻止了第三方 cookie

#### 5. JavaScript 无法访问 Session Cookie
```
❌ Cannot read session cookie from document.cookie
```
**解决方案**: 
- 确保 Drupal 配置了 `cookie_httponly: false`
- 注意：这会降低安全性，仅在必要时使用

#### 6. API 端点不存在
```
❌ 404 Not Found: /api/user/retrieve
```
**解决方案**: 确保目标 Drupal 服务器配置了必需的 API 端点

### 调试技巧

#### 1. 启用详细日志
修改 `simple-dev-server.js` 中的日志级别：
```javascript
const proxyOptions = {
    // ...
    logLevel: 'debug',  // 启用详细日志
    // ...
};
```

#### 2. 检查网络请求
在浏览器开发者工具的 Network 标签中查看：
- 请求是否正确代理到目标服务器
- 响应状态码和错误信息
- Cookie 是否正确发送和接收

#### 3. 使用测试套件
`save-test.html` 提供了分步测试功能，可以精确定位问题所在。

## 📋 配置检查清单

### 开发环境
- [ ] 设置了正确的 DRUPAL_SERVER 环境变量
- [ ] 目标服务器可以访问
- [ ] 在目标 Drupal 系统中已登录
- [ ] 代理服务器启动成功
- [ ] 测试套件验证通过

### 生产环境
- [ ] DgrmJS 文件部署到正确位置
- [ ] Drupal 路由配置正确
- [ ] 必需的 API 端点可访问
- [ ] 内容类型和字段配置正确
- [ ] 用户权限配置正确

### Drupal 服务器配置检查清单

#### Session Cookie 配置
- [ ] 配置了 `cookie_httponly: false` (允许 JS 访问)
- [ ] 配置了 `cookie_secure: false` (开发环境) 或 `true` (生产环境)
- [ ] 配置了 `cookie_samesite: 'None'` (开发环境) 或 `'Lax'` (生产环境)
- [ ] 重启了 Drupal 服务器使配置生效

#### API 端点检查
- [ ] `/api/user/retrieve` 端点可访问
- [ ] `/session/token` 端点可访问
- [ ] `/jsonapi/media/image/field_media_image` 端点可访问
- [ ] `/jsonapi/media/image` 端点可访问
- [ ] `/jsonapi/node/aigc` 端点可访问

#### 内容类型和字段检查
- [ ] 创建了 `aigc` 内容类型
- [ ] 配置了 `title` 字段
- [ ] 配置了 `content_type` 字段
- [ ] 配置了 `field_cover` 字段（引用 media--image）
- [ ] 创建了 `image` 媒体类型
- [ ] 配置了 `field_media_image` 字段

#### 权限配置检查
- [ ] 用户有创建 AIGC 内容的权限
- [ ] 用户有上传文件的权限
- [ ] 用户有创建媒体实体的权限
- [ ] 用户有访问 JSON:API 的权限

#### CORS 配置检查（如果需要跨域）
- [ ] 配置了正确的 `Access-Control-Allow-Origin`
- [ ] 配置了 `Access-Control-Allow-Credentials: true`
- [ ] 配置了正确的 `Access-Control-Allow-Methods`
- [ ] 配置了正确的 `Access-Control-Allow-Headers`

---

**配置支持**: 如有问题，请参考 [DEV-SETUP.md](DEV-SETUP.md) 和 [DEPLOYMENT.md](DEPLOYMENT.md)  
**最后更新**: 2025年6月 