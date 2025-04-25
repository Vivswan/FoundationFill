// Template interface
export interface Template {
  id: string;
  enabled: boolean;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  includePageContent: boolean;
  domain: string | null;
}

// Theme options
export type ThemeMode = 'light' | 'dark' | 'system';

// Panel options
export type Panel = 'setting' | 'template';

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

  [key: string]: unknown;
}

export interface FillTemplateMessage extends Message {
  action: 'fillTemplate';
  template: Template;
  status?: 'loading' | 'success' | 'error';
  error?: string;
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

export interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
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