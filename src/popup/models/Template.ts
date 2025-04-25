import {Template} from '../../types';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {sendMessageToBackground} from '../../utils/chrome-api-utils';
import {createTemplate, isDefaultTemplate, updateTemplate as updateTemplateUtil} from '../../utils/template-utils';

// Create a logger for this component
const logger = createLogger('TEMPLATE');

/**
 * Template model that manages templates and provides methods to
 * create, update, delete, and retrieve templates.
 */
export class TemplateModel {
    private templates: Template[] = [];
    private selectedTemplateId: string | null = null;
    private currentDomain: string = '';
    private storageService: StorageService;
    
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Initialize the model by loading templates from storage
     */
    async initialize(): Promise<void> {
        await this.loadTemplates();
    }

    /**
     * Load templates from storage
     */
    async loadTemplates(): Promise<Template[]> {
        logger.debug('Loading templates');
        try {
            this.templates = await this.storageService.getTemplates();
            logger.debug('Templates loaded:', this.templates);

            // Select the first template by default if available
            if (this.templates.length > 0 && !this.selectedTemplateId) {
                this.selectedTemplateId = this.templates[0].id;
                logger.debug('Selected template ID:', this.selectedTemplateId);
            }

            return this.templates;
        } catch (error) {
            logger.error('Error loading templates:', error);
            // Initialize with an empty array if there's an error
            this.templates = [];
            return [];
        }
    }

    /**
     * Set the current domain for domain-specific templates
     */
    setCurrentDomain(domain: string): void {
        this.currentDomain = domain;
    }

    /**
     * Get the current domain
     */
    getCurrentDomain(): string {
        return this.currentDomain;
    }

    /**
     * Get all templates
     */
    getTemplates(): Template[] {
        logger.debug('Getting templates, count:', this.templates.length);
        return this.templates;
    }

    /**
     * Get only enabled templates
     */
    getEnabledTemplates(): Template[] {
        return this.templates.filter(t => t.enabled);
    }

    /**
     * Get templates that apply to a specific domain
     */
    getTemplatesForDomain(domain: string): Template[] {
        return this.templates.filter(template => {
            if (!template.domainSpecific) return true;
            return template.domain === domain;
        });
    }

    /**
     * Get enabled templates for a specific domain
     */
    getEnabledTemplatesForDomain(domain: string): Template[] {
        return this.getTemplatesForDomain(domain).filter(t => t.enabled);
    }

    /**
     * Get a template by ID
     */
    getTemplateById(id: string): Template | undefined {
        return this.templates.find(t => t.id === id);
    }

    /**
     * Get the selected template
     */
    getSelectedTemplate(): Template | null {
        if (!this.selectedTemplateId) return null;
        return this.templates.find(t => t.id === this.selectedTemplateId) || null;
    }

    /**
     * Get the selected template ID
     */
    getSelectedTemplateId(): string | null {
        return this.selectedTemplateId;
    }

    /**
     * Select a template by ID
     */
    selectTemplate(templateId: string): Template | null {
        this.selectedTemplateId = templateId;
        return this.getSelectedTemplate();
    }

    /**
     * Create a new template
     */
    createNewTemplate(): Template {
        // Find the default template to copy content from
        const defaultTemplate = this.templates.find(t => t.isDefault) || this.templates[0];

        // Create a new template
        const newTemplate = createTemplate('New Template', this.currentDomain);
        
        // Copy content from default template if available
        if (defaultTemplate) {
            newTemplate.systemPrompt = defaultTemplate.systemPrompt;
            newTemplate.userPrompt = defaultTemplate.userPrompt;
        }

        // Add to collection
        this.templates.push(newTemplate);
        this.selectedTemplateId = newTemplate.id;

        // Save to storage
        this.saveTemplates();
        
        return newTemplate;
    }

    /**
     * Update the selected template
     */
    updateSelectedTemplate(updates: Partial<Template>): Template | null {
        if (!this.selectedTemplateId) return null;

        const templateIndex = this.templates.findIndex(t => t.id === this.selectedTemplateId);
        if (templateIndex === -1) return null;

        const currentTemplate = this.templates[templateIndex];

        // Update the template with the utility function to ensure proper handling
        this.templates[templateIndex] = updateTemplateUtil(
            currentTemplate,
            updates,
            this.currentDomain
        );

        this.saveTemplates();
        return this.templates[templateIndex];
    }

    /**
     * Update a template name
     */
    updateTemplateName(templateId: string, newName: string): Template | null {
        const templateIndex = this.templates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) return null;

        // Only update if the name actually changed
        if (this.templates[templateIndex].name !== newName) {
            this.templates[templateIndex].name = newName;
            this.saveTemplates();
        }

        return this.templates[templateIndex];
    }

    /**
     * Update a template by ID
     */
    updateTemplate(id: string, updates: Partial<Template>): Template | null {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return null;

        const template = this.templates[index];

        // Update the template with the utility function to ensure proper handling
        this.templates[index] = updateTemplateUtil(
            template,
            updates,
            this.currentDomain
        );

        this.saveTemplates();
        return this.templates[index];
    }

    /**
     * Delete the selected template
     */
    deleteSelectedTemplate(): boolean {
        if (!this.selectedTemplateId) return false;

        // Find the template
        const template = this.templates.find(t => t.id === this.selectedTemplateId);
        if (!template) return false;

        // Don't allow deleting the default template
        if (isDefaultTemplate(template.id) || template.isDefault) {
            return false;
        }

        // Filter out the template to delete
        this.templates = this.templates.filter(t => t.id !== this.selectedTemplateId);

        // Select the first template if available after deletion
        if (this.templates.length > 0) {
            this.selectedTemplateId = this.templates[0].id;
        } else {
            this.selectedTemplateId = null;
        }

        this.saveTemplates();
        return true;
    }

    /**
     * Delete a template by ID
     */
    deleteTemplate(id: string): boolean {
        // Don't delete default template
        if (isDefaultTemplate(id)) return false;

        const initialLength = this.templates.length;
        this.templates = this.templates.filter(t => t.id !== id);

        if (this.templates.length < initialLength) {
            // If the deleted template was selected, select a different one
            if (this.selectedTemplateId === id) {
                if (this.templates.length > 0) {
                    this.selectedTemplateId = this.templates[0].id;
                } else {
                    this.selectedTemplateId = null;
                }
            }

            this.saveTemplates();
            return true;
        }

        return false;
    }

    /**
     * Check if a template is the default template
     */
    isDefaultTemplate(templateId: string): boolean {
        const template = this.getTemplateById(templateId);
        return template ? isDefaultTemplate(template.id) || !!template.isDefault : false;
    }

    /**
     * Save templates to storage
     */
    async saveTemplates(): Promise<void> {
        try {
            await this.storageService.saveTemplates(this.templates);
            await sendMessageToBackground({action: 'templatesUpdated'});
        } catch (error) {
            logger.error('Error saving templates:', error);
        }
    }
}