# DgrmJS 开发环境设置指南

本文档详细说明了 DgrmJS 项目的开发环境配置、认证系统原理和开发工作流程。

## 🎯 开发环境概述

### 架构说明
开发环境使用代理服务器来解决跨域问题，并处理与 Drupal 后端的认证集成：

```
浏览器 (localhost:3001)
    ↓ HTTP 请求
开发代理服务器 (simple-dev-server.js)
    ↓ 静态文件服务 (src/)
    ↓ API 代理转发 + Cookie 处理
Drupal 服务器 (配置的目标服务器)
    ↓ JSON:API 响应
    ↓ Session Cookie 管理
```

### 环境配置

开发服务器支持通过环境变量配置目标 Drupal 服务器：

```bash
# 默认目标服务器
DRUPAL_SERVER=https://graphmaker.intra.vizcms.cn

# 自定义目标服务器
DRUPAL_SERVER=https://your-drupal-server.com npm run dev:simple
```

## 🔐 认证系统说明

### Session Cookie 机制
DgrmJS 使用 Drupal 的原生 Session Cookie 认证机制：

1. **用户登录**: 在目标 Drupal 系统中登录
2. **Cookie 获取**: 浏览器自动保存 Session Cookie
3. **代理转发**: 开发服务器将 Cookie 转发到 Drupal
4. **状态检测**: DgrmJS 自动检测登录状态
5. **功能启用**: 启用云端保存功能

### Drupal Session Cookie 配置

为了确保认证系统正常工作，需要在 Drupal 服务器上配置正确的 session cookie 参数：

```yaml
# sites/default/services.yml
parameters:
  session.storage.options:
    cookie_httponly: false       # 允许 JS 访问 cookie
    cookie_secure: false         # 非 HTTPS 环境下允许发送 cookie
    cookie_samesite: 'None'      # 允许跨域发送 cookie（如 iframe、跨站请求）
```

**配置重要性**：
- `cookie_httponly: false` - 允许前端 JavaScript 检测和处理 session cookie
- `cookie_secure: false` - 支持开发环境的 HTTP 协议
- `cookie_samesite: 'None'` - 确保跨域代理请求能够携带认证 cookie

### 开发环境特殊处理
- **跨域代理**: 通过代理服务器转发 API 请求
- **Cookie 转发**: 自动处理 Session Cookie 的转发
- **CORS 配置**: 设置正确的跨域资源共享头
- **域名适配**: 修改 Cookie 的域名限制以适配 localhost

## 🚀 开发工作流程

### 1. 环境启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev:simple

# 3. 访问开发环境
# 浏览器打开: http://localhost:3001/index.dev.html
```

### 2. 认证设置

```bash
# 1. 在新标签页打开 Drupal 登录页面
# https://graphmaker.intra.vizcms.cn/user/login

# 2. 使用管理员账户登录
# 用户名: admin
# 密码: [管理员密码]

# 3. 返回 DgrmJS 开发页面
# 系统会自动检测登录状态
```

### 3. 开发调试

#### 检查认证状态
```javascript
// 在浏览器控制台执行
drupalAPI.checkLoginStatus().then(result => {
    console.log('登录状态:', result);
});
```

#### 使用测试套件
访问完整的测试页面进行功能验证：
```
http://localhost:3001/save-test.html
```

**测试套件功能**:
- 逐步测试每个 API 环节
- 详细的错误信息和调试输出
- 可视化的测试结果展示
- 独立测试各个功能模块

#### 查看网络请求
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签页
3. 执行保存操作，观察 API 请求
4. 检查请求头中的 Cookie 和 X-CSRF-Token

#### 服务器日志
开发服务器会输出详细的代理日志：
```
🍪 [GET /api/user/retrieve] Forwarding cookies: SSESS38aa37e6190f58d3aab8779669f4e887=...
🔄 Proxying GET /api/user/retrieve to https://graphmaker.intra.vizcms.cn/api/user/retrieve
✅ Proxy response for /api/user/retrieve: 200
```

### 4. 代码修改和热重载

#### 自动构建
```bash
# 监听模式 - 文件变化时自动重新构建
npm run dev:watch
```

#### 手动构建
```bash
# 手动构建开发版本
npm run dev:build
```

## 📁 关键文件说明

### 开发服务器文件

#### `simple-dev-server.js` (推荐)
- **用途**: 轻量级开发服务器
- **特性**: API 代理、Cookie 转发、CORS 配置
- **端口**: 3001
- **启动**: `npm run dev:simple`

#### `dev-server.js` (完整版)
- **用途**: 功能完整的开发服务器
- **特性**: 文件监听、自动重建、热重载
- **端口**: 3000
- **启动**: `npm run dev`

### 构建配置文件

#### `rollup.dev.config.js`
```javascript
export default {
    input: 'src/index.js',
    output: {
        file: 'src/bundle.js',
        format: 'iife',
        sourcemap: true  // 开发版本包含 source map
    },
    plugins: [
        // 无压缩，便于调试
    ]
};
```

#### `rollup.config.js`
```javascript
export default {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'iife',
        sourcemap: false  // 生产版本不包含 source map
    },
    plugins: [
        terser()  // 压缩优化
    ]
};
```

### 核心功能文件

#### `src/infrastructure/drupal-api.js`
- **认证管理**: checkLoginStatus(), getCurrentCSRFToken()
- **文件上传**: uploadFile() - 使用 application/octet-stream
- **媒体创建**: createMediaEntity() - 创建 media--image 实体
- **节点创建**: createAIGCNode() - 创建 node--aigc 实体
- **完整流程**: saveDiagramToCloud() - 端到端保存流程

#### `src/infrastructure/diagram-cover.js`
- **封面生成**: generateDiagramCover() - 从 SVG/Canvas 生成 PNG
- **尺寸调整**: resizeToCoverSize() - 调整为 1024x1024
- **默认封面**: createDefaultCover() - 空图表的默认封面

#### `src/ui/menu.js`
- **菜单界面**: 主菜单组件
- **保存入口**: "Save to Cloud" 按钮处理
- **用户交互**: 标题输入、状态反馈

## 🔧 配置和自定义

### 修改代理目标
```javascript
// simple-dev-server.js
const DRUPAL_BASE_URL = 'https://graphmaker.intra.vizcms.cn';

// 如需更改目标服务器，修改此 URL
```

### 调整端口配置
```javascript
// simple-dev-server.js
const PORT = process.env.PORT || 3001;

// 或通过环境变量设置
// PORT=3002 npm run dev:simple
```

### 自定义 CORS 设置
```javascript
// simple-dev-server.js
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    next();
});
```

## 🐛 常见问题和解决方案

### 1. 认证问题

**问题**: API 返回 403 Forbidden
```
解决方案:
1. 确认已在 Drupal 登录
2. 检查 session cookie 是否存在
3. 验证 CSRF token 获取正常
4. 查看代理服务器日志
```

**问题**: Cookie 未正确转发
```
解决方案:
1. 检查浏览器 cookie 设置
2. 确认代理服务器 cookie 转发逻辑
3. 验证 CORS 配置中的 credentials: 'include'
```

### 2. 文件上传问题

**问题**: 415 Unsupported Media Type
```
解决方案:
1. 确认使用 Content-Type: application/octet-stream
2. 检查 Content-Disposition 头设置
3. 验证文件大小限制
```

**问题**: 422 Unprocessable Content
```
解决方案:
1. 检查请求体格式是否符合 JSON:API 规范
2. 验证必需字段是否完整
3. 确认字段名称和类型正确
```

### 3. 开发服务器问题

**问题**: 端口占用 (EADDRINUSE)
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 终止进程
taskkill /PID <进程ID> /F

# 或使用不同端口
PORT=3002 npm run dev:simple
```

**问题**: 代理请求失败
```
解决方案:
1. 检查网络连接到 Drupal 服务器
2. 验证代理配置路径
3. 查看服务器错误日志
```

## 📊 性能优化建议

### 1. 开发环境优化
- 使用 `simple-dev-server.js` 而非完整版服务器
- 启用文件监听时避免监听 node_modules
- 使用浏览器缓存加速静态资源加载

### 2. 构建优化
- 开发构建保留 source map 便于调试
- 生产构建启用压缩和优化
- 分离第三方库和应用代码（如有需要）

### 3. API 请求优化
- 缓存 CSRF token 避免重复请求
- 实现请求去重机制
- 添加适当的错误重试逻辑

---

**文档维护**: DgrmJS 开发团队  
**最后更新**: 2025年6月  
**版本**: v1.0.0 