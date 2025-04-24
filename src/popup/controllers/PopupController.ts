import { Template, GenerateTextResponse, Settings } from '../../types';
import { TemplateModel } from '../models/TemplateModel';
import { SettingsModel } from '../models/SettingsModel';
import { TemplateListView } from '../views/TemplateListView';
import { TemplateEditorView } from '../views/TemplateEditorView';
import { SettingsView } from '../views/SettingsView';
import { createLogger } from '../../utils/logging';
import { getCurrentDomain, executeScriptInTab, sendMessageToBackground, getCurrentTab } from '../../utils/chrome-api-utils';
import { generateChatCompletion } from '../../utils/api-service';

// Create a logger instance for this component
const logger = createLogger('POPUP_CONTROLLER');

export class PopupController {
  private templateModel: TemplateModel;
  private settingsModel: SettingsModel;
  private templateListView: TemplateListView;
  private templateEditorView: TemplateEditorView;
  private settingsView: SettingsView;
  
  constructor(
    templateModel: TemplateModel,
    settingsModel: SettingsModel,
    templateListView: TemplateListView,
    templateEditorView: TemplateEditorView,
    settingsView: SettingsView
  ) {
    this.templateModel = templateModel;
    this.settingsModel = settingsModel;
    this.templateListView = templateListView;
    this.templateEditorView = templateEditorView;
    this.settingsView = settingsView;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Initialize the controller
  async initialize(): Promise<void> {
    logger.debug('Initializing');
    
    try {
      // Get the current domain from the active tab
      await this.getCurrentDomain();
      
      // Load templates and settings
      logger.debug('Loading templates and settings');
      await this.templateModel.loadTemplates();
      await this.settingsModel.loadSettings();
      
      // Update views
      logger.debug('Updating views');
      this.updateTemplateListView();
      this.updateSelectedTemplateView();
      this.updateSettingsView();
      
      logger.debug('Initialization complete');
    } catch (error) {
      logger.error('Error during initialization:', error);
    }
  }
  
  // Get the current domain from the active tab
  private async getCurrentDomain(): Promise<void> {
    try {
      const domain = await getCurrentDomain();
      if (domain) {
        this.templateModel.setCurrentDomain(domain);
        this.templateEditorView.setCurrentDomain(domain);
      }
    } catch (error) {
      logger.error('Error getting current domain:', error);
    }
  }
  
  // Set up event listeners
  private setupEventListeners(): void {
    // Template list events
    this.templateListView.onSelect((templateId) => {
      this.handleSelectTemplate(templateId);
    });
    
    this.templateListView.onNewTemplate(() => {
      this.handleNewTemplate();
    });
    
    this.templateListView.onEditName((templateId, newName) => {
      this.handleEditTemplateName(templateId, newName);
    });
    
    // Template editor events
    this.templateEditorView.onDelete(() => {
      this.handleDeleteTemplate();
    });
    
    this.templateEditorView.onGenerate(() => {
      this.handleGenerateText();
    });
    
    this.templateEditorView.onInputChange((templateData) => {
      this.handleTemplateInputChange(templateData);
    });
    
    // Settings events
    this.settingsView.onShow(() => {
      this.handleShowSettings();
    });
    
    this.settingsView.onDone(() => {
      this.handleHideSettings();
    });
    
    this.settingsView.onInputChange((key, value) => {
      this.handleSettingsInputChange(key, value);
    });
  }
  
  // Update the template list view
  private updateTemplateListView(): void {
    const templates = this.templateModel.getTemplates();
    logger.debug('Templates to render:', templates);
    const selectedTemplateId = this.templateModel.getSelectedTemplateId();
    logger.debug('Selected template ID:', selectedTemplateId);
    this.templateListView.render(templates, selectedTemplateId);
  }
  
  // Update the selected template view
  private updateSelectedTemplateView(): void {
    const selectedTemplate = this.templateModel.getSelectedTemplate();
    
    if (selectedTemplate) {
      const isDefault = this.templateModel.isDefaultTemplate(selectedTemplate.id);
      this.templateEditorView.update(selectedTemplate, isDefault);
      
      if (selectedTemplate.domainSpecific && selectedTemplate.domain) {
        this.templateEditorView.setCurrentDomain(selectedTemplate.domain);
      } else {
        const currentDomain = this.templateModel.getCurrentDomain();
        this.templateEditorView.setCurrentDomain(currentDomain);
      }
      
      this.templateEditorView.show();
      this.settingsView.hide();
    } else {
      this.templateEditorView.hide();
    }
  }
  
  // Update the settings view
  private updateSettingsView(): void {
    const settings = this.settingsModel.getSettings();
    this.settingsView.update(settings);
  }
  
  // Handle selecting a template
  private handleSelectTemplate(templateId: string): void {
    this.templateModel.selectTemplate(templateId);
    this.updateSelectedTemplateView();
    this.updateTemplateListView();
  }
  
  // Handle creating a new template
  private handleNewTemplate(): void {
    this.templateModel.createNewTemplate();
    this.updateTemplateListView();
    this.updateSelectedTemplateView();
  }
  
  // Handle editing a template name
  private handleEditTemplateName(templateId: string, newName: string): void {
    this.templateModel.updateTemplateName(templateId, newName);
    this.updateTemplateListView();
  }
  
  // Handle deleting a template
  private handleDeleteTemplate(): void {
    if (confirm('Are you sure you want to delete this template?')) {
      const success = this.templateModel.deleteSelectedTemplate();
      
      if (!success) {
        alert('The default template cannot be deleted.');
        return;
      }
      
      this.updateTemplateListView();
      this.updateSelectedTemplateView();
    }
  }
  
  // Handle generating text
  private async handleGenerateText(): Promise<void> {
    const selectedTemplate = this.templateModel.getSelectedTemplate();
    
    if (!selectedTemplate) return;
    
    // Get template data from the editor (in case it was changed but not yet saved)
    const templateData = this.templateEditorView.getTemplateData();
    
    // Validate required fields
    if (!templateData.systemPrompt && !templateData.userPrompt) {
      this.templateEditorView.setGeneratedText('Error: Please enter a system prompt or user prompt.');
      return;
    }
    
    // Get settings to validate API key
    const settings = this.settingsModel.getSettings();
    if (!settings.apiKey) {
      this.templateEditorView.setGeneratedText('Error: API key is missing. Please add your API key in Settings.');
      return;
    }
    
    // Show loading state
    this.templateEditorView.setGenerateLoading(true);
    
    try {
      // Get current page content if needed
      let pageContent = '';
      if (templateData.includePageContent) {
        const tab = await getCurrentTab();
        if (tab?.id) {
          pageContent = await executeScriptInTab(tab.id, () => document.body.innerText) || '';
        }
      }
      
      // Call the API using the api-service utility
      const response = await sendMessageToBackground<GenerateTextResponse>({
        action: 'generateText',
        systemPrompt: templateData.systemPrompt,
        userPrompt: templateData.userPrompt,
        pageContent: pageContent
      });
      
      // Update UI based on response
      if (response && response.success) {
        this.templateEditorView.setGeneratedText(response.text || '');
      } else {
        this.templateEditorView.setGeneratedText('Error: ' + (response?.error || 'Could not generate text. Check your API key and connection.'));
      }
    } catch (error) {
      logger.error('Error generating text:', error);
      this.templateEditorView.setGeneratedText('Error: ' + (error instanceof Error ? error.message : 'An unknown error occurred'));
    } finally {
      // Reset loading state
      this.templateEditorView.setGenerateLoading(false);
    }
  }
  
  // Handle template input changes
  private handleTemplateInputChange(templateData: Partial<Template>): void {
    const updatedTemplate = this.templateModel.updateSelectedTemplate(templateData);
    
    // If domain-specific was just checked, update the domain display immediately
    if (updatedTemplate && templateData.domainSpecific !== undefined) {
      const currentDomain = this.templateModel.getCurrentDomain();
      if (templateData.domainSpecific) {
        this.templateEditorView.setCurrentDomain(currentDomain);
      }
    }
  }
  
  // Handle showing settings
  private handleShowSettings(): void {
    this.templateEditorView.hide();
    this.settingsView.show();
  }
  
  // Handle hiding settings
  private handleHideSettings(): void {
    this.settingsView.hide();
    this.templateEditorView.show();
  }
  
  // Handle settings input changes
  private async handleSettingsInputChange(key: keyof Settings, value: string): Promise<void> {
    await this.settingsModel.updateSetting(key, value);
    this.settingsView.showStatus('Settings saved!');
  }
}