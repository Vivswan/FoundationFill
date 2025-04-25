import {GenerateTextMessage, MessageTypes,} from './types';
import {createLogger} from './utils/logging';
import {generateChatCompletion} from './utils/api-service';
import {API_TIMEOUT} from './defaults';

// Create a logger instance for this component
const logger = createLogger('BACKGROUND');

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((
    request: MessageTypes,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
) => {
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