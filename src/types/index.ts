// Template interface


// Panel options
export type Panel = 'setting' | 'template';

// Message interfaces
export interface Message {
  action: string;
  [key: string]: unknown;
}

export interface GenerateTextMessage extends Message {
  action: 'generateText';
  systemPrompt: string;
  userPrompt: string;
  pageContent?: string;
}

export interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// Union type for all possible messages
export type MessageTypes =
    | GenerateTextMessage
