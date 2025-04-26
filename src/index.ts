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

        chrome.storage.local.get("resolveTemplateVariables", async (data) => {
            await processResolveTemplateVariables(popupController, data);
        });
    } catch (error) {
        logger.error("Error in initialization", error);
    }
});

async function processResolveTemplateVariables(popupController: PopupController, data: {
    [key: string]: unknown
}): Promise<void> {
    const templateMessageNullable: ResolveTemplateVariablesMessage | unknown = data.resolveTemplateVariables;
    if (!templateMessageNullable) {
        logger.debug('No template message found in storage');
        return;
    }
    if (typeof templateMessageNullable !== "object" || !("template" in templateMessageNullable)) {
        logger.error('Invalid template message format');
        return;
    }
    await chrome.storage.local.set({"resolveTemplateVariables": null});
    const templateMessage = templateMessageNullable as ResolveTemplateVariablesMessage;
    const processTemplate = await popupController.resolveTemplateVariables(templateMessage.template);

    try {
        const tab = await getCurrentTab();
        if (!tab || !tab.id) {
            logger.error('No active tab found');
            return;
        }
        await sendMessageToTab(tab.id, {action: 'fillTemplate', template: processTemplate} as FillTemplateMessage);
    } catch (error) {
        logger.error('Error getting page content:', error);
    }
    window.close();
}