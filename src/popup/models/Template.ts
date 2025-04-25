import {DEFAULT_TEMPLATE} from '../../defaults';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {sendMessageToBackground} from '../../utils/chrome-api-utils';
import {Template} from '../../types';

// Create a logger for this component
const logger = createLogger('TEMPLATE');

/**
 * Check if a template is the default system-provided template
 */
export const isDefaultTemplate = (templateId: string): boolean => {
    return templateId === 'default';
};

/**
 * Create a new template with default values
 */
export const createTemplate = (name = 'New Template', domain = ''): Template => {
    return {
        id: Date.now().toString(),
        name,
        systemPrompt: '',
        userPrompt: '',
        enabled: true,
        includePageContent: false,
        domainSpecific: !!domain,
        domain: domain || '',
        isDefault: false
    };
};

/**
 * Check if a template should be shown for a specific domain
 */
export const shouldShowTemplateForDomain = (template: Template, domain: string): boolean => {
    // Non-domain specific templates are shown everywhere
    if (!template.domainSpecific) {
        return true;
    }

    // Domain-specific templates are only shown on their specific domain
    return template.domain === domain;
};

/**
 * Filter templates for display based on domain
 */
export const filterTemplatesByDomain = (templates: Template[], domain: string): Template[] => {
    return templates.filter(template => {
        // Always include non-domain specific templates
        if (!template.domainSpecific) {
            return true;
        }

        // For domain-specific templates, only include if they match the current domain
        return template.domain === domain;
    });
};

/**
 * Get only enabled templates
 */
export const getEnabledTemplates = (templates: Template[]): Template[] => {
    return templates.filter(template => template.enabled);
};

/**
 * Update a template with new data, ensuring defaults can't be domain-specific
 */
export const updateTemplate = (template: Template, updates: Partial<Template>, currentDomain: string): Template => {
    const isTemplateDefault = isDefaultTemplate(template.id) || !!template.isDefault;

    // Don't allow domain-specific for default template
    if (isTemplateDefault && updates.domainSpecific) {
        updates.domainSpecific = false;
    }

    // Update the template with the new values
    const updated = {
        ...template,
        ...updates
    };

    // Update domain if domain-specific state changes
    if (updates.domainSpecific !== undefined) {
        updated.domain = updates.domainSpecific ? currentDomain : '';
    }

    return updated;
};

/**
 * Template model that manages templates and provides methods to
 * create, update, delete, and retrieve templates.
 */
export class TemplateModel {
    private templates: Template[] = [];
    private selectedTemplateId: string = 'default';
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
            this.templates = await this.getTemplatesFromStorage();
            logger.debug('Templates loaded:', this.templates);

            // Select the first template by default if available
            if (this.templates.length > 0 && !this.selectedTemplateId) {
                this.selectedTemplateId = this.templates[0].id;
                logger.debug('Selected template ID:', this.selectedTemplateId);
            }

        } catch (error) {
            logger.error('Error loading templates:', error);
        }
        return this.templates;
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
        this.templates[templateIndex] = updateTemplate(
            currentTemplate,
            updates,
            this.currentDomain
        );

        this.saveTemplates();
        return this.templates[templateIndex];
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
     * Update a template by ID
     */
    updateTemplate(id: string, updates: Partial<Template>): Template | null {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return null;

        const template = this.templates[index];

        // Update the template with the utility function to ensure proper handling
        this.templates[index] = updateTemplate(
            template,
            updates,
            this.currentDomain
        );

        this.saveTemplates();
        return this.templates[index];
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
            this.selectedTemplateId = '';
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
                    this.selectedTemplateId = '';
                }
            }

            this.saveTemplates();
            return true;
        }

        return false;
    }

    /**
     * Save templates to storage
     */
    async saveTemplates(): Promise<void> {
        try {
            await this.storageService.setItem('templates', this.templates);
            await sendMessageToBackground({action: 'templatesUpdated'});
        } catch (error) {
            logger.error('Error saving templates:', error);
        }
    }

    /**
     * Check if a template is the default template
     */
    isDefaultTemplate(templateId: string): boolean {
        const template = this.getTemplateById(templateId);
        return template ? isDefaultTemplate(template.id) || !!template.isDefault : false;
    }

    /**
     * Get all templates from storage with default fallback
     */
    private async getTemplatesFromStorage(): Promise<Template[]> {
        const templates = await this.storageService.getItem<Template[]>('templates', [DEFAULT_TEMPLATE]);

        // Make sure the default template exists
        const hasDefault = templates.some(t => t.isDefault || t.id === 'default');
        if (!hasDefault) {
            templates.unshift(DEFAULT_TEMPLATE);
        }

        return templates;
    }
}