/**
 * Popup Entry Point
 * Initializes the extension popup UI and sets up event listeners for user interaction
 */
import {PopupController} from './popup/Popup';
import {createLogger} from './utils/logging';

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
    } catch (error) {
        logger.error("Error in initialization", error);
    }
});