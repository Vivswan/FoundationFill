import {DOMUtils} from "./dom-utils";


/**
 * Start generating animation in the given DOM element
 */
export function generatingAnimation(domElement: HTMLElement, timeout: number): () => void {
    if (!DOMUtils.isTextInput(domElement)) return () => {
    };

    let loadingAnimationInterval: number | null = null;
    let loadingDots = '';
    let autoStopTimeout: number | null = null;

    // Stop loading animation
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

    // Start loading animation in the text field
    function startLoadingAnimation(element: HTMLElement): void {
        // Clear any existing animation and timeout
        stopLoadingAnimation();

        // Initialize loading text
        loadingDots = '';
        updateLoadingText(element);

        // Set up animation interval
        loadingAnimationInterval = window.setInterval(() => {
            // Add dots, cycle through 1-3 dots
            loadingDots += '.';
            if (loadingDots.length > 3) {
                loadingDots = '.';
            }
            updateLoadingText(element);
        }, 500);

        // Auto-stop the animation after ANIMATION_TIMEOUT
        autoStopTimeout = window.setTimeout(() => {
            stopLoadingAnimation();
        }, timeout);
    }

    // Update the loading text in the element
    function updateLoadingText(element: HTMLElement): void {
        const loadingText = `Generating${loadingDots}`;

        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
            inputElement.value = loadingText;
            inputElement.dispatchEvent(new Event('input', {bubbles: true}));
        } else if (element.getAttribute('contenteditable') === 'true') {
            element.textContent = loadingText;
            element.dispatchEvent(new Event('input', {bubbles: true}));
        }
    }

    // Start the loading animation
    startLoadingAnimation(domElement);

    return stopLoadingAnimation;
}

