/**
 * Text Generation UI Handler
 * Manages the process of generating text and displaying it in the DOM with animation
 */
import {GenerateTextMessage, Response} from "../utils/types";
import {generatingAnimation} from "./animation";
import {sendMessageToBackground} from "../utils/chrome-api-utils";
import {ANIMATION_TIMEOUT} from "../defaults";
import {createLogger} from "../utils/logging";
import {DOMUtils} from "../utils/dom-utils";
import {Template} from "../popup/models/Template";

// Create a logger instance for this component
const logger = createLogger('GENERATE_TEXT');

/**
 * Generates text using API and inserts it into the specified element with animation
 * Shows a loading animation while waiting for the API response
 * Handles error cases and updates the element with the generated text or error message
 *
 * @param element - The DOM element to insert text into (usually a text input field)
 * @param templateData - The template data containing system and user prompts
 * @param pageContent - The current page content for context (used if template's includePageContent is true)
 * @returns Promise that resolves when text generation and insertion is complete
 * @throws Will handle errors internally and display them in the target element
 */
export const generateTextWithAnimation = async (element: HTMLElement, templateData: Template | undefined | null, pageContent: string | null): Promise<void> => {
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
    if (!pageContent) pageContent = '';

    const stopCallback = generatingAnimation(element, ANIMATION_TIMEOUT);
    try {
        // Call the API using the api-service utility
        const response = await sendMessageToBackground<Response>({
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