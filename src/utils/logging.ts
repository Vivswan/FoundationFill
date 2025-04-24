// Central logging utility for consistent logging across the extension

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

// Generic logging function
export function log(type: keyof typeof LOG_COLORS, prefix: string, msg: string, ...data: any[]) {
  if (data && data.length > 0) {
    console.log(`%c[${prefix}] ${msg}`, LOG_COLORS[type], ...data);
  } else {
    console.log(`%c[${prefix}] ${msg}`, LOG_COLORS[type]);
  }
}

// Specific logging functions
export const debug = (prefix: string, msg: string, ...data: any[]) => 
  log('DEBUG', prefix, msg, ...data);

export const info = (prefix: string, msg: string, ...data: any[]) => 
  log('INFO', prefix, msg, ...data);

export const warn = (prefix: string, msg: string, ...data: any[]) => 
  log('WARN', prefix, msg, ...data);

export const error = (prefix: string, msg: string, ...data: any[]) => 
  log('ERROR', prefix, msg, ...data);

// Component-specific loggers
export const createLogger = (component: string) => ({
  debug: (msg: string, ...data: any[]) => log('DEBUG', component, msg, ...data),
  info: (msg: string, ...data: any[]) => log('INFO', component, msg, ...data),
  warn: (msg: string, ...data: any[]) => log('WARN', component, msg, ...data),
  error: (msg: string, ...data: any[]) => log('ERROR', component, msg, ...data)
});