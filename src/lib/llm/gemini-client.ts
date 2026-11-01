import { GoogleGenAI } from '@google/genai';
import { LlmClient, StructuredGenerationOptions } from './client';

/**
 * Production implementation of LlmClient using Google GenAI SDK.
 * Incorporates intelligent cascading fallback across active Gemini models
 * and automatic retry for 503 transient service spikes.
 */
export class GeminiClient implements LlmClient {
  private client: GoogleGenAI;
  private model: string;

  /**
   * Initializes GeminiClient instance with API credentials and preferred model.
   *
   * @param apiKey - Optional API key (defaults to GEMINI_API_KEY environment variable).
   * @param model - Optional default model identifier (defaults to gemini-3.5-flash).
   */
  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY environment variable is missing. Add it to .env.local.'
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  }

  /**
   * Generates structured JSON output conforming to a JSON schema.
   *
   * @param prompt - Interpolated text prompt with fenced inputs.
   * @param jsonSchema - JSON Schema specification for response structure.
   * @param options - Generation options such as temperature and systemInstruction.
   * @returns Raw JSON string guaranteed to match schema structure.
   */
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

    const candidateModels = [
      this.model,
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError: unknown = null;

    for (const m of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await this.client.models.generateContent({
            model: m,
            contents: prompt,
            config,
          });

          const text = response.text;
          if (!text) {
            throw new Error('Gemini returned an empty response.');
          }

          return text;
        } catch (err: unknown) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('503')) {
            // Temporary demand spike, wait briefly and retry or cascade
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
          break;
        }
      }
    }

    throw lastError;
  }
}
