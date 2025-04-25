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

export const validateDomain = (trueDomain: string, checkDomain: string): boolean => {
    return trueDomain === checkDomain;
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