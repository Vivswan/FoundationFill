import {GenerateTextResponse, Panel} from '../types';
import {TemplateModel} from './models/Template';
import {SettingsModel} from './models/Settings';
import {TemplateListView} from './views/TemplateList';
import {TemplateEditorView} from './views/TemplateEditor';
import {SettingsView} from './views/Settings';
import {createLogger} from '../utils/logging';
import {executeScriptInTab, getCurrentTab, sendMessageToBackground} from '../utils/chrome-api-utils';
import {ThemeService} from "./views/Theme";

// Create a logger instance for this component
const logger = createLogger('POPUP_CONTROLLER');

export class PopupController {
    private settingsModel: SettingsModel;
    private themeService: ThemeService;
    private settingsView: SettingsView;

    private templateModel: TemplateModel;
    private templateListView: TemplateListView;
    private templateEditorView: TemplateEditorView;

    private settingsBtn: HTMLElement;

    constructor() {
        this.settingsModel = new SettingsModel();
        this.themeService = new ThemeService();
        this.settingsView = new SettingsView(this.settingsModel);

        this.templateModel = new TemplateModel();
        this.templateListView = new TemplateListView(this.templateModel);
        this.templateEditorView = new TemplateEditorView(this.templateModel);

        // Initialize DOM elements
        this.settingsBtn = document.getElementById('settings-btn') as HTMLElement;
    }

    // Initialize the controller
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


    // Handle generating text
    private async handleGenerateButtonClick(): Promise<void> {
        const selectedTemplate = this.templateModel.getSelectedTemplate();

        if (!selectedTemplate) return;

        // Get template data from the editor (in case it was changed but not yet saved)
        const templateData = this.templateEditorView.getEditorFormData();

        // Validate required fields
        if (!templateData.systemPrompt && !templateData.userPrompt) {
            this.templateEditorView.setGeneratedText('Error: Please enter a system prompt or user prompt.');
            return;
        }

        // Get settings to validate API key
        const settings = this.settingsModel.getSettings();
        if (!settings.apiKey) {
            this.templateEditorView.setGeneratedText('Error: API key is missing. Please add your API key in Settings.');
            return;
        }

        // Show loading state
        this.templateEditorView.setGenerateLoading(true);

        try {
            // Get current page content if needed
            let pageContent = '';
            if (templateData.includePageContent) {
                const tab = await getCurrentTab();
                if (tab?.id) {
                    pageContent = await executeScriptInTab(tab.id, () => document.body.innerText) || '';
                }
            }

            // Call the API using the api-service utility
            const response = await sendMessageToBackground<GenerateTextResponse>({
                action: 'generateText',
                systemPrompt: templateData.systemPrompt,
                userPrompt: templateData.userPrompt,
                pageContent: pageContent
            });

            // Update UI based on response
            if (response && response.success) {
                this.templateEditorView.setGeneratedText(response.text || '');
            } else {
                this.templateEditorView.setGeneratedText('Error: ' + (response?.error || 'Could not generate text. Check your API key and connection.'));
            }
        } catch (error) {
            logger.error('Error generating text:', error);
            this.templateEditorView.setGeneratedText('Error: ' + (error instanceof Error ? error.message : 'An unknown error occurred'));
        } finally {
            // Reset loading state
            this.templateEditorView.setGenerateLoading(false);
        }
    }
}