import { 
  Template,
  FillTemplateMessage,
  ShowTemplateSelectorMessage,
  MessageTypes
} from '../types';
import { createLogger } from '../utils/logging';
import { createElement, getElementById } from '../utils/dom-utils';

// Create a logger instance for this component
const logger = createLogger('CONTENT');

// Notify the background script that the content script is loaded
logger.debug('Content script loaded, notifying background script');
chrome.runtime.sendMessage({ action: 'contentScriptReady' });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((
  request: MessageTypes, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  logger.debug(`Received message with action: ${request.action}`);
  
  try {
    if (request.action === 'fillTemplate') {
      const fillRequest = request as FillTemplateMessage;
      fillTextArea(fillRequest.template, fillRequest.status, fillRequest.error);
      sendResponse({ success: true });
      return true;
    } else if (request.action === 'showTemplateSelector') {
      showTemplateSelector((request as ShowTemplateSelectorMessage).templates);
      sendResponse({ success: true });
      return true;
    } else if (request.action === 'ping') {
      // Respond to ping requests to check if content script is ready
      logger.debug('Responding to ping request');
      sendResponse({ status: 'ready' });
      return true;
    } else if (request.action === 'getPageContent') {
      // Return the current page content
      const content = document.body.innerText;
      logger.debug(`Returning page content (${content.length} characters)`);
      sendResponse({ content });
      return true;
    }
  } catch (error) {
    logger.error('Error handling message:', error);
    sendResponse({ success: false, error: 'Error processing request' });
  }
  
  return true; // Always return true to indicate async response
});

// Fill the active text area with template content
function fillTextArea(template: Template, status?: 'loading' | 'success' | 'error', error?: string): void {
  const activeElement = document.activeElement as HTMLElement;
  
  if (isTextInput(activeElement)) {
    let content = '';
    
    // Handle different statuses
    if (status === 'loading') {
      content = 'Generating';
      
      // Start a loading animation if it's in loading state
      startLoadingAnimation(activeElement);
      return;
    } else if (status === 'error' && error) {
      content = `Error: ${error}`;
    } else {
      // Regular content processing
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
    }
    
    // Clear any existing loading animation
    stopLoadingAnimation();
    
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

// Track the loading animation interval
let loadingAnimationInterval: number | null = null;
let loadingDots = '';

// Start loading animation in the text field
function startLoadingAnimation(element: HTMLElement): void {
  // Clear any existing animation
  stopLoadingAnimation();
  
  // Initialize loading text
  loadingDots = '';
  updateLoadingText(element);
  
  // Set up animation interval
  loadingAnimationInterval = window.setInterval(() => {
    // Add dots, cycle through 1-3 dots
    loadingDots += '.';
    if (loadingDots.length > 3) {
      loadingDots = '.';
    }
    updateLoadingText(element);
  }, 500);
}

// Update the loading text in the element
function updateLoadingText(element: HTMLElement): void {
  const loadingText = `Generating${loadingDots}`;
  
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    inputElement.value = loadingText;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.getAttribute('contenteditable') === 'true') {
    element.textContent = loadingText;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Stop loading animation
function stopLoadingAnimation(): void {
  if (loadingAnimationInterval !== null) {
    clearInterval(loadingAnimationInterval);
    loadingAnimationInterval = null;
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
  logger.debug(`Showing template selector with ${templates.length} templates`);
  
  // Remove any existing selectors
  const existingSelector = getElementById('foundation-fill-selector');
  if (existingSelector) {
    existingSelector.remove();
  }
  
  const activeElement = document.activeElement as HTMLElement;
  if (!isTextInput(activeElement)) {
    logger.debug('No active text input found, aborting template selector display');
    return;
  }
  
  // Create dropdown using DOM utils
  const dropdown = createElement<HTMLDivElement>('div', {
    id: 'foundation-fill-selector',
    style: 'position: absolute; z-index: 9999; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-height: 300px; overflow-y: auto; width: 250px;'
  });
  
  // Get element position for dropdown placement
  const rect = activeElement.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  
  // Add title
  const title = createElement<HTMLDivElement>('div', {
    textContent: 'Select a template',
    style: 'padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 14px;'
  });
  
  // Add templates
  templates.forEach(template => {
    const item = createElement<HTMLDivElement>('div', 
      {
        textContent: template.name,
        style: 'padding: 8px 12px; cursor: pointer; transition: background 0.2s;'
      },
      {
        mouseover: () => { item.style.background = '#f0f0f0'; },
        mouseout: () => { item.style.background = 'transparent'; },
        click: () => {
          fillTextArea(template);
          dropdown.remove();
        }
      }
    );
    
    dropdown.appendChild(item);
  });
  
  // Add close button
  const closeBtn = createElement<HTMLDivElement>('div', 
    {
      textContent: '✕',
      style: 'position: absolute; top: 8px; right: 10px; cursor: pointer; font-size: 14px;'
    },
    {
      click: () => dropdown.remove()
    }
  );
  
  // Assemble the dropdown
  title.appendChild(closeBtn);
  dropdown.appendChild(title);
  
  // Close when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!dropdown.contains(e.target as Node) && e.target !== dropdown) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  });
  
  // Add to document
  document.body.appendChild(dropdown);
  
  logger.debug('Template selector displayed');
}