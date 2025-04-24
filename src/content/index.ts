import { 
  Template,
  FillTemplateMessage,
  ShowTemplateSelectorMessage,
  PingMessage,
  MessageTypes
} from '../types';

// Notify the background script that the content script is loaded
chrome.runtime.sendMessage({ action: 'contentScriptReady' });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((
  request: MessageTypes, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  if (request.action === 'fillTemplate') {
    fillTextArea((request as FillTemplateMessage).template);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'showTemplateSelector') {
    showTemplateSelector((request as ShowTemplateSelectorMessage).templates);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'ping') {
    // Respond to ping requests to check if content script is ready
    sendResponse({ status: 'ready' });
    return true;
  } else if (request.action === 'getPageContent') {
    // Return the current page content
    const content = document.body.innerText;
    sendResponse({ content });
    return true;
  }
  return true; // Always return true to indicate async response
});

// Fill the active text area with template content
function fillTextArea(template: Template): void {
  const activeElement = document.activeElement as HTMLElement;
  
  if (isTextInput(activeElement)) {
    let content = '';
    
    // If both system and user prompts exist, format them
    if (template.systemPrompt && template.userPrompt) {
      content = `${template.systemPrompt}\n\n${template.userPrompt}`;
    } else if (template.systemPrompt) {
      content = template.systemPrompt;
    } else if (template.userPrompt) {
      content = template.userPrompt;
    }
    
    // Include page content if needed
    if (template.includePageContent) {
      const pageContent = document.body.innerText;
      content += `\n\nPage Content:\n${pageContent}`;
    }
    
    // Fill the text area
    if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
      const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
      inputElement.value = content;
      // Trigger input event to notify any listeners (like React forms)
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (activeElement.getAttribute('contenteditable') === 'true') {
      activeElement.textContent = content;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

// Check if element is a text input
function isTextInput(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  return (
    element.tagName === 'TEXTAREA' ||
    (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
    element.getAttribute('contenteditable') === 'true'
  );
}

// Show a custom template selector dropdown near the cursor
function showTemplateSelector(templates: Template[]): void {
  // Remove any existing selectors
  const existingSelector = document.getElementById('foundation-fill-selector');
  if (existingSelector) {
    existingSelector.remove();
  }
  
  const activeElement = document.activeElement as HTMLElement;
  if (!isTextInput(activeElement)) return;
  
  // Create dropdown element
  const dropdown = document.createElement('div');
  dropdown.id = 'foundation-fill-selector';
  dropdown.style.position = 'absolute';
  dropdown.style.zIndex = '9999';
  dropdown.style.background = '#fff';
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.borderRadius = '4px';
  dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  dropdown.style.maxHeight = '300px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.width = '250px';
  
  // Get element position for dropdown placement
  const rect = activeElement.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  
  // Add title
  const title = document.createElement('div');
  title.textContent = 'Select a template';
  title.style.padding = '8px 12px';
  title.style.borderBottom = '1px solid #eee';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '14px';
  dropdown.appendChild(title);
  
  // Add templates
  templates.forEach(template => {
    const item = document.createElement('div');
    item.textContent = template.name;
    item.style.padding = '8px 12px';
    item.style.cursor = 'pointer';
    item.style.transition = 'background 0.2s';
    
    item.addEventListener('mouseover', () => {
      item.style.background = '#f0f0f0';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.background = 'transparent';
    });
    
    item.addEventListener('click', () => {
      fillTextArea(template);
      dropdown.remove();
    });
    
    dropdown.appendChild(item);
  });
  
  // Add close button
  const closeBtn = document.createElement('div');
  closeBtn.textContent = '✕';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '8px';
  closeBtn.style.right = '10px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '14px';
  closeBtn.addEventListener('click', () => {
    dropdown.remove();
  });
  title.appendChild(closeBtn);
  
  // Close when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!dropdown.contains(e.target as Node) && e.target !== dropdown) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  });
  
  // Add to document
  document.body.appendChild(dropdown);
}