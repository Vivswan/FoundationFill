// Utilities for working with Chrome extension APIs
import {createLogger} from './logging';
import {extractDomainFromUrl} from '../defaults';

const logger = createLogger('CHROME_API');

// Set of tab IDs with ready content scripts
const contentScriptReadyTabs = new Set<number>();

/**
 * Mark a tab as having a ready content script
 */
export function markTabReady(tabId: number): void {
    contentScriptReadyTabs.add(tabId);
    logger.debug(`Tab ${tabId} marked as ready`);
}

/**
 * Remove a tab from the ready list
 */
export function removeTabReady(tabId: number): void {
    contentScriptReadyTabs.delete(tabId);
    logger.debug(`Tab ${tabId} removed from ready list`);
}

/**
 * Check if a tab has a ready content script
 */
export function isTabReady(tabId: number): boolean {
    return contentScriptReadyTabs.has(tabId);
}

/**
 * Get the current active tab
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
 * Get the domain of the current active tab
 */
export const getCurrentDomain = async (): Promise<string> => {
    try {
        const tab = await getCurrentTab();
        if (tab?.url) {
            return extractDomainFromUrl(tab.url);
        }
        return '';
    } catch (error) {
        logger.error('Error getting current domain:', error);
        return '';
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
export const getPageContent = async (tabId: number): Promise<string> => {
    try {
        const content = await executeScriptInTab(tabId, () => document.body.innerText);
        return content || '';
    } catch (error) {
        logger.error(`Error getting page content from tab ${tabId}:`, error);
        return '';
    }
};