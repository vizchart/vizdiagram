# DgrmJS URL 初始化功能指南

## 概述

DgrmJS 支持通过URL参数自动加载图表，支持两种格式：
- **JSON格式**：直接加载JSON元数据文件
- **PNG格式**：从PNG图片中提取图表数据

## URL参数格式

### 基本语法
```
# 文件加载方式
http://localhost:3001/index.dev.html?type=<格式>&file=<文件路径>&scale=<缩放值>

# Drupal节点加载方式
http://localhost:3001/index.dev.html?type=drupal&uuid=<节点UUID>&scale=<缩放值>

# 仅设置缩放值（不加载图表）
http://localhost:3001/index.dev.html?scale=<缩放值>
```

### 参数说明
- `type`: 加载类型，支持 `json`、`png` 或 `drupal`
- `file`: 文件路径，可以是相对路径或绝对路径（用于 `json` 和 `png` 类型）
- `uuid`: Drupal AIGC节点的UUID（用于 `drupal` 类型）
- `scale`: 初始缩放值，范围 0.1-4.0，默认为 1.0（可选参数）

## 使用示例

### 1. 加载本地JSON文件

```bash
# 加载项目根目录下的JSON文件
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json

# 自动添加.json扩展名
http://localhost:3001/index.dev.html?type=json&file=test-diagram

# 加载子目录中的文件
http://localhost:3001/index.dev.html?type=json&file=/diagrams/example.json

# 加载文件并设置初始缩放为50%
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json&scale=0.5

# 加载文件并设置初始缩放为200%
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json&scale=2.0
```

### 2. 加载本地PNG文件

```bash
# 加载包含图表数据的PNG文件
http://localhost:3001/index.dev.html?type=png&file=/images/diagram.png

# 加载PNG文件并设置初始缩放为75%
http://localhost:3001/index.dev.html?type=png&file=/images/diagram.png&scale=0.75
```

### 3. 加载Drupal服务器文件（跨域）

```bash
# 通过代理加载Drupal服务器上的JSON文件
http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json

# 通过代理加载Drupal服务器上的PNG文件
http://localhost:3001/index.dev.html?type=png&file=/drupal-files/sites/default/files/images/diagram.png

# 加载Drupal文件并设置初始缩放
http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json&scale=1.5
```

### 4. 从Drupal AIGC节点加载

```bash
# 通过UUID加载Drupal AIGC节点中的图表数据
http://localhost:3001/index.dev.html?type=drupal&uuid=12345678-1234-1234-1234-123456789abc

# 实际示例（使用真实的UUID）
http://localhost:3001/index.dev.html?type=drupal&uuid=a1b2c3d4-e5f6-7890-abcd-ef1234567890

# 加载Drupal节点并设置初始缩放为150%
http://localhost:3001/index.dev.html?type=drupal&uuid=a1b2c3d4-e5f6-7890-abcd-ef1234567890&scale=1.5
```

### 5. 仅设置初始缩放值

```bash
# 打开空白画布，设置初始缩放为50%
http://localhost:3001/index.dev.html?scale=0.5

# 打开空白画布，设置初始缩放为200%
http://localhost:3001/index.dev.html?scale=2.0

# 打开空白画布，设置初始缩放为最小值25%
http://localhost:3001/index.dev.html?scale=0.25

# 打开空白画布，设置初始缩放为最大值400%
http://localhost:3001/index.dev.html?scale=4.0
```

## 缩放参数详细说明

### 有效范围
- **最小值**: 0.1 (10%)
- **最大值**: 4.0 (400%)
- **默认值**: 1.0 (100%)

### 常用缩放值
- `0.1` - 10%，适合查看超大型图表的全貌
- `0.2` - 20%，适合复杂系统架构图概览
- `0.25` - 25%，适合查看大型流程图全貌
- `0.4` - 40%，适合中大型图表的整体结构
- `0.5` - 50%，适合中等大小的图表概览
- `0.75` - 75%，稍微缩小的视图
- `1.0` - 100%，默认大小（1:1显示）
- `1.25` - 125%，稍微放大的视图
- `1.5` - 150%，适合详细编辑
- `2.0` - 200%，高倍放大，适合精细操作
- `4.0` - 400%，最大放大倍数

### 错误处理
- 如果缩放值超出范围（< 0.1 或 > 4.0），将使用默认值 1.0
- 如果缩放值不是有效数字，将使用默认值 1.0
- 控制台会显示相应的警告信息

### 示例场景

#### 场景1：查看大型流程图
```bash
# 使用较小的缩放值查看整体结构
http://localhost:3001/index.dev.html?type=json&file=/large-flowchart.json&scale=0.5
```

#### 场景2：精细编辑小组件
```bash
# 使用较大的缩放值进行详细编辑
http://localhost:3001/index.dev.html?type=json&file=/detailed-diagram.json&scale=2.0
```

#### 场景3：演示模式
```bash
# 使用适中的缩放值进行演示
http://localhost:3001/index.dev.html?type=drupal&uuid=demo-uuid&scale=1.25
```

## 跨域解决方案

### 开发环境代理

开发服务器提供了 `/drupal-files` 代理路径，可以访问 `graphmaker.intra.vizcms.cn` 上的文件：

```bash
# 原始Drupal路径
https://graphmaker.intra.vizcms.cn/sites/default/files/diagrams/example.json

# 通过代理访问
http://localhost:3001/drupal-files/sites/default/files/diagrams/example.json

# 在URL参数中使用
http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json
```

### CORS支持

开发服务器已配置完整的CORS支持：
- 允许所有来源 (`Access-Control-Allow-Origin: *`)
- 支持所有HTTP方法
- 正确的MIME类型设置
- Cookie和认证头转发

## 文件格式要求

### JSON格式
- 必须是有效的DgrmJS图表JSON格式
- 版本号必须为 "1.1"
- 包含 `v` 和 `s` 属性

示例：
```json
{
  "v": "1.1",
  "s": [
    {
      "type": 2,
      "position": {"x": 300, "y": 200},
      "title": "示例矩形",
      "styles": ["cl-blue"]
    }
  ]
}
```

### PNG格式
- 必须是通过DgrmJS导出的PNG文件
- 包含嵌入的图表元数据
- 支持标准PNG格式

### Drupal AIGC节点格式
- 节点类型必须为 `aigc`
- 必须包含 `content_data` 字段，存储图表的JSON数据
- UUID必须是有效的Drupal节点UUID格式
- 系统会自动从 `content_data` 字段中提取图表数据
- 加载后会自动设置当前图表状态，支持后续保存操作

## 错误处理

### 常见错误及解决方案

1. **文件未找到 (404)**
   ```
   Failed to fetch JSON file: 404 Not Found
   ```
   - 检查文件路径是否正确
   - 确认文件存在于指定位置

2. **跨域错误 (CORS)**
   ```
   Access to fetch at '...' from origin '...' has been blocked by CORS policy
   ```
   - 使用 `/drupal-files` 代理路径
   - 确保开发服务器正在运行

3. **格式错误**
   ```
   Invalid diagram format. Expected format: {v: "1.1", s: [...]}
   ```
   - 检查JSON文件格式是否正确
   - 确认版本号为 "1.1"

4. **PNG数据提取失败**
   ```
   No diagram data found in PNG file
   ```
   - 确认PNG文件是通过DgrmJS导出的
   - 检查文件是否损坏

5. **Drupal节点获取失败**
   ```
   Failed to fetch Drupal node: 404 Not Found
   ```
   - 检查UUID是否正确
   - 确认节点存在且类型为 `aigc`
   - 检查网络连接和API权限

6. **Drupal节点数据格式错误**
   ```
   No diagram data found in Drupal node content_data field
   ```
   - 确认节点的 `content_data` 字段包含有效的图表JSON数据
   - 检查JSON格式是否正确

## 开发服务器配置

### 启动服务器
```bash
npm run dev:simple
```

### 服务器功能
- **静态文件服务**：提供项目文件访问
- **API代理**：转发到Drupal服务器
- **文件代理**：解决跨域文件访问
- **CORS支持**：完整的跨域请求支持
- **调试端点**：健康检查和Cookie调试

### 可用端点
- `http://localhost:3001/` - 主页
- `http://localhost:3001/index.dev.html` - 开发版本
- `http://localhost:3001/health` - 健康检查
- `http://localhost:3001/debug/cookies` - Cookie调试
- `http://localhost:3001/drupal-files/...` - Drupal文件代理

## 实际应用场景

### 1. 团队协作
```bash
# 分享图表链接给团队成员
http://localhost:3001/index.dev.html?type=json&file=/shared/project-flow.json
```

### 2. 文档集成
```bash
# 在文档中嵌入图表链接
http://localhost:3001/index.dev.html?type=json&file=/docs/api-workflow.json
```

### 3. 演示和展示
```bash
# 快速加载演示图表
http://localhost:3001/index.dev.html?type=png&file=/demos/business-process.png
```

### 4. 从Drupal CMS加载
```bash
# 加载CMS中存储的图表
http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/aigc/diagram-123.json
```

## 注意事项

1. **文件路径**：使用绝对路径（以 `/` 开头）确保正确解析
2. **文件扩展名**：JSON文件可以省略 `.json` 扩展名，会自动添加
3. **编码格式**：确保JSON文件使用UTF-8编码
4. **文件大小**：建议图表文件大小不超过1MB
5. **缓存**：开发环境禁用了缓存，生产环境需要考虑缓存策略

## 故障排除

### 检查清单
- [ ] 开发服务器是否正在运行
- [ ] 文件路径是否正确
- [ ] 文件格式是否有效
- [ ] 网络连接是否正常
- [ ] 浏览器控制台是否有错误信息

### 调试步骤
1. 检查浏览器控制台的错误信息
2. 访问 `/health` 端点确认服务器状态
3. 直接访问文件URL确认文件可访问
4. 使用 `/debug/cookies` 检查认证状态

这个功能让DgrmJS更加灵活，支持多种图表加载方式，特别适合团队协作和系统集成场景。 