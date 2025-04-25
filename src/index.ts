import {PopupController} from './popup/Popup';
import {createLogger} from './utils/logging';

const logger = createLogger('Popup');

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