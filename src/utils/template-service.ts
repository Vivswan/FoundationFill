import { Template } from '../types';
import { StorageService } from './storage-service';
import { createLogger } from './logging';
import { isDefaultTemplate, createTemplate } from './template-utils';
import { sendMessageToBackground } from './chrome-api-utils';

const logger = createLogger('TEMPLATE_SERVICE');

export class TemplateService {
  private templates: Template[] = [];
  private currentDomain: string = '';
  private storageService: StorageService;
  
  constructor() {
    this.storageService = new StorageService();
  }
  
  async initialize(): Promise<void> {
    await this.loadTemplates();
  }
  
  async loadTemplates(): Promise<Template[]> {
    try {
      this.templates = await this.storageService.getTemplates();
      return this.templates;
    } catch (error) {
      logger.error('Error loading templates:', error);
      this.templates = [];
      return [];
    }
  }
  
  getTemplates(): Template[] {
    return this.templates;
  }
  
  getEnabledTemplates(): Template[] {
    return this.templates.filter(t => t.enabled);
  }
  
  setCurrentDomain(domain: string): void {
    this.currentDomain = domain;
  }
  
  getCurrentDomain(): string {
    return this.currentDomain;
  }
  
  getTemplatesForDomain(domain: string): Template[] {
    return this.templates.filter(template => {
      if (!template.domainSpecific) return true;
      return template.domain === domain;
    });
  }
  
  getEnabledTemplatesForDomain(domain: string): Template[] {
    return this.getTemplatesForDomain(domain).filter(t => t.enabled);
  }
  
  getTemplateById(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }
  
  addTemplate(name: string = 'New Template'): Template {
    const template = createTemplate(name, this.currentDomain);
    this.templates.push(template);
    this.saveTemplates();
    return template;
  }
  
  updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const template = this.templates[index];
    const isDefault = isDefaultTemplate(template.id);
    
    // Prevent domain-specific for default template
    if (isDefault && updates.domainSpecific) {
      updates.domainSpecific = false;
    }
    
    // Update domain if domain-specific changed
    if (updates.domainSpecific !== undefined) {
      updates.domain = updates.domainSpecific ? this.currentDomain : '';
    }
    
    this.templates[index] = { ...template, ...updates };
    this.saveTemplates();
    return this.templates[index];
  }
  
  deleteTemplate(id: string): boolean {
    // Don't delete default template
    if (isDefaultTemplate(id)) return false;
    
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id);
    
    if (this.templates.length < initialLength) {
      this.saveTemplates();
      return true;
    }
    
    return false;
  }
  
  isDefaultTemplate(id: string): boolean {
    const template = this.getTemplateById(id);
    return template ? isDefaultTemplate(template.id) || !!template.isDefault : false;
  }
  
  async saveTemplates(): Promise<void> {
    try {
      await this.storageService.saveTemplates(this.templates);
      await sendMessageToBackground({ action: 'templatesUpdated' });
    } catch (error) {
      logger.error('Error saving templates:', error);
    }
  }
}