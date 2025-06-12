# DgrmJS 图表 JSON 格式完整指南

## 概述

DgrmJS 使用 JSON 格式来表示图表的元数据。此格式可以通过菜单中的"Export Metadata"和"Import Metadata"选项进行导出和导入。

## JSON 基本结构

```json
{
  "v": "1.1",
  "s": [
    // 形状和连接线数组
  ]
}
```

### 根对象属性

- `v` (string): 版本号，当前为 "1.1"
- `s` (array): 包含所有形状和连接线的数组

## 组件类型详解

### Type 0: 连接线 (Path)

连接线用于连接两个形状，支持多种样式。

```json
{
  "type": 0,
  "s": {
    "s": 0,
    "k": "right"
  },
  "e": {
    "s": 1,
    "k": "left"
  },
  "c": ["arw-e", "dash"]
}
```

#### 连接线属性

- `type`: 固定为 0
- `s`: 起始点配置
  - `s` (number): 起始形状在数组中的索引（从0开始）
  - `k` (string): 连接点位置，可选值：
    - `"left"`: 左侧连接点
    - `"right"`: 右侧连接点
    - `"top"`: 顶部连接点
    - `"bottom"`: 底部连接点
- `e`: 结束点配置（结构同起始点）
- `c` (array, 可选): 样式类数组，可包含：
  - `"arw-s"`: 起始端显示箭头
  - `"arw-e"`: 结束端显示箭头
  - `"dash"`: 虚线样式

#### 连接线样式示例

```json
// 实线，结束端有箭头
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}, "c": ["arw-e"]}

// 虚线，两端都有箭头
{"type": 0, "s": {"s": 0, "k": "bottom"}, "e": {"s": 1, "k": "top"}, "c": ["arw-s", "arw-e", "dash"]}

// 普通实线，无箭头
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}}

// 单个样式也可以用字符串格式（向后兼容）
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}, "c": "arw-e"}
```

### Type 1: 圆形 (Circle)

圆形组件，常用于表示流程中的决策点或状态。

```json
{
  "type": 1,
  "position": {
    "x": 200,
    "y": 200
  },
  "r": 50,
  "title": "决策点",
  "styles": ["cl-orange"]
}
```

#### 圆形属性

- `type`: 固定为 1
- `position` (object): 位置信息
  - `x` (number): 圆心 X 坐标
  - `y` (number): 圆心 Y 坐标
- `r` (number, 可选): 半径，默认为 48
- `title` (string, 可选): 显示的文本内容
- `styles` (array, 可选): 样式类数组

### Type 2: 矩形 (Rectangle)

矩形组件，最常用的流程图形状。

```json
{
  "type": 2,
  "position": {
    "x": 100,
    "y": 100
  },
  "w": 120,
  "h": 60,
  "title": "处理步骤",
  "styles": ["cl-blue"],
  "a": 2
}
```

#### 矩形属性

- `type`: 固定为 2
- `position` (object): 位置信息
  - `x` (number): 矩形中心 X 坐标
  - `y` (number): 矩形中心 Y 坐标
- `w` (number, 可选): 宽度，默认为 96
- `h` (number, 可选): 高度，默认为 48
- `title` (string, 可选): 显示的文本内容
- `styles` (array, 可选): 样式类数组
- `a` (number, 可选): 文本对齐方式
  - `1`: 左对齐
  - `2`: 居中对齐（默认）
  - `3`: 右对齐

### Type 3: 纯文本 (Text Only)

纯文本组件，只显示文字，背景透明。

```json
{
  "type": 3,
  "position": {
    "x": 400,
    "y": 400
  },
  "w": 100,
  "h": 30,
  "title": "标签文本",
  "styles": ["cl-red"],
  "a": 2,
  "t": true
}
```

#### 纯文本属性

- `type`: 固定为 3
- `position` (object): 位置信息
  - `x` (number): 文本中心 X 坐标
  - `y` (number): 文本中心 Y 坐标
- `w` (number, 可选): 宽度，默认为 96
- `h` (number, 可选): 高度，默认为 48
- `title` (string, 可选): 显示的文本内容
- `styles` (array, 可选): 样式类数组（影响文字颜色）
- `a` (number, 可选): 文本对齐方式（同矩形）
- `t` (boolean, 可选): 文本模式标识，纯文本组件应设为 true

### Type 4: 菱形 (Rhomb/Diamond)

菱形组件，通常用于表示判断或决策节点。

```json
{
  "type": 4,
  "position": {
    "x": 300,
    "y": 300
  },
  "w": 100,
  "title": "判断条件",
  "styles": ["cl-green"]
}
```

#### 菱形属性

- `type`: 固定为 4
- `position` (object): 位置信息
  - `x` (number): 菱形中心 X 坐标
  - `y` (number): 菱形中心 Y 坐标
- `w` (number, 可选): 宽度，默认为 96
- `title` (string, 可选): 显示的文本内容
- `styles` (array, 可选): 样式类数组

### Type 5: 容器 (Container)

容器组件，透明背景的矩形框，可用于分组其他元素。

```json
{
  "type": 5,
  "position": {
    "x": 500,
    "y": 500
  },
  "w": 200,
  "h": 150,
  "title": "容器标题",
  "styles": ["cl-dblue"]
}
```

#### 容器属性

- `type`: 固定为 5
- `position` (object): 位置信息
  - `x` (number): 容器中心 X 坐标
  - `y` (number): 容器中心 Y 坐标
- `w` (number, 可选): 宽度，默认为 120
- `h` (number, 可选): 高度，默认为 80
- `title` (string, 可选): 显示的文本内容
- `styles` (array, 可选): 样式类数组（影响边框颜色）

## 颜色类 (Color Classes)

所有组件都支持以下颜色类：

| 颜色类 | 颜色名称 | 十六进制值 | 说明 |
|--------|----------|------------|------|
| `cl-red` | 红色 | #E74C3C | 错误、警告、停止 |
| `cl-orange` | 橙色 | #ff6600 | 注意、处理中 |
| `cl-green` | 绿色 | #19bc9b | 成功、通过、开始 |
| `cl-blue` | 蓝色 | #1aaee5 | 信息、处理、默认 |
| `cl-dblue` | 深蓝色 | #1D809F | 重要信息、系统 |
| `cl-dgray` | 深灰色 | #495057 | 禁用、次要信息 |

### 颜色类在不同组件中的表现

- **矩形/圆形**: 影响填充颜色
- **纯文本**: 影响文字颜色
- **菱形**: 影响边框和填充颜色
- **容器**: 影响边框颜色（背景始终透明）
- **连接线**: 影响线条颜色

## 完整示例

以下是一个包含所有组件类型的完整流程图：

```json
{
  "v": "1.1",
  "s": [
    {
      "type": 2,
      "position": {
        "x": 516,
        "y": 444
      },
      "w": 120,
      "h": 60,
      "title": "开始",
      "styles": ["cl-green"],
      "a": 2
    },
    {
      "type": 1,
      "position": {
        "x": 780,
        "y": 444
      },
      "r": 50,
      "title": "处理数据",
      "styles": ["cl-blue"]
    },
    {
      "type": 4,
      "position": {
        "x": 1020,
        "y": 540
      },
      "w": 100,
      "title": "数据有效？",
      "styles": ["cl-orange"]
    },
    {
      "type": 2,
      "position": {
        "x": 1404,
        "y": 396
      },
      "w": 100,
      "h": 50,
      "title": "保存数据",
      "styles": ["cl-green"],
      "a": 2
    },
    {
      "type": 2,
      "position": {
        "x": 1428,
        "y": 588
      },
      "w": 100,
      "h": 50,
      "title": "显示错误",
      "styles": ["cl-red"],
      "a": 2
    },
    {
      "type": 3,
      "position": {
        "x": 876,
        "y": 300
      },
      "w": 60,
      "h": 20,
      "title": "错误处理",
      "styles": ["cl-dgray"],
      "t": true,
      "a": 1
    },
    {
      "type": 0,
      "s": {"s": 0, "k": "right"},
      "e": {"s": 1, "k": "left"},
      "c": ["arw-e"]
    },
    {
      "type": 0,
      "s": {"s": 1, "k": "right"},
      "e": {"s": 2, "k": "left"},
      "c": ["arw-e"]
    },
    {
      "type": 0,
      "s": {"s": 2, "k": "top"},
      "e": {"s": 3, "k": "left"},
      "c": ["arw-e"]
    },
    {
      "type": 0,
      "s": {"s": 2, "k": "right"},
      "e": {"s": 4, "k": "left"},
      "c": ["arw-e", "dash"]
    }
  ]
}
```

## 使用技巧

### 1. 坐标系统
- 坐标原点在画布左上角
- X 轴向右为正，Y 轴向下为正
- 所有坐标都是相对于形状中心点
- 使用 `position` 对象包含 `x` 和 `y` 坐标

### 2. 文本和样式
- 使用 `title` 属性设置显示文本
- 使用 `styles` 数组设置颜色类，例如 `["cl-blue"]`
- 纯文本组件需要设置 `t: true`
- 文本对齐使用 `a` 属性：1=左对齐，2=居中，3=右对齐

### 3. 连接线样式
- 连接线样式使用 `c` 数组，例如 `["arw-e", "dash"]`
- 也支持字符串格式（向后兼容），例如 `"arw-e"`
- 可组合多个样式：箭头 + 虚线

### 4. 连接线索引
- 连接线中的形状索引 (`s.s` 和 `e.s`) 必须引用数组中已存在的形状
- 索引从 0 开始计算
- 建议先定义所有形状，再定义连接线



## 常见错误

### 1. 版本不匹配
```json
// 错误：版本号不正确
{"v": "1.0", "s": [...]}

// 正确：使用当前版本
{"v": "1.1", "s": [...]}
```

### 2. 坐标格式错误
```json
// 错误：直接使用x,y属性
{"type": 2, "x": 100, "y": 100, "title": "测试"}

// 正确：使用position对象
{"type": 2, "position": {"x": 100, "y": 100}, "title": "测试"}
```

### 3. 文本属性错误
```json
// 错误：使用text属性
{"type": 2, "position": {"x": 100, "y": 100}, "text": "测试"}

// 正确：使用title属性
{"type": 2, "position": {"x": 100, "y": 100}, "title": "测试"}
```

### 4. 样式格式错误
```json
// 错误：使用c属性和字符串（对于形状）
{"type": 2, "position": {"x": 100, "y": 100}, "c": "cl-blue"}

// 正确：使用styles数组
{"type": 2, "position": {"x": 100, "y": 100}, "styles": ["cl-blue"]}
```

### 5. 连接线样式格式
```json
// 推荐：使用数组格式
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}, "c": ["arw-e"]}

// 兼容：字符串格式（单个样式）
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}, "c": "arw-e"}

// 多个样式必须用数组
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}, "c": ["arw-e", "dash"]}
```

### 6. 连接线索引错误
```json
// 错误：引用不存在的形状索引
{"type": 0, "s": {"s": 10, "k": "right"}, "e": {"s": 11, "k": "left"}}

// 正确：确保索引在有效范围内
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}}
```

### 7. 无效的连接点
```json
// 错误：无效的连接点位置
{"type": 0, "s": {"s": 0, "k": "center"}, "e": {"s": 1, "k": "middle"}}

// 正确：使用有效的连接点
{"type": 0, "s": {"s": 0, "k": "right"}, "e": {"s": 1, "k": "left"}}
```

## 高级用法

### 1. 批量创建形状
可以通过编程方式生成大量形状：

```javascript
// 生成网格状的矩形
const shapes = [];
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 3; j++) {
    shapes.push({
      type: 2,
      position: {
        x: 100 + i * 150,
        y: 100 + j * 100
      },
      w: 100,
      h: 50,
      title: `节点 ${i}-${j}`,
      styles: ["cl-blue"],
      a: 2
    });
  }
}
```

### 2. 创建复杂流程
结合不同形状类型创建复杂的业务流程图：

```json
{
  "v": "1.1",
  "s": [
    // 使用容器分组
    {
      "type": 5,
      "position": {"x": 200, "y": 200},
      "w": 300,
      "h": 200,
      "title": "用户模块"
    },
    
    // 容器内的具体流程
    {
      "type": 2,
      "position": {"x": 150, "y": 150},
      "title": "用户登录",
      "a": 2
    },
    {
      "type": 4,
      "position": {"x": 250, "y": 150},
      "title": "验证通过？"
    },
    {
      "type": 2,
      "position": {"x": 150, "y": 250},
      "title": "进入系统",
      "a": 2
    },
    {
      "type": 2,
      "position": {"x": 350, "y": 250},
      "title": "显示错误",
      "a": 2
    },
    
    // 连接线
    {"type": 0, "s": {"s": 1, "k": "right"}, "e": {"s": 2, "k": "left"}, "c": ["arw-e"]},
    {"type": 0, "s": {"s": 2, "k": "bottom"}, "e": {"s": 3, "k": "top"}, "c": ["arw-e"]},
    {"type": 0, "s": {"s": 2, "k": "right"}, "e": {"s": 4, "k": "top"}, "c": ["arw-e", "dash"]}
  ]
}
```

这份指南涵盖了 DgrmJS 图表 JSON 格式的所有方面，可以帮助你创建和编辑复杂的流程图。 