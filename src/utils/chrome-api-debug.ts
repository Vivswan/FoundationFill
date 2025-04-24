/**
 * This is a debugging helper to check if Chrome API calls are working
 */

// Debug function
function debug(msg: string, ...data: unknown[]) {
  if (data.length > 0) {
    console.log(`%c[CHROME_API] ${msg}`, 'color: red; font-weight: bold', ...data);
  } else {
    console.log(`%c[CHROME_API] ${msg}`, 'color: red; font-weight: bold');
  }
}

// Initialize the debug patches
export function initChromeApiDebug() {
  debug("Initializing Chrome API Debug Helpers");
  
  // Save original chrome.storage.sync.get
  const originalGet = chrome.storage.sync.get;
  
  // @ts-expect-error Overriding Chrome API for debugging
  chrome.storage.sync.get = function(
    keys: string | string[] | Record<string, unknown> | null, 
    callback?: (result: Record<string, unknown>) => void
  ) {
    debug("storage.sync.get called with keys:", keys);
    
    // Create a default response if we're looking for templates but they don't exist
    if (Array.isArray(keys) && keys.includes('templates')) {
      debug("Getting templates - using mock if needed");
      return originalGet.call(chrome.storage.sync, keys, function(result: Record<string, unknown>) {
        debug("storage.sync.get original result:", result);
        if (!result || !result.templates || !Array.isArray(result.templates) || !result.templates.length) {
          debug("No templates found, returning mock template");
          // Inject a mock template
          result = result || {};
          result.templates = [{
            id: 'mock-default',
            name: 'Mock Default Template',
            systemPrompt: 'You are a helpful assistant.',
            userPrompt: '',
            enabled: true,
            includePageContent: false,
            domainSpecific: false,
            domain: '',
            isDefault: true
          }];
        }
        if (callback) callback(result);
      });
    }
    
    // Normal processing
    debug("Calling original storage.sync.get");
    return originalGet.call(chrome.storage.sync, keys, callback as any);
  };
  
  debug("Chrome API Debug Helpers Initialized");
}

// Initialize when this module is imported
initChromeApiDebug();