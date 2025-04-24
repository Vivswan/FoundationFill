import { Settings, Template, ThemeMode } from '../types';
import { createLogger } from './logging';
import { DEFAULT_TEMPLATE, DEFAULT_SETTINGS } from './defaults';

const logger = createLogger('STORAGE_SERVICE');

export class StorageService {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      return new Promise<T>((resolve) => {
        chrome.storage.sync.get([key], (result) => {
          if (chrome.runtime.lastError) {
            logger.error('Error getting item from storage:', chrome.runtime.lastError);
            resolve(defaultValue);
            return;
          }
          
          const value = result[key] as T | undefined;
          resolve(value !== undefined ? value : defaultValue);
        });
      });
    } catch (error) {
      logger.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }
  
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            logger.error('Error setting item in storage:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error setting ${key} in storage:`, error);
      throw error;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            logger.error('Error removing item from storage:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }
  
  // Convenience methods for templates
  async getTemplates(): Promise<Template[]> {
    const templates = await this.getItem<Template[]>('templates', [DEFAULT_TEMPLATE]);
    
    // Ensure we always have at least one template
    if (!templates || templates.length === 0) {
      return [DEFAULT_TEMPLATE];
    }
    
    // Make sure the default template exists
    const hasDefault = templates.some(t => t.isDefault || t.id === 'default');
    if (!hasDefault) {
      templates.unshift(DEFAULT_TEMPLATE);
    }
    
    return templates;
  }
  
  async saveTemplates(templates: Template[]): Promise<void> {
    return this.setItem('templates', templates);
  }
  
  // Convenience methods for settings
  async getSettings(): Promise<Settings> {
    return this.getItem<Settings>('settings', DEFAULT_SETTINGS);
  }
  
  async saveSettings(settings: Settings): Promise<void> {
    return this.setItem('settings', settings);
  }
  
  async updateSettings(partialSettings: Partial<Settings>): Promise<Settings> {
    const settings = await this.getSettings();
    const updatedSettings = { ...settings, ...partialSettings };
    await this.saveSettings(updatedSettings);
    return updatedSettings;
  }
  
  // Theme specific methods
  async getTheme(): Promise<ThemeMode> {
    const settings = await this.getSettings();
    return settings.theme;
  }
  
  async setTheme(theme: ThemeMode): Promise<void> {
    const settings = await this.getSettings();
    settings.theme = theme;
    return this.saveSettings(settings);
  }
}