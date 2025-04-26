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
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...importedSettings,
            theme: this.validateTheme(importedSettings.theme) || DEFAULT_SETTINGS.theme,
            themeColor: this.validateColor(importedSettings.themeColor) || DEFAULT_SETTINGS.themeColor
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
     * Get just the color setting
     */
    async getColor(): Promise<ThemeColor> {
        const settings = await this.getSettingsFromStorage();
        return (settings.themeColor as ThemeColor) || DEFAULT_SETTINGS.themeColor as ThemeColor;
    }

    /**
     * Update just the color setting
     */
    async setColor(color: ThemeColor): Promise<void> {
        this.settings.themeColor = color;
        return this.saveSettings();
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
}