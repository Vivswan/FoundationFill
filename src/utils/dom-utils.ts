/**
 * DOM Utilities
 * Provides helper functions for working with DOM elements
 * Handles cross-browser compatibility for text input manipulation
 */

/**
 * DOM Service class that provides utilities for DOM manipulation
 * Handles different types of text inputs (textarea, input, contenteditable)
 */
export class DOMUtils {
    static isTextInput(element: HTMLElement | null): boolean {
        if (!element) return false;

        return (
            element.tagName === 'TEXTAREA' ||
            (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
            element.getAttribute('contenteditable') === 'true'
        );
    }

    static updateText(element: HTMLElement, text: string): void {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
            inputElement.value = text;
            inputElement.dispatchEvent(new Event('input', {bubbles: true}));
        } else if (element.getAttribute('contenteditable') === 'true') {
            element.textContent = text;
            element.dispatchEvent(new Event('input', {bubbles: true}));
        }
    }

}
