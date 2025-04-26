/**
 * Settings View Module
 * Manages the UI for user settings including API configuration and theme preferences
 */
import {SettingsModel} from "../models/Settings";
import {ThemeMode} from "./Theme";

/**
 * Interface defining application settings properties
 * @interface Settings
 * @property {string} apiKey - API key for authentication with LLM services
 * @property {string} baseUrl - Base URL for API endpoint
 * @property {string} model - LLM model identifier to use for generation
 * @property {ThemeMode} theme - UI theme preference ('light', 'dark', or 'system')
 */
export interface Settings {
    apiKey: string;
    baseUrl: string;
    model: string;
    theme: ThemeMode;
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
    private modelInput: HTMLInputElement;
    private themeSelect: HTMLSelectElement;
    private settingsStatus: HTMLElement;

    // Status timeout
    private statusTimeout: number | null = null;

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
        this.modelInput = document.getElementById('model') as HTMLInputElement;
        this.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
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
    }

    /**
     * Shows a temporary status message
     * Displays feedback about settings operations with auto-dismissal
     *
     * @param message - The status message to display
     */
    showStatus(message: string): void {
        this.settingsStatus.textContent = message;

        // Clear any existing timeout
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }

        // Set a new timeout to clear the message after 0.5 seconds
        this.statusTimeout = setTimeout(() => {
            this.settingsStatus.textContent = '';
            this.statusTimeout = null;
        }, 500);
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
        this.showStatus('Settings saved!');
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
        this.showStatus('Settings saved!');
    }
}