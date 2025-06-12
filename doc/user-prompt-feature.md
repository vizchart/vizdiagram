# User Prompt Feature Documentation

## 概述

User Prompt 功能允许用户在本地存储中设置一个自定义提示词，当第一次保存图表到云端时，系统会自动使用这个提示词作为 AIGC 节点的 `prompt` 字段值。

## 功能特性

### 1. 第一次保存 (Create)
- 检查 `localStorage` 中是否存在 `user-prompt` 键
- 如果存在且不为空，使用用户设置的提示词
- 如果不存在或为空，使用默认提示词格式：`DgrmJS diagram: {title}`

### 2. 更新保存 (Update)
- 更新现有图表时，**不会修改** `prompt` 字段
- 保持原有的提示词不变

## 技术实现

### localStorage 键名
```javascript
const USER_PROMPT_KEY = 'user-prompt';
```

### 代码实现位置
- **文件**: `src/infrastructure/drupal-api.js`
- **方法**: `createAIGCNode()` 和 `updateAIGCNode()`

### 创建节点时的逻辑
```javascript
// 检查localStorage中是否有user-prompt
let promptValue = `DgrmJS diagram: ${title}`;
try {
    const userPrompt = localStorage.getItem('user-prompt');
    if (userPrompt && userPrompt.trim()) {
        promptValue = userPrompt.trim();
        console.log('📝 Using user prompt from localStorage:', promptValue);
    }
} catch (error) {
    console.warn('⚠️ Failed to read user-prompt from localStorage:', error);
}
```

### 更新节点时的逻辑
```javascript
const nodeData = {
    data: {
        type: 'node--aigc',
        id: nodeUuid,
        attributes: {
            title: title,
            status: true,
            content_data: contentData
            // 更新时不修改prompt字段
        },
        // ... relationships
    }
};
```

## 使用方法

### 1. 设置用户提示词
```javascript
// 在浏览器控制台或应用中设置
localStorage.setItem('user-prompt', '您的自定义提示词');
```

### 2. 检查当前提示词
```javascript
// 检查当前设置的提示词
const currentPrompt = localStorage.getItem('user-prompt');
console.log('Current user prompt:', currentPrompt);
```

### 3. 清除用户提示词
```javascript
// 清除提示词，恢复使用默认格式
localStorage.removeItem('user-prompt');
```

## 测试

### 测试页面
项目根目录下的 `test-prompt-feature.html` 提供了完整的测试界面，包括：

1. **设置用户提示词**: 输入并保存自定义提示词
2. **检查当前提示词**: 查看当前存储的提示词
3. **模拟保存过程**: 测试创建和更新操作的不同行为
4. **localStorage 管理**: 查看和清理本地存储

### 测试步骤
1. 打开 `test-prompt-feature.html`
2. 在 Test 1 中设置一个自定义提示词
3. 使用 Test 3 模拟创建新节点 - 应该使用自定义提示词
4. 使用 Test 3 模拟更新节点 - 应该不包含 prompt 字段
5. 清除提示词后再次测试 - 应该使用默认提示词

## 实际使用场景

### 场景 1: AI 生成图表
用户可以设置详细的提示词来指导 AI 生成特定类型的图表：
```javascript
localStorage.setItem('user-prompt', 
    '请创建一个专业的业务流程图，包含决策点、处理步骤和结果输出，使用蓝色主题');
```

### 场景 2: 项目特定提示词
为特定项目设置统一的提示词格式：
```javascript
localStorage.setItem('user-prompt', 
    '项目: 用户管理系统 - 创建系统架构图，展示各模块间的关系和数据流');
```

### 场景 3: 清除自定义设置
恢复默认行为：
```javascript
localStorage.removeItem('user-prompt');
```

## 错误处理

### localStorage 访问失败
```javascript
try {
    const userPrompt = localStorage.getItem('user-prompt');
    // 使用提示词
} catch (error) {
    console.warn('⚠️ Failed to read user-prompt from localStorage:', error);
    // 回退到默认提示词
}
```

### 空值处理
- 空字符串或仅包含空白字符的提示词会被忽略
- 使用 `trim()` 方法清理前后空白字符

## 兼容性

### 浏览器支持
- 所有现代浏览器都支持 localStorage
- 在不支持 localStorage 的环境中会自动回退到默认提示词

### 隐私模式
- 某些浏览器的隐私模式可能限制 localStorage 访问
- 代码包含适当的错误处理来应对这种情况

## 日志记录

### 成功使用用户提示词
```
📝 Using user prompt from localStorage: {用户设置的提示词}
```

### 访问失败警告
```
⚠️ Failed to read user-prompt from localStorage: {错误信息}
```

## 注意事项

1. **安全性**: 提示词存储在客户端，不会自动同步到其他设备
2. **持久性**: localStorage 数据会持久保存，直到用户清除浏览器数据
3. **更新策略**: 只在创建新节点时使用，更新时保持原有提示词不变
4. **默认回退**: 任何错误情况下都会回退到默认提示词格式

## 相关文件

- `src/infrastructure/drupal-api.js` - 主要实现逻辑
- `test-prompt-feature.html` - 功能测试页面
- `doc/user-prompt-feature.md` - 本文档 