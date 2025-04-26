import {Template, TemplateModel} from "../models/Template";
import {getCurrentDomain} from "../../utils/associatedDomain";

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

    public update(template: Template): void {
        this.currentDomains = template.associatedDomains || [];
        if (this.currentDomains.length > 0) {
            this.manageDomainsBtn.classList.add('has-domains');
        } else {
            this.manageDomainsBtn.classList.remove('has-domains');
        }
        this.domainCountBadge.textContent = this.currentDomains.length > 0 ? `(${this.currentDomains.length.toString()})` : '';
    }

    // Show/hide the domain management group for default templates
    public updateDomainGroupVisibility(visibility: boolean): void {
        (this.manageDomainsBtn.parentElement as HTMLElement).style.display = visibility ? 'flex' : 'none';
        if (!visibility) this.closeDomainDialog();
    }

    // Open the domain management dialog
    private async openDomainDialog(): Promise<void> {
        // Set current page domain for easy adding
        const currentDomain = await getCurrentDomain();
        this.addCurrentDomainBtn.disabled = !currentDomain;

        // Render the current domains
        await this.renderDomainList();

        // Show the dialog
        this.domainDialog.classList.remove('hidden');
    }

    // Close the domain management dialog
    private closeDomainDialog(): void {
        this.domainDialog.classList.add('hidden');
    }

    // Add a new domain from the input field
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

    // Add the current page's domain
    private async addCurrentDomain(): Promise<void> {
        const currentDomain = await getCurrentDomain();
        if (currentDomain && !this.currentDomains.includes(currentDomain)) {
            this.currentDomains.push(currentDomain);
            await this.renderDomainList();
        }
    }

    // Remove a domain from the list
    private async removeDomain(domain: string): Promise<void> {
        this.currentDomains = this.currentDomains.filter(d => d !== domain);
        await this.renderDomainList();
    }

    // Save domains and close the dialog
    private async saveDomains(): Promise<void> {
        await this.template.updateTemplate(this.template.getActiveTemplateId(), {
            associatedDomains: [...this.currentDomains]
        } as Partial<Template>);

        // Update domain UI elements
        this.closeDomainDialog();
    }

    // Render the domain list in the dialog
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