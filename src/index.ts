/**
 * Popup Entry Point
 * Initializes the extension popup UI and sets up event listeners for user interaction
 */
import {PopupController} from './popup/Popup';
import {createLogger} from './utils/logging';
import {FillTemplateMessage, ResolveTemplateVariablesMessage} from "./utils/types";
import {getCurrentTab, sendMessageToTab} from "./utils/chrome-api-utils";

// Create a logger instance for this component
const logger = createLogger('Popup');

/**
 * Event handler for DOMContentLoaded event
 * Initializes the popup controller and sets up the GitHub link
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const popupController = new PopupController();
        await popupController.initialize();
        (document.getElementById("github-link") as HTMLElement)
            .addEventListener("click", () => chrome.tabs.create({url: 'https://github.com/Vivswan'}));
        (document.getElementById("vs-link") as HTMLElement)
            .addEventListener("click", () => chrome.tabs.create({url: 'https://vivswan.github.io/'}));

        chrome.storage.local.get("resolveTemplateVariables", async (data) => {
            await processResolveTemplateVariables(popupController, data);
        });
    } catch (error) {
        logger.error("Error in initialization", error);
    }
});

/**
 * Processes template variables from local storage
 * Handles the variable resolution flow when a template with variables is selected
 *
 * @param popupController - The popup controller instance
 * @param data - Storage data containing the template variables message
 * @returns Promise that resolves when processing is complete
 */
async function processResolveTemplateVariables(popupController: PopupController, data: {
    [key: string]: unknown
}): Promise<void> {
    // Extract the template message from storage
    const templateMessageNullable: ResolveTemplateVariablesMessage | unknown = data.resolveTemplateVariables;
    if (!templateMessageNullable) {
        logger.debug('No template message found in storage');
        return;
    }

    // Validate the message format
    if (typeof templateMessageNullable !== "object" || !("template" in templateMessageNullable)) {
        logger.error('Invalid template message format');
        return;
    }

    // Clear the message from storage to prevent reprocessing
    await chrome.storage.local.set({"resolveTemplateVariables": null});

    // Process the template variables
    const templateMessage = templateMessageNullable as ResolveTemplateVariablesMessage;
    const processTemplate = await popupController.resolveTemplateVariables(templateMessage.template);

    try {
        // Get the current tab and send the processed template
        const tab = await getCurrentTab();
        if (!tab || !tab.id) {
            logger.error('No active tab found');
            return;
        }

        // Send the processed template to the content script
        await sendMessageToTab(tab.id, {
            action: 'fillTemplate',
            template: processTemplate
        } as FillTemplateMessage);
    } catch (error) {
        logger.error('Error processing template variables:', error);
    }

    // Close the popup after processing
    window.close();
}