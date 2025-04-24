import { Settings } from '../../types';
import { createLogger } from '../../utils/logging';
import { StorageService } from '../../utils/storage-service';

// Create a logger for this component
const logger = createLogger('SETTINGS_MODEL');

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
  
  // Load settings from storage
  async loadSettings(): Promise<Settings> {
    logger.debug('Loading settings');
    this.settings = await this.storageService.getSettings();
    logger.debug('Settings loaded:', this.settings);
    return this.settings;
  }
  
  // Get the current settings
  getSettings(): Settings {
    return this.settings;
  }
  
  // Update a single setting
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
  
  // Save settings to storage
  private async saveSettings(): Promise<void> {
    logger.debug('Saving settings');
    await this.storageService.saveSettings(this.settings);
    logger.debug('Settings saved successfully');
    
    // Call the onChange callback if it exists
    if (this.onChangeCallback) {
      this.onChangeCallback(this.settings);
    }
  }
  
  // Set a callback for settings changes
  onChange(callback: (settings: Settings) => void): void {
    this.onChangeCallback = callback;
  }
}