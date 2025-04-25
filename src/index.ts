import './utils/chrome-api-debug'; // Import first to initialize debug helpers
import {PopupController} from './popup/Popup';
import {createLogger} from './utils/logging';

const logger = createLogger('Popup');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const popupController = new PopupController();
        await popupController.initialize();
    } catch (error) {
        logger.error("Error in initialization", error);
    }
});