import {Settings, ThemeMode} from '../../types';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {DEFAULT_SETTINGS} from '../../defaults';

// Create a logger for this component
const logger = createLogger('SETTINGS_MODEL');

/**
 * Settings model that handles retrieving and saving user settings
 */
export class SettingsModel {
    private settings: Settings = DEFAULT_SETTINGS;
    private storageService: StorageService;
    private changeListeners: ((settings: Settings) => void)[] = [];

    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Load settings from storage
     */
    async initialize(): Promise<void> {
        this.settings = await this.getSettingsFromStorage();
        logger.debug('Settings loaded:', this.settings);
    }

    getSetting(key: keyof Settings): Settings[keyof Settings] {
        return this.settings[key] as Settings[keyof Settings];
    }

    /**
     * Get the current settings
     */
    getSettings(): Settings {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * Update a single setting
     */
    async updateSetting(key: keyof Settings, value: string): Promise<void> {
        logger.debug(`Updating setting ${key} to:`, value);
        if (key === 'theme') {
            // Make sure theme is valid
            this.settings[key] = value as 'light' | 'dark' | 'system';
        } else {
            this.settings[key] = value;
        }
        await this.saveSettings();
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
     * Add a listener for settings changes
     * @returns Function to remove the listener
     */
    onChange(callback: (settings: Settings) => void): () => void {
        this.changeListeners.push(callback);

        // Return a function to remove this listener
        return () => {
            this.changeListeners = this.changeListeners.filter(listener => listener !== callback);
        };
    }

    /**
     * Save settings to storage
     */
    private async saveSettings(): Promise<void> {
        await this.storageService.setItem('settings', this.settings);

        this.changeListeners.forEach(listener => {
            try {
                listener(JSON.parse(JSON.stringify(this.settings)));
            } catch (error) {
                logger.error('Error in settings change listener:', error);
            }
        });
    }

    /**
     * Retrieve settings from storage
     */
    private async getSettingsFromStorage(): Promise<Settings> {
        const settingsObj: Settings = await this.storageService.getItem<Settings>('settings', DEFAULT_SETTINGS);
        return {
            ...DEFAULT_SETTINGS,
            ...settingsObj,
        };
    }
}