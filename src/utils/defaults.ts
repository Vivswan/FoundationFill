// Central location for default values and constants
import { Template, Settings } from '../types';

// Default template that's always present
export const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default Template',
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: '',
  enabled: true,
  includePageContent: false,
  domainSpecific: false,
  domain: '',
  isDefault: true
};

// Default settings for the extension
export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  theme: 'system'
};

// API request constants
export const API_TIMEOUT = 30000; // 30 seconds

// UI Constants
export const UI_CONSTANTS = {
  TEMPLATE_EDITOR_ID: 'template-editor',
  SETTINGS_PANEL_ID: 'settings-panel'
};

// Template utility functions
export const isDefaultTemplate = (templateId: string): boolean => {
  return templateId === 'default';
};

// Domain utility functions
export const extractDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
  } catch (error) {
    return '';
  }
};