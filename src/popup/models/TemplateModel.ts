import { Template } from '../../types';
import { getTemplates, saveTemplates } from '../../utils/chrome-storage';
import { createLogger } from '../../utils/logging';
import { isDefaultTemplate, updateTemplate, createTemplate } from '../../utils/template-utils';
import { sendMessageToBackground } from '../../utils/chrome-api-utils';

// Create a logger for this component
const logger = createLogger('TEMPLATE');

export class TemplateModel {
  private templates: Template[] = [];
  private selectedTemplateId: string | null = null;
  private currentDomain: string = '';
  
  constructor() {}
  
  // Load templates from storage
  async loadTemplates(): Promise<void> {
    logger.debug('Loading templates');
    try {
      this.templates = await getTemplates();
      logger.debug('Templates loaded:', this.templates);
      
      // Select the first template by default if available
      if (this.templates.length > 0 && !this.selectedTemplateId) {
        this.selectedTemplateId = this.templates[0].id;
        logger.debug('Selected template ID:', this.selectedTemplateId);
      }
    } catch (error) {
      logger.error('Error loading templates:', error);
      // Initialize with an empty array if there's an error
      this.templates = [];
    }
  }
  
  // Set the current domain
  setCurrentDomain(domain: string): void {
    this.currentDomain = domain;
  }
  
  // Get the current domain
  getCurrentDomain(): string {
    return this.currentDomain;
  }
  
  // Get all templates
  getTemplates(): Template[] {
    logger.debug('Getting templates, count:', this.templates.length);
    return this.templates;
  }
  
  // Get the selected template
  getSelectedTemplate(): Template | null {
    if (!this.selectedTemplateId) return null;
    return this.templates.find(t => t.id === this.selectedTemplateId) || null;
  }
  
  // Get the selected template ID
  getSelectedTemplateId(): string | null {
    return this.selectedTemplateId;
  }
  
  // Select a template by ID
  selectTemplate(templateId: string): Template | null {
    this.selectedTemplateId = templateId;
    return this.getSelectedTemplate();
  }
  
  // Create a new template
  createNewTemplate(): Template {
    // Find the default template to copy content from
    const defaultTemplate = this.templates.find(t => t.isDefault) || this.templates[0];
    
    // Use the template-utils to create a new template
    const newTemplate = createTemplate('New Template');
    
    // Copy content from default template if available
    if (defaultTemplate) {
      newTemplate.systemPrompt = defaultTemplate.systemPrompt;
      newTemplate.userPrompt = defaultTemplate.userPrompt;
    }
    
    this.templates.push(newTemplate);
    this.saveTemplates();
    this.selectedTemplateId = newTemplate.id;
    return newTemplate;
  }
  
  // Update the selected template
  updateSelectedTemplate(updatedTemplate: Partial<Template>): Template | null {
    if (!this.selectedTemplateId) return null;
    
    const templateIndex = this.templates.findIndex(t => t.id === this.selectedTemplateId);
    if (templateIndex === -1) return null;
    
    // Use template-utils to handle the update with validation
    const currentTemplate = this.templates[templateIndex];
    const updatedTemplateData = updateTemplate(
      currentTemplate, 
      updatedTemplate, 
      this.currentDomain
    );
    
    // Update the template in the array
    this.templates[templateIndex] = updatedTemplateData;
    
    this.saveTemplates();
    return this.templates[templateIndex];
  }
  
  // Update a template name
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
  
  // Delete the selected template
  deleteSelectedTemplate(): boolean {
    if (!this.selectedTemplateId) return false;
    
    // Find the template
    const template = this.templates.find(t => t.id === this.selectedTemplateId);
    if (!template) return false;
    
    // Don't allow deleting the default template
    if (this.isDefaultTemplate(template.id)) {
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
  
  // Check if a template is the default template
  isDefaultTemplate(templateId: string): boolean {
    const template = this.templates.find(t => t.id === templateId);
    return template ? isDefaultTemplate(template.id) || !!template.isDefault : false;
  }
  
  // Save templates to storage
  private async saveTemplates(): Promise<void> {
    try {
      await saveTemplates(this.templates);
      
      // Notify the background script that templates were updated
      await sendMessageToBackground({ action: 'templatesUpdated' });
    } catch (error) {
      logger.error('Error saving templates:', error);
    }
  }
}