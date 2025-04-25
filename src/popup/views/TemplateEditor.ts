import {Template} from '../../types';
import {getCurrentDomain} from "../../utils/chrome-api-utils";

export class TemplateEditorView {
    // DOM elements
    private templateEditor: HTMLElement = document.getElementById('template-editor') as HTMLElement;
    private systemPromptInput: HTMLTextAreaElement = document.getElementById('system-prompt') as HTMLTextAreaElement;
    private userPromptInput: HTMLTextAreaElement = document.getElementById('user-prompt') as HTMLTextAreaElement;
    private templateEnabledCheckbox: HTMLInputElement = document.getElementById('template-enabled') as HTMLInputElement;
    private includePageContentCheckbox: HTMLInputElement = document.getElementById('include-page-content') as HTMLInputElement;
    private domainSpecificCheckbox: HTMLInputElement = document.getElementById('domain-specific') as HTMLInputElement;
    private templateDomainSpan: HTMLElement = document.getElementById('template-domain') as HTMLElement
    private deleteTemplateBtn: HTMLButtonElement = document.getElementById('delete-template-btn') as HTMLButtonElement;
    private generateBtn: HTMLButtonElement = document.getElementById('generate-btn') as HTMLButtonElement;
    private generatedTextArea: HTMLTextAreaElement = document.getElementById('generated-text') as HTMLTextAreaElement;

    // Event callbacks
    private onDeleteCallback: (() => void) | null = null;
    private onGenerateCallback: (() => void) | null = null;
    private onInputChangeCallback: ((template: Partial<Template>) => void) | null = null;

    constructor() {
        // Add event listeners
        this.deleteTemplateBtn.addEventListener('click', () => {
            if (this.onDeleteCallback) {
                this.onDeleteCallback();
            }
        });

        this.generateBtn.addEventListener('click', () => {
            if (this.onGenerateCallback) {
                this.onGenerateCallback();
            }
        });


        // Auto-save template on input changes
        this.systemPromptInput.addEventListener('input', () => {
            if (this.onInputChangeCallback) {
                this.onInputChangeCallback({
                    systemPrompt: this.systemPromptInput.value,
                } as Partial<Template>);
            }
        });
        this.userPromptInput.addEventListener('input', () => {
            if (this.onInputChangeCallback) {
                this.onInputChangeCallback({
                    userPrompt: this.userPromptInput.value,
                } as Partial<Template>);
            }
        });
        this.templateEnabledCheckbox.addEventListener('change', () => {
            if (this.onInputChangeCallback) {
                this.onInputChangeCallback({
                    enabled: this.templateEnabledCheckbox.checked,
                } as Partial<Template>);
            }
        });
        this.includePageContentCheckbox.addEventListener('change', () => {
            if (this.onInputChangeCallback) {
                this.onInputChangeCallback({
                    includePageContent: this.includePageContentCheckbox.checked,
                } as Partial<Template>);
            }
        });

        this.domainSpecificCheckbox.addEventListener('change', () => {
            this.setTemplateDomain();
            if (this.onInputChangeCallback) {
                this.onInputChangeCallback({
                    domainSpecific: this.domainSpecificCheckbox.checked,
                    domain: this.domainSpecificCheckbox.checked ? getCurrentDomain() : '',
                } as Partial<Template>);
            }
        });
    }

    // Show the template editor
    show(): void {
        this.templateEditor.classList.remove('hidden');
    }

    // Hide the template editor
    hide(): void {
        this.templateEditor.classList.add('hidden');
    }

    // Set the template domain display
    setTemplateDomain(): void {
        if (this.domainSpecificCheckbox.checked) {
            this.templateDomainSpan.style.display = 'inline';
        } else {
            this.templateDomainSpan.style.display = 'none';
        }
    }

    // Update the editor with template data
    update(template: Template, isDefault: boolean): void {
        this.systemPromptInput.value = template.systemPrompt || '';
        this.userPromptInput.value = template.userPrompt || '';
        this.templateEnabledCheckbox.checked = template.enabled;
        this.includePageContentCheckbox.checked = template.includePageContent;
        this.generatedTextArea.value = '';
        this.templateDomainSpan.textContent = '';
        this.templateDomainSpan.style.display = 'none';

        // Hide/show delete button based on default template status
        if (isDefault) {
            this.deleteTemplateBtn.style.visibility = 'hidden';
            this.deleteTemplateBtn.disabled = true;
            this.deleteTemplateBtn.title = 'Default template cannot be deleted';
            (this.domainSpecificCheckbox.parentElement as HTMLElement).style.display = 'none';
        } else {
            this.deleteTemplateBtn.style.visibility = 'visible';
            this.deleteTemplateBtn.disabled = false;
            this.deleteTemplateBtn.title = 'Delete this template';
            (this.domainSpecificCheckbox.parentElement as HTMLElement).style.display = 'flex';

            // Set domain-specific checkbox and update domain display
            this.domainSpecificCheckbox.checked = template.domainSpecific;

            if (template.domainSpecific && template.domain) {
                this.templateDomainSpan.textContent = template.domain;
                this.templateDomainSpan.style.display = 'inline';
            }
        }
    }

    // Set the generated text
    setGeneratedText(text: string): void {
        this.generatedTextArea.value = text;
    }

    // Clear the generated text
    clearGeneratedText(): void {
        this.generatedTextArea.value = '';
    }

    // Set loading state for generate button
    setGenerateLoading(isLoading: boolean): void {
        this.generateBtn.disabled = isLoading;
        this.generatedTextArea.value = isLoading ? 'Generating...' : this.generatedTextArea.value;
    }

    // Get the current template data from the editor
    getEditorFormData(): Partial<Template> {
        return {
            systemPrompt: this.systemPromptInput.value,
            userPrompt: this.userPromptInput.value,
            enabled: this.templateEnabledCheckbox.checked,
            includePageContent: this.includePageContentCheckbox.checked,
            domainSpecific: this.domainSpecificCheckbox.checked
        };
    }

    // Set the onDelete callback
    onDelete(callback: () => void): void {
        this.onDeleteCallback = callback;
    }

    // Set the onGenerate callback
    onGenerate(callback: () => void): void {
        this.onGenerateCallback = callback;
    }

    // Set the onInputChange callback
    onTemplateFieldChange(callback: (template: Partial<Template>) => void): void {
        this.onInputChangeCallback = callback;
    }
}