import { 
  Template, 
  MessageTypes, 
  GenerateTextMessage,
  ContentScriptReadyMessage,
  TemplatesUpdatedMessage
} from '../types';
import { getTemplates, getSettings } from '../utils/storage';
import { markTabReady, sendMessageToTab } from '../utils/messages';

// Clean up when tabs are closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => {
  // Use the removeTabReady function
  chrome.runtime.sendMessage({ action: 'tabRemoved', tabId });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // Tab is navigating, content script will be unloaded
    chrome.runtime.sendMessage({ action: 'tabUpdated', tabId });
  }
});

// Function to load templates and update context menu
async function loadTemplatesIntoContextMenu(): Promise<void> {
  const templates = await getTemplates();
  const enabledTemplates = templates.filter(t => t.enabled);
  
  // Remove existing template menu items (keep the parent and refresh items)
  chrome.contextMenus.removeAll(() => {
    // Recreate the parent menu
    chrome.contextMenus.create({
      id: 'foundationFill',
      title: 'Foundation Fill',
      contexts: ['editable']
    });
    
    // Add refresh menu item
    chrome.contextMenus.create({
      id: 'refreshTemplates',
      title: 'Refresh Templates',
      parentId: 'foundationFill',
      contexts: ['editable']
    });
    
    // Create separator
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      parentId: 'foundationFill',
      contexts: ['editable']
    });
    
    // Add each enabled template as a menu item
    enabledTemplates.forEach(template => {
      chrome.contextMenus.create({
        id: `template-${template.id}`,
        title: template.name,
        parentId: 'foundationFill',
        contexts: ['editable']
      });
    });
    
    // If no enabled templates, add a disabled item
    if (enabledTemplates.length === 0) {
      chrome.contextMenus.create({
        id: 'noTemplates',
        title: 'No enabled templates',
        parentId: 'foundationFill',
        enabled: false,
        contexts: ['editable']
      });
    }
  });
}

// Initialize context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Load templates and create menu items
  loadTemplatesIntoContextMenu();
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.templates) {
    // Templates have been updated, refresh the context menu
    loadTemplatesIntoContextMenu();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Check if the tab is valid for message sending
  if (!tab || !tab.id || tab.id === chrome.tabs.TAB_ID_NONE) {
    console.error("Invalid tab for sending message");
    return;
  }
  
  // Handle refresh templates action
  if (info.menuItemId === 'refreshTemplates') {
    loadTemplatesIntoContextMenu();
    return;
  }
  
  // Handle template selection
  if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('template-')) {
    const templateId = info.menuItemId.replace('template-', '');
    const templates = await getTemplates();
    const template = templates.find(t => t.id === templateId && t.enabled);
    
    if (template) {
      try {
        // First generate text using the template
        const settings = await getSettings();
        
        // Skip generation if API key is missing
        if (!settings.apiKey) {
          console.error("API key is missing. Please add your API key in Settings.");
          // Still fill with the raw template as fallback
          sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template
          });
          return;
        }
        
        // Get page content if needed
        let pageContent = '';
        if (template.includePageContent) {
          try {
            // Try to get the page content from the tab
            const contentResponse = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
            if (contentResponse && contentResponse.content) {
              pageContent = contentResponse.content;
            }
          } catch (error) {
            console.error("Failed to get page content:", error);
            // Continue without page content
          }
        }
        
        // Make API request
        const response = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: 'system', content: template.systemPrompt },
              { role: 'user', content: template.userPrompt + (pageContent ? '\n\nPage Content:\n' + pageContent : '') }
            ]
          })
        });
        
        const data = await response.json();
        
        // If successful, fill with generated text
        if (response.ok && data.choices && data.choices[0] && data.choices[0].message) {
          const generatedText = data.choices[0].message.content;
          
          // Create a modified template with the generated text as the system prompt
          const filledTemplate = {
            ...template,
            systemPrompt: generatedText,
            userPrompt: '' // Clear user prompt since we've already used it for generation
          };
          
          // Fill with the generated content
          sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template: filledTemplate
          });
        } else {
          // On error, fall back to filling with the raw template
          console.error("API request failed:", data.error?.message || `API error (${response.status}): ${response.statusText}`);
          sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template
          });
        }
      } catch (error) {
        // On any error, fall back to filling with the raw template
        console.error("Error generating text:", error);
        sendMessageToTab(tab.id, {
          action: 'fillTemplate',
          template
        });
      }
    }
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((
  request: MessageTypes, 
  sender, 
  sendResponse
) => {
  // Handle content script ready message
  if (request.action === 'contentScriptReady' && sender.tab && sender.tab.id) {
    // Mark this tab as having a ready content script
    markTabReady(sender.tab.id);
    console.log(`Content script ready in tab ${sender.tab.id}`);
    return true;
  }
  
  // Handle templates updated message
  if (request.action === 'templatesUpdated') {
    // Templates have been updated, refresh the context menu
    loadTemplatesIntoContextMenu();
    sendResponse({ success: true });
    return true;
  }
  
  // Handle generate text message
  if (request.action === 'generateText') {
    handleGenerateText(request as GenerateTextMessage, sendResponse);
    return true; // Keep the message channel open for the async response
  }
  
  return true;
});

// Handle generate text action
async function handleGenerateText(
  request: GenerateTextMessage, 
  sendResponse: (response?: any) => void
): Promise<void> {
  try {
    const settings = await getSettings();
    
    // Validate API key
    if (!settings.apiKey) {
      sendResponse({ 
        success: false, 
        error: 'API key is missing. Please add your API key in Settings.' 
      });
      return;
    }
    
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt + (request.pageContent ? '\n\nPage Content:\n' + request.pageContent : '') }
        ]
      })
    });
    
    const data = await response.json();
    
    // Check if the API returned an error
    if (!response.ok) {
      sendResponse({ 
        success: false, 
        error: data.error?.message || `API error (${response.status}): ${response.statusText}`
      });
      return;
    }
    
    // Check if we have choices and content
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      sendResponse({ 
        success: false, 
        error: 'API response is missing expected content' 
      });
      return;
    }
    
    sendResponse({ 
      success: true, 
      text: data.choices[0].message.content 
    });
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}