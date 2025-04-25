import {createLogger} from '../../utils/logging';

export type ThemeMode = 'light' | 'dark' | 'system';
const logger = createLogger('THEME');

/**
 * A service for managing and applying themes
 */
export class ThemeService {
    private currentTheme: ThemeMode = 'system';

    constructor(initialTheme: ThemeMode = 'system') {
        this.currentTheme = initialTheme;
        this.setupSystemThemeListener();
        this.applyTheme();
    }

    /**
     * Set the current theme and apply it
     */
    setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.applyTheme();
    }

    /**
     * Apply the current theme to the document
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
     * Set up a listener for system theme changes
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