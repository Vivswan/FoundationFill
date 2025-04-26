/**
 * API Service - Handles communication with external LLM APIs
 * Provides consistent interface for text generation requests
 */
import {createLogger} from '../utils/logging';
import {SettingsModel} from '../popup/models/Settings';
import {API_TIMEOUT} from '../defaults';
import {GenerateTextMessage} from "../utils/types";

// Create a logger instance for this component
const logger = createLogger('API');

/**
 * Interface representing a chat message in the API request format
 * @interface ChatMessage
 * @property {string} role - The role of the message sender ('system', 'user', or 'assistant')
 * @property {string} content - The content of the message
 */
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Configuration options for API requests
 * @interface APIRequestOptions
 * @property {string} systemPrompt - The system prompt to use for the generation
 * @property {string} userPrompt - The user prompt to use for the generation
 * @property {string} [pageContent] - Optional page content to include in the request
 * @property {number} [timeout] - Optional timeout in milliseconds for the request
 */
interface APIRequestOptions {
    systemPrompt: string;
    userPrompt: string;
    pageContent?: string;
    timeout?: number;
}

/**
 * Response object for text generation requests
 * @interface GenerateTextResponse
 * @property {boolean} success - Whether the generation was successful
 * @property {string} [text] - The generated text (if successful)
 * @property {string} [error] - Error message (if unsuccessful)
 */
export interface GenerateTextResponse {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Handles text generation requests from the extension
 * Processes the request and sends the response back to the caller
 *
 * @param request - The generation request message containing prompts and options
 * @param sendResponse - Function to call with the generation results
 * @returns Promise that resolves when the generation is complete
 */
export async function handleGenerateText(
    request: GenerateTextMessage,
    sendResponse: (response?: GenerateTextResponse) => void
): Promise<void> {
    logger.debug('Handling generate text request');

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
}

/**
 * Makes a request to the chat completions API
 * Handles building the request, sending it to the API, and processing the response
 *
 * @param options - Configuration options for the API request
 * @returns Promise that resolves to a GenerateTextResponse object
 * @example
 * const response = await generateChatCompletion({
 *   systemPrompt: "You are a helpful assistant.",
 *   userPrompt: "Tell me about TypeScript.",
 *   timeout: 30000
 * });
 */
export const generateChatCompletion = async (options: APIRequestOptions): Promise<GenerateTextResponse> => {
    try {
        // Create an instance of SettingsModel to get settings
        const settings = (await new SettingsModel().initialize()).getSettings();

        // Validate API key
        if (!settings.apiKey) {
            return {
                success: false,
                error: 'API key is missing. Please add your API key in Settings.'
            };
        }

        // Prepare messages
        const messages: ChatMessage[] = []

        if (options.systemPrompt) {
            messages.push({role: 'system', content: options.systemPrompt});
        }

        // Add user prompt with page content if provided
        let userContent = options.userPrompt;
        if (options.pageContent) {
            userContent += `\n\nPage Content:\n${options.pageContent}`;
        }
        messages.push({role: 'user', content: userContent});

        // Set up timeout
        const timeout = options.timeout || API_TIMEOUT;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Make the API request
        logger.debug('Making API request to:', settings.baseUrl);
        const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages
            }),
            signal: controller.signal
        }).finally(() => {
            clearTimeout(timeoutId);
        });

        const data = await response.json();

        // Handle API response
        if (!response.ok) {
            const errorMsg = data.error?.message || `API error (${response.status}): ${response.statusText}`;
            logger.error('API request failed:', errorMsg);
            return {success: false, error: errorMsg};
        }

        // Check if we have valid content in the response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            logger.error('API response is missing expected content');
            return {success: false, error: 'API response is missing expected content'};
        }

        return {
            success: true,
            text: data.choices[0].message.content
        };

    } catch (error) {
        // Handle request errors
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's an AbortError (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
            logger.error('API request timed out');
            return {success: false, error: `Request timed out after ${options.timeout || API_TIMEOUT}ms`};
        }

        logger.error('Error making API request:', errorMsg);
        return {success: false, error: errorMsg};
    }
};