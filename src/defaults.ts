/**
 * Default Values and Constants
 * Central location for application defaults and constant values
 * Includes defaults for templates, settings, and other configuration
 */
import {Settings} from "./popup/views/Settings";
import {Template} from "./popup/models/Template";
import {getBrowserLanguage} from "./localization/translations";

/**
 * Default template that's always present in the system
 * Serves as a base template and cannot be deleted
 */
export const DEFAULT_TEMPLATE: Template = {
    id: 'default',
    enabled: true,
    name: 'Base',
    systemPrompt: 'You are a helpful assistant.',
    userPrompt: 'Hi',
    associatedDomains: [],
    includePageContent: false,
};

/**
 * Get browser language to use as default application language
 * This is executed at module load time to determine the default language setting
 */
const defaultLanguage = typeof navigator !== 'undefined' ? getBrowserLanguage() : 'en';

/**
 * Default settings for the extension
 * Uses browser language detection for the language setting
 */
export const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    theme: 'system',
    themeColor: 'blue',
    language: defaultLanguage
};

// API request constants
export const API_TIMEOUT = 30000; // 30 seconds
export const ANIMATION_TIMEOUT = 30000; // 30 seconds

// UI Constants
export const UI_CONSTANTS = {
    TEMPLATE_EDITOR_ID: 'template-editor',
    SETTINGS_PANEL_ID: 'settings-panel'
};

