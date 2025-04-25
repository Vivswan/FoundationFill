/**
 * Import/Export Functionality
 * Handles importing and exporting extension data in JSON format
 */
import {createLogger} from '../../utils/logging';
import {SettingsModel} from '../models/Settings';
import {Template, TemplateModel} from '../models/Template';
import {Settings} from './Settings';

// Create a logger for this component
const logger = createLogger('IMPORT_EXPORT');

// Interface for the export data structure
export interface ExportData {
    version: string;
    settings: Settings;
    templates: Template[];
}

export class ImportExportView {
    private settingsModel: SettingsModel;
    private templateModel: TemplateModel;

    // DOM elements
    private exportBtn: HTMLButtonElement;
    private importBtn: HTMLButtonElement;
    private importFileInput: HTMLInputElement;
    private settingsStatus: HTMLElement;

    // Status timeout
    private statusTimeout: number | null = null;

    constructor(settingsModel: SettingsModel, templateModel: TemplateModel) {
        this.settingsModel = settingsModel;
        this.templateModel = templateModel;

        // Get DOM elements
        this.exportBtn = document.getElementById('export-data-btn') as HTMLButtonElement;
        this.importBtn = document.getElementById('import-data-btn') as HTMLButtonElement;
        this.importFileInput = document.getElementById('import-file-input') as HTMLInputElement;
        this.settingsStatus = document.getElementById('settings-status') as HTMLElement;

        // Add event listeners
        this.exportBtn.addEventListener('click', this.handleExport.bind(this));
        this.importBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', this.handleImport.bind(this));
    }

    /**
     * Show a status message
     */
    private showStatus(message: string): void {
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

    /**
     * Handle exporting all extension data
     */
    private async handleExport(): Promise<void> {
        try {
            // Get current settings and templates
            const settings = this.settingsModel.getSettings();
            const templates = this.templateModel.getTemplates();

            // Get package version
            const manifest = chrome.runtime.getManifest();
            const version = manifest.version || '1.0.0';

            // Create export data object
            const exportData: ExportData = {
                version,
                settings,
                templates,
            };

            // Convert to JSON and create download
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            // Create and trigger download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `foundation-fill-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up
            URL.revokeObjectURL(url);
            this.showStatus('Data exported successfully!');

            logger.debug('Data exported successfully');
        } catch (error) {
            logger.error('Error exporting data:', error);
            this.showStatus('Error exporting data!');
        }
    }

    /**
     * Handle importing extension data
     */
    private async handleImport(event: Event): Promise<void> {
        const fileInput = event.target as HTMLInputElement;
        if (!fileInput.files || fileInput.files.length === 0) {
            this.showStatus('No file selected!');
            return;
        }

        const file = fileInput.files[0];

        try {
            // Read the file
            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent) as ExportData;

            // Validate the import data
            if (!this.validateImportData(importData)) {
                this.showStatus('Invalid import file format!');
                return;
            }

            // Import settings
            await this.settingsModel.importSettings(importData.settings);

            // Import templates
            await this.templateModel.importTemplates(importData.templates);

            this.showStatus('Data imported successfully!');
            logger.debug('Data imported successfully');

            // Reset the file input
            fileInput.value = '';
        } catch (error) {
            logger.error('Error importing data:', error);
            this.showStatus('Error importing data!');

            // Reset the file input
            fileInput.value = '';
        }
    }

    /**
     * Read a file as text
     */
    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Validate the import data format
     */
    private validateImportData(data: any): data is ExportData {
        // Check if data has required properties
        if (!data || typeof data !== 'object') return false;
        if (!('version' in data && 'settings' in data && 'templates' in data)) return false;

        // Check if settings has required properties
        const settings = data.settings;
        if (!settings || typeof settings !== 'object') return false;
        if (!('apiKey' in settings && 'baseUrl' in settings && 'model' in settings && 'theme' in settings)) return false;

        // Check if templates is an array
        if (!Array.isArray(data.templates)) return false;

        // Check each template
        for (const template of data.templates) {
            if (!template || typeof template !== 'object') return false;
            if (!('id' in template && 'enabled' in template && 'name' in template &&
                'systemPrompt' in template && 'userPrompt' in template &&
                'includePageContent' in template && 'associatedDomain' in template)) {
                return false;
            }
        }

        return true;
    }
}