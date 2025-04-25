import {GenerateTextMessage, GenerateTextResponse} from "../types";
import {generatingAnimation} from "./animation";
import {executeScriptInTab, getCurrentTab, sendMessageToBackground} from "../utils/chrome-api-utils";
import {ANIMATION_TIMEOUT} from "../defaults";
import {createLogger} from "../utils/logging";
import {DOMUtils} from "../utils/dom-utils";
import {Template} from "../popup/models/Template";

const logger = createLogger('GENERATE_TEXT');

export const generateTextWithAnimation = async (element: HTMLElement, templateData: Template | undefined | null): Promise<void> => {
    if (!templateData) {
        logger.error('Error: Template not found');
        DOMUtils.updateText(element, 'Error: Template not found');
        return
    }
    if (!templateData.userPrompt) {
        logger.error('Error: User prompt is empty');
        DOMUtils.updateText(element, 'Error: User prompt is empty');
        return;
    }

    let pageContent = '';
    try {
        if (templateData.includePageContent) {
            const tab = await getCurrentTab();
            if (tab?.id) {
                pageContent = await executeScriptInTab(tab.id, () => document.body.innerText) || '';
            }
        }
    } catch (error) {
        logger.error('Error getting page content:', error);
    }

    const stopCallback = generatingAnimation(element, ANIMATION_TIMEOUT);
    try {
        // Call the API using the api-service utility
        const response = await sendMessageToBackground<GenerateTextResponse>({
            action: 'generateText',
            systemPrompt: templateData.systemPrompt,
            userPrompt: templateData.userPrompt,
            pageContent: pageContent
        } as GenerateTextMessage);

        // Update UI based on response
        stopCallback();
        if (response && response.success) {
            DOMUtils.updateText(element, response.text || '');
        } else {
            logger.error('Error generating text:', response?.error);
            DOMUtils.updateText(element, 'Error: ' + (response?.error || 'Could not generate text. Check your API key and connection.'));
        }

    } catch (error) {
        console.error('Error during generation:', error);
        stopCallback();
        DOMUtils.updateText(element, 'Error: ' + error);
    }
}