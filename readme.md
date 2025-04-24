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
├── build/             # Build scripts and configuration
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
│   ├── popup/         # Popup UI
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── views/
│   │   └── popup.html
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
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

The project follows the Model-View-Controller (MVC) architecture:

- **Models**: Handle data and business logic
  - `TemplateModel`: Manages templates data
  - `SettingsModel`: Manages extension settings

- **Views**: Render the UI and handle user interactions
  - `TemplateListView`: Renders the template list
  - `TemplateEditorView`: Renders the template editor
  - `SettingsView`: Renders the settings panel

- **Controllers**: Connect models and views
  - `PopupController`: Orchestrates popup UI interactions

## Extension Components

- **Background Script**: Handles context menu, API calls, and messaging
- **Content Script**: Fills text fields and shows template selector
- **Popup**: Main UI for managing templates and settings

## License

MIT