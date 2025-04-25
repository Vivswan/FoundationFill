import {Template} from '../../types';

import {createLogger} from '../../utils/logging';
import {TemplateModel} from "../models/Template";
import {DEFAULT_TEMPLATE} from "../../defaults";

// Create a logger for this component
const logger = createLogger('TEMPLATE_LIST_VIEW');

export class TemplateListView {
    private template: TemplateModel;

    // DOM elements
    private readonly templateList: HTMLElement;
    private readonly newTemplateBtn: HTMLElement;

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

    rerender(): void {
        this.render(this.template.getActiveTemplateId(), this.template.getTemplates());
    }

    render(selectedTemplateId: string, templates: Template[]): void {
        this.templateList.innerHTML = '';

        if (!templates || templates.length === 0) {
            logger.debug('No templates to render');
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-templates';
            emptyMessage.textContent = 'No templates found';
            this.templateList.appendChild(emptyMessage);
            return;
        }

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
            templateItem.addEventListener('click', this.templateItemClick.bind(this));

            // Double click to edit name
            templateItem.addEventListener('dblclick', this.templateItemDblClick.bind(this));

            this.templateList.appendChild(templateItem);
        });
    }

    setNewName(templateId: string, newName: string): void {
        if (!newName) return;
        this.template.updateTemplate(templateId, {name: newName} as Partial<Template>);
    }

    private templateItemClick(e: Event) {
        const element = (e.target as HTMLElement).closest('.template-item');
        if (!element) return;
        if (element.querySelector('.template-name-edit')) return; // Ignore if editing

        e.stopPropagation();

        // Get the template ID from the clicked item
        const id = element.getAttribute('data-id');
        if (id) {
            this.template.setActiveTemplateId(id);
            this.onShowCallback();
        }
    }

    private templateItemDblClick(e: Event) {
        const element = (e.target as HTMLElement).closest('.template-item');
        if (!element) return;
        const id = element.getAttribute('data-id');
        if (!id) return;
        if (id == DEFAULT_TEMPLATE.id) return;

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
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newName = input.value.trim();
                if (newName) {
                    this.setNewName(id, newName)
                }
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.rerender();
                e.preventDefault();
            }
        });

        // Save on blur (click outside)
        input.addEventListener('blur', () => {
            const newName = input.value.trim();
            if (newName) {
                this.setNewName(id, newName);
            } else {
                this.rerender();
            }
        });
    }
}