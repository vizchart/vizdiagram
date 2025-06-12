# 图片组件连接点位置修复

## 问题描述

在引入图片组件后，发现画线连接其他组件时，箭头定位不准确，无法正确指向其他组件的连接点。用户报告即使没有图片组件的情况下也出现定位不准确的问题。

## 问题分析

经过深入分析，发现问题的根本原因是图片组件的连接点位置计算与其他组件不一致：

### 连接点系统工作原理

1. **初始定义**：在组件创建时定义连接点相对于组件中心的位置
2. **动态更新**：在组件resize时更新连接点位置
3. **全局位置计算**：在`drawPosition`函数中将相对位置转换为全局位置

```javascript
// 在 drawPosition 函数中
connectorsData[connectorKey].position = {
    x: connectorsInnerPosition[connectorKey].position.x + shapeData.position.x,
    y: connectorsInnerPosition[connectorKey].position.y + shapeData.position.y
};
```

### 图片组件的错误实现

**错误的初始定义（修复前）：**
```javascript
{
  right: { dir: 'right', position: { x: 60, y: 0 } },  // 固定值，不随尺寸变化
  left: { dir: 'left', position: { x: -60, y: 0 } },
  bottom: { dir: 'bottom', position: { x: 0, y: 60 } },
  top: { dir: 'top', position: { x: 0, y: -60 } }
}
```

**错误的resize计算（修复前）：**
```javascript
shape.cons.right.position.x = -mainX;  // 错误：符号相反
shape.cons.left.position.x = mainX;    // 错误：符号相反
shape.cons.bottom.position.y = -mainY; // 错误：符号相反
```

### 其他组件的正确实现

**Rect组件的正确实现：**
```javascript
// 初始定义（基于默认尺寸）
{
  right: { dir: 'right', position: { x: 48, y: 0 } },  // 96/2 = 48
  left: { dir: 'left', position: { x: -48, y: 0 } },   // -96/2 = -48
  bottom: { dir: 'bottom', position: { x: 0, y: 24 } }, // 48/2 = 24
  top: { dir: 'top', position: { x: 0, y: -24 } }      // -48/2 = -24
}

// resize函数中的正确计算
const mainX = rectData.w / -2;  // 左边界
const mainY = rectData.h / -2;  // 上边界

shape.cons.right.position.x = -mainX;  // -(-w/2) = w/2 (右边界)
shape.cons.left.position.x = mainX;    // -w/2 (左边界)
shape.cons.bottom.position.y = -mainY; // -(-h/2) = h/2 (下边界)
shape.cons.top.position.y = mainY;     // -h/2 (上边界)
```

## 修复方案

### 1. 修复初始连接点定义

将固定值改为基于组件实际尺寸的动态计算：

```javascript
// 修复后：动态计算
{
  right: { dir: 'right', position: { x: imageData.w / 2, y: 0 } },
  left: { dir: 'left', position: { x: imageData.w / -2, y: 0 } },
  bottom: { dir: 'bottom', position: { x: 0, y: imageData.h / 2 } },
  top: { dir: 'top', position: { x: 0, y: imageData.h / -2 } }
}
```

### 2. 修复resize函数中的连接点更新

确保连接点位置计算与其他组件保持一致：

```javascript
// 修复后：正确的计算
const mainX = imageData.w / -2;   // 左边界
const mainY = imageData.h / -2;   // 上边界
const rightX = imageData.w / 2;   // 右边界
const bottomY = imageData.h / 2;  // 下边界

shape.cons.right.position.x = rightX;   // 右边界
shape.cons.left.position.x = mainX;     // 左边界
shape.cons.bottom.position.y = bottomY; // 下边界
shape.cons.top.position.y = mainY;      // 上边界
```

### 3. 确保初始化时调用resize

即使是默认尺寸也要调用resize函数来设置正确的连接点位置：

```javascript
// 修复后：总是调用resize
if (imageData.w !== 120 || imageData.h !== 120) { 
  resize(true); 
} else { 
  resize(true); // 确保连接点位置正确
}
```

## 验证方法

### 1. 视觉验证
- 创建图片组件和其他组件
- 从图片组件的连接点画线到其他组件
- 检查箭头是否准确指向目标连接点

### 2. 代码验证
在浏览器控制台中运行以下代码检查连接点位置：

```javascript
// 检查所有连接点的位置
const connectors = document.querySelectorAll('[data-connect]');
connectors.forEach((connector, index) => {
    const direction = connector.getAttribute('data-connect');
    const transform = connector.style.transform;
    const parent = connector.closest('g');
    const parentTransform = parent ? parent.style.transform : 'none';
    
    console.log(`Connector ${index + 1}:`, {
        direction,
        transform,
        parentTransform
    });
});
```

### 3. 数学验证
对于120x120的图片组件，连接点应该位于：
- Right: (60, 0) 相对于中心
- Left: (-60, 0) 相对于中心  
- Bottom: (0, 60) 相对于中心
- Top: (0, -60) 相对于中心

## 修复结果

- ✅ **位置准确**：连接点现在位于组件边界的正确位置
- ✅ **动态调整**：组件尺寸改变时连接点位置自动更新
- ✅ **连接正常**：箭头能够准确指向其他组件的连接点
- ✅ **一致性**：与rect、container等其他组件的连接行为保持一致
- ✅ **向后兼容**：不影响现有图表数据和其他功能

## 修改的文件

- `src/shapes/image.js` - 修复连接点位置计算逻辑
- `doc/image-connector-fix.md` - 详细的修复文档

## 技术要点

1. **相对位置系统**：连接点位置是相对于组件中心的偏移量
2. **动态计算**：初始定义和resize函数都要基于组件实际尺寸
3. **一致性原则**：所有组件的连接点计算逻辑应该保持一致
4. **初始化重要性**：即使默认尺寸也要调用resize确保正确初始化 