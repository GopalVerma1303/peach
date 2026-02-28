import type { AIProvider, AIGenerateParams } from './ai.js';

/** Groq API (e.g. llama) */
export function createGroqProvider(apiKey: string): AIProvider {
  return {
    async generateContent(params: AIGenerateParams): Promise<string> {
      const body = {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `Mode: ${params.mode}. Respond with the requested content only, no preamble.` },
          { role: 'user', content: buildPrompt(params) },
        ],
        max_tokens: 1024,
      };
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}

/** Google Gemini API */
export function createGeminiProvider(apiKey: string): AIProvider {
  return {
    async generateContent(params: AIGenerateParams): Promise<string> {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(params) }] }],
            generationConfig: { maxOutputTokens: 1024 },
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    },
  };
}

/** Custom backend URL (POST with same params) */
export function createCustomAIProvider(url: string): AIProvider {
  return {
    async generateContent(params: AIGenerateParams): Promise<string> {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { text?: string };
      return data.text ?? '';
    },
  };
}

function buildPrompt(params: AIGenerateParams): string {
  const parts: string[] = [params.prompt];
  if (params.selectedText) parts.push(`Selected text:\n${params.selectedText}`);
  if (params.noteContent) parts.push(`Note content:\n${params.noteContent}`);
  return parts.join('\n\n');
}
