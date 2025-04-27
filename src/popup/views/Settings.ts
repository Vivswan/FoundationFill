/**
 * Settings View Module
 * Manages the UI for user settings including API configuration and theme preferences
 */
import {SettingsModel} from "../models/Settings";
import {THEME_COLORS, ThemeColor, ThemeMode} from "./Theme";
import {getTranslation} from "../../localization/translations";

/**
 * Interface defining application settings properties
 * @interface Settings
 * @property {string} apiKey - API key for authentication with LLM services
 * @property {string} baseUrl - Base URL for API endpoint
 * @property {string} model - LLM model identifier to use for generation
 * @property {ThemeMode} theme - UI theme preference ('light', 'dark', or 'system')
 * @property {string} themeColor - UI accent color preference
 * @property {Language} language - UI language preference ('en', 'zh-CN', 'zh-TW')
 */
export interface Settings {
    apiKey: string;
    baseUrl: string;
    model: string;
    theme: ThemeMode;
    themeColor: string;
    language: string;
}

/**
 * View component for managing application settings
 * Handles UI for editing settings, validation, and persistence
 */
export class SettingsView {
    private settings: SettingsModel;

    // DOM elements
    private settingsPanel: HTMLElement;
    private baseUrlInput: HTMLInputElement;
    private apiKeyInput: HTMLInputElement;
    private toggleApiKeyBtn: HTMLButtonElement;
    private modelInput: HTMLInputElement;
    private themeSelect: HTMLSelectElement;
    private colorSelect: HTMLSelectElement;
    private languageSelect: HTMLSelectElement;
    private colorPreview: HTMLElement;
    private settingsStatus: HTMLElement;

    // Status timeout
    private statusTimeout: number | null = null;

    // API key visibility state
    private isApiKeyVisible: boolean = false;

    /**
     * Initializes the settings view
     * Sets up DOM references and event handlers for input fields
     *
     * @param settings - The settings model to bind to this view
     */
    constructor(settings: SettingsModel) {
        this.settings = settings;
        this.settingsPanel = document.getElementById('settings-panel') as HTMLElement;
        this.baseUrlInput = document.getElementById('base-url') as HTMLInputElement;
        this.apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        this.toggleApiKeyBtn = document.getElementById('toggle-api-key') as HTMLButtonElement;
        this.modelInput = document.getElementById('model') as HTMLInputElement;
        this.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
        this.colorSelect = document.getElementById('color-select') as HTMLSelectElement;
        this.languageSelect = document.getElementById('language-select') as HTMLSelectElement;
        this.colorPreview = document.getElementById('color-preview') as HTMLElement;
        this.settingsStatus = document.getElementById('settings-status') as HTMLElement;

        // Update the settings panel visibility based on the current state
        this.update()
        this.settings.onChange(this.update.bind(this));

        // Auto-save settings on input changes
        this.baseUrlInput.addEventListener('input', this.handleValueChange.bind(this, 'baseUrl'));
        this.apiKeyInput.addEventListener('input', this.handleValueChange.bind(this, 'apiKey'));
        this.modelInput.addEventListener('input', this.handleValueChange.bind(this, 'model'));

        // Theme dropdown change handler
        this.themeSelect.addEventListener('change', this.handleThemeChange.bind(this));

        // Color dropdown change handler
        this.colorSelect.addEventListener('change', this.handleColorChange.bind(this));

        // Language dropdown change handler
        this.languageSelect.addEventListener('change', this.handleLanguageChange.bind(this));

        // Toggle API key visibility handler
        this.toggleApiKeyBtn.addEventListener('click', this.toggleApiKeyVisibility.bind(this));

        // Update color preview when settings change
        this.updateColorPreview();
    }

    /**
     * Toggles the visibility of the API key field
     * Switches between password and text input types
     */
    toggleApiKeyVisibility(): void {
        this.isApiKeyVisible = !this.isApiKeyVisible;
        this.apiKeyInput.type = this.isApiKeyVisible ? 'text' : 'password';

        // Update the eye icon
        const eyeIcon = this.toggleApiKeyBtn.querySelector('i');
        if (eyeIcon) {
            eyeIcon.className = this.isApiKeyVisible ? 'fa fa-eye-slash' : 'fa fa-eye';
        }

        // Set focus back to input
        this.apiKeyInput.focus();
    }

    /**
     * Shows the settings panel
     * Removes the 'hidden' class to make the panel visible
     */
    show(): void {
        this.settingsPanel.classList.remove('hidden');
    }

    /**
     * Hides the settings panel
     * Adds the 'hidden' class to make the panel invisible
     */
    hide(): void {
        this.settingsPanel.classList.add('hidden');
    }

    /**
     * Updates the settings form fields with current values
     * Synchronizes UI state with the settings model
     */
    update(): void {
        const settings = this.settings.getSettings()
        this.baseUrlInput.value = settings.baseUrl;
        this.apiKeyInput.value = settings.apiKey;
        this.modelInput.value = settings.model;

        // Update theme dropdown
        this.themeSelect.value = settings.theme;

        // Update color dropdown
        this.colorSelect.value = settings.themeColor;

        // Update language dropdown
        this.languageSelect.value = settings.language;

        // Update color preview
        this.updateColorPreview();
    }

    /**
     * Updates the color preview element based on current theme color
     * Sets the background color to match the selected theme color
     */
    updateColorPreview(): void {
        const settings = this.settings.getSettings();
        this.colorPreview.style.backgroundColor = this.getColorHex(settings.themeColor);
    }

    /**
     * Gets the hex color value for a given theme color
     * Uses THEME_COLORS as the single source of truth
     *
     * @param colorName - The name of the theme color
     * @returns The hex color value or a default value if not found
     */
    getColorHex(colorName: string): string {
        // Convert to ThemeColor type if possible
        if (THEME_COLORS[colorName as ThemeColor]) {
            return THEME_COLORS[colorName as ThemeColor].primary;
        }

        // Default to blue if not found
        return THEME_COLORS.blue.primary;
    }

    /**
     * Shows a temporary status message
     * Displays feedback about settings operations with auto-dismissal
     *
     * @param message - The status message to display
     * @param error - Indicates if the message is an error
     * @param timeout - The duration to show the message (default: 500ms)
     */
    showStatus(message: string, error: boolean, timeout: number = 500): void {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        if (error) {
            this.settingsStatus.classList.add('error');
        } else {
            this.settingsStatus.classList.remove('error');
        }
        this.settingsStatus.textContent = message;

        // Set a new timeout to clear the message after 0.5 seconds
        this.statusTimeout = setTimeout(() => {
            this.settingsStatus.textContent = '';
            this.statusTimeout = null;
        }, timeout);
    }

    /**
     * Handles changes to input field values
     * Updates the corresponding setting and shows a confirmation message
     *
     * @param key - The settings key to update
     * @param e - The input event
     * @returns Promise that resolves when the setting is updated
     * @private Internal event handler
     */
    private async handleValueChange(key: keyof Settings, e: Event): Promise<void> {
        const value = (e.target as HTMLInputElement).value;
        await this.settings.updateSetting(key, value);
        this.showStatus(getTranslation("settings.saved"), false);
    }

    /**
     * Handles changes to the theme dropdown
     * Updates the theme setting and shows a confirmation message
     *
     * @param e - The change event
     * @returns Promise that resolves when the theme is updated
     * @private Internal event handler
     */
    private async handleThemeChange(e: Event): Promise<void> {
        const value = (e.target as HTMLSelectElement).value;
        await this.settings.updateSetting('theme', value);
        this.showStatus(getTranslation("settings.saved"), false);
    }

    /**
     * Handles changes to the color dropdown
     * Updates the theme color setting and shows a confirmation message
     *
     * @param e - The change event
     * @returns Promise that resolves when the color is updated
     * @private Internal event handler
     */
    private async handleColorChange(e: Event): Promise<void> {
        const value = (e.target as HTMLSelectElement).value;
        await this.settings.updateSetting('themeColor', value);
        this.updateColorPreview();
        this.showStatus(getTranslation("settings.saved"), false);
    }

    /**
     * Handles changes to the language dropdown
     * Updates the language setting and shows a confirmation message
     *
     * @param e - The change event
     * @returns Promise that resolves when the language is updated
     * @private Internal event handler
     */
    private async handleLanguageChange(e: Event): Promise<void> {
        const value = (e.target as HTMLSelectElement).value;
        await this.settings.updateSetting('language', value);
        this.showStatus(getTranslation("settings.saved"), false);
    }
}