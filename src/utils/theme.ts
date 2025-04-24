import { ThemeMode } from '../types';
import { createLogger } from './logging';

const logger = createLogger('THEME');

/**
 * Apply the selected theme to the document/extension
 * @param theme Theme mode (light, dark, or system)
 */
export const applyTheme = (theme: ThemeMode): void => {
  // Get the html element
  const html = document.documentElement;
  
  logger.debug(`Applying theme: ${theme}`);
  
  // Remove any existing theme classes
  html.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'system') {
    // Use system preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const appliedTheme = prefersDarkMode ? 'theme-dark' : 'theme-light';
    html.classList.add(appliedTheme);
    logger.debug(`Using system preference: ${appliedTheme}`);
  } else {
    // Use selected theme
    const themeClass = `theme-${theme}`;
    html.classList.add(themeClass);
    logger.debug(`Applied explicit theme: ${themeClass}`);
  }
};

/**
 * Listen for system theme changes
 * @param theme The current theme mode
 * @param callback Callback to run when theme changes
 */
export const listenForThemeChanges = (theme: ThemeMode, callback: () => void): void => {
  if (theme === 'system') {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    logger.debug('Setting up system theme listener');
    
    try {
      // Standard approach
      darkModeMediaQuery.addEventListener('change', callback);
      logger.debug('Using standard event listener for theme changes');
    } catch (error) {
      // Fallback for older browsers
      logger.warn('Fallback to legacy event listener for theme changes');
      try {
        darkModeMediaQuery.addListener(callback);
      } catch (error) {
        logger.error('Failed to set up theme change listener:', error);
      }
    }
  }
};

/**
 * Get theme label for display
 * @param theme Theme mode
 * @returns Human-readable theme label
 */
export const getThemeLabel = (theme: ThemeMode): string => {
  switch (theme) {
    case 'light': return 'Light Mode';
    case 'dark': return 'Dark Mode';
    case 'system': return 'Use System Setting';
    default: return 'Unknown';
  }
};