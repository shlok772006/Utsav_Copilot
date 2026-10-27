export interface StructuredGenerationOptions {
  temperature?: number;
  systemInstruction?: string;
}

export interface LlmClient {
  generateStructured(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: StructuredGenerationOptions
  ): Promise<string>;
}
