/**
 * Content Script - Runs in the context of web pages
 * Handles text field manipulation and template insertion
 */
import {createLogger} from "./utils/logging";
import {FillTemplateMessage, MessageTypes} from "./utils/types";
import {Template} from "./popup/models/Template";
import {generateTextWithAnimation} from "./generate/toElement";

// Create a logger instance for this component
const logger = createLogger('CONTENT');

// Notify the background script that the content script is loaded
logger.debug('Content script loaded, notifying background script');

/**
 * Message listener for communication with background script
 * Handles fill template requests
 */
chrome.runtime.onMessage.addListener((
    request: MessageTypes,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
) => {
  logger.debug(`Received message with action: ${request.action}`);

  try {
    if (request.action === 'fillTemplate') {
      const fillRequest = request as FillTemplateMessage;
      fillTextArea(fillRequest.template);
      sendResponse({success: true});
      return true;
    }
  } catch (error) {
    logger.error('Error handling message:', error);
    sendResponse({success: false, error: 'Error processing request'});
  }

  sendResponse({success: false, error: 'Unknown action'});
  return true;
});

/**
 * Fills the active text area with generated text from the template
 * @param template The template to process and use for text generation
 * @returns Promise that resolves when the text area is filled
 */
async function fillTextArea(template: Template): Promise<void> {
  const activeElement = document.activeElement as HTMLElement;
  await generateTextWithAnimation(activeElement, template, document.body.innerText);
}

