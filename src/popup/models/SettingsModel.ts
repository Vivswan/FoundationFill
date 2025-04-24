import { Settings } from '../../types';
import { getSettings, saveSettings } from '../../utils/storage';

export class SettingsModel {
  private settings: Settings = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    theme: 'system'
  };
  
  // Callback for settings changes
  private onChangeCallback: ((settings: Settings) => void) | null = null;
  
  constructor() {}
  
  // Load settings from storage
  async loadSettings(): Promise<Settings> {
    this.settings = await getSettings();
    return this.settings;
  }
  
  // Get the current settings
  getSettings(): Settings {
    return this.settings;
  }
  
  // Update a single setting
  async updateSetting(key: keyof Settings, value: any): Promise<Settings> {
    this.settings[key] = value;
    await this.saveSettings();
    return this.settings;
  }
  
  // Save settings to storage
  private async saveSettings(): Promise<void> {
    await saveSettings(this.settings);
    
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