/**
 * Template Model
 * Manages the templates data, including creation, updates, and storage
 * Provides methods for filtering templates by domain and enabled status
 */
import {DEFAULT_TEMPLATE} from '../../defaults';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {sendMessageToBackground} from '../../utils/chrome-api-utils';

/**
 * Interface representing a template for text generation
 */
export interface Template {
    id: string;
    enabled: boolean;
    name: string;
    systemPrompt: string;
    userPrompt: string;
    includePageContent: boolean;
    domain: string | null;
}

// Create a logger for this component
const logger = createLogger('TEMPLATE');

/**
 * Template model that manages templates and provides methods to
 * create, update, delete, and retrieve templates.
 */
export class TemplateModel {
    private templates: Template[] = [];
    private activeTemplateId: string = DEFAULT_TEMPLATE.id;
    private storageService: StorageService;
    private changeListeners: ((activeId: string, templates: Template[]) => void)[] = [];

    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Initialize the model by loading templates from storage
     */
    async initialize(): Promise<TemplateModel> {
        logger.debug('Loading templates');
        this.templates = await this.storageService.getItem<Template[]>('templates', [DEFAULT_TEMPLATE]);

        const hasDefault = this.templates.some(t => t.id === DEFAULT_TEMPLATE.id);
        if (!hasDefault) this.templates.unshift(DEFAULT_TEMPLATE);

        // Notify listeners on initialization
        this.notifyListeners();
        return this;
    }

    setActiveTemplateId(id: string): void {
        const template = this.templates.find((t) => t.id === id);
        if (template) {
            this.activeTemplateId = id;
            this.notifyListeners();
        } else {
            logger.error(`Template with ID ${id} not found`);
        }
    }

    getActiveTemplateId(): string {
        return this.activeTemplateId;
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
    async updateTemplate(updateId: string, updates: Partial<Template>): Promise<Template | null> {
        const templateIndex = this.templates.findIndex(template => template.id === updateId);
        if (templateIndex === -1) return null;

        const template = this.templates[templateIndex];
        this.templates[templateIndex] = {
            ...template,
            ...updates,
            id: updateId,
        }

        if (updateId == DEFAULT_TEMPLATE.id) this.templates[templateIndex].domain = null;

        await this.saveTemplates();
        return JSON.parse(JSON.stringify(template));
    }

    /**
     * Delete the template
     */
    async deleteTemplate(id: string): Promise<void> {
        if (!id) return;
        if (id == DEFAULT_TEMPLATE.id) return;

        const templateIndex = this.templates.findIndex(template => template.id === id);
        if (templateIndex === -1) return;
        if (this.templates[templateIndex].id === this.activeTemplateId) {
            this.activeTemplateId = this.templates[templateIndex - 1].id;
        }

        this.templates = this.templates.filter(t => t.id !== id);
        await this.saveTemplates();
    }

    /**
     * Get all templates
     */
    getTemplates(): Template[] {
        return JSON.parse(JSON.stringify(this.templates));
    }

    getEnabledTemplates() {
        return this.templates.filter(template => template.enabled);
    }

    /**
     * Get templates that apply to a specific domain
     */
    getTemplatesForDomain(domain: string): Template[] {
        return this.templates.filter(template => {
            if (template.domain === null) return true;
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

            // Notify all listeners
            this.notifyListeners();
        } catch (error) {
            logger.error('Error saving templates:', error);
        }
    }

    /**
     * Add a listener for template changes
     * @returns Function to remove the listener
     */
    onChange(callback: (activeId: string, templates: Template[]) => void): () => void {
        this.changeListeners.push(callback);

        // Return a function to remove this listener
        return () => {
            this.changeListeners = this.changeListeners.filter(listener => listener !== callback);
        };
    }

    /**
     * Notify all listeners of template changes
     */
    private notifyListeners(): void {
        this.changeListeners.forEach(listener => {
            try {
                listener(this.activeTemplateId, JSON.parse(JSON.stringify(this.templates)));
            } catch (error) {
                logger.error('Error in template change listener:', error);
            }
        });
    }
}