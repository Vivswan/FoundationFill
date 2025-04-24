import { TemplateModel } from './models/TemplateModel';
import { SettingsModel } from './models/SettingsModel';
import { TemplateListView } from './views/TemplateListView';
import { TemplateEditorView } from './views/TemplateEditorView';
import { SettingsView } from './views/SettingsView';
import { PopupController } from './controllers/PopupController';
import { applyTheme, listenForThemeChanges } from '../utils/theme';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize models
  const templateModel = new TemplateModel();
  const settingsModel = new SettingsModel();
  
  // Load settings to get theme
  const settings = await settingsModel.loadSettings();
  
  // Apply theme
  applyTheme(settings.theme);
  
  // Listen for system theme changes
  listenForThemeChanges(settings.theme, () => {
    applyTheme(settings.theme);
  });
  
  // Set up a theme listener on the settings model
  settingsModel.onChange((updatedSettings) => {
    applyTheme(updatedSettings.theme);
    
    // If theme is system, we need to listen for system changes
    listenForThemeChanges(updatedSettings.theme, () => {
      applyTheme(updatedSettings.theme);
    });
  });
  
  // Initialize views
  const templateListView = new TemplateListView('template-list', 'new-template-btn');
  
  const templateEditorView = new TemplateEditorView(
    'template-editor',
    'system-prompt',
    'user-prompt',
    'template-enabled',
    'include-page-content',
    'domain-specific',
    'current-domain',
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
  
  // Initialize controller
  const popupController = new PopupController(
    templateModel,
    settingsModel,
    templateListView,
    templateEditorView,
    settingsView
  );
  
  // Initialize the application
  await popupController.initialize();
});