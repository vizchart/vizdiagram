# 图片组件功能说明

## 概述

DgrmJS 新增了图片组件功能，支持在图表中添加图片元素，并将图片上传到 Drupal AIGC 节点的 `ref_images` 字段中。

## 功能特性

### 🎨 组件特性
- **类型ID**: 6
- **默认尺寸**: 120x120 像素
- **连接点**: 上下左右四个方向
- **可调整大小**: 支持通过拖拽调整
- **图片适配**: 保持比例，居中裁剪显示

### 🖼️ 视觉设计
- **占位符状态**: 虚线边框 + 图片图标 + "双击上传图片"提示
- **已上传状态**: 绿色实线边框 + 显示图片内容
- **加载状态**: 显示"上传中..."文字

## 使用方法

### 1. 添加图片组件
1. 在左侧工具栏中找到图片组件按钮（虚线方框图标）
2. 拖拽到画布上的目标位置
3. 组件会显示为虚线边框的占位符

### 2. 上传图片
1. 双击图片组件
2. 如果图表尚未保存，会提示先保存图表
3. 如果图表已保存，会弹出文件选择对话框
4. 选择图片文件（支持常见图片格式）
5. 等待上传完成，图片会显示在组件中

### 3. 调整大小
- 选中图片组件后，可以拖拽边角调整大小
- 图片会自动适配新的尺寸，保持比例

## 技术实现

### API 集成
图片上传使用 Drupal JSON:API，具体流程：

```javascript
// 1. 上传文件到 ref_images 字段
POST /jsonapi/node/aigc/ref_images
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="image.jpg"

// 2. 获取现有 ref_images 值
GET /jsonapi/node/aigc/{uuid}?fields[node--aigc]=ref_images

// 3. 更新节点，添加新文件到数组
PATCH /jsonapi/node/aigc/{uuid}
{
  "data": {
    "type": "node--aigc",
    "id": "{uuid}",
    "relationships": {
      "ref_images": {
        "data": [...existing_files, {type: "file--file", id: "new_file_id"}]
      }
    }
  }
}
```

### 组件结构
```javascript
// 图片组件数据结构
{
  type: 6,                    // 组件类型ID
  position: {x: 100, y: 100}, // 位置
  w: 120,                     // 宽度
  h: 120,                     // 高度
  imageUrl: "blob:...",       // 图片URL（本地预览）
  title: "Image",             // 标题（可选）
  styles: ["cl-green"]        // 样式类（可选）
}
```

### SVG 模板
```xml
<rect data-key="outer" ... />                    <!-- 外边框（事件区域） -->
<rect data-key="main" ... stroke-dasharray="5,5" /> <!-- 主边框（虚线） -->
<g data-key="placeholder">                       <!-- 占位符图标 -->
  <path d="..." fill="#6c757d" opacity="0.3"/>   <!-- 图片框 -->
  <circle cx="-5" cy="-5" r="3" />               <!-- 太阳 -->
  <path d="..." stroke="#6c757d" />              <!-- 山峰 -->
</g>
<image data-key="image" ... />                   <!-- 实际图片 -->
<text data-key="text">双击上传图片</text>          <!-- 提示文字 -->
```

## 状态管理

### 图表状态检查
```javascript
const currentDiagram = drupalAPI.getCurrentDiagram();
if (!currentDiagram.nodeId) {
  alert('⚠️ 请先保存图表，然后才能上传图片到ref_images字段');
  return;
}
```

### 上传状态反馈
- **开始上传**: 显示"上传中..."，文字变蓝色
- **上传成功**: 显示图片，边框变绿色，隐藏占位符
- **上传失败**: 显示错误提示，恢复原状态

## 错误处理

### 常见错误情况
1. **图表未保存**: 提示用户先保存图表
2. **用户未登录**: 提示认证失败
3. **网络错误**: 显示具体错误信息
4. **文件格式不支持**: 提示选择正确格式
5. **服务器错误**: 显示服务器返回的错误信息

### 错误处理代码
```javascript
try {
  const result = await drupalAPI.addImageToRefImagesField(file, nodeUuid);
  if (result.success) {
    // 处理成功
  } else {
    throw new Error(result.error || 'Upload failed');
  }
} catch (error) {
  console.error('❌ Image upload failed:', error);
  alert(`❌ 图片上传失败:\n\n${error.message}`);
  hideLoading();
}
```

## 测试方法

### 手动测试
1. 访问 `test-image-component.html` 测试页面
2. 点击"打开图表编辑器"
3. 拖拽图片组件到画布
4. 双击组件测试上传功能

### 控制台日志
成功上传时的控制台输出：
```
📷 Adding image to ref_images field for node: {uuid}
✅ File uploaded to ref_images field: {file_id}
📋 Current ref_images: [{existing_files}]
✅ Image successfully added to ref_images field
✅ Image uploaded successfully to ref_images field
```

## 文件结构

### 新增文件
- `src/shapes/image.js` - 图片组件实现
- `doc/IMAGE-COMPONENT.md` - 功能说明文档
- `test-image-component.html` - 测试页面

### 修改文件
- `src/shapes/shape-type-map.js` - 添加图片组件映射
- `src/ui/shape-menu.js` - 添加图片组件按钮
- `src/infrastructure/drupal-api.js` - 添加上传方法
- `src/index.js` - 设置全局 drupalAPI

## 注意事项

1. **依赖关系**: 图片上传功能依赖 Drupal 后端和认证状态
2. **文件大小**: 建议限制上传文件大小，避免影响性能
3. **图片格式**: 支持常见图片格式（jpg, png, gif, webp等）
4. **本地预览**: 使用 `URL.createObjectURL()` 创建本地预览
5. **内存管理**: 适时调用 `URL.revokeObjectURL()` 释放内存

## 未来改进

1. **拖拽上传**: 支持直接拖拽图片文件到组件
2. **图片编辑**: 支持基本的图片编辑功能（裁剪、旋转等）
3. **批量上传**: 支持一次选择多张图片
4. **图片库**: 显示已上传的图片列表，支持重复使用
5. **压缩优化**: 自动压缩大图片以提高性能 