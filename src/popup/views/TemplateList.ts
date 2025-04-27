/**
 * Template List View Module
 * Handles the sidebar list of templates, selection, inline editing, and reordering
 */
import {createLogger} from '../../utils/logging';
import {Template, TemplateModel} from "../models/Template";
import {DEFAULT_TEMPLATE} from "../../defaults";
import Sortable from 'sortablejs';
import {getTranslation} from "../../localization/translations";

// Create a logger for this component
const logger = createLogger('TEMPLATE_LIST_VIEW');

/**
 * View component for displaying and managing the list of templates
 * Handles template selection, inline name editing, and new template creation
 */
export class TemplateListView {
    private template: TemplateModel;

    // DOM elements
    private readonly templateList: HTMLElement;
    private readonly newTemplateBtn: HTMLElement;

    // Track click timer to distinguish between single and double clicks
    private clickTimer: number | null = null;
    private clickedTemplateId: string | null = null;

    // Sortable instance for drag-and-drop reordering
    private sortableInstance: Sortable | null = null;

    /**
     * Initializes the template list view
     * Sets up DOM elements, event listeners, and data binding
     *
     * @param template - The template model to bind to this view
     */
    constructor(template: TemplateModel) {
        this.template = template;

        // Initialize DOM elements
        this.templateList = document.getElementById('template-list') as HTMLElement;
        this.newTemplateBtn = document.getElementById('new-template-btn') as HTMLElement;

        // Update
        this.rerender()
        this.template.onChange(this.render.bind(this));

        // Add event listener for new template button
        this.newTemplateBtn.addEventListener('click', async () => {
            this.template.setActiveTemplateId((await this.template.createNewTemplate()).id)
        });
    }

    /**
     * Callback function triggered when a template is selected
     * Can be set externally to handle navigation to template editor
     */
    public onShowCallback: () => void = () => {
    };

    /**
     * Re-renders the template list with current data
     * Convenience method that calls render with current state
     */
    rerender(): void {
        this.render(this.template.getActiveTemplateId(), this.template.getTemplates());
    }

    /**
     * Renders the template list with the provided data
     * Creates DOM elements for each template and adds appropriate event listeners
     *
     * @param selectedTemplateId - The ID of the currently selected template
     * @param templates - Array of templates to display in the list
     */
    render(selectedTemplateId: string, templates: Template[]): void {
        this.templateList.innerHTML = '';

        // Destroy existing Sortable instance if it exists
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
            this.sortableInstance = null;
        }

        if (!templates || templates.length === 0) {
            logger.debug('No templates to render');
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-templates';
            emptyMessage.textContent = 'No templates found';
            this.templateList.appendChild(emptyMessage);
            return;
        }

        // Create a dedicated container for sortable items
        const sortableContainer = document.createElement('div');
        sortableContainer.className = 'sortable-container';
        this.templateList.appendChild(sortableContainer);

        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.setAttribute("data-id", template.id);

            if (template.id === selectedTemplateId) {
                templateItem.classList.add('active');
            }

            if (!template.enabled) {
                templateItem.classList.add('template-item-disabled');
            }

            // Mark default template with a special class/icon
            if (template.id === DEFAULT_TEMPLATE.id) {
                templateItem.classList.add('default-template');

                // Add a drag handle for default template but style it differently
                const handle = document.createElement('span');
                handle.className = 'template-handle default-handle';
                handle.innerHTML = '&#x2630;'; // hamburger menu icon
                handle.style.visibility = 'hidden'; // Hide the handle for default template

                const nameContainer = document.createElement('span');
                nameContainer.className = 'template-name';
                nameContainer.textContent = template.name;

                const defaultBadge = document.createElement('span');
                defaultBadge.className = 'default-badge';
                defaultBadge.textContent = `(${getTranslation('template.default')})`;

                templateItem.appendChild(handle);
                templateItem.appendChild(nameContainer);
                templateItem.appendChild(defaultBadge);
            } else {
                // Add a drag handle for non-default templates
                const handle = document.createElement('span');
                handle.className = 'template-handle';
                handle.innerHTML = '&#x2630;'; // hamburger menu icon

                const nameContainer = document.createElement('span');
                nameContainer.className = 'template-name';
                nameContainer.textContent = template.name;

                templateItem.appendChild(handle);
                templateItem.appendChild(nameContainer);
            }

            // Click to select template
            templateItem.addEventListener('click', this.templateItemClick.bind(this));

            // Double click to edit name
            templateItem.addEventListener('dblclick', this.templateItemDblClick.bind(this));

            sortableContainer.appendChild(templateItem);
        });

        // Initialize Sortable after all items are added
        this.initSortable(sortableContainer);
    }

    /**
     * Updates a template with a new name
     * Called when inline editing of a template name is completed
     *
     * @param templateId - The ID of the template to update
     * @param newName - The new name for the template
     */
    async setNewName(templateId: string, newName: string): Promise<void> {
        if (!newName) return;
        await this.template.updateTemplate(templateId, {name: newName} as Partial<Template>);
    }

    /**
     * Initializes SortableJS for template reordering
     *
     * @param container - The container element for sortable items
     * @private Internal method used during rendering
     */
    private initSortable(container: HTMLElement): void {
        this.sortableInstance = new Sortable(container, {
            animation: 150,
            handle: '.template-handle',
            filter: '.default-template', // Prevent the default template from being moved
            onStart: () => {
                // Add a class to the body when dragging starts
                document.body.classList.add('template-dragging');
            },
            onEnd: async (evt: Sortable.SortableEvent) => {
                // Remove the class when dragging ends
                document.body.classList.remove('template-dragging');

                // If we moved a template
                if (evt.oldIndex !== evt.newIndex) {
                    // Ensure default template remains at the top (index 0)
                    if (evt.newIndex === 0 && this.template.getTemplates()[0].id === DEFAULT_TEMPLATE.id) {
                        // If someone tried to move a template before the default, revert by re-rendering
                        this.rerender();
                        return;
                    }

                    // Get new order of template IDs (excluding the default template)
                    const templateItems = Array.from(container.querySelectorAll('.template-item'));
                    const newOrder = templateItems.map(item => item.getAttribute('data-id') as string);

                    // Update the model with the new order
                    await this.template.reorderTemplates(newOrder);
                }
            }
        });
    }

    /**
     * Handles click events on template items
     * Selects the template and triggers the onShowCallback to display it
     *
     * @param e - The click event
     * @private Internal event handler
     */
    private templateItemClick(e: Event) {
        // Don't trigger click when dragging or clicking the handle
        if ((e.target as HTMLElement).closest('.template-handle')) {
            return;
        }

        const element = (e.target as HTMLElement).closest('.template-item');
        if (!element) return;
        if (element.querySelector('.template-name-edit')) return; // Ignore if editing

        e.stopPropagation();

        // Get the template ID from the clicked item
        const id = element.getAttribute('data-id');
        if (!id) return;

        // If we're waiting for a potential double-click on the same element, do nothing
        if (this.clickTimer !== null && this.clickedTemplateId === id) {
            return;
        }

        // Store the clicked template ID
        this.clickedTemplateId = id;

        // Clear any existing timer
        if (this.clickTimer !== null) {
            window.clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }

        // Set a timer to handle single click after a short delay
        this.template.setActiveTemplateId(id);
        this.onShowCallback();
        this.clickTimer = window.setTimeout(() => {
            this.clickTimer = null;
            this.clickedTemplateId = null;
        }, 250); // Short delay to wait for possible double-click
    }

    /**
     * Handles double-click events on template items
     * Enables inline editing of template names
     *
     * @param e - The double-click event
     * @private Internal event handler
     */
    private templateItemDblClick(e: Event) {
        // Don't trigger dblclick when dragging or clicking the handle
        if ((e.target as HTMLElement).closest('.template-handle')) {
            return;
        }

        const element = (e.target as HTMLElement).closest('.template-item');
        if (!element) return;
        const id = element.getAttribute('data-id');
        if (!id) return;
        if (id == DEFAULT_TEMPLATE.id) return;

        // Cancel any pending single-click timer to prevent both actions
        if (this.clickTimer !== null) {
            window.clearTimeout(this.clickTimer);
            this.clickTimer = null;
            this.clickedTemplateId = null;
        }

        e.stopPropagation();

        // Find the name container
        const nameContainer = element.querySelector('.template-name');
        if (!nameContainer) return;

        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = (nameContainer as HTMLInputElement).textContent || '';
        input.className = 'template-name-edit';

        // Replace just the name container with the input
        nameContainer.replaceWith(input);

        // Focus the input and select all text
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        // Save on Enter key
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const newName = input.value.trim();
                if (newName) {
                    await this.setNewName(id, newName)
                }
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.rerender();
                e.preventDefault();
            }
        });

        // Save on blur (click outside)
        input.addEventListener('blur', async () => {
            const newName = input.value.trim();
            if (newName) {
                await this.setNewName(id, newName);
            } else {
                this.rerender();
            }
        });
    }
}