const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building DgrmJS for production...');

try {
    // Step 1: Build JavaScript
    console.log('📦 Compiling JavaScript...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Clean up old JavaScript files
    console.log('🧹 Cleaning up old JavaScript files...');
    const distDir = path.join(__dirname, 'dist', 'app');
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
        if (file.match(/^index\.[a-z0-9]+\.js$/)) {
            fs.unlinkSync(path.join(distDir, file));
            console.log(`   Removed: ${file}`);
        }
    });
    
    // Step 3: Generate random string for cache busting
    const randomString = Math.random().toString(36).substring(2, 10);
    const jsFileName = `index.${randomString}.js`;
    console.log(`🎲 Generated random filename: ${jsFileName}`);
    
    // Step 4: Copy and rename JavaScript file
    console.log('📄 Renaming JavaScript file...');
    const originalJs = path.join(__dirname, 'dist', 'app', 'index.js');
    const newJs = path.join(__dirname, 'dist', 'app', jsFileName);
    
    // Generate timestamp
    const timestamp = new Date().toISOString();
    console.log(`⏰ Build timestamp: ${timestamp}`);
    
    // Read JS file, add timestamp, and write to new filename
    let jsContent = fs.readFileSync(originalJs, 'utf8');
    jsContent = jsContent.replace('{{BUILD_TIMESTAMP}}', timestamp);
    jsContent += `\n// Build completed: ${timestamp}`;
    fs.writeFileSync(newJs, jsContent);
    
    // Remove original index.js file
    fs.unlinkSync(originalJs);
    
    // Step 5: Copy HTML file and update JavaScript reference
    console.log('📄 Updating HTML file...');
    const srcHtml = path.join(__dirname, 'src', 'index.html');
    const distHtml = path.join(__dirname, 'dist', 'app', 'index.html');
    
    // Read HTML file and replace timestamp placeholder and JS filename
    let htmlContent = fs.readFileSync(srcHtml, 'utf8');
    htmlContent = htmlContent.replace('{{BUILD_TIMESTAMP}}', timestamp);
    htmlContent = htmlContent.replace('src="index.js"', `src="${jsFileName}"`);
    fs.writeFileSync(distHtml, htmlContent);
    
    console.log('✅ Production build completed successfully!');
    console.log('📁 Output directory: dist/app/');
    console.log('📋 Files:');
    console.log('   - index.html (HTML file with timestamp and updated JS reference)');
    console.log(`   - ${jsFileName} (Compiled JavaScript with timestamp)`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🎯 Cache busting: ${randomString}`);
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
 