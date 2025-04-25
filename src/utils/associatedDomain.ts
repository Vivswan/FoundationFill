import {getCurrentTab} from "./chrome-api-utils";
import {createLogger} from "./logging";


const logger = createLogger('ASSOCIATED_DOMAIN');

export const extractDomainFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
    } catch (error) {
        return '';
    }
};

/**
 * Validate if a domain matches a pattern with support for wildcards
 * @param pattern The domain pattern (possibly with wildcards) to match against
 * @param domain The actual domain to check
 * @returns True if the domain matches the pattern, false otherwise
 */
export const validateDomain = (pattern: string, domain: string): boolean => {
    // Handle empty cases
    if (!pattern || !domain) {
        return false;
    }

    // Clean and normalize domains for comparison
    pattern = pattern.trim().toLowerCase();
    domain = domain.trim().toLowerCase();

    // Exact match check
    if (pattern === domain) return true;

    // Wildcard pattern handling
    if (pattern.startsWith('*.')) {
        const patternBase = pattern.substring(2); // Remove the *. prefix

        // Case 1: Direct domain match
        if (patternBase === domain) return true;

        // Case 2: Subdomain match
        // Ensure it's a proper subdomain by checking if domain ends with .patternBase
        // This prevents *.example.com from matching "badexample.com"
        if (domain.endsWith('.' + patternBase)) {
            // Verify there's at least one subdomain character before the dot
            const subdomainPart = domain.slice(0, domain.length - patternBase.length - 1);
            if (subdomainPart && subdomainPart.length > 0) {
                logger.debug(`Domain match (wildcard subdomain): ${domain} matches pattern ${pattern}`);
                return true;
            }
        }
    }

    return false;
}

/**
 * Get the domain of the current active tab
 */
export const getCurrentDomain = async (): Promise<string> => {
    try {
        const tab = await getCurrentTab();
        if (tab?.url) {
            return extractDomainFromUrl(tab.url);
        }
        return '';
    } catch (error) {
        logger.error('Error getting current domain:', error);
        return '';
    }
};