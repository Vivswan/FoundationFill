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

/**
 * Theme color options for the application
 * @type ThemeColor
 */
export type ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'pink';

// Create a logger instance for this component
const logger = createLogger('THEME');

/**
 * Theme color information with display names and hex values for all theme variables
 * Single source of truth for all color values in the application
 */
export const THEME_COLORS: Record<ThemeColor, {
    name: string,
    primary: string,
    hover: string,
    light: {
        bg: string,
        text: string,
        border: string,
        highlight: string,
        sidebar: string
    },
    dark: {
        bg: string,
        text: string,
        border: string,
        highlight: string,
        sidebar: string,
        primary: string,
        hover: string,
        danger: string,
        dangerHover: string
    }
}> = {
    blue: {
        name: 'Blue',
        primary: '#2563eb',
        hover: '#1d4ed8',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#3b82f6',
            hover: '#2563eb',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    },
    red: {
        name: 'Red',
        primary: '#dc2626',
        hover: '#b91c1c',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#ef4444',
            hover: '#dc2626',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    },
    green: {
        name: 'Green',
        primary: '#16a34a',
        hover: '#15803d',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#22c55e',
            hover: '#16a34a',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    },
    purple: {
        name: 'Purple',
        primary: '#9333ea',
        hover: '#7e22ce',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#a855f7',
            hover: '#9333ea',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    },
    orange: {
        name: 'Orange',
        primary: '#ea580c',
        hover: '#c2410c',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#f97316',
            hover: '#ea580c',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    },
    pink: {
        name: 'Pink',
        primary: '#db2777',
        hover: '#be185d',
        light: {
            bg: '#ffffff',
            text: '#1f2937',
            border: '#e5e7eb',
            highlight: '#f3f4f6',
            sidebar: '#f9fafb'
        },
        dark: {
            bg: '#0f172a',
            text: '#f8fafc',
            border: '#1e293b',
            highlight: '#1e293b',
            sidebar: '#020617',
            primary: '#ec4899',
            hover: '#db2777',
            danger: '#ef4444',
            dangerHover: '#dc2626'
        }
    }
};

/**
 * Service for managing and applying application themes
 * Handles light/dark mode, system preference detection, theme transitions, and color variants
 */
export class ThemeService {
    private currentTheme: ThemeMode = 'system';
    private currentColor: ThemeColor = 'blue';

    /**
     * Creates a new ThemeService instance
     * Sets up system theme preference listeners and applies the initial theme and color
     *
     * @param initialTheme - The theme to initialize with (defaults to 'system')
     * @param initialColor - The color to initialize with (defaults to 'blue')
     */
    constructor(initialTheme: ThemeMode = 'system', initialColor: ThemeColor = 'blue') {
        this.currentTheme = initialTheme;
        this.currentColor = initialColor;
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
     * Sets the current color theme and applies it
     * Updates DOM classes to reflect the selected color
     *
     * @param color - The color to apply
     */
    setColor(color: ThemeColor): void {
        this.currentColor = color;
        this.applyTheme();
    }

    /**
     * Gets the current theme color
     * @returns The current theme color
     */
    getColor(): ThemeColor {
        return this.currentColor;
    }

    /**
     * Gets the current theme mode
     * @returns The current theme mode
     */
    getTheme(): ThemeMode {
        return this.currentTheme;
    }

    /**
     * Applies the current theme to the document
     * Uses CSS variables via style.setProperty to apply theme colors
     * based on theme and color preferences
     * @private Internal method called when theme or color changes
     */
    private applyTheme(): void {
        // Get the html element
        const html = document.documentElement;
        const themeColor = THEME_COLORS[this.currentColor];

        logger.debug(`Applying theme: ${this.currentTheme}, color: ${this.currentColor}`);

        // Determine if we're in dark mode
        let isDarkMode = false;
        if (this.currentTheme === 'system') {
            isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            logger.debug(`Using system preference: ${isDarkMode ? 'dark' : 'light'}`);
        } else {
            isDarkMode = this.currentTheme === 'dark';
            logger.debug(`Using explicit theme: ${this.currentTheme}`);
        }

        // Apply primary/hover color for all themes
        html.style.setProperty('--primary-color', isDarkMode ? themeColor.dark.primary : themeColor.primary);
        html.style.setProperty('--primary-hover', isDarkMode ? themeColor.dark.hover : themeColor.hover);

        // Apply danger colors
        html.style.setProperty('--danger-color', isDarkMode ? themeColor.dark.danger : '#dc2626');
        html.style.setProperty('--danger-hover', isDarkMode ? themeColor.dark.dangerHover : '#b91c1c');

        // Apply theme-specific colors
        if (isDarkMode) {
            // Dark theme
            html.style.setProperty('--bg-color', themeColor.dark.bg);
            html.style.setProperty('--text-color', themeColor.dark.text);
            html.style.setProperty('--border-color', themeColor.dark.border);
            html.style.setProperty('--highlight-color', themeColor.dark.highlight);
            html.style.setProperty('--sidebar-bg', themeColor.dark.sidebar);
        } else {
            // Light theme
            html.style.setProperty('--bg-color', themeColor.light.bg);
            html.style.setProperty('--text-color', themeColor.light.text);
            html.style.setProperty('--border-color', themeColor.light.border);
            html.style.setProperty('--highlight-color', themeColor.light.highlight);
            html.style.setProperty('--sidebar-bg', themeColor.light.sidebar);
        }

        // For backward compatibility, set data attributes that can be used in CSS selectors
        html.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        html.setAttribute('data-color', this.currentColor);
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