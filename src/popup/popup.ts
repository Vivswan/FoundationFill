import '../utils/chrome-api-debug'; // Import first to initialize debug helpers
import { TemplateModel } from './models/Template';
import { SettingsModel } from './models/Settings';
import { TemplateListView } from './views/TemplateList';
import { TemplateEditorView } from './views/TemplateEditor';
import { SettingsView } from './views/Settings';
import { PopupController } from '../controllers/Popup';
import { applyTheme, listenForThemeChanges } from '../utils/theme';

// Import the theme service
import { ThemeService } from '../utils/theme-service';

// Initialize popup
console.log("[Popup] Starting main initialization");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log("[Popup] DOM content loaded, initializing components");

    // Initialize models
    const templateModel = new TemplateModel();
    const settingsModel = new SettingsModel();
    
    console.log("[Popup] Models initialized");

    // Load settings to get theme
    const settings = await settingsModel.loadSettings();
    
    console.log("[Popup] Settings loaded:", settings);
    
    // Initialize theme service
    const themeService = new ThemeService(settings.theme);
    
    // Set up a theme listener on the settings model
    settingsModel.onChange((updatedSettings) => {
      themeService.setTheme(updatedSettings.theme);
    });
    
    console.log("[Popup] Theme setup complete");
    
    // Initialize views
    console.log("[Popup] Initializing views");
    
    const templateListView = new TemplateListView('template-list', 'new-template-btn');
    
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
    
    const settingsView = new SettingsView(
      'settings-panel',
      'api-key',
      'base-url',
      'model',
      'settings-status',
      'done-btn',
      'settings-btn'
    );
    
    console.log("[Popup] Views initialized");
    
    // Initialize controller
    console.log("[Popup] Creating controller");
    const popupController = new PopupController(
      templateModel,
      settingsModel,
      templateListView,
      templateEditorView,
      settingsView
    );
    
    // Initialize the application
    console.log("[Popup] Initializing application");
    await popupController.initialize();
    console.log("[Popup] Application initialized");
    
  } catch (error) {
    console.error("[Popup] Error in initialization:", error);
  }
});