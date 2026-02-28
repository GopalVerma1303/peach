export type AIMode = 'expand' | 'summarize' | 'rewrite' | 'custom';

export interface AIGenerateParams {
  prompt: string;
  noteContent?: string;
  selectedText?: string;
  mode: AIMode;
}

export interface AIProvider {
  generateContent(params: AIGenerateParams): Promise<string>;
}

/** No-op provider when none configured */
export class NoOpAIProvider implements AIProvider {
  async generateContent(): Promise<string> {
    return '';
  }
}
