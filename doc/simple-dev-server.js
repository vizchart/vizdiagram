const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 配置目标服务器 - 可通过环境变量配置
const TARGET_SERVER = process.env.DRUPAL_SERVER || 'https://graphmaker.intra.vizcms.cn';

console.log('🚀 Starting Simple DgrmJS Development Server...');
console.log(`🎯 Target Drupal Server: ${TARGET_SERVER}`);

// 静态文件服务
app.use(express.static('src'));

// API 代理配置
const proxyOptions = {
    target: TARGET_SERVER,
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
        // 转发所有 Cookie
        if (req.headers.cookie) {
            proxyReq.setHeader('Cookie', req.headers.cookie);
        }
        
        // 设置正确的 Host 头
        const targetUrl = new URL(TARGET_SERVER);
        proxyReq.setHeader('Host', targetUrl.host);
        
        // 设置 Referer 头
        proxyReq.setHeader('Referer', TARGET_SERVER);
        
        console.log(`🔄 Proxying ${req.method} ${req.url} -> ${TARGET_SERVER}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // 处理 Set-Cookie 头，使其在 localhost 上工作
        const setCookieHeaders = proxyRes.headers['set-cookie'];
        if (setCookieHeaders) {
            proxyRes.headers['set-cookie'] = setCookieHeaders.map(cookie => {
                return cookie
                    .replace(/Domain=[^;]+;?\s*/gi, '') // 移除 Domain 限制
                    .replace(/Secure;?\s*/gi, '')       // 移除 Secure 标志
                    .replace(/SameSite=None;?\s*/gi, 'SameSite=Lax'); // 修改 SameSite
            });
        }
        
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(500).json({ error: 'Proxy Error', message: err.message });
    }
};

// 设置代理路由
const proxyPaths = ['/user', '/api', '/jsonapi', '/session', '/sites'];

proxyPaths.forEach(path => {
    console.log(`Setting up proxy for ${path} -> ${TARGET_SERVER}${path}`);
    app.use(path, createProxyMiddleware(proxyOptions));
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'src'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// 默认路由
app.get('/', (req, res) => {
  res.redirect('/index.dev.html');
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    drupalProxy: TARGET_SERVER,
    timestamp: new Date().toISOString()
  });
});

// Cookie调试端点
app.get('/debug/cookies', (req, res) => {
  res.json({
    received_cookies: req.headers.cookie || 'No cookies received',
    all_headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`
🎉 Simple DgrmJS Development Server is running!

📍 Local:            http://localhost:${PORT}
📍 Development Page: http://localhost:${PORT}/index.dev.html
📍 Cookie Debug:     http://localhost:${PORT}/cookie-debug.html
📍 SameSite Test:    http://localhost:${PORT}/samesite-test.html
📍 Health Check:     http://localhost:${PORT}/health
📍 Cookie Debug API: http://localhost:${PORT}/debug/cookies
🔗 Drupal API Proxy: ${TARGET_SERVER}

🍪 Enhanced cookie forwarding enabled for session management

API Proxy Routes:
${proxyPaths.map(path => `  ${path} -> ${TARGET_SERVER}${path}`).join('\n')}

Press Ctrl+C to stop the server
  `);
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop other servers or use a different port.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 