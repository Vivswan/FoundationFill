/**
 * Template Model
 * Manages the templates data, including creation, updates, and storage
 * Provides methods for filtering templates by domain and enabled status
 */
import {DEFAULT_TEMPLATE} from '../../defaults';
import {createLogger} from '../../utils/logging';
import {StorageService} from '../../utils/storage-service';
import {sendMessageToBackground} from '../../utils/chrome-api-utils';
import {validateDomain} from "../../utils/associatedDomain";

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
    associatedDomains: string[];
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

    getActiveTemplate(): Template | null {
        const template = this.templates.find((t) => t.id === this.activeTemplateId);
        return template ? JSON.parse(JSON.stringify(template)) : null;
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
     * Duplicate an existing template
     * @param templateId - The ID of the template to duplicate
     */
    async duplicateTemplate(templateId: string): Promise<Template | null> {
        const sourceTemplate = this.templates.find(template => template.id === templateId);

        if (!sourceTemplate) {
            logger.error(`Template with ID ${templateId} not found for duplication`);
            return null;
        }

        const newTemplate = {
            ...JSON.parse(JSON.stringify(sourceTemplate)),
            id: crypto.randomUUID(),
            name: `${sourceTemplate.name} (Copy)`,
        };

        // Insert after the source template
        const sourceIndex = this.templates.findIndex(t => t.id === templateId);
        this.templates.splice(sourceIndex + 1, 0, newTemplate);

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

        if (updateId == DEFAULT_TEMPLATE.id) this.templates[templateIndex].associatedDomains = [];

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
     * Import templates from an external source
     */
    async importTemplates(importedTemplates: Template[]): Promise<void> {
        logger.debug('Importing templates:', importedTemplates);

        // Make sure default template exists
        const hasDefaultInImport = importedTemplates.some(t => t.id === DEFAULT_TEMPLATE.id);

        // If default doesn't exist in import, preserve current default
        let defaultTemplate: Template = DEFAULT_TEMPLATE;
        if (hasDefaultInImport) {
            defaultTemplate = importedTemplates.find(t => t.id === DEFAULT_TEMPLATE.id) || DEFAULT_TEMPLATE;
        } else {
            defaultTemplate = this.templates.find(t => t.id === DEFAULT_TEMPLATE.id) || DEFAULT_TEMPLATE;
        }

        // Filter out any malformed templates and ensure each has required properties
        const validTemplates = importedTemplates
            .filter(this.validateTemplate)
            .filter(template => template.id !== DEFAULT_TEMPLATE.id)
            .map(template => ({
                id: template.id,
                enabled: template.enabled ?? true,
                name: template.name || 'Unnamed Template',
                systemPrompt: template.systemPrompt || '',
                userPrompt: template.userPrompt || '',
                includePageContent: template.includePageContent ?? false,
                associatedDomains: template.associatedDomains || [],
            } as Template));

        validTemplates.unshift(defaultTemplate);
        // Update templates and save
        this.templates = validTemplates;

        // If active template no longer exists, set to default
        if (!this.templates.some(t => t.id === this.activeTemplateId)) {
            this.activeTemplateId = DEFAULT_TEMPLATE.id;
        }

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
            if (!template.associatedDomains || template.associatedDomains.length === 0) return true;
            return template.associatedDomains.some(pattern => validateDomain(pattern, domain));
        });
    }

    /**
     * Get enabled templates for a specific domain
     */
    getEnabledTemplatesForDomain(domain: string): Template[] {
        return this.getTemplatesForDomain(domain).filter(t => t.enabled);
    }

    /**
     * Reorder templates based on the new order of IDs
     * Default template always remains at the first position
     *
     * @param newOrder - Array of template IDs in the new order
     */
    async reorderTemplates(newOrder: string[]): Promise<void> {
        if (!newOrder || newOrder.length === 0) return;

        // Make sure default template is first
        const defaultTemplate = this.templates.find(t => t.id === DEFAULT_TEMPLATE.id);
        if (!defaultTemplate) {
            logger.error('Default template not found during reordering');
            return;
        }

        // Create a map of all templates by ID for quick lookup
        const templateMap: Record<string, Template> = {};
        this.templates.forEach(template => {
            templateMap[template.id] = template;
        });

        // Build the new templates array with default template first
        const orderedTemplates: Template[] = [defaultTemplate];

        // Add the rest of the templates in the new order
        newOrder.forEach(id => {
            if (id !== DEFAULT_TEMPLATE.id && templateMap[id]) {
                orderedTemplates.push(templateMap[id]);
            }
        });

        // Make sure we didn't lose any templates during reordering
        // Add any templates that weren't in the newOrder list
        this.templates.forEach(template => {
            const templateInNewOrder = orderedTemplates.some(t => t.id === template.id);
            if (!templateInNewOrder) {
                orderedTemplates.push(template);
            }
        });

        // Update the templates array
        this.templates = orderedTemplates;

        // Save the new order
        await this.saveTemplates();
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
     * Validate template data
     */
    private validateTemplate(template: any): template is Template {
        if (!template || typeof template !== 'object') return false;
        if (!('id' in template && 'name' in template &&
            'systemPrompt' in template && 'userPrompt' in template)) {
            return false;
        }
        return true;
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