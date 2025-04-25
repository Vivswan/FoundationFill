// DOM utilities for common DOM operations

/**
 * Type definitions for DOM utility functions
 */
type EventHandler = (event: Event) => void;

interface ElementOptions {
    id?: string;
    className?: string;
    textContent?: string;
    innerHTML?: string;
    style?: Partial<CSSStyleDeclaration> | string;
    attributes?: Record<string, string>;
}

interface ElementAttributes {
    [key: string]: string;
}

interface ElementEvents {
    [key: string]: EventListenerOrEventListenerObject;
}

/**
 * DOM Service class that combines functionality from dom-utils.ts and dom-service.ts
 */
export class DOMUtils {
    /**
     * Creates an element with attributes, events, and children
     */
    static createElement<T extends HTMLElement>(
        tag: string,
        attributes: ElementAttributes = {},
        events: ElementEvents = {},
        children: (HTMLElement | string)[] = []
    ): T {
        // Create the element
        const element = document.createElement(tag) as T;

        // Add attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        // Add event listeners
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });

        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    /**
     * Get an element by ID with type casting
     */
    static getElementById<T extends HTMLElement>(id: string): T | null {
        return document.getElementById(id) as T | null;
    }

    /**
     * Get a required element, throws error if not found
     */
    static getRequiredElement<T extends HTMLElement>(id: string): T {
        const element = this.getElementById<T>(id);
        if (!element) throw new Error(`Element not found with ID: ${id}`);
        return element;
    }

    /**
     * Find multiple elements by selector
     */
    static querySelectorAll<T extends HTMLElement>(
        selector: string,
        parent: Document | HTMLElement = document
    ): T[] {
        const elements = parent.querySelectorAll(selector);
        return Array.from(elements) as T[];
    }

    /**
     * Find a single element by selector
     */
    static querySelector<T extends HTMLElement>(
        selector: string,
        parent: Document | HTMLElement = document
    ): T | null {
        return parent.querySelector(selector) as T | null;
    }

    /**
     * Show an element by removing 'hidden' class
     */
    static show(element: HTMLElement): void {
        element.classList.remove('hidden');
    }

    /**
     * Hide an element by adding 'hidden' class
     */
    static hide(element: HTMLElement): void {
        element.classList.add('hidden');
    }

    /**
     * Toggle element visibility
     */
    static toggle(element: HTMLElement): void {
        element.classList.toggle('hidden');
    }

    /**
     * Toggle visibility with boolean control
     */
    static toggleVisibility(element: HTMLElement | null, visible: boolean): void {
        if (!element) return;

        if (visible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    /**
     * Add event listener to multiple elements
     */
    static addEventListenerToAll<T extends HTMLElement>(
        elements: T[],
        eventType: string,
        handler: EventListenerOrEventListenerObject
    ): void {
        elements.forEach(element => element.addEventListener(eventType, handler));
    }


    static isTextInput(element: HTMLElement | null): boolean {
        if (!element) return false;

        return (
            element.tagName === 'TEXTAREA' ||
            (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
            element.getAttribute('contenteditable') === 'true'
        );
    }
}
