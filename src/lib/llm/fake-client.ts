import { LlmClient, StructuredGenerationOptions } from './client';

export interface RecordedLlmCall {
  prompt: string;
  jsonSchema: Record<string, unknown>;
  options?: StructuredGenerationOptions;
}

/**
 * Deterministic in-memory fake LLM client for unit tests and CI evals.
 * Can return queued responses, fail with errors, and records all invocations.
 */
export class FakeLlmClient implements LlmClient {
  private responseQueue: Array<string | Error> = [];
  public calls: RecordedLlmCall[] = [];

  constructor(initialResponses: Array<string | Error> = []) {
    this.responseQueue = [...initialResponses];
  }

  queueResponse(response: string | Error): void {
    this.responseQueue.push(response);
  }

  queueResponses(responses: Array<string | Error>): void {
    this.responseQueue.push(...responses);
  }

  async generateStructured(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: StructuredGenerationOptions
  ): Promise<string> {
    this.calls.push({ prompt, jsonSchema, options });

    if (this.responseQueue.length === 0) {
      throw new Error('FakeLlmClient: response queue is empty.');
    }

    const nextResponse = this.responseQueue.shift()!;
    if (nextResponse instanceof Error) {
      throw nextResponse;
    }

    return nextResponse;
  }

  reset(): void {
    this.responseQueue = [];
    this.calls = [];
  }
}
