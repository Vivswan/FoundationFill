// Track which tabs have content scripts ready
const contentScriptReadyTabs = new Set();

// Clean up when tabs are closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => {
  contentScriptReadyTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // Tab is navigating, content script will be unloaded
    contentScriptReadyTabs.delete(tabId);
  }
});

// Initialize context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Create the default settings if they don't exist
  chrome.storage.sync.get(['apiKey', 'baseUrl', 'model', 'templates'], (result) => {
    if (!result.apiKey) {
      chrome.storage.sync.set({ apiKey: '' });
    }
    if (!result.baseUrl) {
      chrome.storage.sync.set({ baseUrl: 'https://api.openai.com/v1' });
    }
    if (!result.model) {
      chrome.storage.sync.set({ model: 'gpt-4' });
    }
    if (!result.templates) {
      const defaultTemplate = {
        id: 'default',
        name: 'Default Template',
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: '',
        enabled: true,
        includePageContent: false,
        domainSpecific: false,
        domain: '',
        isDefault: true
      };
      chrome.storage.sync.set({ templates: [defaultTemplate] });
    }
  });

  // Create parent context menu item
  chrome.contextMenus.create({
    id: 'foundationFill',
    title: 'Foundation Fill',
    contexts: ['editable']
  });
  
  // Create "Refresh Templates" menu item
  chrome.contextMenus.create({
    id: 'refreshTemplates',
    title: 'Refresh Templates',
    parentId: 'foundationFill',
    contexts: ['editable']
  });
  
  // Load templates and create menu items
  loadTemplatesIntoContextMenu();
});

// Function to load templates and update context menu
function loadTemplatesIntoContextMenu() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || [];
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
  });
}

// Function to safely send a message to a tab
function sendMessageToTab(tabId, message) {
  // Check if content script is already known to be ready
  if (contentScriptReadyTabs.has(tabId)) {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        console.log("Error sending message to tab that was marked ready: " + chrome.runtime.lastError.message);
        // Tab might have been reloaded, remove from ready list
        contentScriptReadyTabs.delete(tabId);
        // Try again with injection
        injectAndSend(tabId, message);
      }
    });
  } else {
    // First, try to ping the tab to see if content script is already there
    chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
      if (chrome.runtime.lastError || !response) {
        // Content script not ready, need to inject
        injectAndSend(tabId, message);
      } else {
        // Content script is ready, mark tab and send message
        contentScriptReadyTabs.add(tabId);
        chrome.tabs.sendMessage(tabId, message);
      }
    });
  }
}

// Helper function to inject content script and then send message
function injectAndSend(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['js/content.js']
  }).then(() => {
    // Wait a moment for content script to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, message, response => {
        if (!chrome.runtime.lastError && response && response.success) {
          contentScriptReadyTabs.add(tabId);
        }
      });
    }, 200);
  }).catch(err => {
    console.error("Error injecting content script:", err);
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
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
  if (info.menuItemId.startsWith('template-')) {
    const templateId = info.menuItemId.replace('template-', '');
    
    chrome.storage.sync.get(['templates'], (result) => {
      const templates = result.templates || [];
      const template = templates.find(t => t.id === templateId && t.enabled);
      
      if (template) {
        sendMessageToTab(tab.id, {
          action: 'fillTemplate',
          template: template
        });
      }
    });
  }
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.templates) {
    // Templates have been updated, refresh the context menu
    loadTemplatesIntoContextMenu();
  }
});

// Listen for messages from content scripts to know when they're ready
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'contentScriptReady' && sender.tab && sender.tab.id) {
    // Mark this tab as having a ready content script
    contentScriptReadyTabs.add(sender.tab.id);
    console.log(`Content script ready in tab ${sender.tab.id}`);
    return true;
  }
  
  if (request.action === 'templatesUpdated') {
    // Templates have been updated, refresh the context menu
    loadTemplatesIntoContextMenu();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'generateText') {
    // Call the OpenAI API or other LLM API
    chrome.storage.sync.get(['apiKey', 'baseUrl', 'model'], async (result) => {
      try {
        // Validate API key
        if (!result.apiKey) {
          sendResponse({ 
            success: false, 
            error: 'API key is missing. Please add your API key in Settings.' 
          });
          return;
        }
        
        const response = await fetch(`${result.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.apiKey}`
          },
          body: JSON.stringify({
            model: result.model,
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
        
        sendResponse({ success: true, text: data.choices[0].message.content });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Keep the message channel open for the async response
    });
    
    return true; // Indicate we'll send a response asynchronously
  }
});