/**
 * Background Script - Main Service Worker
 * Manages context menus, API communication, and message handling between components
 */
import {
    FillTemplateMessage,
    GenerateTextMessage,
    Message,
    ResolveTemplateVariablesMessage,
    Response,
} from './utils/types';
import {createLogger} from './utils/logging';
import {getCurrentTab, sendMessageToTab} from './utils/chrome-api-utils';
import {handleGenerateText} from "./generate/api-service";
import {TemplateModel} from "./popup/models/Template";
import {extractDomainFromUrl} from "./utils/associatedDomain";
import {TemplateVariableView} from "./popup/views/TemplateVariable";

// Create a logger instance for this component
const logger = createLogger('BACKGROUND');

/**
 * Loads all enabled templates into the context menu
 * Filters templates by domain if a domain is active
 * Templates are shown in their saved order with domain-specific filtering
 * 
 * @returns Promise that resolves when context menu has been fully updated
 */
async function loadTemplatesIntoContextMenu(): Promise<void> {
    try {
        // Get all templates
        const templates = await new TemplateModel().initialize();

        // Get current tab for domain filtering
        const tab = await getCurrentTab();
        const currentDomain = tab?.url ? extractDomainFromUrl(tab.url) : null;
        let activeTemplates = templates.getEnabledTemplates();
        if (currentDomain) {
            activeTemplates = templates.getEnabledTemplatesForDomain(currentDomain);
        }

        // Remove existing template menu items using promise to ensure it completes before creating new ones
        await new Promise<void>((resolve) => {
            chrome.contextMenus.removeAll(() => {
                resolve();
            });
        });

        // Create the parent menu
        chrome.contextMenus.create({
            id: 'foundationFill',
            title: 'Foundation Fill',
            contexts: ['editable']
        });

        // Add each enabled template as a menu item
        // Use a Map to ensure no duplicate IDs
        const addedIds = new Set<string>();

        for (const template of activeTemplates) {
            const menuId = `template-${template.id}`;

            // Skip if we already added this template
            if (addedIds.has(menuId)) {
                logger.debug(`Skipping duplicate menu item: ${menuId}`);
                continue;
            }

            try {
                chrome.contextMenus.create({
                    id: menuId,
                    title: template.name,
                    parentId: 'foundationFill',
                    contexts: ['editable']
                });

                // Track that we added this ID
                addedIds.add(menuId);
            } catch (error) {
                logger.error(`Error creating menu item for template ${template.id}:`, error);
            }
        }

        // Create separator
        chrome.contextMenus.create({
            id: 'separator',
            type: 'separator',
            parentId: 'foundationFill',
            contexts: ['editable']
        });

        // Add refresh menu item
        chrome.contextMenus.create({
            id: 'refreshTemplates',
            title: 'Refresh Templates',
            parentId: 'foundationFill',
            contexts: ['editable']
        });

    } catch (error) {
        logger.error("Error loading templates into context menu:", error);
    }
}

/**
 * Initialize context menu items when extension is installed or updated
 * Loads templates and creates menu items
 */
chrome.runtime.onInstalled.addListener(loadTemplatesIntoContextMenu);

/**
 * Refresh context menu when user switches tabs
 * This ensures that domain-specific templates are properly displayed
 * Use a debounce to prevent too many refreshes in quick succession
 */
let tabActivationTimer: number | null = null;
chrome.tabs.onActivated.addListener(() => {
    // Clear existing timer
    if (tabActivationTimer !== null) {
        clearTimeout(tabActivationTimer);
    }

    // Set a new timer to debounce the context menu refresh
    tabActivationTimer = setTimeout(() => {
        loadTemplatesIntoContextMenu();
        tabActivationTimer = null;
    }, 500); // Wait 500ms before refreshing the context menu
});

/**
 * Listen for storage changes to update context menu
 * Updates the context menu when templates are modified
 * Uses debouncing to prevent multiple rapid refreshes
 *
 * @param changes Object containing the changes to storage
 * @param area Storage area that was changed ('sync', 'local', or 'managed')
 */
let storageChangeTimer: number | null = null;
chrome.storage.onChanged.addListener((changes: {
    [key: string]: { oldValue?: unknown, newValue?: unknown }
}, area: string) => {
    if (area === 'sync' && changes.templates) {
        // Clear existing timer
        if (storageChangeTimer !== null) {
            clearTimeout(storageChangeTimer);
        }

        // Set a new timer to debounce the context menu refresh
        storageChangeTimer = setTimeout(() => {
            loadTemplatesIntoContextMenu();
            storageChangeTimer = null;
        }, 300); // Wait 300ms before refreshing the context menu
    }
});

/**
 * Handle context menu clicks
 * Processes user interactions with the extension's context menu items
 *
 * @param info Information about the clicked menu item
 * @param tab The tab where the context menu was clicked
 */
chrome.contextMenus.onClicked.addListener(async (info: { menuItemId: string | number }, tab?: chrome.tabs.Tab) => {
    // Check if the tab is valid for message sending
    if (!tab || !tab.id || tab.id === chrome.tabs.TAB_ID_NONE) {
        logger.error("Invalid tab for sending message");
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
        const templates = (await new TemplateModel().initialize()).getTemplates();
        const template = templates.find(t => t.id === templateId);

        if (!template) return;

        // Check if template contains variables that need to be resolved
        const systemVars = TemplateVariableView.extractTemplateVariables(template.systemPrompt);
        const userVars = TemplateVariableView.extractTemplateVariables(template.userPrompt);

        if (systemVars.length === 0 && userVars.length === 0) {
            // No variables, directly fill the template
            await sendMessageToTab(tab.id, {action: 'fillTemplate', template} as FillTemplateMessage);
        } else {
            // Template has variables, open popup for resolution
            const templateMessage: ResolveTemplateVariablesMessage = {
                action: 'resolveTemplateVariables',
                timestamp: Date.now(),
                template: template,
            };
            // Store the template in local storage and open popup to collect variable values
            chrome.storage.local.set({"resolveTemplateVariables": templateMessage}, () => chrome.action.openPopup());
        }
    }
});

/**
 * Message handler for communication with content scripts and popup
 * Processes various message types and performs appropriate actions
 *
 * @param request The message request object containing action and data
 * @param sender Information about the sender of the message
 * @param sendResponse Function to call with the response data
 * @returns Boolean indicating whether the response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((
    request: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
) => {
    // Handle templates updated message
    if (request.action === 'templatesUpdated') {
        // Templates have been updated, refresh the context menu
        loadTemplatesIntoContextMenu();
        sendResponse({success: true} as Response);
        return true;
    }

    // Handle generate text message
    if (request.action === 'generateText') {
        handleGenerateText(request as GenerateTextMessage, sendResponse);
        return true; // Keep the message channel open for the async response
    }

    return true;
});
