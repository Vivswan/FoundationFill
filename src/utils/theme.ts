import { ThemeMode } from '../types';

/**
 * Apply the selected theme to the document/extension
 * @param theme Theme mode (light, dark, or system)
 */
export const applyTheme = (theme: ThemeMode): void => {
  // Get the html element
  const html = document.documentElement;
  
  // Remove any existing theme classes
  html.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'system') {
    // Use system preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.add(prefersDarkMode ? 'theme-dark' : 'theme-light');
  } else {
    // Use selected theme
    html.classList.add(`theme-${theme}`);
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
    
    // Modern approach (recommended)
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', callback);
    } 
    // Deprecated but needed for some browsers
    else if ('addListener' in darkModeMediaQuery) {
      // @ts-ignore: Typings are missing for the deprecated method
      darkModeMediaQuery.addListener(callback);
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