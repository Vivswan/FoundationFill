/**
 * Content Script - Runs in the context of web pages
 * Handles text field manipulation and template insertion
 */
import {createLogger} from "./utils/logging";
import {FillTemplateMessage, Message, Response} from "./utils/types";
import {Template} from "./popup/models/Template";
import {generateTextWithAnimation} from "./generate/toElement";
import {SettingsModel} from "./popup/models/Settings";

// Create a logger instance for this component
const logger = createLogger('CONTENT');

// Notify the background script that the content script is loaded
logger.debug('Content script loaded, notifying background script');

/**
 * Message listener for communication with background script
 * Handles template filling requests from the background script
 *
 * Supported actions:
 * - 'fillTemplate': Fills the active text field with content from the specified template
 *
 * @param request - The message request object
 * @param _sender - The sender of the message (unused)
 * @param sendResponse - Function to send a response back to the caller
 * @returns True to indicate asynchronous response handling
 */
chrome.runtime.onMessage.addListener((
    request: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
) => {
    logger.debug(`Received message with action: ${request.action}`);

    try {
        if (request.action === 'fillTemplate') {
            const fillRequest = request as FillTemplateMessage;
            fillTextArea(fillRequest.template);
            sendResponse({success: true} as Response);
            return true;
        }
    } catch (error) {
        logger.error('Error handling message:', error);
        sendResponse({success: false, error: 'Error processing request'} as Response);
    }

    sendResponse({success: false, error: 'Unknown action'} as Response);
    return true;
});

/**
 * Fills the active text area with generated text from the template
 * Sets the language attribute for localization before generating content
 * Extracts page content if the template has includePageContent enabled
 * 
 * @param template - The template to process and use for text generation
 * @returns Promise that resolves when the text area is filled
 */
async function fillTextArea(template: Template): Promise<void> {
    document.documentElement.setAttribute('data-foundation-fill-language', await new SettingsModel().getLanguage());
    const activeElement = document.activeElement as HTMLElement;
    const pageContent = template.includePageContent ? document.body.innerText : '';
    await generateTextWithAnimation(activeElement, template, pageContent);
}

