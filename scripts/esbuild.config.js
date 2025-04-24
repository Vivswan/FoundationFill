const { copy } = require('esbuild-plugin-copy');
const path = require('path');
const fs = require('fs');

// Root and dist directories
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// HTML template processing
const processHTML = () => {
  let htmlContent = fs.readFileSync(path.join(rootDir, 'src/popup/popup.html'), 'utf8');
  
  // Add script tags to HTML before closing body tag
  htmlContent = htmlContent.replace('</body>', `
  <!-- Initialization script -->
  <script src="../popup-init.js"></script>
  
  <!-- Main script bundle -->
  <script src="../popup.js"></script>
</body>`);
  
  // Ensure popup directory exists
  const popupDir = path.resolve(distDir, 'popup');
  if (!fs.existsSync(popupDir)) {
    fs.mkdirSync(popupDir, { recursive: true });
  }
  fs.writeFileSync(path.join(popupDir, 'popup.html'), htmlContent);
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

// Run build process
async function build(watch = false) {
  const esbuild = require('esbuild');

  // Process HTML and manifest
  processHTML();
  copyManifest();

  try {
    // Build options
    const options = {
      entryPoints: {
        popup: path.join(rootDir, 'src/popup/popup.ts'),
        'popup-init': path.join(rootDir, 'src/popup/init.js'),
        background: path.join(rootDir, 'src/background/background.ts'),
        content: path.join(rootDir, 'src/content/content.ts')
      },
      bundle: true,
      outdir: distDir,
      format: 'esm',  // Use ESM format for Chrome MV3
      target: 'es2020',
      platform: 'browser',
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      plugins: [
        copy({
          assets: [
            { from: [path.join(rootDir, 'src/assets/css/*')], to: ['css'] },
            { from: [path.join(rootDir, 'src/assets/images/*')], to: ['images'] }
          ]
        })
      ]
    };

    if (watch) {
      // Watch mode
      const ctx = await esbuild.context(options);
      await ctx.watch();
      console.log('Watching for changes...');
      
      // Watch HTML template and manifest for changes
      fs.watch(path.join(rootDir, 'src/popup/popup.html'), () => {
        processHTML();
        console.log('Detected changes in popup.html, updated it');
      });
      
      fs.watch(path.join(rootDir, 'manifest.json'), () => {
        copyManifest();
        console.log('Detected changes in manifest.json, updated it');
      });
      
    } else {
      // Build once
      await esbuild.build(options);
      console.log('Build complete!');
    }
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

// Check if watching
const watch = process.argv.includes('--watch');
build(watch);