// API service for making consistent API requests
import { createLogger } from './logging';
import { getSettings } from './chrome-storage';
import { API_TIMEOUT } from './defaults';

const logger = createLogger('API');

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface APIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  pageContent?: string;
  timeout?: number;
}

interface APIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Makes a request to the chat completions API
 */
export const generateChatCompletion = async (options: APIRequestOptions): Promise<APIResponse> => {
  try {
    const settings = await getSettings();
    
    // Validate API key
    if (!settings.apiKey) {
      return { 
        success: false, 
        error: 'API key is missing. Please add your API key in Settings.' 
      };
    }
    
    // Prepare messages
    const messages: ChatMessage[] = [
      { role: 'system', content: options.systemPrompt }
    ];
    
    // Add user prompt with page content if provided
    let userContent = options.userPrompt;
    if (options.pageContent) {
      userContent += `\n\nPage Content:\n${options.pageContent}`;
    }
    messages.push({ role: 'user', content: userContent });
    
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
      return { success: false, error: errorMsg };
    }
    
    // Check if we have valid content in the response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      logger.error('API response is missing expected content');
      return { success: false, error: 'API response is missing expected content' };
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
      return { success: false, error: `Request timed out after ${options.timeout || API_TIMEOUT}ms` };
    }
    
    logger.error('Error making API request:', errorMsg);
    return { success: false, error: errorMsg };
  }
};