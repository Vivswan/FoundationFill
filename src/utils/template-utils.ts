// Utility functions for working with templates
import { Template } from '../types';
import { isDefaultTemplate, extractDomainFromUrl } from './defaults';

/**
 * Check if a template should be shown for a specific domain
 */
export const shouldShowTemplateForDomain = (template: Template, domain: string): boolean => {
  // Non-domain specific templates are shown everywhere
  if (!template.domainSpecific) {
    return true;
  }
  
  // Domain-specific templates are only shown on their specific domain
  return template.domain === domain;
};

/**
 * Filter templates for display based on domain
 */
export const filterTemplatesByDomain = (templates: Template[], domain: string): Template[] => {
  return templates.filter(template => {
    // Always include non-domain specific templates
    if (!template.domainSpecific) {
      return true;
    }
    
    // For domain-specific templates, only include if they match the current domain
    return template.domain === domain;
  });
};

/**
 * Get only enabled templates
 */
export const getEnabledTemplates = (templates: Template[]): Template[] => {
  return templates.filter(template => template.enabled);
};

/**
 * Create a new template with default values
 */
export const createTemplate = (name = 'New Template', domain = ''): Template => {
  return {
    id: Date.now().toString(),
    name,
    systemPrompt: '',
    userPrompt: '',
    enabled: true,
    includePageContent: false,
    domainSpecific: !!domain,
    domain: domain || '',
    isDefault: false
  };
};

/**
 * Validate template data
 */
export const validateTemplate = (template: Partial<Template>): boolean => {
  // Basic validation - for example, don't allow domain-specific for default template
  if (template.id && isDefaultTemplate(template.id) && template.domainSpecific) {
    return false;
  }
  
  return true;
};

/**
 * Update a template with new data, ensuring defaults can't be domain-specific
 */
export const updateTemplate = (template: Template, updates: Partial<Template>, currentDomain: string): Template => {
  const isDefault = isDefaultTemplate(template.id) || !!template.isDefault;
  
  // Don't allow domain-specific for default template
  if (isDefault && updates.domainSpecific) {
    updates.domainSpecific = false;
  }
  
  // Update the template with the new values
  const updated = {
    ...template,
    ...updates
  };
  
  // Update domain if domain-specific state changes
  if (updates.domainSpecific !== undefined) {
    updated.domain = updates.domainSpecific ? currentDomain : '';
  }
  
  return updated;
};