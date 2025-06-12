# DgrmJS 使用指南

## 🚀 快速开始

### 1. 启动应用
```bash
npm install
npm run dev:simple
```

访问：http://localhost:3001/index.dev.html


### 2. 本地测试跨域的问题
有两个地方涉及跨域的问题
1. 保存/更新等操作
跨域通过Cookie手动把Drupal登陆后的session复制过来，然后前端post的时候，加上 with creditional就行

2. Diagram初始化加载json或者文件的问题，本地测试是一个 /api/viz开始的URL，这个url被转发UAT服务器上
如果直接在PHP服务器上，就不会出现这个跨域问题

http://localhost:3001/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json

### 生产环境

#### 生产环境打包编译的命令:
```
npm run build:prod
```