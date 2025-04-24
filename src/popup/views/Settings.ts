import {Settings} from '../../types';

export class SettingsView {
  // DOM elements
  private settingsPanel: HTMLElement;
  private apiKeyInput: HTMLInputElement;
  private baseUrlInput: HTMLInputElement;
  private modelInput: HTMLInputElement;
  private themeLightInput: HTMLInputElement;
  private themeDarkInput: HTMLInputElement;
  private themeSystemInput: HTMLInputElement;
  private settingsStatus: HTMLElement;
  private doneBtn: HTMLElement;
  private settingsBtn: HTMLElement;

  // Status timeout
  private statusTimeout: number | null = null;

  // Event callbacks
  private onInputChangeCallback: ((key: keyof Settings, value: string) => void) | null = null;
  private onDoneCallback: (() => void) | null = null;
  private onShowCallback: (() => void) | null = null;

  constructor(
      settingsPanelId: string,
      apiKeyId: string,
      baseUrlId: string,
      modelId: string,
      settingsStatusId: string,
      doneBtnId: string,
      settingsBtnId: string
  ) {
    // Get DOM elements
    this.settingsPanel = document.getElementById(settingsPanelId) as HTMLElement;
    this.apiKeyInput = document.getElementById(apiKeyId) as HTMLInputElement;
    this.baseUrlInput = document.getElementById(baseUrlId) as HTMLInputElement;
    this.modelInput = document.getElementById(modelId) as HTMLInputElement;
    this.themeLightInput = document.getElementById('theme-light') as HTMLInputElement;
    this.themeDarkInput = document.getElementById('theme-dark') as HTMLInputElement;
    this.themeSystemInput = document.getElementById('theme-system') as HTMLInputElement;
    this.settingsStatus = document.getElementById(settingsStatusId) as HTMLElement;
    this.doneBtn = document.getElementById(doneBtnId) as HTMLElement;
    this.settingsBtn = document.getElementById(settingsBtnId) as HTMLElement;

    // Add event listeners
    this.doneBtn.addEventListener('click', () => {
      if (this.onDoneCallback) {
        this.onDoneCallback();
      }
    });

    this.settingsBtn.addEventListener('click', () => {
      if (this.onShowCallback) {
        this.onShowCallback();
      }
    });

    // Auto-save settings on input changes
    this.apiKeyInput.addEventListener('input', () => {
      if (this.onInputChangeCallback) {
        this.onInputChangeCallback('apiKey', this.apiKeyInput.value);
      }
    });

    this.baseUrlInput.addEventListener('input', () => {
      if (this.onInputChangeCallback) {
        this.onInputChangeCallback('baseUrl', this.baseUrlInput.value);
      }
    });

    this.modelInput.addEventListener('input', () => {
      if (this.onInputChangeCallback) {
        this.onInputChangeCallback('model', this.modelInput.value);
      }
    });

    // Theme option change handlers
    this.themeLightInput.addEventListener('change', () => {
      if (this.themeLightInput.checked && this.onInputChangeCallback) {
        this.onInputChangeCallback('theme', 'light');
      }
    });

    this.themeDarkInput.addEventListener('change', () => {
      if (this.themeDarkInput.checked && this.onInputChangeCallback) {
        this.onInputChangeCallback('theme', 'dark');
      }
    });

    this.themeSystemInput.addEventListener('change', () => {
      if (this.themeSystemInput.checked && this.onInputChangeCallback) {
        this.onInputChangeCallback('theme', 'system');
      }
    });
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
  update(settings: Settings): void {
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
    }, 2000);
  }

  // Set the onInputChange callback
  onSettingChange(callback: (key: keyof Settings, value: string) => void): void {
    this.onInputChangeCallback = callback;
  }

  // Set the onDone callback
  onDone(callback: () => void): void {
    this.onDoneCallback = callback;
  }

  // Set the onShow callback
  onShow(callback: () => void): void {
    this.onShowCallback = callback;
  }
}