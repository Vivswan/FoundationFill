// Combined storage service for Chrome extension
import { Settings, Template, ThemeMode } from '../types';
import { createLogger } from './logging';
import { DEFAULT_TEMPLATE, DEFAULT_SETTINGS } from '../defaults';

const logger = createLogger('STORAGE_SERVICE');

/**
 * Storage service that handles all storage operations for the extension
 * Combines functionality from chrome-storage.ts and storage-service.ts
 */
export class StorageService {
  /**
   * Checks if Chrome storage API is available
   */
  private isStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
  }

  /**
   * Get an item from storage with fallback to default value
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    logger.debug(`Getting ${key} from storage`);

    if (!this.isStorageAvailable()) {
      logger.warn('Chrome storage not available, returning default value');
      return defaultValue;
    }

    try {
      return new Promise<T>((resolve) => {
        chrome.storage.sync.get([key], (result) => {
          if (chrome.runtime.lastError) {
            logger.error('Error getting item from storage:', chrome.runtime.lastError);
            resolve(defaultValue);
            return;
          }
          
          const value = result[key] as T | undefined;
          logger.debug(`${key} value:`, value !== undefined ? value : 'using default');
          resolve(value !== undefined ? value : defaultValue);
        });
      });
    } catch (error) {
      logger.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Set an item in storage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    logger.debug(`Saving ${key} to storage`);

    if (!this.isStorageAvailable()) {
      logger.warn('Chrome storage not available, cannot save');
      return;
    }

    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            logger.error('Error setting item in storage:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          logger.debug(`${key} saved successfully`);
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error setting ${key} in storage:`, error);
      throw error;
    }
  }
  
  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    logger.debug(`Removing ${key} from storage`);

    if (!this.isStorageAvailable()) {
      logger.warn('Chrome storage not available, cannot remove');
      return;
    }

    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            logger.error('Error removing item from storage:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          logger.debug(`${key} removed successfully`);
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }
  
  /**
   * Get all templates with default fallback
   */
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
  
  /**
   * Save templates and notify background script
   */
  async saveTemplates(templates: Template[]): Promise<void> {
    await this.setItem('templates', templates);
    
    // Notify background script that templates were updated
    try {
      chrome.runtime.sendMessage({ action: 'templatesUpdated' });
    } catch (error) {
      logger.error('Failed to notify background script of template update:', error);
    }
  }
}