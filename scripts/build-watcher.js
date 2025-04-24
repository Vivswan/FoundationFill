const path = require('path');
const fs = require('fs');

// Root and dist directories
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// HTML template processing
const processHTML = () => {
    let htmlContent = fs.readFileSync(path.join(rootDir, 'src/popup.html'), 'utf8');

    // Add script tags to HTML before closing body tag
    htmlContent = htmlContent.replace('</body>', `
  <!-- Initialization script -->
  <script src="popup-init.js"></script>
  
  <!-- Main script bundle -->
  <script src="popup.js"></script>
</body>`);

    fs.writeFileSync(path.join(distDir, 'popup.html'), htmlContent);
    console.log('Processed popup.html');
};

// Copy manifest file
const copyManifest = () => {
    fs.copyFileSync(
        path.resolve(rootDir, 'manifest.json'),
        path.resolve(distDir, 'manifest.json')
    );
    console.log('Copied manifest.json to dist directory');
};

// Copy CSS and images
const copyAssets = () => {
    // Create css directory if it doesn't exist
    const cssDir = path.join(distDir, 'css');
    if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, {recursive: true});
    }

    // Create images directory if it doesn't exist
    const imagesDir = path.join(distDir, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, {recursive: true});
    }

    // Copy CSS files
    const cssFiles = fs.readdirSync(path.join(rootDir, 'src/assets/css'));
    cssFiles.forEach(file => {
        fs.copyFileSync(
            path.join(rootDir, 'src/assets/css', file),
            path.join(cssDir, file)
        );
    });

    // Copy image files
    const imageFiles = fs.readdirSync(path.join(rootDir, 'src/assets/images'));
    imageFiles.forEach(file => {
        fs.copyFileSync(
            path.join(rootDir, 'src/assets/images', file),
            path.join(imagesDir, file)
        );
    });

    console.log('Copied asset files to dist directory');
};

async function rebuild() {
    // Define entry points
    const entryPoints = [
        path.join(rootDir, 'src/index.ts'),
        path.join(rootDir, 'src/background.ts'),
        path.join(rootDir, 'src/popup/content.ts'),
        path.join(rootDir, 'src/assets/js/init.js')
    ];

    // Process HTML, manifest, and assets
    processHTML();
    copyManifest();
    copyAssets();

    // Build options
    const buildOptions = {
        entrypoints: entryPoints,
        outdir: distDir,
        target: 'browser',
        format: 'esm',
        sourcemap: 'external',
        minify: process.env.NODE_ENV === 'production',
    };

    try {
        await Bun.build(buildOptions);
        console.log(`[${new Date().toLocaleTimeString()}] Rebuilt successfully`);
    } catch (err) {
        console.error('Build failed:', err);
    }
}

// Initial build
rebuild();

// This file is run with --watch flag by Bun, which will automatically
// re-run this file whenever it changes or any imported file changes
console.log('Watcher active - waiting for changes...');