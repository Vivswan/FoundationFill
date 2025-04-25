/**
 * Clean rebuild script for Foundation Fill
 * This script ensures a fresh build by cleaning the dist directory
 * and then running the build process.
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Paths
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure clean rebuild with properly preserved images
async function cleanRebuild() {
  console.log('Starting clean rebuild process...');

  // Check if dist directory exists
  if (fs.existsSync(distDir)) {
    console.log('Removing dist directory...');

    try {
      // Delete dist directory
      fs.rmSync(distDir, {recursive: true, force: true});
      console.log('Successfully removed dist directory.');
    } catch (error) {
      console.error('Error removing dist directory:', error);
      process.exit(1);
    }
  }

  // Run icon generation first
  console.log('Generating icons...');
  try {
    execSync('node ' + path.join(__dirname, 'generate-icons.js'), {stdio: 'inherit'});
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }

  // Check if we should run in development mode
  const isDev = process.argv.includes('--dev');
  const buildEnv = isDev ? 'development' : 'production';

  console.log(`Running esbuild in ${buildEnv} mode...`);
  try {
    execSync(`NODE_ENV=${buildEnv} node ${path.join(__dirname, 'esbuild.config.js')}`, {stdio: 'inherit'});
  } catch (error) {
    console.error('Error during esbuild build:', error);
    process.exit(1);
  }

  console.log('Clean rebuild completed successfully!');
}

cleanRebuild().catch(err => {
  console.error('Unhandled error during clean rebuild:', err);
  process.exit(1);
});