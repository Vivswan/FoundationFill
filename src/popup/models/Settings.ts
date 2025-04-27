/**
 * Settings Model
 * Manages user settings for the extension, including API configuration and theme
 * Provides methods for getting and updating settings with storage persistence
 */
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {DEFAULT_SETTINGS} from '../../defaults';
import {Settings} from "../views/Settings";
import {ThemeColor, ThemeMode} from "../views/Theme";

// Create a logger for this component
const logger = createLogger('SETTINGS_MODEL');

/**
 * Settings model that handles retrieving and saving user settings
 * Provides observability through change listeners
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
    async initialize(): Promise<SettingsModel> {
        this.settings = await this.getSettingsFromStorage();
        
        // Ensure baseUrl has no trailing slash
        if (this.settings.baseUrl && this.settings.baseUrl.endsWith('/')) {
            this.settings.baseUrl = this.settings.baseUrl.slice(0, -1);
            await this.saveSettings();
        }
        
        this.notifyListeners();
        logger.debug('Settings loaded:', this.settings);
        return this
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
     * Import settings from an external source
     */
    async importSettings(importedSettings: Settings): Promise<void> {
        const baseUrl = importedSettings.baseUrl ? 
            (importedSettings.baseUrl.endsWith('/') ? importedSettings.baseUrl.slice(0, -1) : importedSettings.baseUrl) : 
            DEFAULT_SETTINGS.baseUrl;
            
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...importedSettings,
            baseUrl: baseUrl,
            theme: this.validateTheme(importedSettings.theme) || DEFAULT_SETTINGS.theme,
            themeColor: this.validateColor(importedSettings.themeColor) || DEFAULT_SETTINGS.themeColor,
            language: this.validateLanguage(importedSettings.language) || DEFAULT_SETTINGS.language
        };
        await this.saveSettings();
    }

    /**
     * Update a single setting
     */
    async updateSetting(key: keyof Settings, value: string): Promise<void> {
        logger.debug(`Updating setting ${key} to:`, value);
        if (key === 'theme') {
            // Make sure theme is valid
            this.settings[key] = this.validateTheme(value) || DEFAULT_SETTINGS.theme;
        } else if (key === 'themeColor') {
            // Make sure color is valid
            this.settings[key] = this.validateColor(value) || DEFAULT_SETTINGS.themeColor;
        } else if (key === 'language') {
            // Make sure language is valid
            this.settings[key] = this.validateLanguage(value) || DEFAULT_SETTINGS.language;
        } else if (key === 'baseUrl') {
            // Remove trailing slash if present
            this.settings[key] = value.endsWith('/') ? value.slice(0, -1) : value;
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
     * Get just the language setting
     */
    async getLanguage(): Promise<string> {
        const settings = await this.getSettingsFromStorage();
        return settings.language;
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
        this.notifyListeners();
    }

    private notifyListeners(): void {
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

    /**
     * Validate theme value
     */
    private validateTheme(theme: string | undefined): ThemeMode | undefined {
        if (theme && ['light', 'dark', 'system'].includes(theme)) {
            return theme as ThemeMode;
        }
        return undefined;
    }

    /**
     * Validate color value
     */
    private validateColor(color: string | undefined): ThemeColor | undefined {
        if (color && ['blue', 'red', 'green', 'purple', 'orange', 'pink'].includes(color)) {
            return color as ThemeColor;
        }
        return undefined;
    }
    
    /**
     * Validate language value
     */
    private validateLanguage(language: string | undefined): string | undefined {
        if (language && ['en', 'zh-CN', 'zh-TW'].includes(language)) {
            return language;
        }
        return undefined;
    }
}