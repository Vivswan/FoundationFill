# Deployment Workflow Instructions

## Overview

This repository uses GitHub Actions for automated versioning and deployment of the Chrome extension. The workflow is designed to:

1. Automatically build and release the extension when code is pushed to the `deploy` branch
2. Increment the version number in the `main` branch after a successful release
3. Tag the release with the appropriate version number
4. Generate both `.zip` and `.crx` files for distribution (CRX files only if a private key is available)

## How It Works

### Deployment Process

1. **Regular development** happens on the `main` branch or feature branches
2. When ready to deploy a new version:
   - Ensure all changes are merged to `main`
   - Push or merge `main` into the `deploy` branch
3. GitHub Actions will:
   - Build the extension from the `deploy` branch
   - Create a GitHub release with built files
   - Tag the release with the current version number
   - Automatically increment the patch version in the `main` branch

### Private Key for CRX Files

For building `.crx` files (for direct installation), a private key needs to be added to GitHub Secrets:

1. Go to your repository settings
2. Click on "Secrets and variables" → "Actions"
3. Add a new repository secret:
   - Name: `EXTENSION_PRIVATE_KEY`
   - Value: The contents of your `key.pem` file

If the private key is not provided, the workflow will still create a release but only with the `.zip` file.

## Creating a Private Key

If you don't have a private key for the extension, you can generate one with:

```bash
openssl genrsa -out key.pem 2048
```

**Important:** Keep this key secure and consistent. Changing the key will make existing users unable to receive updates for the extension.

## Version Management

- The workflow automatically increments the patch version by 0.0.1 (e.g., from 0.1.0 to 0.1.1)
- For major or minor version updates, manually edit the version in `package.json` before deploying

## Troubleshooting

### Missing CRX File in Release

- Verify the `EXTENSION_PRIVATE_KEY` secret is properly set
- Check the GitHub Actions logs for any errors related to key generation

### Version Not Updated

- Ensure the GitHub Action has proper write permissions to the repository
- Check if there were any errors in the version bump job in the workflow run

### Build Failures

- Review the build step logs for any compilation or packaging errors
- Make sure all dependencies are correctly specified in package.json