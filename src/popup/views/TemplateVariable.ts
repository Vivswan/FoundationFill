/**
 * Template Variable Module
 * Manages template variables, extraction, replacement, dialog interactions, and UI
 */
import {Template} from "../models/Template";

/**
 * Regular expression to match template variables in the format {{name:default value}}
 */
const VARIABLE_REGEX = /\{\{([^:}]+)(?::([^}]*))?\}\}/g;

/**
 * Interface representing a template variable
 * Used to store information about variables extracted from template text
 *
 * @property fullMatch - The full matched string including delimiters (e.g., "{{name:default}}")
 * @property name - The name of the variable (e.g., "name")
 * @property defaultValue - The default value of the variable if provided (e.g., "default")
 */
export interface TemplateVariable {
    fullMatch: string;
    name: string;
    defaultValue: string;
}

/**
 * Class for managing template variables and UI interactions
 */
export class TemplateVariableView {
    private dialog: HTMLElement;
    private variablesContent: HTMLElement;
    private nextBtn: HTMLButtonElement;
    private closeBtn: HTMLButtonElement;
    private resolveCallback: ((value: Map<string, string>) => void) | null = null;
    private currentVariables: TemplateVariable[] = [];

    /**
     * Initializes the template variable view
     * Sets up the dialog elements and event listeners for the template variable UI
     */
    constructor() {
        // Initialize dialog elements
        this.dialog = document.getElementById('template-variables-dialog') as HTMLElement;
        this.variablesContent = document.getElementById('template-variables-content') as HTMLElement;
        this.nextBtn = document.getElementById('next-variables-btn') as HTMLButtonElement;
        this.closeBtn = document.getElementById('close-variables-dialog') as HTMLButtonElement;

        // Add event listener
        this.nextBtn.addEventListener('click', this.hideDialog.bind(this));
        this.closeBtn.addEventListener('click', this.hideDialog.bind(this));
        this.dialog.addEventListener('click', (event) => {
            if (event.target === this.dialog) this.hideDialog();
        });
    }

    /**
     * Extracts all template variables from a string using regex pattern
     * Identifies variables in the format {{variable_name:default_value}}
     * 
     * @param text - The text to extract variables from
     * @returns Array of template variables with name, defaultValue, and fullMatch properties
     */
    static extractTemplateVariables(text: string): TemplateVariable[] {
        const variables: TemplateVariable[] = [];
        let match;

        while ((match = VARIABLE_REGEX.exec(text)) !== null) {
            variables.push({
                fullMatch: match[0],
                name: match[1],
                defaultValue: match[2] || ''
            });
        }

        return variables;
    }

    /**
     * Replaces template variables in a string with their values
     * Uses the same regex pattern as extraction to ensure consistency
     * 
     * @param text - The text containing template variables
     * @param variableValues - Map of variable names to values
     * @returns The text with variables replaced by their values
     */
    replaceTemplateVariables(text: string, variableValues: Map<string, string>): string {
        return text.replace(VARIABLE_REGEX, (match, name) => {
            return variableValues.has(name) ? variableValues.get(name) || '' : match;
        });
    }

    /**
     * Shows a dialog to collect values for template variables
     * Creates form fields dynamically for each variable with appropriate labels
     * Uses the variable's default value as the initial input value
     * 
     * @param variables - Array of template variables to collect values for
     * @returns Promise that resolves with a map of variable names to user-provided values
     */
    showTemplateVariableDialog(variables: TemplateVariable[]): Promise<Map<string, string>> {
        this.variablesContent.innerHTML = '';

        // Create form elements for each variable
        variables.forEach(variable => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = variable.name;
            label.htmlFor = `var-${variable.name}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `var-${variable.name}`;
            input.value = variable.defaultValue;
            input.placeholder = `Enter value for ${variable.name}`;

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            this.variablesContent.appendChild(formGroup);
        });

        // Show the dialog
        this.dialog.classList.remove('hidden');

        return new Promise<Map<string, string>>((resolve) => {
            this.currentVariables = variables;
            this.resolveCallback = resolve;
        });
    }

    /**
     * Processes a template by replacing variables with user-provided values
     * Extracts variables from both system and user prompts
     * Deduplicates variables to ensure the user only needs to provide each value once
     * 
     * @param templateData - The template to process containing variables
     * @returns Promise that resolves with the processed template with variables replaced
     */
    async process(templateData: Template): Promise<Template> {
        // Extract template variables from prompts
        const systemVars = TemplateVariableView.extractTemplateVariables(templateData.systemPrompt);
        const userVars = TemplateVariableView.extractTemplateVariables(templateData.userPrompt);

        // If no variables found, return the original template
        if (systemVars.length === 0 && userVars.length === 0) {
            return templateData;
        }

        // Combine all unique variables
        const allVariables = new Map<string, TemplateVariable>();
        [...systemVars, ...userVars].forEach(variable => {
            if (!allVariables.has(variable.name)) {
                allVariables.set(variable.name, variable);
            }
        });

        // Get values for variables from user input
        const variables = Array.from(allVariables.values());
        const variableValues = await this.showTemplateVariableDialog(variables);
        const processedSystemPrompt = this.replaceTemplateVariables(templateData.systemPrompt, variableValues);
        const processedUserPrompt = this.replaceTemplateVariables(templateData.userPrompt, variableValues);

        // Return processed template with variables replaced
        // Replace variables in template prompts
        return {
            ...templateData,
            systemPrompt: processedSystemPrompt,
            userPrompt: processedUserPrompt,
        };
    }

    /**
     * Hides the template variables dialog and resolves the promise
     * Collects all input values and creates a map of variable names to values
     * Adds the 'hidden' CSS class to the dialog element to hide it from view
     * Called when the close button, next button, or outside of the dialog is clicked
     * 
     * @private Internal method used by event handlers
     */
    private hideDialog(): void {
        const variableValues = new Map<string, string>();

        this.currentVariables.forEach(variable => {
            const input = document.getElementById(`var-${variable.name}`) as HTMLInputElement;
            variableValues.set(variable.name, input.value);
        });

        this.resolveCallback?.(variableValues);
        this.dialog.classList.add('hidden');
    }
}
