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

/**
 * Response interface for API and operation results
 * Provides a standardized structure for success/failure responses
 *
 * @property success - Whether the operation was successful
 * @property text - Optional text result for successful operations
 * @property error - Optional error message for failed operations
 */
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

/**
 * Message to request variable resolution for a template
 * Used to store template variables request in local storage
 * Triggers the popup to open and process template variables
 *
 * @property action - Always 'resolveTemplateVariables'
 * @property timestamp - Timestamp when the request was created (for deduplication)
 * @property template - The template containing variables to be resolved
 */
export interface ResolveTemplateVariablesMessage extends Message {
    action: 'resolveTemplateVariables';
    timestamp: number;
    template: Template;
}