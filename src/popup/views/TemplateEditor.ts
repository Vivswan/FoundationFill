import {Template} from '../../types';

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

        // Domain-specific checkbox handler for immediate UI updates
        this.domainSpecificCheckbox.addEventListener('change', () => {
            // Update domain display immediately on checkbox change
            if (this.domainSpecificCheckbox.checked) {
                this.templateDomainSpan.style.display = 'inline';
            } else {
                this.templateDomainSpan.style.display = 'none';
            }
            this.handleInputChange();
        });

        // Auto-save template on input changes
        this.systemPromptInput.addEventListener('input', () => this.handleInputChange());
        this.userPromptInput.addEventListener('input', () => this.handleInputChange());
        this.templateEnabledCheckbox.addEventListener('change', () => this.handleInputChange());
        this.includePageContentCheckbox.addEventListener('change', () => this.handleInputChange());
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
    setTemplateDomain(domain: string): void {
        if (this.domainSpecificCheckbox.checked) {
            this.templateDomainSpan.textContent = domain;
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

        // Hide/show delete button based on default template status
        if (isDefault) {
            this.deleteTemplateBtn.style.visibility = 'hidden';
            this.deleteTemplateBtn.disabled = true;
            this.deleteTemplateBtn.title = 'Default template cannot be deleted';

            // Hide domain-specific UI for default template
            const domainSpecificContainer = this.domainSpecificCheckbox.closest('.checkbox-item');
            if (domainSpecificContainer instanceof HTMLElement) {
                domainSpecificContainer.style.display = 'none';
            }
        } else {
            this.deleteTemplateBtn.style.visibility = 'visible';
            this.deleteTemplateBtn.disabled = false;
            this.deleteTemplateBtn.title = 'Delete this template';

            // Show domain-specific UI for non-default templates
            const domainSpecificContainer = this.domainSpecificCheckbox.closest('.checkbox-item');
            if (domainSpecificContainer instanceof HTMLElement) {
                domainSpecificContainer.style.display = 'flex';
            }

            // Set domain-specific checkbox and update domain display
            this.domainSpecificCheckbox.checked = template.domainSpecific;

            if (template.domainSpecific && template.domain) {
                this.templateDomainSpan.textContent = template.domain;
                this.templateDomainSpan.style.display = 'inline';
            } else {
                this.templateDomainSpan.style.display = 'none';
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

    // Handle input changes
    private handleInputChange(): void {
        if (this.onInputChangeCallback) {
            this.onInputChangeCallback({
                systemPrompt: this.systemPromptInput.value,
                userPrompt: this.userPromptInput.value,
                enabled: this.templateEnabledCheckbox.checked,
                includePageContent: this.includePageContentCheckbox.checked,
                domainSpecific: this.domainSpecificCheckbox.checked
            });
        }
    }
}