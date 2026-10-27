import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { LlmBadOutputError, LlmUnavailableError } from '../llm/call-structured';

export type ApiErrorCode =
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'LLM_UNAVAILABLE'
  | 'LLM_BAD_OUTPUT'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
    details?: string[];
  };
}

export function createErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  retryable = false,
  details?: string[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        retryable,
        details,
      },
    },
    { status }
  );
}

export function handleApiError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return createErrorResponse(400, 'VALIDATION', 'Invalid request body shape.', false, issues);
  }

  if (err instanceof LlmBadOutputError) {
    return createErrorResponse(502, 'LLM_BAD_OUTPUT', err.message, true, err.validationErrors);
  }

  if (err instanceof LlmUnavailableError) {
    return createErrorResponse(503, 'LLM_UNAVAILABLE', err.message, true);
  }

  if (err instanceof Error && err.name === 'PayloadTooLargeError') {
    return createErrorResponse(413, 'PAYLOAD_TOO_LARGE', err.message, false);
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
  return createErrorResponse(500, 'INTERNAL_ERROR', message, false);
}
