document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const templateList = document.getElementById('template-list');
  const templateEditor = document.getElementById('template-editor');
  const settingsPanel = document.getElementById('settings-panel');
  const newTemplateBtn = document.getElementById('new-template-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const deleteTemplateBtn = document.getElementById('delete-template-btn');
  const generateBtn = document.getElementById('generate-btn');
  const backBtn = document.getElementById('back-btn');
  const settingsStatus = document.getElementById('settings-status');
  
  // Form elements
  const systemPromptInput = document.getElementById('system-prompt');
  const userPromptInput = document.getElementById('user-prompt');
  const templateEnabledCheckbox = document.getElementById('template-enabled');
  const includePageContentCheckbox = document.getElementById('include-page-content');
  const domainSpecificCheckbox = document.getElementById('domain-specific');
  const currentDomainSpan = document.getElementById('current-domain');
  const generatedTextArea = document.getElementById('generated-text');
  const apiKeyInput = document.getElementById('api-key');
  const baseUrlInput = document.getElementById('base-url');
  const modelInput = document.getElementById('model');
  
  // State variables
  let templates = [];
  let selectedTemplateId = null;
  let currentDomain = '';
  
  // Initialize
  init();
  
  async function init() {
    // Get current domain
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url);
    currentDomain = url.hostname + (url.port ? ':' + url.port : '');
    currentDomainSpan.textContent = currentDomain;
    
    // Load templates and settings
    loadTemplates();
    loadSettings();
  }
  
  function loadTemplates() {
    chrome.storage.sync.get(['templates'], (result) => {
      templates = result.templates || [];
      
      if (templates.length === 0) {
        // Create default template if none exist
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
        
        templates = [defaultTemplate];
        chrome.storage.sync.set({ templates });
      }
      
      renderTemplateList();
      
      if (templates.length > 0) {
        selectTemplate(templates[0].id);
      }
    });
  }
  
  function loadSettings() {
    chrome.storage.sync.get(['apiKey', 'baseUrl', 'model'], (result) => {
      apiKeyInput.value = result.apiKey || '';
      baseUrlInput.value = result.baseUrl || 'https://api.openai.com/v1';
      modelInput.value = result.model || 'gpt-4';
    });
  }
  
  function renderTemplateList() {
    templateList.innerHTML = '';
    
    templates.forEach(template => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      templateItem.dataset.templateId = template.id;
      
      if (template.id === selectedTemplateId) {
        templateItem.classList.add('active');
      }
      
      if (!template.enabled) {
        templateItem.classList.add('template-item-disabled');
      }
      
      // Mark default template with a special class/icon
      if (template.isDefault || template.id === 'default') {
        templateItem.classList.add('default-template');
        
        const nameContainer = document.createElement('span');
        nameContainer.className = 'template-name';
        nameContainer.textContent = template.name;
        
        const defaultBadge = document.createElement('span');
        defaultBadge.className = 'default-badge';
        defaultBadge.textContent = '(default)';
        defaultBadge.style.fontSize = '10px';
        defaultBadge.style.marginLeft = '4px';
        defaultBadge.style.opacity = '0.7';
        
        templateItem.appendChild(nameContainer);
        templateItem.appendChild(defaultBadge);
      } else {
        const nameContainer = document.createElement('span');
        nameContainer.className = 'template-name';
        nameContainer.textContent = template.name;
        templateItem.appendChild(nameContainer);
      }
      
      // Click to select template
      templateItem.addEventListener('click', (e) => {
        // Don't trigger select if we're clicking on the edit input
        if (e.target.classList.contains('template-name-edit')) {
          return;
        }
        selectTemplate(template.id);
      });
      
      // Double click to edit name (delegate the event to the templateItem itself)
      templateItem.addEventListener('dblclick', (e) => {
        // If this is a span or badge, get the parent element
        const element = e.target.closest('.template-item');
        if (!element) return;
        
        e.stopPropagation();
        
        // Find the name container
        const nameContainer = element.querySelector('.template-name');
        if (!nameContainer) return;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = template.name;
        input.className = 'template-name-edit';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '4px 8px';
        input.style.border = '1px solid var(--border-color)';
        input.style.borderRadius = '2px';
        input.style.backgroundColor = 'var(--bg-color)';
        input.style.color = 'var(--text-color)';
        
        // Replace just the name container with the input
        nameContainer.replaceWith(input);
        
        // For default template, make the input smaller to accommodate the badge
        if (template.isDefault || template.id === 'default') {
          input.style.width = 'calc(100% - 60px)'; // Make room for the badge
        }
        
        // Focus the input and select all text
        setTimeout(() => {
          input.focus();
          input.select();
        }, 10);
        
        // Save on Enter key
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const newName = input.value.trim();
            if (newName) {
              updateTemplateName(template.id, newName);
            }
            e.preventDefault();
          } else if (e.key === 'Escape') {
            renderTemplateList(); // Cancel editing
            e.preventDefault();
          }
        });
        
        // Save on blur (click outside)
        input.addEventListener('blur', () => {
          const newName = input.value.trim();
          if (newName) {
            updateTemplateName(template.id, newName);
          } else {
            renderTemplateList(); // Restore original name if empty
          }
        });
      });
      
      templateList.appendChild(templateItem);
    });
  }
  
  function selectTemplate(templateId) {
    selectedTemplateId = templateId;
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      // Show template editor
      templateEditor.classList.remove('hidden');
      settingsPanel.classList.add('hidden');
      
      // Fill form with template data
      systemPromptInput.value = template.systemPrompt || '';
      userPromptInput.value = template.userPrompt || '';
      templateEnabledCheckbox.checked = template.enabled;
      includePageContentCheckbox.checked = template.includePageContent;
      domainSpecificCheckbox.checked = template.domainSpecific;
      generatedTextArea.value = '';
      
      // Hide/show delete button based on default template status
      if (template.isDefault || template.id === 'default') {
        deleteTemplateBtn.style.visibility = 'hidden';
        deleteTemplateBtn.disabled = true;
        deleteTemplateBtn.title = 'Default template cannot be deleted';
      } else {
        deleteTemplateBtn.style.visibility = 'visible';
        deleteTemplateBtn.disabled = false;
        deleteTemplateBtn.title = 'Delete this template';
      }
      
      // Update UI
      renderTemplateList();
    }
  }
  
  function createNewTemplate() {
    // Find the default template to copy content from
    const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
    
    const newTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      systemPrompt: defaultTemplate ? defaultTemplate.systemPrompt : '',
      userPrompt: defaultTemplate ? defaultTemplate.userPrompt : '',
      enabled: true,
      includePageContent: false,
      domainSpecific: false,
      domain: ''
    };
    
    templates.push(newTemplate);
    saveTemplates();
    selectTemplate(newTemplate.id);
  }
  
  function updateTemplate() {
    if (!selectedTemplateId) return;
    
    const templateIndex = templates.findIndex(t => t.id === selectedTemplateId);
    if (templateIndex === -1) return;
    
    templates[templateIndex] = {
      ...templates[templateIndex],
      systemPrompt: systemPromptInput.value,
      userPrompt: userPromptInput.value,
      enabled: templateEnabledCheckbox.checked,
      includePageContent: includePageContentCheckbox.checked,
      domainSpecific: domainSpecificCheckbox.checked,
      domain: domainSpecificCheckbox.checked ? currentDomain : ''
    };
    
    saveTemplates();
  }
  
  function updateTemplateName(templateId, newName) {
    const templateIndex = templates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) return;
    
    // Only update if the name actually changed
    if (templates[templateIndex].name !== newName) {
      templates[templateIndex].name = newName;
      saveTemplates();
    }
    
    // Re-render and maintain the active selection
    renderTemplateList();
    
    // If this was the selected template, ensure it stays selected visually
    if (selectedTemplateId === templateId) {
      const templateItem = Array.from(templateList.children).find(
        item => item.dataset.templateId === templateId
      );
      if (templateItem) {
        templateItem.classList.add('active');
      }
    }
  }
  
  function deleteTemplate() {
    if (!selectedTemplateId) return;
    
    // Find the template
    const template = templates.find(t => t.id === selectedTemplateId);
    
    // Don't allow deleting the default template
    if (template && (template.isDefault || template.id === 'default')) {
      alert('The default template cannot be deleted.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this template?')) {
      templates = templates.filter(t => t.id !== selectedTemplateId);
      saveTemplates();
      
      if (templates.length > 0) {
        selectTemplate(templates[0].id);
      } else {
        templateEditor.classList.add('hidden');
      }
    }
  }
  
  function saveTemplates() {
    chrome.storage.sync.set({ templates }, () => {
      renderTemplateList();
      
      // Notify background script that templates were updated
      chrome.runtime.sendMessage({ action: 'templatesUpdated' });
    });
  }
  
  // Variable to track the status message timeout
  let statusTimeout = null;
  
  function saveSettings(showAlert = false) {
    chrome.storage.sync.set({
      apiKey: apiKeyInput.value,
      baseUrl: baseUrlInput.value,
      model: modelInput.value
    }, () => {
      if (showAlert) {
        alert('Settings saved!');
      } else {
        // Show status message
        settingsStatus.textContent = 'Settings saved!';
        
        // Clear any existing timeout
        if (statusTimeout) {
          clearTimeout(statusTimeout);
        }
        
        // Set a new timeout to clear the message after 2 seconds
        statusTimeout = setTimeout(() => {
          settingsStatus.textContent = '';
          statusTimeout = null;
        }, 2000);
      }
    });
  }
  
  function showSettingsPanel() {
    templateEditor.classList.add('hidden');
    settingsPanel.classList.remove('hidden');
  }
  
  function showTemplateEditor() {
    settingsPanel.classList.add('hidden');
    templateEditor.classList.remove('hidden');
  }
  
  async function generateText() {
    if (!selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    // Get current page content if needed
    let pageContent = '';
    if (template.includePageContent) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0].id;
      
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.body.innerText
      });
      
      pageContent = result;
    }
    
    // Show loading state
    generatedTextArea.value = 'Generating...';
    generateBtn.disabled = true;
    
    // Validate required fields
    if (!template.systemPrompt && !template.userPrompt) {
      generatedTextArea.value = 'Error: Please enter a system prompt or user prompt.';
      generateBtn.disabled = false;
      return;
    }
    
    // Get API key to validate it exists
    chrome.storage.sync.get(['apiKey'], (result) => {
      if (!result.apiKey) {
        generatedTextArea.value = 'Error: API key is missing. Please add your API key in Settings.';
        generateBtn.disabled = false;
        return;
      }
      
      // Call API via background script
      chrome.runtime.sendMessage({
        action: 'generateText',
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
        pageContent: pageContent
      }, (response) => {
        generateBtn.disabled = false;
        
        if (response && response.success) {
          generatedTextArea.value = response.text;
        } else {
          generatedTextArea.value = 'Error: ' + (response?.error || 'Could not generate text. Check your API key and connection.');
        }
      });
    });
  }
  
  // Event Listeners
  newTemplateBtn.addEventListener('click', createNewTemplate);
  settingsBtn.addEventListener('click', showSettingsPanel);
  deleteTemplateBtn.addEventListener('click', deleteTemplate);
  generateBtn.addEventListener('click', generateText);
  backBtn.addEventListener('click', showTemplateEditor);
  
  // Auto-save template on input changes
  systemPromptInput.addEventListener('input', updateTemplate);
  userPromptInput.addEventListener('input', updateTemplate);
  templateEnabledCheckbox.addEventListener('change', updateTemplate);
  includePageContentCheckbox.addEventListener('change', updateTemplate);
  domainSpecificCheckbox.addEventListener('change', updateTemplate);
  
  // Auto-save settings on input changes
  apiKeyInput.addEventListener('input', () => saveSettings(false));
  baseUrlInput.addEventListener('input', () => saveSettings(false));
  modelInput.addEventListener('input', () => saveSettings(false));
});