const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const DRUPAL_URL = 'https://graphmaker.intra.vizcms.cn';

// API代理路径
const API_PATHS = ['/user', '/api', '/jsonapi', '/session', '/sites'];

console.log('🚀 Starting DgrmJS Development Server...');

// 配置反向代理
API_PATHS.forEach(path => {
  app.use(path, createProxyMiddleware({
    target: DRUPAL_URL,
    changeOrigin: true,
    secure: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
      // 添加必要的请求头
      proxyReq.setHeader('Origin', DRUPAL_URL);
      proxyReq.setHeader('Referer', DRUPAL_URL);
      console.log(`🔄 Proxying ${req.method} ${req.url} to ${DRUPAL_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // 处理CORS
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token, Accept';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    },
    onError: (err, req, res) => {
      console.error('❌ Proxy Error:', err.message);
      res.status(500).json({ error: 'Proxy Error', message: err.message });
    }
  }));
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'src'), {
  setHeaders: (res, path) => {
    // 禁用缓存，确保开发时能看到最新文件
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// 默认路由到开发页面
app.get('/', (req, res) => {
  res.redirect('/index.dev.html');
});

// 文件监听和自动重新构建
let isBuilding = false;

const watcher = chokidar.watch('src/**/*.js', {
  ignored: ['src/bundle.js', 'src/bundle.js.map'],
  persistent: true
});

watcher.on('change', (filePath) => {
  if (isBuilding) return;
  
  console.log(`📝 File changed: ${filePath}`);
  console.log('🔨 Rebuilding...');
  
  isBuilding = true;
  
  exec('npm run dev:build', (error, stdout, stderr) => {
    isBuilding = false;
    
    if (error) {
      console.error('❌ Build failed:', error.message);
      return;
    }
    
    if (stderr) {
      console.warn('⚠️ Build warnings:', stderr);
    }
    
    console.log('✅ Build completed successfully');
    console.log('🔄 Please refresh your browser to see changes');
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
🎉 DgrmJS Development Server is running!

📍 Local:            http://localhost:${PORT}
📍 Development Page: http://localhost:${PORT}/index.dev.html
🔗 Drupal API Proxy: ${DRUPAL_URL}

📁 Serving files from: ./src/
👀 Watching for changes in: src/**/*.js
🔄 Auto-rebuild enabled

API Proxy Routes:
${API_PATHS.map(path => `  ${path} -> ${DRUPAL_URL}${path}`).join('\n')}

Press Ctrl+C to stop the server
  `);
  
  // 自动打开浏览器（可选）
  const open = require('open');
  open(`http://localhost:${PORT}/index.dev.html`).catch(() => {
    console.log('💡 Please manually open: http://localhost:3000/index.dev.html');
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  watcher.close();
  process.exit(0);
}); 