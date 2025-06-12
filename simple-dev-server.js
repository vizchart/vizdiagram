const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3001;
const DRUPAL_SERVER = 'https://graphmaker.intra.vizcms.cn';

console.log('🚀 Starting Simple DgrmJS Development Server...');
console.log(`🎯 Target Drupal Server: ${DRUPAL_SERVER}`);

// Add CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from the project root
app.use(express.static('.', {
  setHeaders: (res, path) => {
    // Set CORS headers for static files
    res.header('Access-Control-Allow-Origin', '*');
    
    // Set proper MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Proxy configuration for Drupal API endpoints
const proxyPaths = ['/user', '/api', '/jsonapi', '/session', '/sites'];

proxyPaths.forEach(proxyPath => {
  console.log(`Setting up proxy for ${proxyPath} -> ${DRUPAL_SERVER}${proxyPath}`);
  
  app.use(proxyPath, createProxyMiddleware({
    target: DRUPAL_SERVER,
    changeOrigin: true,
    secure: true,
    followRedirects: true,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      // Forward all headers including cookies
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
      
      // Forward CSRF token if present
      if (req.headers['x-csrf-token']) {
        proxyReq.setHeader('X-CSRF-Token', req.headers['x-csrf-token']);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Forward Set-Cookie headers
      if (proxyRes.headers['set-cookie']) {
        res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
      }
      
      // Add CORS headers to proxy responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }));
});

// Proxy for files from Drupal server (for cross-domain file access)
app.use('/drupal-files', createProxyMiddleware({
  target: DRUPAL_SERVER,
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/drupal-files': '' // Remove /drupal-files prefix
  },
  logLevel: 'silent',
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers for file access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'DgrmJS Development Server',
    drupalProxy: DRUPAL_SERVER,
    timestamp: new Date().toISOString()
  });
});

// Cookie debug endpoint
app.get('/debug/cookies', (req, res) => {
  res.json({
    cookies: req.headers.cookie || 'No cookies',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 Simple DgrmJS Development Server is running!');
  console.log(`📍 Local:            http://localhost:${PORT}`);
  console.log(`📍 Development Page: http://localhost:${PORT}/index.dev.html`);
  console.log(`📍 Health Check:     http://localhost:${PORT}/health`);
  console.log(`📍 Cookie Debug API: http://localhost:${PORT}/debug/cookies`);
  console.log(`🔗 Drupal API Proxy: ${DRUPAL_SERVER}`);
  console.log(`🌐 Drupal Files Proxy: http://localhost:${PORT}/drupal-files/...`);
  console.log('🍪 Enhanced cookie forwarding enabled for session management');
  console.log('🔄 CORS enabled for cross-origin requests');
  
  console.log('\nAPI Proxy Routes:');
  proxyPaths.forEach(path => {
    console.log(`  ${path} -> ${DRUPAL_SERVER}${path}`);
  });
  
  console.log('\nURL Initialization Examples:');
  console.log(`  📄 JSON: http://localhost:${PORT}/index.dev.html?type=json&file=/test-diagram.json`);
  console.log(`  📄 JSON: http://localhost:${PORT}/index.dev.html?type=json&file=test-diagram`);
  console.log(`  🖼️  PNG: http://localhost:${PORT}/index.dev.html?type=png&file=/path/to/diagram.png`);
  console.log(`  🌐 Drupal UUID: http://localhost:${PORT}/index.dev.html?type=drupal&uuid=12345678-1234-1234-1234-123456789abc`);
  console.log(`  🌐 Drupal Files: http://localhost:${PORT}/index.dev.html?type=json&file=/drupal-files/sites/default/files/diagrams/example.json`);
  
  console.log('\nPress Ctrl+C to stop the server');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please stop other servers or use a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
}); 