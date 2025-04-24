import { Template, Settings } from '../types';

// Debug function to help with troubleshooting
function debug(msg: string, ...data: any[]) {
  if (data.length > 0) {
    console.log(`%c[DEBUG] ${msg}`, 'color: blue; font-weight: bold', ...data);
  } else {
    console.log(`%c[DEBUG] ${msg}`, 'color: blue; font-weight: bold');
  }
}

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
  debug('Saving templates to storage:', templates);
  
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        debug('Chrome storage is available, saving templates');
        chrome.storage.sync.set({ templates }, () => {
          debug('Templates saved successfully');
          resolve();
        });
      } else {
        debug('Chrome storage not available, cannot save templates');
        resolve(); // Resolve anyway to prevent UI from hanging
      }
    } catch (error) {
      debug('Error saving templates:', error);
      resolve(); // Resolve anyway to prevent UI from hanging
    }
  });
};

// Get templates from Chrome storage
export const getTemplates = (): Promise<Template[]> => {
  debug('Getting templates from storage');
  
  // Create a promise to handle Chrome storage retrieval
  return new Promise((resolve) => {
    // Always provide a default template first to prevent UI issues
    const defaultTemplates = [DEFAULT_TEMPLATE];
    
    try {
      debug('Checking if chrome.storage is available');
      
      // Check if Chrome storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        debug('Chrome storage is available, getting templates');
        
        // Try to get templates from Chrome storage
        chrome.storage.sync.get(['templates'], (result: {templates?: Template[]}) => {
          debug('Chrome storage result:', result);
          
          // Check if templates exist and are not empty
          if (result && result.templates && result.templates.length > 0) {
            debug('Found templates in storage:', result.templates);
            resolve(result.templates);
          } else {
            // No templates found, use default and save it
            debug('No templates found in storage, creating default template');
            saveTemplates(defaultTemplates);
            resolve(defaultTemplates);
          }
        });
      } else {
        // Chrome storage not available, use default templates
        debug('Chrome storage not available, using default templates');
        resolve(defaultTemplates);
      }
    } catch (error) {
      // Error occurred, use default templates
      debug('Error in getTemplates:', error);
      resolve(defaultTemplates);
    }
  });
};

// Save settings to Chrome storage
export const saveSettings = (settings: Settings): Promise<void> => {
  debug('Saving settings to storage');
  
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        debug('Chrome storage is available, saving settings');
        chrome.storage.sync.set(settings, () => {
          debug('Settings saved successfully');
          resolve();
        });
      } else {
        debug('Chrome storage not available, cannot save settings');
        resolve(); // Resolve anyway to prevent UI from hanging
      }
    } catch (error) {
      debug('Error saving settings:', error);
      resolve(); // Resolve anyway to prevent UI from hanging
    }
  });
};

// Get settings from Chrome storage
export const getSettings = (): Promise<Settings> => {
  debug('Getting settings from storage');
  
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        debug('Chrome storage is available, getting settings');
        
        chrome.storage.sync.get(['apiKey', 'baseUrl', 'model', 'theme'], (result: Partial<Settings>) => {
          debug('Settings from storage:', result);
          
          const settings: Settings = {
            apiKey: (result && result.apiKey) || DEFAULT_SETTINGS.apiKey,
            baseUrl: (result && result.baseUrl) || DEFAULT_SETTINGS.baseUrl,
            model: (result && result.model) || DEFAULT_SETTINGS.model,
            theme: (result && result.theme) || DEFAULT_SETTINGS.theme,
          };
          
          // Initialize default settings if they don't exist
          if (!result || (!result.apiKey && !result.baseUrl && !result.model && !result.theme)) {
            debug('No settings found, saving defaults');
            saveSettings(settings);
          }
          
          resolve(settings);
        });
      } else {
        debug('Chrome storage not available, using default settings');
        resolve(DEFAULT_SETTINGS);
      }
    } catch (error) {
      debug('Error getting settings:', error);
      resolve(DEFAULT_SETTINGS);
    }
  });
};