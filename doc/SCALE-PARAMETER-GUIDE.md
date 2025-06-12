# DgrmJS 缩放参数功能指南

## 🔍 概述

DgrmJS 现在支持通过 URL 参数 `scale` 来设置画布的初始缩放值，让您可以在打开应用时就设定合适的视图比例。

## 📋 基本用法

### 语法格式
```
http://localhost:3001/index.dev.html?scale=<缩放值>
```

### 参数说明
- **参数名**: `scale`
- **数据类型**: 浮点数
- **有效范围**: 0.1 - 4.0
- **默认值**: 1.0
- **单位**: 倍数（1.0 = 100%）

## 🎯 使用示例

### 基础示例
```bash
# 50% 缩放（适合查看大图表全貌）
http://localhost:3001/index.dev.html?scale=0.5

# 150% 缩放（适合详细编辑）
http://localhost:3001/index.dev.html?scale=1.5

# 200% 缩放（适合精细操作）
http://localhost:3001/index.dev.html?scale=2.0
```

### 与其他参数组合
```bash
# 加载图表并设置缩放
http://localhost:3001/index.dev.html?type=json&file=/test-diagram.json&scale=0.75

# 从 Drupal 加载并设置缩放
http://localhost:3001/index.dev.html?type=drupal&uuid=your-uuid&scale=1.25

# 加载 PNG 文件并设置缩放
http://localhost:3001/index.dev.html?type=png&file=/diagram.png&scale=2.0
```

## 📊 常用缩放值参考

| 缩放值 | 百分比 | 适用场景 | 说明 |
|--------|--------|----------|------|
| 0.25 | 25% | 超大图表概览 | 最小缩放，查看复杂流程图全貌 |
| 0.5 | 50% | 大图表概览 | 适合查看中大型图表的整体结构 |
| 0.75 | 75% | 中等图表查看 | 在概览和细节之间的平衡 |
| 1.0 | 100% | 默认视图 | 标准 1:1 显示比例 |
| 1.25 | 125% | 舒适编辑 | 稍微放大，便于编辑操作 |
| 1.5 | 150% | 详细编辑 | 适合精确编辑和调整 |
| 2.0 | 200% | 精细操作 | 高倍放大，适合细节处理 |
| 4.0 | 400% | 最大放大 | 极限放大，适合像素级操作 |

## ⚠️ 错误处理

### 无效值处理
当提供无效的缩放值时，系统会：
1. 在控制台显示警告信息
2. 自动使用默认值 1.0
3. 继续正常初始化应用

### 常见错误示例
```bash
# 小于最小值 - 将使用默认值 1.0
http://localhost:3001/index.dev.html?scale=0.1

# 大于最大值 - 将使用默认值 1.0  
http://localhost:3001/index.dev.html?scale=5.0

# 非数字值 - 将使用默认值 1.0
http://localhost:3001/index.dev.html?scale=abc
```

### 控制台日志
```javascript
// 成功设置缩放值
🔍 Setting initial scale from URL parameter: 1.5

// 无效缩放值警告
⚠️ Invalid scale parameter: 5.0. Using default scale: 1
```

## 🛠️ 技术实现

### 代码位置
- 主要实现：`src/index.js`
- 参数解析在 `DOMContentLoaded` 事件中进行
- 缩放值验证确保在有效范围内

### 实现逻辑
```javascript
// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const scaleParam = urlParams.get('scale');

// 验证并设置初始缩放值
let initialScale = 1; // 默认值
if (scaleParam) {
    const parsedScale = parseFloat(scaleParam);
    if (!isNaN(parsedScale) && parsedScale >= 0.1 && parsedScale <= 4) {
        initialScale = parsedScale;
    }
}

// 应用到画布数据
canvas[CanvasSmbl] = {
    data: {
        position: { x: 0, y: 0 },
        scale: initialScale,
        cell: 24
    },
    shapeMap: shapeTypeMap(canvas)
};
```

## 🎨 应用场景

### 场景1：大型流程图查看
```bash
# 使用小缩放值查看整体结构
http://localhost:3001/index.dev.html?type=json&file=/large-process.json&scale=0.5
```
**适用于**：复杂的业务流程图、系统架构图

### 场景2：详细设计编辑
```bash
# 使用大缩放值进行精确编辑
http://localhost:3001/index.dev.html?type=json&file=/ui-mockup.json&scale=2.0
```
**适用于**：UI 原型设计、详细的技术图表

### 场景3：演示和展示
```bash
# 使用适中缩放值进行演示
http://localhost:3001/index.dev.html?type=drupal&uuid=demo-diagram&scale=1.25
```
**适用于**：会议演示、客户展示

### 场景4：移动设备适配
```bash
# 在小屏幕设备上使用较小缩放值
http://localhost:3001/index.dev.html?scale=0.75
```
**适用于**：平板电脑、小屏幕笔记本

## 🔧 开发和调试

### 测试不同缩放值
使用 `test-url-init.html` 页面可以快速测试各种缩放值：
```bash
http://localhost:3001/test-url-init.html
```

### 控制台调试
打开浏览器开发者工具，查看控制台输出：
- 成功设置缩放值的确认信息
- 无效参数的警告信息
- 其他相关的调试信息

### 动态修改缩放值
在运行时，您仍然可以通过鼠标滚轮、触摸手势等方式调整缩放值，URL 参数只影响初始状态。

## 📝 注意事项

1. **参数优先级**：URL 参数只在页面初始化时生效
2. **浏览器兼容性**：支持所有现代浏览器
3. **性能影响**：缩放参数不会影响应用性能
4. **用户体验**：建议根据内容复杂度选择合适的初始缩放值
5. **URL 长度**：缩放参数不会显著增加 URL 长度

## 🔗 相关文档

- [URL 初始化功能指南](./URL-INITIALIZATION-GUIDE.md)
- [开发环境配置](./CONFIGURATION.md)
- [API 参考文档](./DRUPAL-API-REFERENCE.md)

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