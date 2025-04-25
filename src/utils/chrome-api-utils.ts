/**
 * Chrome API Utilities
 * Helper functions for working with Chrome extension APIs in a type-safe manner
 * Provides error handling and logging for Chrome API operations
 */
import {createLogger} from './logging';

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
 * Get page content from a tab
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