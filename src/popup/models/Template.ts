import {DEFAULT_TEMPLATE} from '../../defaults';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {sendMessageToBackground} from '../../utils/chrome-api-utils';
import {Template} from '../../types';

// Create a logger for this component
const logger = createLogger('TEMPLATE');


/**
 * Template model that manages templates and provides methods to
 * create, update, delete, and retrieve templates.
 */
export class TemplateModel {
    private templates: Template[] = [];
    private storageService: StorageService;

    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Initialize the model by loading templates from storage
     */
    async initialize(): Promise<void> {
        logger.debug('Loading templates');
        this.templates = await this.storageService.getItem<Template[]>('templates', [DEFAULT_TEMPLATE]);

        const hasDefault = this.templates.some(t => t.id === DEFAULT_TEMPLATE.id);
        if (!hasDefault) this.templates.unshift(DEFAULT_TEMPLATE);
    }

    /**
     * Create a new template
     */
    async createNewTemplate(): Promise<Template> {
        const newTemplate = {
            ...this.templates.find(template => template.id === DEFAULT_TEMPLATE.id),
            id: crypto.randomUUID(),
            name: 'New Template',
        } as Template;

        this.templates.push(newTemplate);
        await this.saveTemplates();
        return newTemplate;
    }

    /**
     * Update the template
     */
    async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
        const templateIndex = this.templates.findIndex(template => template.id === id);
        if (templateIndex === -1) return null;

        const template = this.templates[templateIndex];
        this.templates[templateIndex] = {
            ...template,
            ...updates,
        }

        await this.saveTemplates();
        return JSON.parse(JSON.stringify(template));
    }

    /**
     * Delete the template
     */
    async deleteTemplate(id: string): Promise<void> {
        if (!id) return;
        if (id == DEFAULT_TEMPLATE.id) return;

        this.templates = this.templates.filter(t => t.id !== id);
        await this.saveTemplates();
    }

    /**
     * Get all templates
     */
    getTemplates(): Template[] {
        return JSON.parse(JSON.stringify(this.templates));
    }

    /**
     * Get templates that apply to a specific domain
     */
    getTemplatesForDomain(domain: string): Template[] {
        return this.templates.filter(template => {
            if (template.domain !== null) return true;
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
        return templateId === DEFAULT_TEMPLATE.id;
    }
}