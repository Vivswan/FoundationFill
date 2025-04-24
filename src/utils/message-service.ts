import { Message } from '../types';
import { createLogger } from './logging';

const logger = createLogger('MESSAGE_SERVICE');

type MessageHandler<T extends Message, R = any> = (
  message: T, 
  sender?: chrome.runtime.MessageSender
) => Promise<R> | R;

export class MessageService {
  private handlers: Map<string, MessageHandler<any, any>> = new Map();
  
  constructor() {
    this.setupListener();
  }
  
  private setupListener(): void {
    chrome.runtime.onMessage.addListener((
      message: Message, 
      sender: chrome.runtime.MessageSender, 
      sendResponse: (response?: any) => void
    ) => {
      if (!message.action) {
        logger.error('Received message with no action');
        sendResponse({ success: false, error: 'No action specified' });
        return true;
      }
      
      const handler = this.handlers.get(message.action);
      if (!handler) {
        logger.warn(`No handler registered for action: ${message.action}`);
        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
        return true;
      }
      
      try {
        const result = handler(message, sender);
        
        if (result instanceof Promise) {
          result
            .then(response => sendResponse(response))
            .catch(error => {
              logger.error(`Error in handler for ${message.action}:`, error);
              sendResponse({ 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
            });
          return true; // Keep channel open for async response
        } else {
          sendResponse(result);
          return true;
        }
      } catch (error) {
        logger.error(`Error handling message ${message.action}:`, error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        return true;
      }
    });
  }
  
  registerHandler<T extends Message, R = any>(
    action: string, 
    handler: MessageHandler<T, R>
  ): void {
    this.handlers.set(action, handler);
    logger.debug(`Registered handler for action: ${action}`);
  }
  
  async sendMessage<T extends Message, R = any>(message: T): Promise<R> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response: R | undefined) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as R);
        }
      });
    });
  }
  
  async sendMessageToTab<T extends Message, R = any>(tabId: number, message: T): Promise<R> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response: R | undefined) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as R);
        }
      });
    });
  }
}