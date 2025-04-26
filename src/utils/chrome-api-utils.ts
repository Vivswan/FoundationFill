/**
 * Chrome API Utilities
 * Helper functions for working with Chrome extension APIs in a type-safe manner
 * Provides error handling and logging for Chrome API operations
 */
import {createLogger} from './logging';

// Create a logger instance for this component
const logger = createLogger('CHROME_API');

/**
 * Gets the current active tab in the current window
 * @returns The active tab or null if an error occurs
 */
export const getCurrentTab = async (): Promise<chrome.tabs.Tab | null> => {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        return tabs[0] || null;
    } catch (error) {
        logger.error('Error getting current tab:', error);
        return null;
    }
};

/**
 * Send a message to a specific tab
 * Communicates with content scripts running in the specified tab
 *
 * @param tabId - The ID of the tab to send the message to
 * @param message - The message to send to the tab
 * @returns Promise that resolves to the response from the tab or null if an error occurs
 * @example
 * const response = await sendMessageToTab(123, { action: 'fillTemplate', data: {...} });
 */
export const sendMessageToTab = async <T>(tabId: number, message: unknown): Promise<T | null> => {
    try {
        return await chrome.tabs.sendMessage(tabId, message) as T;
    } catch (error) {
        logger.error(`Error sending message to tab ${tabId}:`, error);
        return null;
    }
};

/**
 * Send a message to the background script
 * Used by content scripts and popup pages to communicate with the service worker
 *
 * @param message - The message to send to the background script
 * @returns Promise that resolves to the response from the background script or null if an error occurs
 * @example
 * const response = await sendMessageToBackground({ action: 'generateText', data: {...} });
 */
export const sendMessageToBackground = async <T>(message: unknown): Promise<T | null> => {
    try {
        return await chrome.runtime.sendMessage(message) as T;
    } catch (error) {
        logger.error('Error sending message to background script:', error);
        return null;
    }
};

/**
 * Execute a script in a tab
 * Injects and executes a function in the context of a web page
 *
 * @param tabId - The ID of the tab in which to execute the script
 * @param func - The function to execute in the tab's context
 * @returns Promise that resolves to the function's return value or null if an error occurs
 * @example
 * const pageTitle = await executeScriptInTab(123, () => document.title);
 */
export const executeScriptInTab = async <T>(tabId: number, func: () => T): Promise<T | null> => {
    try {
        const results = await chrome.scripting.executeScript({
            target: {tabId},
            func
        });

        if (results && results.length > 0) {
            return results[0].result as T;
        }
        return null;
    } catch (error) {
        logger.error(`Error executing script in tab ${tabId}:`, error);
        return null;
    }
};

/**
 * Get page content from the current active tab
 * Retrieves the text content of the body element from the active tab
 *
 * @returns Promise that resolves to the page content as a string or empty string if unavailable
 * @example
 * const pageText = await getCurrentPageContent();
 * // Use pageText for context in template generation
 */
export const getCurrentPageContent = async (): Promise<string> => {
    try {
        const tab = await getCurrentTab();
        if (!tab || !tab.id) {
            logger.error('No active tab found');
            return '';
        }
        const content = await executeScriptInTab(tab.id, () => document.body.innerText);
        return content || '';
    } catch (error) {
        logger.error('Error getting page content:', error);
        return '';
    }
};