// Chrome storage utility for consistent storage operations
import { createLogger } from './logging';
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATE } from '../defaults';
import { Template, Settings } from '../types';

const logger = createLogger('STORAGE');

/**
 * Checks if Chrome storage API is available
 */
export const isStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
};

/**
 * Generic function to get data from Chrome storage
 */
export const getFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  logger.debug(`Getting ${key} from storage`);
  
  if (!isStorageAvailable()) {
    logger.warn('Chrome storage not available, returning default value');
    return defaultValue;
  }
  
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get([key], (result) => {
        if (result && result[key] !== undefined) {
          logger.debug(`Found ${key} in storage:`, result[key]);
          resolve(result[key] as T);
        } else {
          logger.debug(`${key} not found in storage, using default`);
          resolve(defaultValue);
        }
      });
    } catch (error) {
      logger.error(`Error getting ${key} from storage:`, error);
      resolve(defaultValue);
    }
  });
};

/**
 * Generic function to save data to Chrome storage
 */
export const saveToStorage = async <T>(key: string, value: T): Promise<void> => {
  logger.debug(`Saving ${key} to storage:`, value);
  
  if (!isStorageAvailable()) {
    logger.warn('Chrome storage not available, cannot save');
    return;
  }
  
  return new Promise((resolve) => {
    try {
      const data = { [key]: value };
      chrome.storage.sync.set(data, () => {
        logger.debug(`${key} saved successfully`);
        resolve();
      });
    } catch (error) {
      logger.error(`Error saving ${key} to storage:`, error);
      resolve();
    }
  });
};

/**
 * Get templates from storage
 */
export const getTemplates = async (): Promise<Template[]> => {
  const templates = await getFromStorage<Template[]>('templates', [DEFAULT_TEMPLATE]);
  
  // If no templates were found, save the default
  if (templates.length === 0) {
    const defaultTemplates = [DEFAULT_TEMPLATE];
    await saveTemplates(defaultTemplates);
    return defaultTemplates;
  }
  
  return templates;
};

/**
 * Save templates to storage
 */
export const saveTemplates = async (templates: Template[]): Promise<void> => {
  await saveToStorage('templates', templates);
  
  // Notify background script that templates were updated
  try {
    chrome.runtime.sendMessage({ action: 'templatesUpdated' });
  } catch (error) {
    logger.error('Failed to notify background script of template update:', error);
  }
};

/**
 * Get settings from storage
 */
export const getSettings = async (): Promise<Settings> => {
  // Get all settings at once for efficiency
  if (!isStorageAvailable()) {
    logger.warn('Chrome storage not available, returning default settings');
    return DEFAULT_SETTINGS;
  }
  
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(['apiKey', 'baseUrl', 'model', 'theme'], (result: Partial<Settings>) => {
        const settings: Settings = {
          apiKey: result.apiKey || DEFAULT_SETTINGS.apiKey,
          baseUrl: result.baseUrl || DEFAULT_SETTINGS.baseUrl,
          model: result.model || DEFAULT_SETTINGS.model,
          theme: result.theme || DEFAULT_SETTINGS.theme,
        };
        
        // Initialize default settings if none exist
        if (!result || Object.keys(result).length === 0) {
          logger.debug('No settings found, saving defaults');
          saveSettings(settings);
        }
        
        resolve(settings);
      });
    } catch (error) {
      logger.error('Error getting settings:', error);
      resolve(DEFAULT_SETTINGS);
    }
  });
};

/**
 * Save settings to storage
 */
export const saveSettings = async (settings: Settings): Promise<void> => {
  await saveToStorage('settings', settings);
};