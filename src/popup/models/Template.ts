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
import {getTranslation} from "../../localization/translations";

/**
 * Interface representing a template for text generation
 * 
 * @property id - Unique identifier for the template (UUID format)
 * @property enabled - Whether the template is active and available for use
 * @property name - Display name for the template
 * @property systemPrompt - System instructions for the LLM
 * @property userPrompt - User prompt content for the LLM
 * @property includePageContent - Whether to include page content when generating text
 * @property associatedDomains - List of domains this template should be available on
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
     * Ensures the default template always exists
     * Notifies listeners after initialization
     * 
     * @returns Promise resolving to this model instance for chaining
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

    /**
     * Sets the active template by ID
     * Updates the activeTemplateId and notifies all listeners of the change
     *
     * @param id - The ID of the template to set as active
     */
    setActiveTemplateId(id: string): void {
        const template = this.templates.find((t) => t.id === id);
        if (template) {
            this.activeTemplateId = id;
            this.notifyListeners();
        } else {
            logger.error(`Template with ID ${id} not found`);
        }
    }

    /**
     * Gets the ID of the currently active template
     *
     * @returns The ID of the active template
     */
    getActiveTemplateId(): string {
        return this.activeTemplateId;
    }

    /**
     * Gets the currently active template
     * Returns a deep copy to prevent unintentional mutations
     *
     * @returns The active template object or null if not found
     */
    getActiveTemplate(): Template | null {
        const template = this.templates.find((t) => t.id === this.activeTemplateId);
        return template ? JSON.parse(JSON.stringify(template)) : null;
    }

    /**
     * Get a template by its ID
     * Returns a deep copy to prevent unintentional mutations
     * 
     * @param id - The ID of the template to retrieve
     * @returns Promise resolving to the template or null if not found
     */
    async getTemplateById(id: string): Promise<Template | null> {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            return JSON.parse(JSON.stringify(template));
        } else {
            logger.error(`Template with ID ${id} not found`);
            return null;
        }
    }

    /**
     * Create a new template based on the default template
     * Generates a unique ID and adds the template to the templates array
     *
     * @returns Promise resolving to the newly created template
     */
    async createNewTemplate(): Promise<Template> {
        const newTemplate = {
            ...this.templates.find(template => template.id === DEFAULT_TEMPLATE.id),
            id: crypto.randomUUID(),
            name: getTranslation('template.new'),
        } as Template;

        this.templates.push(newTemplate);
        await this.saveTemplates();
        return newTemplate;
    }

    /**
     * Duplicate an existing template
     * Creates a deep copy with a new ID and adds "(Copy)" to the name
     * Inserts the new template immediately after the source template
     * 
     * @param templateId - The ID of the template to duplicate
     * @returns Promise resolving to the new template or null if source not found
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
     * Update an existing template with new values
     * If updating the default template, associated domains will be cleared
     *
     * @param updateId - The ID of the template to update
     * @param updates - Partial template object with the fields to update
     * @returns Promise resolving to the original template before updates, or null if not found
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
     * Delete a template by ID
     * Will not delete the default template (protected)
     * If the active template is deleted, selects the previous template in the list
     *
     * @param id - The ID of the template to delete
     * @returns Promise that resolves when the deletion is complete
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
     * Validates templates, preserves the default template, and handles duplicates
     * If the default template is imported, it will replace the existing one
     * If the active template is removed during import, defaults to the default template
     * 
     * @param importedTemplates - Array of templates to import
     * @returns Promise that resolves when templates have been imported and saved
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
     * Returns a deep copy of the templates array to prevent unintentional mutations
     * 
     * @returns Array containing all templates
     */
    getTemplates(): Template[] {
        return JSON.parse(JSON.stringify(this.templates));
    }

    /**
     * Get all enabled templates
     *
     * @returns Array of templates that have enabled set to true
     */
    getEnabledTemplates(): Template[] {
        return this.templates.filter(template => template.enabled);
    }

    /**
     * Get templates that apply to a specific domain
     * Returns templates with no associated domains or those that match the given domain
     *
     * @param domain - The domain to filter templates for
     * @returns Array of templates that apply to the specified domain
     */
    getTemplatesForDomain(domain: string): Template[] {
        return this.templates.filter(template => {
            if (!template.associatedDomains || template.associatedDomains.length === 0) return true;
            return template.associatedDomains.some(pattern => validateDomain(pattern, domain));
        });
    }

    /**
     * Get enabled templates for a specific domain
     * Combines domain filtering and enabled status filtering
     *
     * @param domain - The domain to filter templates for
     * @returns Array of enabled templates that apply to the specified domain
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
     * Persists templates to Chrome sync storage
     * Notifies the background script that templates have changed
     * Triggers change listeners for UI updates
     * 
     * @returns Promise that resolves when save operations complete
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
     * Registers a callback function to be called whenever templates or the active template changes
     * 
     * @param callback - Function to call with active template ID and templates array
     * @returns Function that when called will remove this listener
     */
    onChange(callback: (activeId: string, templates: Template[]) => void): () => void {
        this.changeListeners.push(callback);

        // Return a function to remove this listener
        return () => {
            this.changeListeners = this.changeListeners.filter(listener => listener !== callback);
        };
    }

    /**
     * Validate template data structure
     * Ensures the template has the required properties to function correctly
     * 
     * @param template - The template object to validate
     * @returns Type guard boolean indicating if the template is valid
     * @private Used during template import to filter out invalid templates
     */
    private validateTemplate(template: unknown): template is Template {
        if (!template || typeof template !== 'object') return false;
        return 'id' in template && 'name' in template &&
            'systemPrompt' in template && 'userPrompt' in template;
    }

    /**
     * Notify all listeners of template changes
     * Calls each registered listener with the current activeTemplateId and a deep copy of templates
     * Catches and logs errors in listener callbacks to prevent one bad listener from breaking others
     * 
     * @private Internal method called whenever templates or activeTemplateId changes
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