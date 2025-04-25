import {GenerateTextMessage, MessageTypes,} from './types';
import {StorageService} from './utils/storage-service';
import {SettingsModel} from './popup/models/Settings';
import {createLogger} from './utils/logging';
import {generateChatCompletion} from './utils/api-service';
import {API_TIMEOUT, extractDomainFromUrl} from './defaults';
import {getCurrentTab, markTabReady, sendMessageToTab} from './utils/chrome-api-utils';
import {filterTemplatesByDomain, getEnabledTemplates} from './popup/models/Template';

// Create a logger instance for this component
const logger = createLogger('BACKGROUND');

// Initialize storage service
const storageService = new StorageService();

// Clean up when tabs are closed or navigated away
chrome.tabs.onRemoved.addListener((tabId: number) => {
    // Notify other parts of the extension that a tab was closed
    logger.debug(`Tab ${tabId} was removed`);
    chrome.runtime.sendMessage({action: 'tabRemoved', tabId});
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: { status?: string }) => {
    if (changeInfo.status === 'loading') {
        // Tab is navigating, content script will be unloaded
        logger.debug(`Tab ${tabId} is navigating, content script will be unloaded`);
        chrome.runtime.sendMessage({action: 'tabUpdated', tabId});
    }
});

// Function to load templates and update context menu
async function loadTemplatesIntoContextMenu(): Promise<void> {
    try {
        logger.debug('Loading templates into context menu');

        // Get all templates
        const templates = await storageService.getTemplates();

        // Get enabled templates
        let enabledTemplates = getEnabledTemplates(templates);
        logger.debug(`Found ${enabledTemplates.length} enabled templates`);

        // Get current tab for domain filtering
        const tab = await getCurrentTab();
        let currentDomain = '';

        if (tab?.url) {
            currentDomain = extractDomainFromUrl(tab.url);
            logger.debug(`Current domain: ${currentDomain}`);

            // Filter templates by domain using utility function
            enabledTemplates = filterTemplatesByDomain(enabledTemplates, currentDomain);
            logger.debug(`${enabledTemplates.length} templates match the current domain`);
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
chrome.runtime.onInstalled.addListener(() => {
    // Load templates and create menu items
    loadTemplatesIntoContextMenu();
});

// Update context menu when tab changes
chrome.tabs.onActivated.addListener(() => {
    // When user switches tabs, refresh the context menu
    loadTemplatesIntoContextMenu();
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener((changes: {
    [key: string]: { oldValue?: unknown, newValue?: unknown }
}, area: string) => {
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
        const templates = await storageService.getTemplates();
        const template = templates.find(t => t.id === templateId && t.enabled);

        if (template) {
            try {
                // First show loading state
                logger.debug(`Showing loading state for template: ${template.name}`);
                await sendMessageToTab(tab.id, {
                    action: 'fillTemplate',
                    template,
                    status: 'loading'
                });

                // Generate text using the template
                // Use the settings model to get settings
                const settingsModel = new SettingsModel();
                const settings = await settingsModel.loadSettings();

                // Skip generation if API key is missing
                if (!settings.apiKey) {
                    logger.error("API key is missing");
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
                        const response = await sendMessageToTab<{
                            content: string
                        }>(tab.id, {action: 'getPageContent'});
                        pageContent = response?.content || '';
                        logger.debug(`Retrieved ${pageContent.length} characters of page content`);
                    } catch (error) {
                        logger.error("Failed to get page content:", error);
                        // Continue without page content
                    }
                }

                // Use the API service to generate text
                logger.debug('Generating text with the API service');
                const apiResponse = await generateChatCompletion({
                    systemPrompt: template.systemPrompt,
                    userPrompt: template.userPrompt,
                    pageContent,
                    timeout: API_TIMEOUT
                });

                // Handle response
                if (apiResponse.success && apiResponse.text) {
                    // Create a modified template with the generated text as the system prompt
                    const filledTemplate = {
                        ...template,
                        systemPrompt: apiResponse.text,
                        userPrompt: '' // Clear user prompt since we've already used it for generation
                    };

                    // Fill with the generated content
                    logger.debug('Successfully generated text, filling template');
                    await sendMessageToTab(tab.id, {
                        action: 'fillTemplate',
                        template: filledTemplate,
                        status: 'success'
                    });
                } else {
                    // On error, fall back to filling with the raw template but show error
                    logger.error("API request failed:", apiResponse.error);
                    await sendMessageToTab(tab.id, {
                        action: 'fillTemplate',
                        template,
                        status: 'error',
                        error: apiResponse.error || 'Unknown error generating text'
                    });
                }
            } catch (error) {
                // On any error, fall back to filling with the raw template but show error
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                logger.error("Error generating text:", errorMsg);

                // Check if it's an AbortError (timeout)
                if (error instanceof DOMException && error.name === 'AbortError') {
                    await sendMessageToTab(tab.id, {
                        action: 'fillTemplate',
                        template,
                        status: 'error',
                        error: `Request timed out after ${API_TIMEOUT / 1000} seconds`
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
    sendResponse: (response?: unknown) => void
) => {
    // Handle content script ready message
    if (request.action === 'contentScriptReady' && sender.tab && sender.tab.id) {
        // Mark this tab as having a ready content script
        markTabReady(sender.tab.id);
        logger.debug(`Content script ready in tab ${sender.tab.id}`);
        return true;
    }

    // Handle templates updated message
    if (request.action === 'templatesUpdated') {
        // Templates have been updated, refresh the context menu
        loadTemplatesIntoContextMenu();
        sendResponse({success: true});
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
    sendResponse: (response?: unknown) => void
): Promise<void> {
    logger.debug('Handling generate text request');

    try {
        // Use the api-service utility to generate text
        const response = await generateChatCompletion({
            systemPrompt: request.systemPrompt,
            userPrompt: request.userPrompt,
            pageContent: request.pageContent,
            timeout: API_TIMEOUT
        });

        // Return the response
        logger.debug(`Generation ${response.success ? 'succeeded' : 'failed'}`);
        if (!response.success) {
            logger.error(`API error: ${response.error}`);
        }

        sendResponse(response);
    } catch (error) {
        logger.error('Error in handleGenerateText:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}