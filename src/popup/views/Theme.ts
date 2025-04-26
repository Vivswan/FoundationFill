/**
 * Theme Management Module
 * Handles application theme switching, system preference detection, and theme persistence
 */
import {createLogger} from '../../utils/logging';

/**
 * Theme mode options for the application
 * @type ThemeMode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// Create a logger instance for this component
const logger = createLogger('THEME');

/**
 * Service for managing and applying application themes
 * Handles light/dark mode, system preference detection, and theme transitions
 */
export class ThemeService {
    private currentTheme: ThemeMode = 'system';

    /**
     * Creates a new ThemeService instance
     * Sets up system theme preference listeners and applies the initial theme
     *
     * @param initialTheme - The theme to initialize with (defaults to 'system')
     */
    constructor(initialTheme: ThemeMode = 'system') {
        this.currentTheme = initialTheme;
        this.setupSystemThemeListener();
        this.applyTheme();
    }

    /**
     * Sets the current theme and applies it
     * Updates DOM classes to reflect the selected theme
     *
     * @param theme - The theme to apply ('light', 'dark', or 'system')
     */
    setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.applyTheme();
    }

    /**
     * Applies the current theme to the document
     * Updates CSS classes based on the active theme or system preference
     * @private Internal method called when theme changes
     */
    private applyTheme(): void {
        // Get the html element
        const html = document.documentElement;

        logger.debug(`Applying theme: ${this.currentTheme}`);

        // Remove any existing theme classes
        html.classList.remove('theme-light', 'theme-dark');

        if (this.currentTheme === 'system') {
            // Use system preference
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const appliedTheme = prefersDarkMode ? 'theme-dark' : 'theme-light';
            html.classList.add(appliedTheme);
            logger.debug(`Using system preference: ${appliedTheme}`);
        } else {
            // Use selected theme
            const themeClass = `theme-${this.currentTheme}`;
            html.classList.add(themeClass);
            logger.debug(`Applied explicit theme: ${themeClass}`);
        }
    }

    /**
     * Sets up a listener for system theme preference changes
     * Ensures theme updates automatically when system settings change
     * @private Internal method called during initialization
     */
    private setupSystemThemeListener(): void {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        try {
            // Standard approach
            darkModeMediaQuery.addEventListener('change', () => this.applyTheme());
        } catch (error) {
            // Fallback for older browsers
            try {
                darkModeMediaQuery.addListener(() => this.applyTheme());
            } catch (error) {
                logger.error('Failed to set up theme change listener:', error);
            }
        }
    }
}