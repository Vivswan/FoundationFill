import {Template} from '../../types';

import {createLogger} from '../../utils/logging';

// Create a logger for this component
const logger = createLogger('TEMPLATE_LIST_VIEW');

export class TemplateListView {
    private readonly templateList: HTMLElement = document.getElementById('template-list') as HTMLElement;
    private readonly newTemplateBtn: HTMLElement = document.getElementById('new-template-btn') as HTMLElement;

    // Event callbacks
    private onSelectCallback: ((templateId: string) => void) | null = null;
    private onNewTemplateCallback: (() => void) | null = null;
    private onEditNameCallback: ((templateId: string, newName: string) => void) | null = null;

    constructor() {
        logger.debug('Initializing TemplateListView');
        if (!this.templateList) {
            logger.error('Template list element not found');
        }
        if (!this.newTemplateBtn) {
            logger.error('New template button element not found');
        }

        // Add event listener for new template button
        if (this.newTemplateBtn) {
            this.newTemplateBtn.addEventListener('click', () => {
                logger.debug('New template button clicked');
                if (this.onNewTemplateCallback) {
                    this.onNewTemplateCallback();
                }
            });
        }
    }

    // Render the template list
    render(templates: Template[], selectedTemplateId: string | null): void {
        logger.debug('Rendering template list');

        if (!this.templateList) {
            logger.error('Cannot render, template list element is null');
            return;
        }

        this.templateList.innerHTML = '';
        logger.debug('Templates count:', templates?.length);

        if (!templates || templates.length === 0) {
            logger.debug('No templates to render');
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-templates';
            emptyMessage.textContent = 'No templates found';
            this.templateList.appendChild(emptyMessage);
            return;
        }

        templates.forEach(template => {
            logger.debug('Rendering template:', template.id, template.name);
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.dataset.templateId = template.id;

            if (template.id === selectedTemplateId) {
                templateItem.classList.add('active');
            }

            if (!template.enabled) {
                templateItem.classList.add('template-item-disabled');
            }

            // Mark default template with a special class/icon
            if (template.isDefault || template.id === 'default') {
                templateItem.classList.add('default-template');

                const nameContainer = document.createElement('span');
                nameContainer.className = 'template-name';
                nameContainer.textContent = template.name;

                const defaultBadge = document.createElement('span');
                defaultBadge.className = 'default-badge';
                defaultBadge.textContent = '(default)';

                templateItem.appendChild(nameContainer);
                templateItem.appendChild(defaultBadge);
            } else {
                const nameContainer = document.createElement('span');
                nameContainer.className = 'template-name';
                nameContainer.textContent = template.name;
                templateItem.appendChild(nameContainer);
            }

            // Click to select template
            templateItem.addEventListener('click', (e) => {
                // Don't trigger select if we're clicking on the edit input
                if ((e.target as HTMLElement).classList.contains('template-name-edit')) {
                    return;
                }

                if (this.onSelectCallback && template.id) {
                    this.onSelectCallback(template.id);
                }
            });

            // Double click to edit name
            templateItem.addEventListener('dblclick', (e) => {
                // If this is a span or badge, get the parent element
                const element = (e.target as HTMLElement).closest('.template-item');
                if (!element) return;

                e.stopPropagation();

                // Find the name container
                const nameContainer = element.querySelector('.template-name');
                if (!nameContainer) return;

                // Create input field
                const input = document.createElement('input');
                input.type = 'text';
                input.value = template.name;
                input.className = 'template-name-edit';

                // Replace just the name container with the input
                nameContainer.replaceWith(input);

                // For default template, make the input smaller to accommodate the badge
                if (template.isDefault || template.id === 'default') {
                    input.style.width = 'calc(100% - 60px)'; // Make room for the badge
                }

                // Focus the input and select all text
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 10);

                // Save on Enter key
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const newName = input.value.trim();
                        if (newName && this.onEditNameCallback) {
                            this.onEditNameCallback(template.id, newName);
                        }
                        e.preventDefault();
                    } else if (e.key === 'Escape') {
                        this.render(templates, selectedTemplateId); // Cancel editing
                        e.preventDefault();
                    }
                });

                // Save on blur (click outside)
                input.addEventListener('blur', () => {
                    const newName = input.value.trim();
                    if (newName && this.onEditNameCallback) {
                        this.onEditNameCallback(template.id, newName);
                    } else {
                        this.render(templates, selectedTemplateId); // Restore original name if empty
                    }
                });
            });

            this.templateList.appendChild(templateItem);
        });
    }

    // Set the onSelect callback
    onSelect(callback: (templateId: string) => void): void {
        this.onSelectCallback = callback;
    }

    // Set the onNewTemplate callback
    onNewTemplate(callback: () => void): void {
        this.onNewTemplateCallback = callback;
    }

    // Set the onEditName callback
    onTemplateNameEdit(callback: (templateId: string, newName: string) => void): void {
        this.onEditNameCallback = callback;
    }
}