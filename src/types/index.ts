// Template interface
export interface Template {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  enabled: boolean;
  includePageContent: boolean;
  domainSpecific: boolean;
  domain: string;
  isDefault?: boolean;
}

// Theme options
export type ThemeMode = 'light' | 'dark' | 'system';

// Settings interface
export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
  theme: ThemeMode;
}

// Message interfaces
export interface Message {
  action: string;
  [key: string]: any;
}

export interface FillTemplateMessage extends Message {
  action: 'fillTemplate';
  template: Template;
}

export interface ShowTemplateSelectorMessage extends Message {
  action: 'showTemplateSelector';
  templates: Template[];
}

export interface GenerateTextMessage extends Message {
  action: 'generateText';
  systemPrompt: string;
  userPrompt: string;
  pageContent?: string;
}

export interface ContentScriptReadyMessage extends Message {
  action: 'contentScriptReady';
}

export interface TemplatesUpdatedMessage extends Message {
  action: 'templatesUpdated';
}

export interface PingMessage extends Message {
  action: 'ping';
}

export interface GetPageContentMessage extends Message {
  action: 'getPageContent';
}

export interface GetPageContentResponse {
  content: string;
}

export interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface PingResponse {
  status: 'ready';
}

export interface SuccessResponse {
  success: boolean;
}

// Union type for all possible messages
export type MessageTypes = 
  | FillTemplateMessage
  | ShowTemplateSelectorMessage
  | GenerateTextMessage
  | ContentScriptReadyMessage
  | TemplatesUpdatedMessage
  | PingMessage
  | GetPageContentMessage;