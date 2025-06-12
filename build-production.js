const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building DgrmJS for production...');

try {
    // Step 1: Build JavaScript
    console.log('📦 Compiling JavaScript...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Copy HTML file
    console.log('📄 Copying HTML file...');
    const srcHtml = path.join(__dirname, 'src', 'index.html');
    const distHtml = path.join(__dirname, 'dist', 'app', 'index.html');
    
    fs.copyFileSync(srcHtml, distHtml);
    
    console.log('✅ Production build completed successfully!');
    console.log('📁 Output directory: dist/app/');
    console.log('📋 Files:');
    console.log('   - index.html (HTML file)');
    console.log('   - index.js (Compiled JavaScript)');
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
 