/**
 * Template Editor View
 * Handles the UI for editing templates, managing user inputs, and previewing generation
 */
import {getCurrentPageContent} from "../../utils/chrome-api-utils";
import {Template, TemplateModel} from "../models/Template";
import {DEFAULT_TEMPLATE} from "../../defaults";
import {generateTextWithAnimation} from "../../generate/toElement";
import {DomainUI} from "./DomainUI";
import {TemplateVariableView} from "./TemplateVariable";
import {getTranslation} from "../../localization/translations";

/**
 * TemplateEditorView class
 * Manages the template editor UI, including input fields, controls, and text generation preview
 */
export class TemplateEditorView {
    private template: TemplateModel;
    private lastTemplateId: string = DEFAULT_TEMPLATE.id;
    private domainUI: DomainUI;
    private templateVariableView: TemplateVariableView;

    // DOM elements
    private templateEditor: HTMLElement;
    private templateTitle: HTMLElement;
    private systemPromptInput: HTMLTextAreaElement;
    private userPromptInput: HTMLTextAreaElement;
    private templateEnabledCheckbox: HTMLInputElement;
    private includePageContentCheckbox: HTMLInputElement;
    private deleteTemplateBtn: HTMLButtonElement;
    private duplicateTemplateBtn: HTMLButtonElement;
    private generateBtn: HTMLButtonElement;
    private generatedTextArea: HTMLTextAreaElement;

    /**
     * Initializes the template editor view
     * Sets up DOM elements, event listeners, and child components
     *
     * @param template - The template model to bind to this view
     */
    constructor(template: TemplateModel) {
        this.template = template;

        // Initialize the domain UI
        this.domainUI = new DomainUI(template);

        // Initialize the template variable UI
        this.templateVariableView = new TemplateVariableView();

        // Initialize DOM elements
        this.templateEditor = document.getElementById('template-editor') as HTMLElement;
        this.templateTitle = document.getElementById('template-title') as HTMLElement;
        this.systemPromptInput = document.getElementById('system-prompt') as HTMLTextAreaElement;
        this.userPromptInput = document.getElementById('user-prompt') as HTMLTextAreaElement;
        this.templateEnabledCheckbox = document.getElementById('template-enabled') as HTMLInputElement;
        this.includePageContentCheckbox = document.getElementById('include-page-content') as HTMLInputElement;
        this.deleteTemplateBtn = document.getElementById('delete-template-btn') as HTMLButtonElement;
        this.duplicateTemplateBtn = document.getElementById('duplicate-template-btn') as HTMLButtonElement;
        this.generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
        this.generatedTextArea = document.getElementById('generated-text') as HTMLTextAreaElement;

        // Update
        this.update(this.template.getActiveTemplateId(), this.template.getTemplates());
        this.template.onChange(this.update.bind(this));

        // Add event listeners
        this.deleteTemplateBtn.addEventListener('click', async () => {
            await this.template.deleteTemplate(this.template.getActiveTemplateId());
        });

        this.duplicateTemplateBtn.addEventListener('click', async () => {
            const activeId = this.template.getActiveTemplateId();
            const duplicatedTemplate = await this.template.duplicateTemplate(activeId);
            if (duplicatedTemplate) {
                this.template.setActiveTemplateId(duplicatedTemplate.id);
            }
        });

        // Auto-save template on input changes
        this.systemPromptInput.addEventListener('input', async () => {
            await this.template.updateTemplate(this.template.getActiveTemplateId(), {
                systemPrompt: this.systemPromptInput.value,
            } as Partial<Template>);
        });

        this.userPromptInput.addEventListener('input', async () => {
            await this.template.updateTemplate(this.template.getActiveTemplateId(), {
                userPrompt: this.userPromptInput.value,
            } as Partial<Template>);
        });

        this.templateEnabledCheckbox.addEventListener('change', async () => {
            await this.template.updateTemplate(this.template.getActiveTemplateId(), {
                enabled: this.templateEnabledCheckbox.checked,
            } as Partial<Template>);
        });

        this.includePageContentCheckbox.addEventListener('change', async () => {
            await this.template.updateTemplate(this.template.getActiveTemplateId(), {
                includePageContent: this.includePageContentCheckbox.checked,
            } as Partial<Template>);
        });

        this.generateBtn.addEventListener('click', this.generate.bind(this));
    }

    /**
     * Shows the template editor panel
     * Removes the 'hidden' class to make the editor visible
     */
    show(): void {
        this.templateEditor.classList.remove('hidden');
    }

    /**
     * Hides the template editor panel
     * Adds the 'hidden' class to make the editor invisible
     */
    hide(): void {
        this.templateEditor.classList.add('hidden');
    }

    /**
     * Updates the editor with template data
     * Syncs the UI state with the active template's properties
     *
     * @param activeId - The ID of the active template
     * @param templates - Array of all available templates
     */
    update(activeId: string, templates: Template[]): void {
        const template = templates.find(t => t.id === activeId);
        if (!template) return;

        this.templateTitle.innerHTML = getTranslation('template.title') + " (" + template.name + ")";
        this.systemPromptInput.value = template.systemPrompt;
        this.userPromptInput.value = template.userPrompt;
        this.templateEnabledCheckbox.checked = template.enabled;
        this.includePageContentCheckbox.checked = template.includePageContent;
        this.domainUI.updateDomainGroupVisibility(activeId !== DEFAULT_TEMPLATE.id);

        if (activeId === DEFAULT_TEMPLATE.id) {
            this.deleteTemplateBtn.style.visibility = 'hidden';
            this.deleteTemplateBtn.style.opacity = '0';
            this.deleteTemplateBtn.disabled = true;
            this.deleteTemplateBtn.title = getTranslation('template.cannotDelete');

            // Show duplicate button for default template (can still duplicate it)
            this.duplicateTemplateBtn.style.visibility = 'visible';
            this.duplicateTemplateBtn.disabled = false;
            this.duplicateTemplateBtn.title = getTranslation('template.duplicateTitle');
        } else {
            this.deleteTemplateBtn.style.visibility = 'visible';
            this.deleteTemplateBtn.style.opacity = '1';
            this.deleteTemplateBtn.disabled = false;
            this.deleteTemplateBtn.title = getTranslation('template.deleteTitle');

            this.duplicateTemplateBtn.style.visibility = 'visible';
            this.duplicateTemplateBtn.disabled = false;
            this.duplicateTemplateBtn.title = getTranslation('template.duplicateTitle');
        }

        // Clear generated text area when switching templates
        if (this.lastTemplateId !== activeId) {
            this.generatedTextArea.value = '';
            this.lastTemplateId = activeId;
        }

        // Update the domain UI with the current template
        this.domainUI.update(template);
    }

    /**
     * Generates a preview of the template output
     * Processes variables, fetches page content, and displays generated text with animation
     *
     * @returns Promise that resolves when generation is complete
     */
    async generate(): Promise<void> {
        const templateData = this.template.getTemplates()
            .find(t => t.id === this.template.getActiveTemplateId());

        if (!templateData) return;

        const processedTemplate = await this.templateVariableView.process(templateData);
        const pageContent = templateData.includePageContent ? await getCurrentPageContent() : '';
        return generateTextWithAnimation(
            this.generatedTextArea,
            processedTemplate,
            pageContent
        );
    }

    /**
     * Processes variables in a template through the template variable view component
     * Extracts variables using regex pattern, displays dialog for user input, 
     * and replaces variables with user-provided values in both prompts
     * 
     * This is used both for the template preview and when sending templates to the content script
     *
     * @param template - The template containing variables to process (in format {{variable:default}})
     * @returns Promise resolving to the processed template with variable values substituted
     */
    public async processTemplateVariables(template: Template): Promise<Template> {
        return await this.templateVariableView.process(template);
    }
}