# Foundation Fill

A Chromium-based browser extension that allows you to fill text fields with predefined system prompt templates.

## Features

- Works with Chromium-based browsers (Chrome, Edge, Brave)
- Save base URL, API key, and model for LLM API access
- OpenAI API as default and GPT-4 as default model
- Manage multiple templates with simple UI
- Fill text areas with templates via popup or context menu
- Domain-specific templates
- Option to include current page content
- Generate text using LLM APIs
- Dark mode support
- Auto-save templates

## Project Structure

```
foundation_fill/
├── background/      # Background script for handling context menus and API calls
│   └── background.js
├── css/             # Styles for the extension
│   └── popup.css
├── docs/            # Documentation files
│   └── ui_tempalte.png
├── images/          # Extension icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── js/              # JavaScript content scripts
│   └── content.js
├── popup/           # Extension popup UI
│   ├── popup.html
│   └── popup.js
├── manifest.json    # Extension configuration file
└── README.md        # Documentation
```

## Installation

### Development Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/foundation_fill.git
   ```

2. Open Chrome/Edge/Brave and navigate to the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. Enable "Developer mode" using the toggle in the top-right corner.

4. Click "Load unpacked" and select the root directory of this repository.

5. The extension should now be installed and visible in your browser toolbar.

## Usage

1. Click on the Foundation Fill extension icon in your browser toolbar to open the popup.

2. In the popup, you can:
   - Create, edit, and delete templates
   - Fill text fields with templates
   - Generate text using LLM APIs
   - Configure API settings

3. Right-click on any text field to access your templates via the context menu.

## Creating Templates

1. Click the "New" button to create a new template.
2. Enter a system prompt and optional user prompt.
3. Enable/disable the template using the checkbox.
4. Choose whether to include the current page content.
5. Choose whether to make the template specific to the current domain.

## Configuration

1. Click the "Settings" button to configure API settings.
2. Enter your API key.
3. Optionally change the base URL and model.
4. Click "Save Settings" to save your changes.

## License

[MIT License](LICENSE)
