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
 * Message to display the template selector UI
 * Typically sent to the content script
 */
export interface ShowTemplateSelectorMessage extends Message {
  action: 'showTemplateSelector';
  templates: Template[];
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
 * Message indicating that the content script has loaded
 * Sent from content script to background script
 */
export interface ContentScriptReadyMessage extends Message {
  action: 'contentScriptReady';
}

/**
 * Message indicating that templates have been updated
 * Sent to refresh context menus and UI components
 */
export interface TemplatesUpdatedMessage extends Message {
  action: 'templatesUpdated';
}

/**
 * Simple ping message to check if a component is responsive
 * Used for checking if scripts are loaded and responsive
 */
export interface PingMessage extends Message {
  action: 'ping';
}

/**
 * Message to request the current page content
 * Sent to content script to get the current page text
 */
export interface GetPageContentMessage extends Message {
  action: 'getPageContent';
}

/**
 * Response to a GetPageContentMessage
 * Contains the extracted text content from the page
 */
export interface GetPageContentResponse {
  content: string;
}

/**
 * Response to a GenerateTextMessage
 * Contains the generated text or error information
 */
export interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Response to a PingMessage
 * Indicates that the component is ready
 */
export interface PingResponse {
  status: 'ready';
}

/**
 * Generic success/failure response
 * Used for operations that only need to indicate completion status
 */
export interface SuccessResponse {
  success: boolean;
}

/**
 * Union type for all possible message types
 * Used for type checking and discriminated unions in message handlers
 */
export type MessageTypes =
    | FillTemplateMessage
    | ShowTemplateSelectorMessage
    | GenerateTextMessage
    | ContentScriptReadyMessage
    | TemplatesUpdatedMessage
    | PingMessage
    | GetPageContentMessage;