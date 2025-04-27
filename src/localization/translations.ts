/**
 * Localization
 * Contains translations for all UI elements in different languages
 * Loads translations from YAML files
 */
import enTranslations from './en.yaml';
import zhCNTranslations from './zh-CN.yaml';
import zhTWTranslations from './zh-TW.yaml';

// Type definition for translation structure
export type Translation = typeof enTranslations;

/**
 * Language options for the application
 * @type Language
 */
export type Language = 'en' | 'zh-CN' | 'zh-TW';

/**
 * Translations object
 * Maps language codes to their respective translation objects
 */
export const translations: Record<Language, Translation> = {
    'en': enTranslations,
    'zh-CN': zhCNTranslations,
    'zh-TW': zhTWTranslations,
};

/**
 * Get the current language of the document
 * @returns Language code (e.g., 'en', 'zh-CN', 'zh-TW')
 */
export function getDocumentLanguage(): Language {
    const lang = document.documentElement.getAttribute('data-foundation-fill-language');
    return lang as Language || 'en';
}

/**
 * Get the browser's preferred language
 * Matches to supported languages or falls back to 'en' if no match found
 * 
 * @returns Closest matching supported language code
 */
export function getBrowserLanguage(): Language {
    // Get browser language (e.g., 'en-US', 'zh-CN', etc.)
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    
    // Convert to lowercase for case-insensitive matching
    const langLower = browserLang.toLowerCase();
    
    // Direct match with supported language
    if (langLower in translations) {
        return langLower as Language;
    }
    
    // Check for language base (e.g., 'en-US' → 'en')
    const baseLang = langLower.split('-')[0];
    
    // Match with supported languages
    if (baseLang === 'zh') {
        // For Chinese, we need to differentiate between variants
        if (langLower.includes('cn') || langLower.includes('hans')) {
            return 'zh-CN';  // Simplified Chinese
        } else if (langLower.includes('tw') || langLower.includes('hant') || langLower.includes('hk')) {
            return 'zh-TW';  // Traditional Chinese
        }
        // For other Chinese variants, default to Simplified
        return 'zh-CN';
    } else if (baseLang === 'en') {
        return 'en';
    }
    
    // Fallback to English for unsupported languages
    return 'en';
}

/**
 * Set the document language attribute
 * @param language Language code (e.g., 'en', 'zh-CN', 'zh-TW')
 */
export function setDocumentLanguage(language: Language) {
    document.documentElement.setAttribute('data-foundation-fill-language', language);
}

/**
 * Get all available languages
 * @returns Array of language codes
 */
export function getAllLanguages(): Language[] {
    return Object.keys(translations) as Language[];
}


/**
 * Get translated text based on the current language
 * @param key Translation key path using dot notation (e.g., 'settings.title')
 * @param language Optional language code, defaults to current UI language
 * @returns Translated text string
 */
export function getTranslation(key: string, language: string | null = null): string {
    if (!language) {
        language = document.documentElement.getAttribute('data-foundation-fill-language') || 'en';
    }

    // Default to English if the language is not supported
    const currentLanguage = (translations[language as Language]) ? language as Language : 'en';

    // Parse the key path (e.g., 'settings.title' => ['settings', 'title'])
    const keyPath = key.split('.');

    // Traverse the translation object to find the value
    let result: Translation = translations[currentLanguage];
    for (const k of keyPath) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            // If key doesn't exist in the current language, fall back to English
            result = getTranslationFallback(key);
            break;
        }
    }
    return result as string;
}

/**
 * Fallback function to get English translation
 * @param key Translation key path
 * @returns English translation
 */
function getTranslationFallback(key: string): string {
    const keyPath = key.split('.');
    let result: Translation = translations['en'];

    for (const k of keyPath) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; // Return the key itself if not found
        }
    }
    return result as string;
}