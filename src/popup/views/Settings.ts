import {Settings} from '../../types';
import {SettingsModel} from "../models/Settings";

export class SettingsView {
    private settings: SettingsModel;

    // DOM elements
    private settingsPanel: HTMLElement;
    private apiKeyInput: HTMLInputElement;
    private baseUrlInput: HTMLInputElement;
    private modelInput: HTMLInputElement;
    private themeLightInput: HTMLInputElement;
    private themeDarkInput: HTMLInputElement;
    private themeSystemInput: HTMLInputElement;
    private settingsStatus: HTMLElement;

    // Status timeout
    private statusTimeout: number | null = null;

    constructor(settings: SettingsModel) {
        this.settings = settings;
        this.settingsPanel = document.getElementById('settings-panel') as HTMLElement;
        this.apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        this.baseUrlInput = document.getElementById('base-url') as HTMLInputElement;
        this.modelInput = document.getElementById('model') as HTMLInputElement;
        this.themeLightInput = document.getElementById('theme-light') as HTMLInputElement;
        this.themeDarkInput = document.getElementById('theme-dark') as HTMLInputElement;
        this.themeSystemInput = document.getElementById('theme-system') as HTMLInputElement;
        this.settingsStatus = document.getElementById('settings-status') as HTMLElement;

        // Update the settings panel visibility based on the current state
        this.update()
        this.settings.onChange(this.update.bind(this));

        // Auto-save settings on input changes
        this.apiKeyInput.addEventListener('input', this.handleValueChange.bind(this, 'apiKey'));
        this.baseUrlInput.addEventListener('input', this.handleValueChange.bind(this, 'baseUrl'));
        this.modelInput.addEventListener('input', this.handleValueChange.bind(this, 'model'));

        // Theme option change handlers
        this.themeLightInput.addEventListener('change', this.handleCheckboxChange.bind(this, 'theme', 'light'));
        this.themeDarkInput.addEventListener('change', this.handleCheckboxChange.bind(this, 'theme', 'dark'));
        this.themeSystemInput.addEventListener('change', this.handleCheckboxChange.bind(this, 'theme', 'system'));
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
        this.apiKeyInput.value = settings.apiKey || '';
        this.baseUrlInput.value = settings.baseUrl || '';
        this.modelInput.value = settings.model || '';

        // Update theme radio buttons
        switch (settings.theme) {
            case 'light':
                this.themeLightInput.checked = true;
                break;
            case 'dark':
                this.themeDarkInput.checked = true;
                break;
            case 'system':
            default:
                this.themeSystemInput.checked = true;
                break;
        }
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

    private async handleCheckboxChange(key: keyof Settings, value: string, e: Event): Promise<void> {
        if (!(e.target as HTMLInputElement).checked) return;
        await this.settings.updateSetting(key, value);
        this.showStatus('Settings saved!');
    }
}