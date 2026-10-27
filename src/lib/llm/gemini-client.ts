import { GoogleGenAI } from '@google/genai';
import { LlmClient, StructuredGenerationOptions } from './client';

export class GeminiClient implements LlmClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY environment variable is missing. Add it to .env.local.'
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generateStructured(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: StructuredGenerationOptions
  ): Promise<string> {
    const config: Record<string, unknown> = {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    };

    if (typeof options?.temperature === 'number') {
      config.temperature = options.temperature;
    }
    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;
  }
}
