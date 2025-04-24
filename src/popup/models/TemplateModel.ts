import { Template } from '../../types';
import { getTemplates, saveTemplates } from '../../utils/storage';

export class TemplateModel {
  private templates: Template[] = [];
  private selectedTemplateId: string | null = null;
  private currentDomain: string = '';
  
  constructor() {}
  
  // Load templates from storage
  async loadTemplates(): Promise<void> {
    this.templates = await getTemplates();
    
    // Select the first template by default if available
    if (this.templates.length > 0 && !this.selectedTemplateId) {
      this.selectedTemplateId = this.templates[0].id;
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
    
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: 'New Template',
      systemPrompt: defaultTemplate ? defaultTemplate.systemPrompt : '',
      userPrompt: defaultTemplate ? defaultTemplate.userPrompt : '',
      enabled: true,
      includePageContent: false,
      domainSpecific: false,
      domain: ''
    };
    
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
    
    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updatedTemplate
    };
    
    // If we're updating domain-specific setting, also update the domain
    if (updatedTemplate.domainSpecific !== undefined) {
      this.templates[templateIndex].domain = updatedTemplate.domainSpecific ? this.currentDomain : '';
    }
    
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
    
    // Don't allow deleting the default template
    if (template && (template.isDefault || template.id === 'default')) {
      return false;
    }
    
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
    return !!(template && (template.isDefault || template.id === 'default'));
  }
  
  // Save templates to storage
  private async saveTemplates(): Promise<void> {
    await saveTemplates(this.templates);
    
    // Notify the background script that templates were updated
    chrome.runtime.sendMessage({ action: 'templatesUpdated' });
  }
}