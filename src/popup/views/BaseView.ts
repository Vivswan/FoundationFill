export abstract class BaseView {
  protected elements: Map<string, HTMLElement> = new Map();
  
  constructor(elementIds: Record<string, string>) {
    // Initialize elements
    Object.entries(elementIds).forEach(([key, id]) => {
      const element = document.getElementById(id) as HTMLElement;
      if (!element) {
        console.error(`Element not found with ID: ${id}`);
      }
      this.elements.set(key, element);
    });
  }
  
  protected getElement<T extends HTMLElement>(key: string): T {
    const element = this.elements.get(key) as T;
    if (!element) {
      throw new Error(`Element not found with key: ${key}`);
    }
    return element;
  }
  
  show(): void {
    const mainElement = this.elements.get('container');
    if (mainElement) {
      mainElement.classList.remove('hidden');
    }
  }
  
  hide(): void {
    const mainElement = this.elements.get('container');
    if (mainElement) {
      mainElement.classList.add('hidden');
    }
  }
}