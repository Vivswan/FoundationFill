import {MessageTypes} from '../types';
import {createLogger} from '../utils/logging';
import {generatingAnimation} from "../utils/generatingAnimation";

// Create a logger instance for this component
const logger = createLogger('CONTENT');

// Notify the background script that the content script is loaded
logger.debug('Content script loaded, notifying background script');
chrome.runtime.sendMessage({action: 'contentScriptReady'});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((
    request: MessageTypes,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
) => {
    logger.debug(`Received message with action: ${request.action}`);

    try {
        if (request.action === 'fillTemplate') {
            generatingAnimation(document.activeElement as HTMLElement);
            sendResponse({success: true});
            return true;
        } else if (request.action === 'ping') {
            // Respond to ping requests to check if content script is ready
            logger.debug('Responding to ping request');
            sendResponse({status: 'ready'});
            return true;
        } else if (request.action === 'getPageContent') {
            // Return the current page content
            const content = document.body.innerText;
            logger.debug(`Returning page content (${content.length} characters)`);
            sendResponse({content});
            return true;
        }
    } catch (error) {
        logger.error('Error handling message:', error);
        sendResponse({success: false, error: 'Error processing request'});
    }

    return true; // Always return true to indicate async response
});
