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
    /**
     * Checks if the provided element is a text input element
     * Validates if the element is a textarea, text input, or contenteditable element
     *
     * @param element - The DOM element to check
     * @returns True if the element is a text input element, false otherwise
     * @example
     * if (DOMUtils.isTextInput(document.activeElement)) {
     *   // Element is a text input
     * }
     */
    static isTextInput(element: HTMLElement | null): boolean {
        if (!element) return false;

        return (
            element.tagName === 'TEXTAREA' ||
            (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
            element.getAttribute('contenteditable') === 'true'
        );
    }

    /**
     * Updates the text content of an input element
     * Works with textareas, text inputs, and contenteditable elements
     * Dispatches an input event to trigger any listeners
     *
     * @param element - The DOM element to update
     * @param text - The new text content to set
     * @example
     * DOMUtils.updateText(textArea, "New content for the text area");
     */
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
