import { MessageTypes, SuccessResponse, PingResponse, GenerateTextResponse } from '../types';

// Type for message responses
type MessageResponse = SuccessResponse | PingResponse | GenerateTextResponse | void;

// Set of tab IDs with ready content scripts
const contentScriptReadyTabs = new Set<number>();

// Send a message to a tab
export const sendMessageToTab = async (
  tabId: number, 
  message: MessageTypes
): Promise<MessageResponse> => {
  return new Promise((resolve) => {
    try {
      // Check if content script is already known to be ready
      if (contentScriptReadyTabs.has(tabId)) {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error sending message to tab that was marked ready: " + chrome.runtime.lastError.message);
            // Tab might have been reloaded, remove from ready list
            contentScriptReadyTabs.delete(tabId);
            // Try again with injection
            injectAndSend(tabId, message).then(resolve);
          } else {
            resolve(response);
          }
        });
      } else {
        // First, try to ping the tab to see if content script is already there
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            // Content script not ready, need to inject
            injectAndSend(tabId, message).then(resolve);
          } else {
            // Content script is ready, mark tab and send message
            contentScriptReadyTabs.add(tabId);
            chrome.tabs.sendMessage(tabId, message, (response) => {
              resolve(response);
            });
          }
        });
      }
    } catch (error) {
      console.error('Error in sendMessageToTab:', error);
      resolve({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};

// Helper function to inject content script and then send message
const injectAndSend = async (
  tabId: number, 
  message: MessageTypes
): Promise<MessageResponse> => {
  return new Promise((resolve) => {
    try {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['/content.js']
      }).then(() => {
        // Wait a moment for content script to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (!chrome.runtime.lastError && response && 'success' in response) {
              contentScriptReadyTabs.add(tabId);
            }
            resolve(response);
          });
        }, 200);
      }).catch(err => {
        console.error("Error injecting content script:", err);
        resolve({ success: false, error: 'Failed to inject content script' });
      });
    } catch (error) {
      console.error('Error in injectAndSend:', error);
      resolve({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};

// Mark a tab as having a ready content script
export const markTabReady = (tabId: number): void => {
  contentScriptReadyTabs.add(tabId);
};

// Remove a tab from the ready list
export const removeTabReady = (tabId: number): void => {
  contentScriptReadyTabs.delete(tabId);
};

// Check if a tab is ready
export const isTabReady = (tabId: number): boolean => {
  return contentScriptReadyTabs.has(tabId);
};