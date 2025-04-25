const path = require('path');
const fs = require('fs');
const {watch} = require('fs');
const generateIconsModule = require('./generate-icons');

// Root and dist directories
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, {recursive: true});
}

// Generate icons using the generate-icons.js module
const generateIcons = async () => {
    try {
        console.log('Generating icons...');
        await generateIconsModule();
        console.log('Icons generated successfully');
    } catch (error) {
        console.error('Error generating icons:', error.message);
    }
};

// HTML template processing
const processHTML = () => {
    let htmlContent = fs.readFileSync(path.join(rootDir, 'src/popup.html'), 'utf8');

    // Add script tags to HTML before closing body tag
    htmlContent = htmlContent.replace('</body>', `
  <!-- Initialization script -->
  <script src="init.js"></script>
  
  <!-- Main script bundle -->
  <script src="index.js"></script>
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

// Run build process
async function build() {
    // Generate icons first
    await generateIcons();

    // Process HTML, manifest, and assets
    processHTML();
    copyManifest();
    copyAssets();

    try {
        const isWatchMode = process.argv.includes('--watch');

        // Define entry points
        const entryPoints = {
            'index': path.join(rootDir, 'src/index.ts'),
            'background': path.join(rootDir, 'src/background.ts'),
            'content': path.join(rootDir, 'src/popup/content.ts'),
            'init': path.join(rootDir, 'src/assets/js/init.js')
        };

        // Build options
        const buildOptions = {
            entrypoints: [
                entryPoints['index'],
                entryPoints['background'],
                entryPoints['content'],
                entryPoints['init']
            ],
            outdir: distDir,
            target: 'browser',
            format: 'esm',
            sourcemap: 'external',
            minify: process.env.NODE_ENV === 'production',
            naming: {
                // Prevent files from being put in subdirectories
                // Use flat structure in root output directory
                entry: "[name].js"
            },
        };

        // Initial build
        const result = await Bun.build(buildOptions);
        console.log('Build completed successfully');

        if (isWatchMode) {
            console.log('Watching for changes...');

            // Watch src directory for TS/JS changes
            watch(path.join(rootDir, 'src'), {recursive: true}, async (eventType, filename) => {
                if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
                    console.log(`Change detected in ${filename}, rebuilding...`);
                    try {
                        await Bun.build(buildOptions);
                        console.log('Rebuild completed');
                    } catch (error) {
                        console.error('Rebuild failed:', error);
                    }
                }
            });

            // Watch popup.html
            watch(path.join(rootDir, 'src/popup.html'), () => {
                console.log('Change detected in popup.html');
                processHTML();
            });

            // Watch manifest.json
            watch(path.join(rootDir, 'manifest.json'), () => {
                console.log('Change detected in manifest.json');
                copyManifest();
            });

            // Watch CSS files
            watch(path.join(rootDir, 'src/assets/css'), {recursive: true}, () => {
                console.log('Change detected in CSS files');
                copyAssets();
            });

            // Watch image files
            watch(path.join(rootDir, 'src/assets/images'), {recursive: true}, () => {
                console.log('Change detected in image files');
                copyAssets();
            });

            // Keep process running
            setInterval(() => {
            }, 1000);
        }
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();