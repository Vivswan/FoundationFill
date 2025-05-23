/**
 * Animation Service
 * Provides loading animation while text is being generated
 * Handles timeouts and cleanup of animation intervals
 */
import {DOMUtils} from "../utils/dom-utils";
import {getTranslation} from "../localization/translations";

/**
 * Starts a "Generating..." animation in the given DOM element
 * @param domElement - The DOM element to show animation in (usually a text field)
 * @param timeout - Maximum time to show animation before auto-stopping (ms)
 * @returns Function to stop the animation manually
 */
export function generatingAnimation(domElement: HTMLElement, timeout: number): () => void {
    if (!DOMUtils.isTextInput(domElement)) return () => {
    };

    let loadingAnimationInterval: number | null = null;
    let loadingDots = '';
    let autoStopTimeout: number | null = null;

    /**
     * Stops the loading animation
     * Clears both the animation interval and auto-stop timeout
     */
    function stopLoadingAnimation(): void {
        if (loadingAnimationInterval !== null) {
            clearInterval(loadingAnimationInterval);
            loadingAnimationInterval = null;
        }

        if (autoStopTimeout !== null) {
            clearTimeout(autoStopTimeout);
            autoStopTimeout = null;
        }
    }

    /**
     * Starts the loading animation in the specified DOM element
     * Shows a "Generating..." text with animated dots (up to 3)
     *
     * @param element - The DOM element to show animation in
     */
    function startLoadingAnimation(element: HTMLElement): void {
        // Clear any existing animation and timeout
        stopLoadingAnimation();

        // Initialize loading text
        loadingDots = '';
        const generatingText = getTranslation('generation.generating');
        DOMUtils.updateText(element, `${generatingText}${loadingDots}`);

        // Set up animation interval
        loadingAnimationInterval = window.setInterval(() => {
            // Add dots, cycle through 1-3 dots
            loadingDots += '.';
            if (loadingDots.length > 3) {
                loadingDots = '.';
            }
            DOMUtils.updateText(element, `${generatingText}${loadingDots}`);
        }, 500);

        // Auto-stop the animation after the specified timeout
        autoStopTimeout = window.setTimeout(() => {
            stopLoadingAnimation();
        }, timeout);
    }

    // Start the loading animation
    startLoadingAnimation(domElement);

    return stopLoadingAnimation;
}

