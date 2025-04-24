import { Template, Settings } from '../types';

// Default values
const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default Template',
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: '',
  enabled: true,
  includePageContent: false,
  domainSpecific: false,
  domain: '',
  isDefault: true
};

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  theme: 'system'
};

// Save templates to Chrome storage
export const saveTemplates = (templates: Template[]): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ templates }, () => {
      resolve();
    });
  });
};

// Get templates from Chrome storage
export const getTemplates = (): Promise<Template[]> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['templates'], (result) => {
      const templates = result.templates || [];
      
      if (templates.length === 0) {
        // Initialize with default template if none exist
        saveTemplates([DEFAULT_TEMPLATE]);
        resolve([DEFAULT_TEMPLATE]);
      } else {
        resolve(templates);
      }
    });
  });
};

// Save settings to Chrome storage
export const saveSettings = (settings: Settings): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
};

// Get settings from Chrome storage
export const getSettings = (): Promise<Settings> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'baseUrl', 'model', 'theme'], (result) => {
      const settings: Settings = {
        apiKey: result.apiKey || DEFAULT_SETTINGS.apiKey,
        baseUrl: result.baseUrl || DEFAULT_SETTINGS.baseUrl,
        model: result.model || DEFAULT_SETTINGS.model,
        theme: result.theme || DEFAULT_SETTINGS.theme,
      };
      
      // Initialize default settings if they don't exist
      if (!result.apiKey && !result.baseUrl && !result.model && !result.theme) {
        saveSettings(settings);
      }
      
      resolve(settings);
    });
  });
};