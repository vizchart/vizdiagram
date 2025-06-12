# 登录检查功能改进

## 功能概述

为了确保用户在使用云端功能前已经登录，系统在以下操作中添加了登录状态检查：

1. **保存图表到云端** (Save to Cloud)
2. **上传图片到ref_images字段** (图片组件双击上传)

## API端点更新

### 新的登录状态检查端点

```
GET: /user/login_status?_format=json
```

**返回值：**
- `0` - 表示未登录
- `1` - 表示已登录

### 原有端点保留

```
GET: /api/user/retrieve
```
用于获取已登录用户的详细信息。

## 实现细节

### 1. 更新 `checkLoginStatus()` 方法

```javascript
async checkLoginStatus() {
  // 使用新的登录状态检查端点
  const response = await fetch('/user/login_status?_format=json', {
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (response.ok) {
    const loginStatus = await response.json();
    const isLoggedIn = loginStatus === 1;
    
    if (isLoggedIn) {
      // 如果已登录但没有用户信息，尝试获取用户信息
      if (!this.currentUser) {
        const userResponse = await fetch('/api/user/retrieve', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (userResponse.ok) {
          this.currentUser = await userResponse.json();
        }
      }
      
      return {
        isLoggedIn: true,
        user: this.currentUser
      };
    } else {
      return {
        isLoggedIn: false,
        error: 'User not logged in'
      };
    }
  }
}
```

### 2. 保存图表功能的登录检查

在 `src/ui/menu.js` 的保存功能中：

```javascript
// Save to Drupal Cloud
click('save', async () => {
  try {
    // 检查登录状态
    console.log('🔍 Checking login status...')
    const loginStatus = await drupalAPI.checkLoginStatus()
    
    if (!loginStatus.isLoggedIn) {
      await showSaveErrorDialog('🔐 请先登录才能保存图表到云端\n\n您可以在以下地址登录：\nhttps://graphmaker.intra.vizcms.cn/user/login')
      return
    }
    
    // 继续保存流程...
  } catch (error) {
    // 错误处理...
  }
});
```

### 3. 图片上传功能的登录检查

在 `src/shapes/image.js` 的双击上传功能中：

```javascript
async function handleDoubleClick(event) {
  event.stopPropagation();
  
  // 检查用户登录状态
  console.log('🔍 Checking login status before image upload...');
  const loginStatus = await drupalAPI.checkLoginStatus();
  if (!loginStatus.isLoggedIn) {
    alert('🔐 请先登录才能上传图片\n\n您可以在以下地址登录：\nhttps://graphmaker.intra.vizcms.cn/user/login');
    return;
  }
  
  // 继续上传流程...
}
```

### 4. API方法中的登录检查

在 `addImageToRefImagesField()` 方法中：

```javascript
async addImageToRefImagesField(file, nodeUuid) {
  try {
    if (!this.isAuthenticated) {
      const loginStatus = await this.checkLoginStatus();
      if (!loginStatus.isLoggedIn) {
        throw new Error('请先登录才能上传图片。您可以在 https://graphmaker.intra.vizcms.cn/user/login 登录');
      }
    }
    
    // 继续上传流程...
  } catch (error) {
    // 错误处理...
  }
}
```

## 用户体验改进

### 1. 友好的中文提示

所有登录相关的错误消息都使用中文，并提供登录链接：

- **保存图表**：`🔐 请先登录才能保存图表到云端`
- **上传图片**：`🔐 请先登录才能上传图片`
- **登录链接**：`https://graphmaker.intra.vizcms.cn/user/login`

### 2. 多层次检查

1. **前端检查**：在用户操作前检查登录状态
2. **API检查**：在API方法中再次验证登录状态
3. **服务器检查**：服务器端的最终验证

### 3. 优雅的错误处理

- 使用弹窗显示友好的错误消息
- 提供明确的登录链接
- 不会中断用户的其他操作

## 测试场景

### 场景1：未登录用户尝试保存图表

1. 用户创建图表
2. 点击 "Save to Cloud"
3. 系统检查登录状态
4. 显示登录提示弹窗
5. 用户可以点击链接前往登录页面

### 场景2：未登录用户尝试上传图片

1. 用户添加图片组件
2. 双击图片组件
3. 系统检查登录状态
4. 显示登录提示对话框
5. 用户可以前往登录页面

### 场景3：已登录用户正常使用

1. 用户已登录
2. 所有功能正常工作
3. 无额外的登录提示

## 日志输出

系统会在控制台输出详细的登录检查日志：

```
🔍 Checking user login status...
📊 Login status response: 1
✅ User is logged in
👤 User info retrieved: {uid: 123, name: "username", ...}
```

或者：

```
🔍 Checking login status before image upload...
📊 Login status response: 0
❌ User is not logged in
```

## 安全特性

1. **双重验证**：前端和后端都进行登录检查
2. **会话管理**：使用cookie进行会话管理
3. **CSRF保护**：所有API调用都包含CSRF令牌
4. **优雅降级**：登录检查失败时提供友好的用户体验 