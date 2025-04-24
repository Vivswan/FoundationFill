// DOM utilities for common DOM operations

/**
 * Safely get an element by ID with type casting
 */
export const getElementById = <T extends HTMLElement>(id: string): T | null => {
  const element = document.getElementById(id);
  return element as T | null;
};

/**
 * Safely get elements by a query selector with type casting
 */
export const querySelectorAll = <T extends HTMLElement>(selector: string, parent: Document | HTMLElement = document): T[] => {
  const elements = parent.querySelectorAll(selector);
  return Array.from(elements) as T[];
};

/**
 * Safely query for a single element with type casting
 */
export const querySelector = <T extends HTMLElement>(selector: string, parent: Document | HTMLElement = document): T | null => {
  const element = parent.querySelector(selector);
  return element as T | null;
};

/**
 * Create an element with optional attributes and event listeners
 */
interface ElementAttributes {
  [key: string]: string;
}

interface ElementEvents {
  [key: string]: EventListenerOrEventListenerObject;
}

export const createElement = <T extends HTMLElement>(
  tag: string,
  attributes: ElementAttributes = {},
  events: ElementEvents = {},
  children: (HTMLElement | string)[] = []
): T => {
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
};

/**
 * Show or hide an element by adding/removing 'hidden' class
 */
export const toggleElementVisibility = (element: HTMLElement | null, visible: boolean): void => {
  if (!element) return;
  
  if (visible) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
};

/**
 * Add a common event listener to multiple elements
 */
export const addEventListenerToAll = <T extends HTMLElement>(
  elements: T[],
  eventType: string,
  handler: EventListenerOrEventListenerObject
): void => {
  elements.forEach(element => element.addEventListener(eventType, handler));
};