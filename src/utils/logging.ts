/**
 * Logging Utility
 * Provides centralized, color-coded logging for the extension
 * Creates component-specific loggers with consistent formatting
 */

// Different log types with associated colors for better visibility
const LOG_COLORS = {
  DEBUG: 'color: blue; font-weight: bold',
  INFO: 'color: green;',
  WARN: 'color: orange; font-weight: bold',
  ERROR: 'color: red; font-weight: bold',
  POPUP: 'color: purple; font-weight: bold',
  TEMPLATE: 'color: green; font-weight: bold',
  BACKGROUND: 'color: darkblue; font-weight: bold',
  STORAGE: 'color: teal; font-weight: bold'
};

/**
 * Generic logging function that outputs color-coded log messages to the console
 *
 * @param type - The type of log message (determines the color)
 * @param prefix - The component prefix to identify the source
 * @param msg - The message text to log
 * @param data - Additional data to log (objects, arrays, etc.)
 */
export function log(type: keyof typeof LOG_COLORS, prefix: string, msg: string, ...data: unknown[]) {
  if (data && data.length > 0) {
    console.log(`%c[${prefix}] ${msg}`, LOG_COLORS[type], ...data);
  } else {
    console.log(`%c[${prefix}] ${msg}`, LOG_COLORS[type]);
  }
}

/**
 * Logs a debug level message with blue styling
 *
 * @param prefix - The component prefix to identify the source
 * @param msg - The message text to log
 * @param data - Additional data to log
 */
export const debug = (prefix: string, msg: string, ...data: unknown[]) =>
    log('DEBUG', prefix, msg, ...data);

/**
 * Logs an info level message with green styling
 *
 * @param prefix - The component prefix to identify the source
 * @param msg - The message text to log
 * @param data - Additional data to log
 */
export const info = (prefix: string, msg: string, ...data: unknown[]) =>
    log('INFO', prefix, msg, ...data);

/**
 * Logs a warning level message with orange styling
 *
 * @param prefix - The component prefix to identify the source
 * @param msg - The message text to log
 * @param data - Additional data to log
 */
export const warn = (prefix: string, msg: string, ...data: unknown[]) =>
    log('WARN', prefix, msg, ...data);

/**
 * Logs an error level message with red styling
 *
 * @param prefix - The component prefix to identify the source
 * @param msg - The message text to log
 * @param data - Additional data to log
 */
export const error = (prefix: string, msg: string, ...data: unknown[]) =>
    log('ERROR', prefix, msg, ...data);

/**
 * Creates a component-specific logger with all log levels
 * Provides a consistent interface for components to log messages
 *
 * @param component - The name of the component to create a logger for
 * @returns An object with debug, info, warn, and error logging methods
 * @example
 * const logger = createLogger('POPUP');
 * logger.debug('Initializing popup component');
 * logger.error('Failed to load settings', errorObj);
 */
export const createLogger = (component: string) => ({
  debug: (msg: string, ...data: unknown[]) => log('DEBUG', component, msg, ...data),
  info: (msg: string, ...data: unknown[]) => log('INFO', component, msg, ...data),
  warn: (msg: string, ...data: unknown[]) => log('WARN', component, msg, ...data),
  error: (msg: string, ...data: unknown[]) => log('ERROR', component, msg, ...data)
});