# Foundation Fill

A Chrome extension for filling text fields with predefined system prompt templates.

## Features

- Create, edit, and manage templates for text field filling
- Customize system prompts and user prompts
- Domain-specific templates
- Include page content in prompt generation
- Context menu integration for quick access
- Light/dark/system theme support
- Generate text with API integration

## Project Structure

```
foundation-fill/
├── scripts/           # Build scripts and configuration
│   ├── clean-rebuild.js  # Clean build script
│   ├── esbuild.config.js # ESBuild configuration
│   └── generate-icons.js # Script to generate PNG icons from SVG
├── dist/              # Build output directory
├── src/               # Source code
│   ├── assets/        # Static assets
│   │   ├── css/       # Stylesheets
│   │   └── images/    # Icons and images
│   ├── background/    # Background script
│   ├── content/       # Content script
│   ├── controllers/   # Controllers for application components
│   ├── popup/         # Popup UI
│   │   ├── models/    # Data models
│   │   ├── views/     # UI components
│   │   └── popup.html # Popup HTML template
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions and services
├── manifest.json      # Extension manifest
└── tsconfig.json      # TypeScript configuration
```

## Development

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load the unpacked extension from the `dist` directory in Chrome:
    - Go to `chrome://extensions/`
    - Enable Developer mode
    - Click "Load unpacked" and select the `dist` directory

### Commands

- `npm run build` - Build the extension using ESBuild
- `npm run clean-build` - Clean and rebuild the entire extension (production build)
- `npm run dev` - Start development mode with file watching
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run generate-icons` - Generate PNG icons from SVG source

### Build System

Foundation Fill uses ESBuild for fast, efficient builds:

- **Fast Builds**: ESBuild compiles TypeScript much faster than webpack
- **Development Mode**: `npm run dev` watches for file changes and rebuilds automatically
- **Production Mode**: `npm run clean-build` creates optimized production builds
- **Automatic Asset Handling**: CSS and images are automatically copied to the dist folder

## Architecture

The project follows a simplified Model-View-Controller (MVC) architecture with service-oriented components:

- **Models**: Handle data and business logic
    - `Template`: Manages templates data
    - `Settings`: Manages extension settings

- **Views**: Render the UI and handle user interactions
    - `TemplateList`: Renders the template list
    - `TemplateEditor`: Renders the template editor
    - `Settings`: Renders the settings panel

- **Controllers**: Connect models and views
    - `Popup`: Orchestrates popup UI interactions

- **Services**: Provide reusable functionality
    - `StorageService`: Centralized storage access
    - `TemplateService`: Template operations and validation
    - `ThemeService`: Theme management
    - `MessageService`: Cross-component communication
    - `DOMService`: DOM manipulation utilities

## Extension Components

- **Background Script**: Handles context menu, API calls, and messaging
- **Content Script**: Fills text fields and shows template selector
- **Popup**: Main UI for managing templates and settings
- **Utils**: Common utilities for storage, API access, and Chrome integration

## License

MIT