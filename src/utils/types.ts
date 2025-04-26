/**
 * Type Definitions
 * Contains interfaces and types used throughout the extension
 * Provides type safety for messages and other data structures
 */
import {Template} from "../popup/models/Template";

/**
 * Panel types for the UI navigation
 * Used to switch between different panels in the popup
 */
export type Panel = 'setting' | 'template';

export interface Response {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Base message interface for all extension messaging
 * Provides common structure for all message types
 */
export interface Message {
  action: string;
  [key: string]: unknown;
}

/**
 * Message sent to fill a template in a text field
 * Sent from background script to content script
 */
export interface FillTemplateMessage extends Message {
  action: 'fillTemplate';
  template: Template;
}

/**
 * Message to request text generation from the API
 * Sent from content script to background script
 */
export interface GenerateTextMessage extends Message {
  action: 'generateText';
  systemPrompt: string;
  userPrompt: string;
  pageContent?: string;
}


export interface ResolveTemplateVariablesMessage extends Message {
    action: 'resolveTemplateVariables';
    timestamp: number;
    template: Template;
}
