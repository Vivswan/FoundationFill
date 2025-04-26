/**
 * Storage Service
 * Provides a unified interface for Chrome extension storage operations
 * Handles error cases, logging, and type safety for stored data
 */
import {createLogger} from './logging';

// Create a logger instance for this component
const logger = createLogger('STORAGE_SERVICE');

/**
 * Storage service that handles all storage operations for the extension
 * Provides methods for getting, setting, and removing items with proper typing
 * Includes fallbacks and error handling for all operations
 */
export class StorageService {
    /**
     * Get an item from storage with fallback to default value
     * Retrieves data from Chrome's sync storage with type safety
     *
     * @param key - The key to retrieve from storage
     * @param defaultValue - The default value to return if the key doesn't exist
     * @returns Promise resolving to the stored value or the default value
     * @example
     * const settings = await storageService.getItem('settings', defaultSettings);
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
     * Saves data to Chrome's sync storage with proper error handling
     *
     * @param key - The key to store the value under
     * @param value - The value to store
     * @returns Promise that resolves when the operation is complete
     * @throws Error if storage operation fails
     * @example
     * await storageService.setItem('settings', updatedSettings);
     */
    async setItem<T>(key: string, value: T): Promise<void> {
        logger.debug(`Saving ${key} to storage`);

        if (!this.isStorageAvailable()) {
            logger.warn('Chrome storage not available, cannot save');
            return;
        }

        try {
            return new Promise<void>((resolve, reject) => {
                chrome.storage.sync.set({[key]: value}, () => {
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
     * Deletes data from Chrome's sync storage
     *
     * @param key - The key to remove from storage
     * @returns Promise that resolves when the operation is complete
     * @throws Error if storage operation fails
     * @example
     * await storageService.removeItem('temporaryData');
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
     * Checks if Chrome storage API is available
     * Verifies that the extension has access to chrome.storage.sync
     *
     * @returns True if Chrome storage API is available, false otherwise
     * @private Used internally before storage operations
     */
    private isStorageAvailable(): boolean {
        return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
    }
}