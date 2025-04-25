import {getCurrentDomain,} from "../../utils/chrome-api-utils";
import {Template, TemplateModel} from "../models/Template";
import {DEFAULT_TEMPLATE} from "../../defaults";

import {generateTextWithAnimation} from "../../generate/toElement";

export class TemplateEditorView {
    private template: TemplateModel;
    private lastTemplateId: string = DEFAULT_TEMPLATE.id;

    // DOM elements
    private templateEditor: HTMLElement;
    private templateTitle: HTMLElement;
    private systemPromptInput: HTMLTextAreaElement;
    private userPromptInput: HTMLTextAreaElement;
    private templateEnabledCheckbox: HTMLInputElement;
    private includePageContentCheckbox: HTMLInputElement;
    private domainSpecificCheckbox: HTMLInputElement;
    private templateDomainSpan: HTMLElement;
    private deleteTemplateBtn: HTMLButtonElement;
    private generateBtn: HTMLButtonElement;
    private generatedTextArea: HTMLTextAreaElement;

    constructor(template: TemplateModel) {
        this.template = template;

        // Initialize DOM elements
        this.templateEditor = document.getElementById('template-editor') as HTMLElement;
        this.templateTitle = document.getElementById('template-title') as HTMLElement;
        this.systemPromptInput = document.getElementById('system-prompt') as HTMLTextAreaElement;
        this.userPromptInput = document.getElementById('user-prompt') as HTMLTextAreaElement;
        this.templateEnabledCheckbox = document.getElementById('template-enabled') as HTMLInputElement;
        this.includePageContentCheckbox = document.getElementById('include-page-content') as HTMLInputElement;
        this.domainSpecificCheckbox = document.getElementById('domain-specific') as HTMLInputElement;
        this.templateDomainSpan = document.getElementById('template-domain') as HTMLElement
        this.deleteTemplateBtn = document.getElementById('delete-template-btn') as HTMLButtonElement;
        this.generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
        this.generatedTextArea = document.getElementById('generated-text') as HTMLTextAreaElement;

        // Update
        this.update(this.template.getActiveTemplateId(), this.template.getTemplates());
        this.template.onChange(this.update.bind(this));

        // Add event listeners
        this.deleteTemplateBtn.addEventListener('click', async () => {
            await this.template.deleteTemplate(this.template.getActiveTemplateId());
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

        this.domainSpecificCheckbox.addEventListener('change', async () => {
            await this.template.updateTemplate(this.template.getActiveTemplateId(), {
                domain: this.domainSpecificCheckbox.checked ? await getCurrentDomain() : null,
            } as Partial<Template>);
        });
        this.generateBtn.addEventListener('click', this.generate.bind(this));
    }

    // Show the template editor
    show(): void {
        this.templateEditor.classList.remove('hidden');
    }

    // Hide the template editor
    hide(): void {
        this.templateEditor.classList.add('hidden');
    }

    // Update the editor with template data
    update(activeId: string, templates: Template[]): void {
        const template = templates.find(t => t.id === activeId);
        if (!template) return;

        this.templateTitle.innerHTML = "Edit (" + template.name + ")";
        this.systemPromptInput.value = template.systemPrompt;
        this.userPromptInput.value = template.userPrompt;
        this.templateEnabledCheckbox.checked = template.enabled;
        this.includePageContentCheckbox.checked = template.includePageContent;
        this.domainSpecificCheckbox.checked = template.domain !== null;

        if (this.lastTemplateId !== activeId) {
            this.generatedTextArea.value = '';
            this.lastTemplateId = activeId;
        }

        this.templateDomainSpan.style.display = 'none';
        this.templateDomainSpan.textContent = template.domain || '';

        // Hide/show delete button based on default template status
        if (activeId === DEFAULT_TEMPLATE.id) {
            this.deleteTemplateBtn.style.visibility = 'hidden';
            this.deleteTemplateBtn.disabled = true;
            this.deleteTemplateBtn.title = 'Default template cannot be deleted';
            (this.domainSpecificCheckbox.parentElement as HTMLElement).style.display = 'none';
        } else {
            this.deleteTemplateBtn.style.visibility = 'visible';
            this.deleteTemplateBtn.disabled = false;
            this.deleteTemplateBtn.title = 'Delete this template';
            (this.domainSpecificCheckbox.parentElement as HTMLElement).style.display = 'flex';

            if (template.domain !== null) {
                this.templateDomainSpan.style.display = 'inline';
            }
        }
    }

    async generate(): Promise<void> {
        const templateData = this.template.getTemplates()
            .find(t => t.id === this.template.getActiveTemplateId());
        return generateTextWithAnimation(this.generatedTextArea, templateData);
    }
}