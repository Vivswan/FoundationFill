/**
 * Import/Export Module
 * Handles importing and exporting extension data in JSON format
 * Provides data portability and backup/restore functionality
 */
import {createLogger} from '../../utils/logging';
import {SettingsModel} from '../models/Settings';
import {Template, TemplateModel} from '../models/Template';
import {Settings} from './Settings';

// Create a logger for this component
const logger = createLogger('IMPORT_EXPORT');

/**
 * Interface defining the structure of exported data
 * Contains version information, settings, and templates
 *
 * @interface ExportData
 * @property {string} version - The extension version that created the export
 * @property {Settings} settings - User settings configuration
 * @property {Template[]} templates - Array of user templates
 */
export interface ExportData {
    version: string;
    settings: Settings;
    templates: Template[];
}

/**
 * View component for handling import and export functionality
 * Manages UI for data import/export and handles file operations
 */
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

    /**
     * Initializes the import/export view
     * Sets up DOM references and event handlers for import/export actions
     *
     * @param settingsModel - The settings model to use for import/export
     * @param templateModel - The template model to use for import/export
     */
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
     * Displays a temporary status message
     * Shows feedback about import/export operations with auto-dismissal
     *
     * @param message - The status message to display
     * @param error - Indicates if the message is an error
     * @param timeout - Duration in milliseconds to show the message
     * @private Internal utility method
     */
    private showStatus(message: string, error: boolean, timeout: number = 2000): void {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        if (error) {
            this.settingsStatus.classList.add('error');
        } else {
            this.settingsStatus.classList.remove('error');
        }
        this.settingsStatus.textContent = message;

        // Set a new timeout to clear the message after 2 seconds
        this.statusTimeout = setTimeout(() => {
            this.settingsStatus.textContent = '';
            this.statusTimeout = null;
        }, timeout);
    }

    /**
     * Handles the export action when the export button is clicked
     * Creates a JSON file with all extension data and triggers download
     *
     * @returns Promise that resolves when export is complete
     * @private Event handler for export button
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
            this.showStatus('Data exported successfully!', false);

            logger.debug('Data exported successfully');
        } catch (error) {
            logger.error('Error exporting data:', error);
            this.showStatus('Error exporting data!', true);
        }
    }

    /**
     * Handles the import action when a file is selected
     * Reads the file, validates its format, and imports settings and templates
     *
     * @param event - The change event from the file input
     * @returns Promise that resolves when import is complete
     * @private Event handler for file input change
     */
    private async handleImport(event: Event): Promise<void> {
        const fileInput = event.target as HTMLInputElement;
        if (!fileInput.files || fileInput.files.length === 0) {
            this.showStatus('No file selected!', true);
            return;
        }

        const file = fileInput.files[0];
        fileInput.value = '';

        try {
            // Read the file
            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent) as ExportData;

            // Validate the import data
            if (!this.validateImportData(importData)) {
                this.showStatus('Invalid import file format!', true);
                return;
            }

            // Import settings
            await this.settingsModel.importSettings(importData.settings);

            // Import templates
            await this.templateModel.importTemplates(importData.templates);

            this.showStatus('Data imported successfully!', false);
            logger.debug('Data imported successfully');
        } catch (error) {
            logger.error('Error importing data:', error);
            this.showStatus('Error importing data!', true);
        }
    }

    /**
     * Reads a file as text using FileReader
     *
     * @param file - The file to read
     * @returns Promise that resolves with the file contents as a string
     * @private Utility method for file reading
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
     * Validates that imported data has the expected structure
     * Performs type checking and ensures required properties exist
     *
     * @param data - The data to validate
     * @returns Boolean indicating whether the data is valid
     * @private Type guard for import data validation
     */
    private validateImportData(data: unknown): data is ExportData {
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
            if (!('id' in template && 'name' in template &&
                'systemPrompt' in template && 'userPrompt' in template)) {
                return false;
            }
        }

        return true;
    }
}