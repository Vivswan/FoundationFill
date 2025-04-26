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
import {SettingsView} from './views/Settings';
import {ImportExportView} from './views/ImportExport';
import {createLogger} from '../utils/logging';
import {ThemeService} from "./views/Theme";

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

        // Set the initial theme
        this.themeService.setTheme(await this.settingsModel.getTheme());
        this.settingsModel.onChange((updatedSettings) => this.themeService.setTheme(updatedSettings.theme));

        this.settingsBtn.addEventListener('click', this.show.bind(this, 'setting'));
        this.templateListView.onShowCallback = this.show.bind(this, 'template');
        this.show("template");
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

    public async resolveTemplateVariables(template: Template): Promise<Template> {
        this.show("template");
        this.templateModel.setActiveTemplateId(template.id);
        return await this.templateEditorView.processTemplateVariables(template);
    }
}