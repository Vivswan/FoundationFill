import {SettingsModel} from "../models/Settings";
import {ThemeMode} from "./Theme";

// Settings interface
export interface Settings {
    apiKey: string;
    baseUrl: string;
    model: string;
    theme: ThemeMode;
}

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

    // Show the settings panel
    show(): void {
        this.settingsPanel.classList.remove('hidden');
    }

    // Hide the settings panel
    hide(): void {
        this.settingsPanel.classList.add('hidden');
    }

    // Update the settings inputs
    update(): void {
        const settings = this.settings.getSettings()
        this.baseUrlInput.value = settings.baseUrl;
        this.apiKeyInput.value = settings.apiKey;
        this.modelInput.value = settings.model;

        // Update theme dropdown
        this.themeSelect.value = settings.theme;
    }

    // Show a status message
    showStatus(message: string): void {
        this.settingsStatus.textContent = message;

        // Clear any existing timeout
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }

        // Set a new timeout to clear the message after 2 seconds
        this.statusTimeout = setTimeout(() => {
            this.settingsStatus.textContent = '';
            this.statusTimeout = null;
        }, 500);
    }

    private async handleValueChange(key: keyof Settings, e: Event): Promise<void> {
        const value = (e.target as HTMLInputElement).value;
        await this.settings.updateSetting(key, value);
        this.showStatus('Settings saved!');
    }

    private async handleThemeChange(e: Event): Promise<void> {
        const value = (e.target as HTMLSelectElement).value;
        await this.settings.updateSetting('theme', value);
        this.showStatus('Settings saved!');
    }
}