/**
 * Domain Management UI Module
 * Manages associated domains for templates and domain-specific behavior
 */
import {Template, TemplateModel} from "../models/Template";
import {getCurrentDomain} from "../../utils/associatedDomain";

/**
 * View component for managing domain associations with templates
 * Provides UI for listing, adding, and removing domains from templates
 */
export class DomainUI {
    private template: TemplateModel;
    private currentDomains: string[] = [];

    // Domain dialog elements
    private domainDialog: HTMLElement;
    private closeDomainDialogBtn: HTMLButtonElement;
    private domainDialogBackground: HTMLButtonElement;
    private domainList: HTMLElement;
    private newDomainInput: HTMLInputElement;
    private addDomainBtn: HTMLButtonElement;
    private addCurrentDomainBtn: HTMLButtonElement;
    private saveDomainsBtn: HTMLButtonElement;

    // Domain UI elements
    private manageDomainsBtn: HTMLButtonElement;
    private domainCountBadge: HTMLElement;

    /**
     * Initializes the domain UI component
     * Sets up DOM references and event handlers for domain management
     *
     * @param template - The template model to bind with domain management
     */
    constructor(template: TemplateModel) {
        this.template = template;

        // Initialize domain UI elements
        this.manageDomainsBtn = document.getElementById('manage-domains-btn') as HTMLButtonElement;
        this.domainCountBadge = document.getElementById('domain-count-badge') as HTMLElement;

        // Initialize domain dialog DOM elements
        this.domainDialog = document.getElementById('domain-dialog') as HTMLElement;
        this.closeDomainDialogBtn = document.getElementById('close-domain-dialog') as HTMLButtonElement;
        this.domainDialogBackground = document.getElementById('domain-dialog') as HTMLButtonElement;
        this.domainList = document.getElementById('domain-list') as HTMLElement;
        this.newDomainInput = document.getElementById('new-domain-input') as HTMLInputElement;
        this.addDomainBtn = document.getElementById('add-domain-btn') as HTMLButtonElement;
        this.addCurrentDomainBtn = document.getElementById('add-current-domain-btn') as HTMLButtonElement;
        this.saveDomainsBtn = document.getElementById('save-domains-btn') as HTMLButtonElement;

        // Set up event listeners
        this.manageDomainsBtn.addEventListener('click', this.openDomainDialog.bind(this));
        this.closeDomainDialogBtn.addEventListener('click', this.closeDomainDialog.bind(this));
        this.domainDialogBackground.addEventListener('click', async (e) => {
            if (e.target === this.domainDialogBackground) await this.saveDomains();
        });
        this.addDomainBtn.addEventListener('click', this.addDomain.bind(this));
        this.newDomainInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await this.addDomain();
        });
        this.addCurrentDomainBtn.addEventListener('click', this.addCurrentDomain.bind(this));
        this.saveDomainsBtn.addEventListener('click', this.saveDomains.bind(this));

        // Initialize the domain list
        this.template.onChange((activeId, templates) => {
            const currentTemplate = templates.find(t => t.id === activeId);
            if (!currentTemplate) return;
            this.update(currentTemplate);
        })
    }

    /**
     * Updates the domain UI with the current template's domains
     * Refreshes the domain counter and button state
     *
     * @param template - The template whose domains should be displayed
     */
    public update(template: Template): void {
        this.currentDomains = template.associatedDomains || [];
        if (this.currentDomains.length > 0) {
            this.manageDomainsBtn.classList.add('has-domains');
        } else {
            this.manageDomainsBtn.classList.remove('has-domains');
        }
        this.domainCountBadge.textContent = this.currentDomains.length > 0 ? `(${this.currentDomains.length.toString()})` : '';
    }

    /**
     * Shows or hides the domain management UI
     * Used to disable domain management for certain templates
     *
     * @param visibility - Whether the domain management controls should be visible
     */
    public updateDomainGroupVisibility(visibility: boolean): void {
        (this.manageDomainsBtn.parentElement as HTMLElement).style.display = visibility ? 'flex' : 'none';
        if (!visibility) this.closeDomainDialog();
    }

    /**
     * Opens the domain management dialog
     * Fetches current domain and renders the domain list
     *
     * @returns Promise that resolves when the dialog is open and populated
     * @private Event handler for manage domains button
     */
    private async openDomainDialog(): Promise<void> {
        // Set current page domain for easy adding
        const currentDomain = await getCurrentDomain();
        this.addCurrentDomainBtn.disabled = !currentDomain;

        // Render the current domains
        await this.renderDomainList();

        // Show the dialog
        this.domainDialog.classList.remove('hidden');
    }

    /**
     * Closes the domain management dialog
     * Hides the dialog without saving changes
     *
     * @private Event handler for close button
     */
    private closeDomainDialog(): void {
        this.domainDialog.classList.add('hidden');
    }

    /**
     * Adds a new domain from the input field
     * Validates and adds the domain to the current list
     *
     * @returns Promise that resolves when the domain is added
     * @private Event handler for add domain button
     */
    private async addDomain(): Promise<void> {
        const domain = this.newDomainInput.value.trim();
        if (!domain) return;

        // Add domain if it's not already in the list
        if (!this.currentDomains.includes(domain)) {
            this.currentDomains.push(domain);
            await this.renderDomainList();
        }

        // Clear input field
        this.newDomainInput.value = '';
        if (document.activeElement === this.newDomainInput) {
            this.newDomainInput.focus();
        }
    }

    /**
     * Adds the current page's domain to the list
     * Fetches the current domain and adds it if not already present
     *
     * @returns Promise that resolves when the domain is added
     * @private Event handler for add current domain button
     */
    private async addCurrentDomain(): Promise<void> {
        const currentDomain = await getCurrentDomain();
        if (currentDomain && !this.currentDomains.includes(currentDomain)) {
            this.currentDomains.push(currentDomain);
            await this.renderDomainList();
        }
    }

    /**
     * Removes a domain from the list
     * Filters out the specified domain and updates the UI
     *
     * @param domain - The domain to remove
     * @returns Promise that resolves when the domain is removed
     * @private Event handler for domain remove buttons
     */
    private async removeDomain(domain: string): Promise<void> {
        this.currentDomains = this.currentDomains.filter(d => d !== domain);
        await this.renderDomainList();
    }

    /**
     * Saves domain changes to the template
     * Updates the template model and closes the dialog
     *
     * @returns Promise that resolves when changes are saved
     * @private Event handler for save button
     */
    private async saveDomains(): Promise<void> {
        await this.template.updateTemplate(this.template.getActiveTemplateId(), {
            associatedDomains: [...this.currentDomains]
        } as Partial<Template>);

        // Update domain UI elements
        this.closeDomainDialog();
    }

    /**
     * Renders the list of domains in the dialog
     * Creates DOM elements for each domain with remove buttons
     *
     * @returns Promise that resolves when rendering is complete
     * @private Internal method for UI updates
     */
    private async renderDomainList(): Promise<void> {
        this.domainList.innerHTML = '';

        if (this.currentDomains.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'domain-empty';
            emptyMessage.textContent = 'No domains added yet. Add a domain below.';
            emptyMessage.style.padding = '8px 12px';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.opacity = '0.7';
            this.domainList.appendChild(emptyMessage);
        }

        this.currentDomains.forEach(domain => {
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';

            const domainName = document.createElement('span');
            domainName.className = 'domain-name';
            domainName.textContent = domain;

            const removeButton = document.createElement('button');
            removeButton.className = 'domain-remove-btn';
            removeButton.textContent = '×';
            removeButton.title = 'Remove domain';
            removeButton.addEventListener('click', () => this.removeDomain(domain));

            domainItem.appendChild(domainName);
            domainItem.appendChild(removeButton);
            this.domainList.appendChild(domainItem);
        });

        const currentDomain = await getCurrentDomain();
        if (currentDomain && !this.currentDomains.includes(currentDomain)) {
            this.addCurrentDomainBtn.disabled = false;
            this.addCurrentDomainBtn.textContent = `Add '${currentDomain}'`;
        } else {
            this.addCurrentDomainBtn.disabled = true;
            this.addCurrentDomainBtn.textContent = 'Already Added';
        }
    }
}