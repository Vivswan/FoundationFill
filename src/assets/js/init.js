// Initialization script for popup
console.log('[Popup] Initializing...');

// Set up error handlers
window.addEventListener('error', function (event) {
  console.error('[POPUP_ERROR]', event.error);
});

window.addEventListener('unhandledrejection', function (event) {
  console.error('[POPUP_UNHANDLED_REJECTION]', event.reason);
});

// Check Chrome API availability
console.log('[Popup] Chrome API available:', typeof chrome !== 'undefined', chrome);