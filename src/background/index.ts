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
chrome.tabs.onRemoved.addListener((tabId: number) => {
  // Use the removeTabReady function
  chrome.runtime.sendMessage({ action: 'tabRemoved', tabId });
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: { status?: string }) => {
  if (changeInfo.status === 'loading') {
    // Tab is navigating, content script will be unloaded
    chrome.runtime.sendMessage({ action: 'tabUpdated', tabId });
  }
});

// Function to load templates and update context menu
async function loadTemplatesIntoContextMenu(): Promise<void> {
  try {
    const templates = await getTemplates();
    let enabledTemplates = templates.filter(t => t.enabled);
    
    // Get current tab for domain filtering
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let currentDomain = '';
    
    if (tabs[0]?.url) {
      const url = new URL(tabs[0].url);
      currentDomain = url.hostname + (url.port ? ':' + url.port : '');
      
      // Filter out domain-specific templates that don't match the current domain
      enabledTemplates = enabledTemplates.filter(t => 
        !t.domainSpecific || !t.domain || t.domain === currentDomain
      );
    }
    
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
  } catch (error) {
    console.error("Error loading templates into context menu:", error);
  }
}

// Initialize context menu items
chrome.runtime.onInstalled.addListener((_details: chrome.runtime.InstalledDetails) => {
  // Load templates and create menu items
  loadTemplatesIntoContextMenu();
});

// Update context menu when tab changes
chrome.tabs.onActivated.addListener(() => {
  // When user switches tabs, refresh the context menu
  loadTemplatesIntoContextMenu();
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener((changes: { [key: string]: { oldValue?: any, newValue?: any } }, area: string) => {
  if (area === 'sync' && changes.templates) {
    // Templates have been updated, refresh the context menu
    loadTemplatesIntoContextMenu();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info: { menuItemId: string | number }, tab?: chrome.tabs.Tab) => {
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
        // First show loading state
        await sendMessageToTab(tab.id, {
          action: 'fillTemplate',
          template,
          status: 'loading'
        });
        
        // Generate text using the template
        const settings = await getSettings();
        
        // Skip generation if API key is missing
        if (!settings.apiKey) {
          console.error("API key is missing. Please add your API key in Settings.");
          // Still fill with the raw template as fallback
          await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template,
            status: 'error',
            error: 'API key is missing. Please add your API key in Settings.'
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
        
        // Set up request timeout
        const timeoutDuration = 30000; // 30 seconds
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutDuration);
        
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
          }),
          signal: abortController.signal
        }).finally(() => {
          clearTimeout(timeoutId);
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
          await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template: filledTemplate,
            status: 'success'
          });
        } else {
          // On error, fall back to filling with the raw template but show error
          const errorMsg = data.error?.message || `API error (${response.status}): ${response.statusText}`;
          console.error("API request failed:", errorMsg);
          await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template,
            status: 'error',
            error: errorMsg
          });
        }
      } catch (error) {
        // On any error, fall back to filling with the raw template but show error
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error generating text:", errorMsg);
        
        // Check if it's an AbortError (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template,
            status: 'error',
            error: 'Request timed out after 30 seconds'
          });
        } else {
          await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template,
            status: 'error',
            error: errorMsg
          });
        }
      }
    }
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((
  request: MessageTypes, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
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