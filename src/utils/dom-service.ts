type EventHandler = (event: Event) => void;
type ElementOptions = Partial<{
  id: string;
  className: string;
  textContent: string;
  innerHTML: string;
  style: Partial<CSSStyleDeclaration> | string;
  attributes: Record<string, string>;
}>;

export class DOMService {
  static createElement<T extends HTMLElement>(
    tagName: string,
    options: ElementOptions = {},
    events: Record<string, EventHandler> = {}
  ): T {
    const element = document.createElement(tagName) as T;
    
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    
    if (options.style) {
      if (typeof options.style === 'string') {
        element.setAttribute('style', options.style);
      } else {
        Object.assign(element.style, options.style);
      }
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    // Add event listeners
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler);
    });
    
    return element;
  }
  
  static getElement<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }
  
  static getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = this.getElement<T>(id);
    if (!element) throw new Error(`Element not found with ID: ${id}`);
    return element;
  }
  
  static show(element: HTMLElement): void {
    element.classList.remove('hidden');
  }
  
  static hide(element: HTMLElement): void {
    element.classList.add('hidden');
  }
  
  static toggle(element: HTMLElement): void {
    element.classList.toggle('hidden');
  }
}