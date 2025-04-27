/**
 * Popup Controller Module
 * Main controller for the extension popup UI
 * Coordinates between models and views, manages navigation
 */
import {Panel} from '../utils/types';
import {Template, TemplateModel} from './models/Template';
import {SettingsModel} from './models/Settings';
import {TemplateListView} from './views/TemplateList';
import {TemplateEditorView} from './views/TemplateEditor';
import {Settings, SettingsView} from './views/Settings';
import {ImportExportView} from './views/ImportExport';
import {createLogger} from '../utils/logging';
import {ThemeColor, ThemeMode, ThemeService} from "./views/Theme";
import {getTranslation, Language, setDocumentLanguage} from '../localization/translations';
import {DEFAULT_TEMPLATE} from "../defaults";

// Create a logger instance for this component
const logger = createLogger('POPUP_CONTROLLER');

/**
 * Main controller for the extension popup
 * Manages initialization, panel navigation, and coordinates between models and views
 */
export class PopupController {
    private settingsModel: SettingsModel;
    private themeService: ThemeService;
    private settingsView: SettingsView;
    private importExportView: ImportExportView;

    private templateModel: TemplateModel;
    private templateListView: TemplateListView;
    private templateEditorView: TemplateEditorView;

    private settingsBtn: HTMLElement;

    /**
     * Initializes the popup controller
     * Creates instances of models and views needed for the popup UI
     */
    constructor() {
        this.settingsModel = new SettingsModel();
        this.themeService = new ThemeService();
        this.settingsView = new SettingsView(this.settingsModel);

        this.templateModel = new TemplateModel();
        this.templateListView = new TemplateListView(this.templateModel);
        this.templateEditorView = new TemplateEditorView(this.templateModel);

        // Initialize import/export functionality
        this.importExportView = new ImportExportView(this.settingsModel, this.templateModel);

        // Initialize DOM elements
        this.settingsBtn = document.getElementById('settings-btn') as HTMLElement;
    }

    /**
     * Initializes the controller
     * Loads data, sets up event listeners, and displays the initial UI
     *
     * @returns Promise that resolves when initialization is complete
     */
    async initialize(): Promise<void> {
        logger.debug('Initializing');

        // Load templates and settings
        logger.debug('Loading templates and settings');
        await this.settingsModel.initialize();
        await this.templateModel.initialize();

        await this.onSettingsChange(this.settingsModel.getSettings());

        this.settingsModel.onChange(this.onSettingsChange.bind(this));
        this.settingsBtn.addEventListener('click', this.show.bind(this, 'setting'));
        this.templateListView.onShowCallback = this.show.bind(this, 'template');
        this.show("template");
    }

    /**
     * Processes template variables for a template
     * Displays the template editor and processes any variables in the template
     * Used when a template with variables is selected from the context menu
     *
     * @param template - The template containing variables to resolve
     * @returns Promise resolving to the processed template with variable values
     */
    public async resolveTemplateVariables(template: Template): Promise<Template> {
        this.show("template");
        this.templateModel.setActiveTemplateId(template.id);
        return await this.templateEditorView.processTemplateVariables(template);
    }

    private async onSettingsChange(updatedSettings: Settings): Promise<void> {
        setDocumentLanguage(updatedSettings.language as Language);

        await this.templateModel.updateTemplate(DEFAULT_TEMPLATE.id, {
            name: getTranslation("baseTemplate.title"),
            systemPrompt: getTranslation("baseTemplate.systemPrompt"),
            userPrompt: getTranslation("baseTemplate.userPrompt"),
        });
        this.themeService.setTheme(updatedSettings.theme as ThemeMode);
        this.themeService.setColor(updatedSettings.themeColor as ThemeColor);
        this.updateUILanguage(updatedSettings.language);
    }

    /**
     * Shows a specific panel in the popup
     * Hides all other panels and displays the requested one
     *
     * @param panel - The panel to show ('template' or 'setting')
     * @private Internal method used for navigation
     */
    private show(panel: Panel): void {
        // Hide all panels
        this.templateEditorView.hide();
        this.settingsView.hide();

        switch (panel) {
            case "template":
                this.templateEditorView.show();
                break;
            case "setting":
                this.settingsView.show();
                break;
            default:
                logger.error('Unknown panel:', panel);
        }
    }

    /**
     * Updates the UI language by replacing text content in DOM elements
     * @param language - The language code to use
     */
    private updateUILanguage(language: string): void {
        logger.debug('Updating UI language to:', language);

        // Update settings panel texts
        document.querySelector('.settings-header h2')!.textContent = getTranslation('settings.title');
        document.querySelector('label[for="base-url"]')!.textContent = getTranslation('settings.baseUrl');
        document.querySelector('label[for="api-key"]')!.textContent = getTranslation('settings.apiKey');
        document.querySelector('label[for="model"]')!.textContent = getTranslation('settings.model');
        document.querySelector('label[for="theme-select"]')!.textContent = getTranslation('settings.theme');
        document.querySelector('label[for="color-select"]')!.textContent = getTranslation('settings.accentColor');
        document.querySelector('label[for="language-select"]')!.textContent = getTranslation('settings.language');

        // Update default badge if found
        const defaultBadge = document.querySelector('.default-badge');
        if (defaultBadge) {
            defaultBadge.textContent = `(${getTranslation('template.default')})`;
        }

        // Update theme options
        const themeOptions = document.querySelectorAll('#theme-select option');
        themeOptions[0].textContent = getTranslation('theme.light');
        themeOptions[1].textContent = getTranslation('theme.dark');
        themeOptions[2].textContent = getTranslation('theme.system');

        // Update color options
        const colorOptions = document.querySelectorAll('#color-select option');
        colorOptions[0].textContent = getTranslation('colors.blue');
        colorOptions[1].textContent = getTranslation('colors.red');
        colorOptions[2].textContent = getTranslation('colors.green');
        colorOptions[3].textContent = getTranslation('colors.purple');
        colorOptions[4].textContent = getTranslation('colors.orange');
        colorOptions[5].textContent = getTranslation('colors.pink');

        // Update import/export section
        document.querySelector('.import-export-group h3')!.textContent = getTranslation('settings.importExport');
        document.querySelector('#export-data-btn')!.textContent = getTranslation('settings.exportBtn');
        document.querySelector('#import-data-btn')!.textContent = getTranslation('settings.importBtn');

        // Update template editor texts
        document.querySelector('#template-title')!.textContent = getTranslation('template.title');
        document.querySelector('label[for="system-prompt"]')!.textContent = getTranslation('template.systemPrompt');
        document.querySelector('label[for="user-prompt"]')!.textContent = getTranslation('template.userPrompt');
        document.querySelector('#generated-text')!.setAttribute('placeholder', getTranslation('template.generatedText'));
        document.querySelector('label[for="template-enabled"]')!.textContent = getTranslation('template.enabled');
        document.querySelector('label[for="include-page-content"]')!.textContent = getTranslation('template.webContent');
        document.querySelector('#manage-domains-btn')!.textContent = ' ' + getTranslation('template.domains') + ' ';
        document.querySelector('#generate-btn')!.textContent = getTranslation('template.testPrompt');

        // Update domain dialog
        document.querySelector('#domain-dialog .dialog-header h3')!.textContent = getTranslation('domains.title');
        document.querySelector('#domain-dialog .dialog-info')!.textContent = getTranslation('domains.info');
        document.querySelector('#add-current-domain-btn')!.textContent = getTranslation('domains.addCurrent');
        document.querySelector('#new-domain-input')!.setAttribute('placeholder', getTranslation('domains.placeholder'));
        document.querySelector('#add-domain-btn')!.textContent = getTranslation('domains.add');
        document.querySelector('#save-domains-btn')!.textContent = getTranslation('domains.save');
    }
}