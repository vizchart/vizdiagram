# DgrmJS URL 初始化功能测试指南

## 测试环境准备

### 1. 启动开发服务器

```bash
# 在项目根目录执行
npm run dev:simple
```

如果端口3001被占用，会显示错误信息。需要先停止其他服务器。

### 2. 确认服务器启动成功

服务器启动后会显示以下信息：
```
🎉 Simple DgrmJS Development Server is running!
📍 Local:            http://localhost:3001
📍 Development Page: http://localhost:3001/index.dev.html
📍 Health Check:     http://localhost:3001/health
📍 Cookie Debug API: http://localhost:3001/debug/cookies
🔗 Drupal API Proxy: https://graphmaker.intra.vizcms.cn
🌐 Drupal Files Proxy: http://localhost:3001/drupal-files/...
🍪 Enhanced cookie forwarding enabled for session management
🔄 CORS enabled for cross-origin requests

API Proxy Routes:
  /user -> https://graphmaker.intra.vizcms.cn/user
  /api -> https://graphmaker.intra.vizcms.cn/api
  /jsonapi -> https://graphmaker.intra.vizcms.cn/jsonapi
  /session -> https://graphmaker.intra.vizcms.cn/session
  /sites -> https://graphmaker.intra.vizcms.cn/sites

URL Initialization Examples:
  📄 JSON: http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json
  📄 JSON: http://localhost:3001/index.dev.html?type=json&file=test-diagram
  🖼️  PNG: http://localhost:3001/index.dev.html?type=png&file=/path/to/diagram.png
  🌐 Drupal: http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json
```

## 测试用例

### 测试1：基本功能验证

#### 1.1 健康检查
```bash
# 在浏览器中访问
http://localhost:3001/health
```

**期望结果**：
```json
{
  "status": "ok",
  "server": "DgrmJS Development Server",
  "drupalProxy": "https://graphmaker.intra.vizcms.cn",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 1.2 静态文件访问
```bash
# 直接访问测试JSON文件
http://localhost:3001/test-diagram.json
```

**期望结果**：显示JSON内容，包含图表数据。

### 测试2：JSON格式初始化

#### 2.1 完整路径加载
```bash
# 测试URL
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json
```

**测试步骤**：
1. 在浏览器中打开上述URL
2. 观察页面加载过程
3. 检查浏览器控制台输出

**期望结果**：
- 页面自动加载图表
- 控制台显示：`🔄 Initializing diagram from URL: type=json, file=/test-diagram.json`
- 控制台显示：`📄 Loading JSON diagram from: /test-diagram.json`
- 控制台显示：`✅ Successfully loaded JSON diagram with 4 elements`
- 图表包含：蓝色矩形"URL初始化测试"、绿色圆形"成功加载"、灰色文本"通过URL参数加载的图表"、连接线

#### 2.2 自动扩展名加载
```bash
# 测试URL（省略.json扩展名）
http://localhost:3001/index.dev.html?type=json&file=test-diagram
```

**期望结果**：与2.1相同，系统自动添加`.json`扩展名。

### 测试3：PNG格式初始化

#### 3.1 准备PNG测试文件
首先需要创建一个包含图表数据的PNG文件：

1. 访问：`http://localhost:3001/index.dev.html`
2. 创建一个简单图表（如添加一个矩形）
3. 点击菜单 → "Download Image" 保存为PNG
4. 将PNG文件重命名为 `test-diagram.png` 并放在项目根目录

#### 3.2 PNG文件加载测试
```bash
# 测试URL
http://localhost:3001/index.dev.html?type=png&file=/test-diagram.png
```

**期望结果**：
- 控制台显示：`📷 Loading PNG diagram from: /test-diagram.png`
- 成功从PNG文件中提取并加载图表数据

### 测试4：错误处理测试

#### 4.1 无效文件路径
```bash
# 测试不存在的文件
http://localhost:3001/index.dev.html?type=json&file=/nonexistent.json
```

**期望结果**：
- 显示错误弹窗：`❌ Failed to load diagram: Failed to fetch JSON file: 404 Not Found`
- 控制台显示详细错误信息

#### 4.2 无效文件格式
```bash
# 测试无效的type参数
http://localhost:3001/index.dev.html?type=invalid&file=/test-diagram.json
```

**期望结果**：
- 显示错误弹窗：`❌ Invalid type parameter. Use "png" or "json"`

#### 4.3 无效JSON格式
创建一个无效的JSON文件 `invalid.json`：
```json
{
  "invalid": "format"
}
```

```bash
# 测试无效JSON格式
http://localhost:3001/index.dev.html?type=json&file=/invalid.json
```

**期望结果**：
- 显示错误弹窗：`❌ Failed to load diagram: Invalid diagram format. Expected format: {v: "1.1", s: [...]}`

### 测试5：跨域文件访问（Drupal代理）

#### 5.1 代理路径测试
```bash
# 测试代理功能（如果Drupal服务器上有文件）
http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/test.json
```

**注意**：这个测试需要Drupal服务器上实际存在对应的文件。

#### 5.2 直接代理访问测试
```bash
# 直接访问代理路径
http://localhost:3001/drupal-files/sites/default/files/
```

**期望结果**：返回Drupal服务器的响应（可能是目录列表或404，取决于服务器配置）。

### 测试6：集成功能测试

#### 6.1 历史记录集成
1. 通过URL加载图表
2. 修改图表（添加/删除元素）
3. 使用撤销/重做功能

**期望结果**：
- URL加载的图表作为初始状态
- 撤销/重做功能正常工作
- 历史记录正确保存

#### 6.2 保存功能集成
1. 通过URL加载图表
2. 修改图表
3. 使用"Save to Cloud"功能

**期望结果**：
- 能够正常保存修改后的图表
- 保存时重置当前图表状态

## 调试技巧

### 1. 浏览器控制台
打开浏览器开发者工具（F12），查看Console标签页的输出信息：
- `🔄` 开始初始化
- `📄` 或 `📷` 加载过程
- `✅` 成功加载
- `❌` 错误信息

### 2. 网络请求监控
在开发者工具的Network标签页中监控：
- JSON文件请求状态
- PNG文件请求状态
- 代理请求转发情况

### 3. 服务器日志
观察终端中的服务器输出，特别是代理请求的日志。

### 4. 错误排查步骤
如果加载失败：
1. 检查文件是否存在：直接访问文件URL
2. 检查文件格式：确认JSON格式正确
3. 检查网络：确认服务器正在运行
4. 检查控制台：查看详细错误信息

## 性能测试

### 1. 加载时间测试
测试不同大小文件的加载时间：
- 小文件（< 1KB）
- 中等文件（1-10KB）
- 大文件（> 10KB）

### 2. 并发加载测试
同时打开多个带URL参数的标签页，测试并发加载能力。

## 兼容性测试

### 浏览器兼容性
在以下浏览器中测试：
- Chrome
- Firefox
- Safari
- Edge

### URL编码测试
测试包含特殊字符的文件路径：
```bash
# 包含空格的文件名
http://localhost:3001/index.dev.html?type=json&file=/test%20diagram.json

# 包含中文的文件名
http://localhost:3001/index.dev.html?type=json&file=/测试图表.json
```

## 自动化测试脚本

可以创建简单的测试脚本来验证功能：

```javascript
// 在浏览器控制台中运行
async function testURLInitialization() {
  const testCases = [
    { type: 'json', file: '/test-diagram.json' },
    { type: 'json', file: 'test-diagram' },
    { type: 'json', file: '/nonexistent.json' }, // 应该失败
  ];
  
  for (const testCase of testCases) {
    const url = `${window.location.origin}/index.dev.html?type=${testCase.type}&file=${testCase.file}`;
    console.log(`Testing: ${url}`);
    // 在新标签页中打开进行测试
    window.open(url, '_blank');
  }
}

// 运行测试
testURLInitialization();
```

## 测试报告模板

### 测试结果记录
| 测试用例 | URL | 期望结果 | 实际结果 | 状态 |
|---------|-----|---------|---------|------|
| JSON基本加载 | `?type=json&file=/test-diagram.json` | 成功加载4个元素 | ✅ 成功 | PASS |
| 自动扩展名 | `?type=json&file=test-diagram` | 成功加载4个元素 | ✅ 成功 | PASS |
| 文件不存在 | `?type=json&file=/nonexistent.json` | 显示404错误 | ✅ 显示错误 | PASS |
| 无效类型 | `?type=invalid&file=/test-diagram.json` | 显示类型错误 | ✅ 显示错误 | PASS |

### 问题记录
记录测试过程中发现的问题：
1. 问题描述
2. 重现步骤
3. 期望行为
4. 实际行为
5. 解决方案

这个测试指南提供了全面的测试覆盖，确保URL初始化功能的稳定性和可靠性。 