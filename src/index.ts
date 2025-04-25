import './utils/chrome-api-debug'; // Import first to initialize debug helpers
import {TemplateModel} from './popup/models/Template';
import {SettingsModel} from './popup/models/Settings';
import {TemplateListView} from './popup/views/TemplateList';
import {TemplateEditorView} from './popup/views/TemplateEditor';
import {SettingsView} from './popup/views/Settings';
import {PopupController} from './popup/Popup';

// Import the theme service and logger
import {ThemeService} from './utils/theme';
import {createLogger} from './utils/logging';

// Create a logger for the popup
const logger = createLogger('Popup');

// Initialize popup
logger.info("Starting main initialization");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    logger.info("DOM content loaded, initializing components");

    // Initialize models
    const templateModel = new TemplateModel();
    const settingsModel = new SettingsModel();

    logger.info("Models initialized");

    // Load settings to get theme
    const settings = await settingsModel.loadSettings();
    const themeService = new ThemeService(settings.theme);

    logger.debug("Settings loaded", settings);

    // Set up a theme listener on the settings model
    settingsModel.onChange((updatedSettings) => {
      themeService.setTheme(updatedSettings.theme);
    });

    logger.info("Theme setup complete");

    // Initialize views
    logger.info("Initializing views");

    const templateListView = new TemplateListView();
    const templateEditorView = new TemplateEditorView(
        'template-editor',
        'system-prompt',
        'user-prompt',
        'template-enabled',
        'include-page-content',
        'domain-specific',
        'template-domain',
        'delete-template-btn',
        'generate-btn',
        'generated-text'
    );

    const settingsView = new SettingsView();

    logger.info("Views initialized");

    // Initialize controller
    logger.info("Creating controller");
    const popupController = new PopupController(
        templateModel,
        settingsModel,
        templateListView,
        templateEditorView,
        settingsView
    );

    // Initialize the application
    logger.info("Initializing application");
    await popupController.initialize();
    logger.info("Application initialized");

  } catch (error) {
    logger.error("Error in initialization", error);
  }
});