import { z } from 'zod';
import { LlmClient } from './client';
import { GeminiClient } from './gemini-client';
import { loadPrompt, PromptId } from './prompts-loader';
import { getJsonSchema } from './schemas';

export class LlmBadOutputError extends Error {
  public code = 'LLM_BAD_OUTPUT' as const;
  public retryable = true;
  public validationErrors?: string[];

  constructor(message: string, validationErrors?: string[]) {
    super(message);
    this.name = 'LlmBadOutputError';
    this.validationErrors = validationErrors;
  }
}

export class LlmUnavailableError extends Error {
  public code = 'LLM_UNAVAILABLE' as const;
  public retryable = true;

  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

export interface CallStructuredOptions {
  temperature?: number;
  version?: string;
  client?: LlmClient;
}

let defaultClient: LlmClient | null = null;

export function setDefaultLlmClient(client: LlmClient | null): void {
  defaultClient = client;
}

export function getDefaultLlmClient(): LlmClient {
  if (defaultClient) {
    return defaultClient;
  }
  return new GeminiClient();
}

/**
 * Pure wrapper for structured LLM interaction:
 * 1. Loads prompt and interpolates variables.
 * 2. Generates JSON response matching Zod schema.
 * 3. On initial validation failure, triggers ONE repair call.
 * 4. On second failure, throws LlmBadOutputError.
 * 5. Logs metadata safely without logging untrusted user text.
 */
export async function callStructured<T>(
  promptId: PromptId,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  options: CallStructuredOptions = {}
): Promise<T> {
  const client = options.client || getDefaultLlmClient();
  const temperature = options.temperature ?? 0.1;
  const version = options.version ?? 'v1';

  const promptText = loadPrompt(promptId, variables, version);
  const jsonSchema = getJsonSchema(schema);

  let rawResponse: string;
  try {
    rawResponse = await client.generateStructured(promptText, jsonSchema, { temperature });
  } catch (err) {
    throw new LlmUnavailableError(
      `LLM generation request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Attempt 1: Parse and validate
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawResponse);
  } catch {
    parsedJson = null;
  }

  if (parsedJson !== null) {
    const parseResult = schema.safeParse(parsedJson);
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  // Attempt 2: ONE repair retry
  const firstErrors = parsedJson ? schema.safeParse(parsedJson) : null;
  const errorDetails = firstErrors && !firstErrors.success
    ? firstErrors.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    : 'Invalid JSON format or missing expected schema fields';

  const repairPrompt = `${promptText}

---
CRITICAL REPAIR INSTRUCTION:
Your previous output failed schema validation with the following error(s):
${errorDetails}

Please return the corrected JSON object matching the required schema ONLY. No markdown formatting, no comments.`;

  let repairResponse: string;
  try {
    repairResponse = await client.generateStructured(repairPrompt, jsonSchema, { temperature: 0.0 });
  } catch (err) {
    throw new LlmBadOutputError(
      `Repair LLM request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    const repairParsed = JSON.parse(repairResponse);
    const repairResult = schema.safeParse(repairParsed);
    if (repairResult.success) {
      return repairResult.data;
    }
    const finalIssues = repairResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new LlmBadOutputError(`Output failed schema validation after repair attempt: ${finalIssues.join(', ')}`, finalIssues);
  } catch (err) {
    if (err instanceof LlmBadOutputError) throw err;
    throw new LlmBadOutputError(`Failed to parse repaired LLM output as JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}
