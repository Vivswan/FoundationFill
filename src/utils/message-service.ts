import {Message} from '../types';
import {createLogger} from './logging';

const logger = createLogger('MESSAGE_SERVICE');

// Generic handler type
type AnyMessageHandler = (
    message: Message,
    sender?: chrome.runtime.MessageSender
) => Promise<unknown> | unknown;

// Type for specific message and response
type TypedMessageHandler<T extends Message, R = unknown> = (
    message: T,
    sender?: chrome.runtime.MessageSender
) => Promise<R> | R;

export class MessageService {
  private handlers: Map<string, AnyMessageHandler> = new Map();

  constructor() {
    this.setupListener();
  }

  registerHandler<T extends Message, R = unknown>(
      action: string,
      handler: TypedMessageHandler<T, R>
  ): void {
    // Safe to cast since T extends Message
    this.handlers.set(action, handler as AnyMessageHandler);
    logger.debug(`Registered handler for action: ${action}`);
  }

  async sendMessage<T extends Message, R = unknown>(message: T): Promise<R> {
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

  async sendMessageToTab<T extends Message, R = unknown>(tabId: number, message: T): Promise<R> {
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

  private setupListener(): void {
    chrome.runtime.onMessage.addListener((
        message: Message,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ) => {
      if (!message.action) {
        logger.error('Received message with no action');
        sendResponse({success: false, error: 'No action specified'});
        return true;
      }

      const handler = this.handlers.get(message.action);
      if (!handler) {
        logger.warn(`No handler registered for action: ${message.action}`);
        sendResponse({success: false, error: `Unknown action: ${message.action}`});
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
}