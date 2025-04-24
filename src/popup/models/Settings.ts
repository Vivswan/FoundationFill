import { Settings, ThemeMode } from '../../types';
import { createLogger } from '../../utils/logging';
import { StorageService } from '../../utils/storage-service';
import { DEFAULT_SETTINGS } from '../../defaults';

// Create a logger for this component
const logger = createLogger('SETTINGS_MODEL');

/**
 * Settings model that handles retrieving and saving user settings
 */
export class SettingsModel {
  private settings: Settings = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    theme: 'system'
  };
  
  private storageService: StorageService;
  
  // Callback for settings changes
  private onChangeCallback: ((settings: Settings) => void) | null = null;
  
  constructor() {
    this.storageService = new StorageService();
  }
  
  /**
   * Load settings from storage
   */
  async loadSettings(): Promise<Settings> {
    logger.debug('Loading settings');
    this.settings = await this.getSettingsFromStorage();
    logger.debug('Settings loaded:', this.settings);
    return this.settings;
  }
  
  /**
   * Get the current settings
   */
  getSettings(): Settings {
    return this.settings;
  }
  
  /**
   * Update a single setting
   */
  async updateSetting(key: keyof Settings, value: string): Promise<Settings> {
    logger.debug(`Updating setting ${key} to:`, value);
    if (key === 'theme') {
      // Make sure theme is valid
      this.settings[key] = value as 'light' | 'dark' | 'system';
    } else {
      this.settings[key] = value;
    }
    await this.saveSettings();
    return this.settings;
  }
  
  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    logger.debug('Saving settings');
    await this.saveSettingsToStorage(this.settings);
    logger.debug('Settings saved successfully');
    
    // Call the onChange callback if it exists
    if (this.onChangeCallback) {
      this.onChangeCallback(this.settings);
    }
  }
  
  /**
   * Get just the theme setting
   */
  async getTheme(): Promise<ThemeMode> {
    const settings = await this.getSettingsFromStorage();
    return settings.theme;
  }
  
  /**
   * Update just the theme setting
   */
  async setTheme(theme: ThemeMode): Promise<void> {
    this.settings.theme = theme;
    return this.saveSettings();
  }
  
  /**
   * Update partial settings
   */
  async updateSettings(partialSettings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettingsFromStorage();
    const updatedSettings = { ...currentSettings, ...partialSettings };
    await this.saveSettingsToStorage(updatedSettings);
    this.settings = updatedSettings;
    
    // Call the onChange callback if it exists
    if (this.onChangeCallback) {
      this.onChangeCallback(this.settings);
    }
    
    return updatedSettings;
  }
  
  /**
   * Retrieve settings from storage
   */
  private async getSettingsFromStorage(): Promise<Settings> {
    try {
      // Use the generic item getter for non-essential operations
      const settingsObj = await this.storageService.getItem<Settings>('settings', DEFAULT_SETTINGS);
      
      // Ensure all required settings exist
      const settings: Settings = {
        apiKey: settingsObj.apiKey || DEFAULT_SETTINGS.apiKey,
        baseUrl: settingsObj.baseUrl || DEFAULT_SETTINGS.baseUrl,
        model: settingsObj.model || DEFAULT_SETTINGS.model,
        theme: settingsObj.theme || DEFAULT_SETTINGS.theme,
      };
      
      return settings;
    } catch (error) {
      logger.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Save settings to storage
   */
  private async saveSettingsToStorage(settings: Settings): Promise<void> {
    return this.storageService.setItem('settings', settings);
  }
  
  /**
   * Set a callback for settings changes
   */
  onChange(callback: (settings: Settings) => void): void {
    this.onChangeCallback = callback;
  }
}