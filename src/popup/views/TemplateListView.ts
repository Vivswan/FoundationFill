import { Template } from '../../types';

export class TemplateListView {
  private templateList: HTMLElement;
  private newTemplateBtn: HTMLElement;
  
  // Event callbacks
  private onSelectCallback: ((templateId: string) => void) | null = null;
  private onNewTemplateCallback: (() => void) | null = null;
  private onEditNameCallback: ((templateId: string, newName: string) => void) | null = null;
  
  constructor(templateListId: string, newTemplateBtnId: string) {
    this.templateList = document.getElementById(templateListId) as HTMLElement;
    this.newTemplateBtn = document.getElementById(newTemplateBtnId) as HTMLElement;
    
    // Add event listener for new template button
    this.newTemplateBtn.addEventListener('click', () => {
      if (this.onNewTemplateCallback) {
        this.onNewTemplateCallback();
      }
    });
  }
  
  // Render the template list
  render(templates: Template[], selectedTemplateId: string | null): void {
    this.templateList.innerHTML = '';
    
    templates.forEach(template => {
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
  onEditName(callback: (templateId: string, newName: string) => void): void {
    this.onEditNameCallback = callback;
  }
}