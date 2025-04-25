import {ThemeMode} from '../types';
import {createLogger} from './logging';

const logger = createLogger('THEME');

/**
 * A service for managing and applying themes
 */
export class ThemeService {
    private currentTheme: ThemeMode = 'system';
    private listeners: ((theme: ThemeMode) => void)[] = [];

    constructor(initialTheme: ThemeMode = 'system') {
        this.currentTheme = initialTheme;
        this.applyTheme();
        this.setupSystemThemeListener();
    }

    /**
     * Set the current theme and apply it
     */
    setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.applyTheme();
        this.notifyListeners();
    }

    /**
     * Get the current theme mode
     */
    getTheme(): ThemeMode {
        return this.currentTheme;
    }

    /**
     * Add a listener that will be called when the theme changes
     */
    addListener(listener: (theme: ThemeMode) => void): void {
        this.listeners.push(listener);
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
        if (this.currentTheme === 'system') {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            logger.debug('Setting up system theme listener');

            try {
                // Standard approach
                darkModeMediaQuery.addEventListener('change', () => this.applyTheme());
                logger.debug('Using standard event listener for theme changes');
            } catch (error) {
                // Fallback for older browsers
                logger.warn('Fallback to legacy event listener for theme changes');
                try {
                    darkModeMediaQuery.addListener(() => this.applyTheme());
                } catch (error) {
                    logger.error('Failed to set up theme change listener:', error);
                }
            }
        }
    }

    /**
     * Notify all listeners about a theme change
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.currentTheme));
    }
}