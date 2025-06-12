# Ref Images 清理功能

## 功能概述

当保存图表时，系统会自动清理 `ref_images` 字段中不再使用的图片文件，避免冗余文件积累。

## 工作原理

### 1. 图片组件数据结构

图片组件根据图片大小采用不同的存储方式：

#### 大图片（≥100KB）
存储两个关键字段：
- `imageUrl`: 图片的URL地址
- `fileId`: 图片文件在Drupal中的文件ID

```javascript
// 大图片组件数据示例
{
  type: 6,
  position: { x: 100, y: 100 },
  w: 120,
  h: 120,
  imageUrl: "/sites/graphmaker/files/aigc_ref_images/2025-06/image.png",
  fileId: "12345-abcd-6789-efgh"
}
```

#### 小图片（<100KB）
仅存储base64数据：
- `imageUrl`: base64格式的图片数据
- `fileId`: 不设置（undefined或null）

```javascript
// 小图片组件数据示例
{
  type: 6,
  position: { x: 100, y: 100 },
  w: 120,
  h: 120,
  imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  fileId: undefined
}
```

### 2. 上传流程

当用户双击图片组件上传图片时：

1. **检查图片大小**：
   - 如果图片小于100KB，直接转换为base64格式嵌入到组件中，无需上传到服务器
   - 如果图片大于等于100KB，执行后续上传流程

2. **大图片上传流程**（仅适用于≥100KB的图片）：
   - 检查图表是否已保存（有nodeId）
   - 上传图片到 `/jsonapi/node/aigc/ref_images` 端点
   - 获取返回的文件ID和URL
   - 同时保存 `imageUrl` 和 `fileId` 到组件数据中

3. **小图片处理流程**（适用于<100KB的图片）：
   - 将图片转换为base64格式
   - 直接保存base64数据到 `imageUrl` 字段
   - 不设置 `fileId`（因为没有上传到服务器）

### 3. 清理流程

当保存图表时（仅对更新操作，不包括新建）：

1. **扫描图表数据**：遍历所有图片组件（type: 6），收集使用中的文件ID
   - 只收集有 `fileId` 的组件（即大图片组件）
   - 忽略base64格式的小图片组件（因为它们没有fileId，不占用服务器存储）
2. **获取当前ref_images**：从节点获取当前 `ref_images` 字段的所有文件ID
3. **识别未使用文件**：对比两个列表，找出不再使用的文件ID
4. **更新ref_images字段**：移除未使用的文件引用，保留仍在使用的文件

## 代码实现

### 主要方法

#### `cleanupUnusedRefImages(nodeUuid, diagramData)`

```javascript
async cleanupUnusedRefImages(nodeUuid, diagramData) {
  // 1. 从图表数据中提取使用中的文件ID
  const usedFileIds = new Set();
  for (const shape of diagramData.s) {
    if (shape.type === 6 && shape.fileId) {
      usedFileIds.add(shape.fileId);
    }
  }
  
  // 2. 获取当前ref_images字段
  const currentRefImages = await getCurrentRefImages(nodeUuid);
  
  // 3. 找出未使用的文件
  const unusedFileIds = currentRefImages.filter(
    refImage => !usedFileIds.has(refImage.id)
  );
  
  // 4. 更新ref_images字段，移除未使用的文件
  if (unusedFileIds.length > 0) {
    await updateRefImagesField(nodeUuid, usedFileIds);
  }
}
```

### 集成到保存流程

在 `saveDiagramToCloud` 方法中，清理步骤在节点更新完成后执行：

```javascript
// 6. 清理未使用的ref_images（仅对更新的节点执行）
if (!isNewNode && diagramData && this.currentDiagram.nodeId) {
  try {
    console.log('🧹 Cleaning up unused ref_images...');
    await this.cleanupUnusedRefImages(this.currentDiagram.nodeId, diagramData);
  } catch (cleanupError) {
    console.warn('⚠️ Failed to cleanup unused ref_images:', cleanupError);
    // 不让清理失败影响整个保存流程
  }
}
```

## 使用场景

### 场景1：替换大图片
1. 用户上传大图片A（≥100KB）到图片组件
2. 保存图表（图片A添加到ref_images）
3. 用户双击同一组件，上传大图片B替换图片A
4. 保存图表时，系统自动从ref_images中移除图片A，保留图片B

### 场景2：大图片替换为小图片
1. 用户上传大图片（≥100KB）到图片组件
2. 保存图表（图片添加到ref_images）
3. 用户双击同一组件，上传小图片（<100KB）替换大图片
4. 保存图表时，系统自动从ref_images中移除原大图片，新的小图片以base64格式存储

### 场景3：小图片替换为大图片
1. 用户上传小图片（<100KB）到图片组件（以base64存储）
2. 保存图表（无文件添加到ref_images）
3. 用户双击同一组件，上传大图片（≥100KB）替换小图片
4. 保存图表时，大图片上传到服务器并添加到ref_images

### 场景4：删除图片组件
1. 用户上传大图片到图片组件
2. 保存图表
3. 用户删除该图片组件
4. 保存图表时，系统自动从ref_images中移除该图片文件

### 场景5：复制粘贴图片组件
1. 用户上传大图片到图片组件A
2. 复制组件A，粘贴为组件B（共享同一个fileId）
3. 删除组件A，保留组件B
4. 保存时，由于组件B仍在使用该文件，文件不会被清理

### 场景6：小图片组件操作
1. 用户上传小图片（<100KB）到多个图片组件
2. 复制、删除、修改这些组件
3. 保存图表时，由于小图片都是base64格式，不涉及ref_images清理

## 安全特性

1. **保守策略**：如果无法确定文件是否在使用，系统会保留文件而不是删除
2. **错误隔离**：清理失败不会影响图表保存的主要流程
3. **仅更新操作**：只对现有图表的更新操作执行清理，新建图表不执行清理
4. **详细日志**：提供详细的控制台日志，便于调试和监控

## 日志示例

```
🧹 Cleaning up unused ref_images...
🔍 Analyzing diagram for used images...
📷 Found used image URL: /sites/graphmaker/files/aigc_ref_images/2025-06/image1.png
🔗 Found used file ID: 12345-abcd-6789-efgh (URL: /sites/graphmaker/files/aigc_ref_images/2025-06/image1.png)
📊 Total used images: 1
📋 Current ref_images count: 3
🗑️ Found unused file ID: 98765-wxyz-4321-ijkl
🗑️ Found unused file ID: 11111-aaaa-2222-bbbb
🧹 Removing 2 unused files from ref_images...
✅ Successfully cleaned up 2 unused files from ref_images
📊 Remaining ref_images count: 1
```

## 注意事项

1. **图片大小阈值**：100KB是区分大小图片的关键阈值，小于100KB的图片使用base64存储，不占用服务器文件存储空间
2. **文件ID依赖**：清理功能依赖于大图片组件正确存储fileId，小图片组件和旧的图片组件可能没有fileId
3. **存储优化**：小图片使用base64格式可以减少HTTP请求，但会增加图表数据大小；大图片上传到服务器可以减少图表数据大小，但需要额外的HTTP请求
4. **网络错误处理**：如果清理过程中发生网络错误，不会影响图表保存
5. **性能影响**：清理操作会增加保存时间，但通常很快完成
6. **数据一致性**：确保图表数据和ref_images字段保持一致，base64格式的小图片不会影响ref_images字段 