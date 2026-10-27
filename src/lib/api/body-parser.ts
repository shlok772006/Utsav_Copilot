import { NextRequest } from 'next/server';
import { RATE_LIMIT_CONFIG } from '../config/limits';

export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload size exceeds the 20 KB limit.') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Safely parses JSON from NextRequest, enforcing the 20 KB size cap.
 * Throws PayloadTooLargeError if payload exceeds limit.
 */
export async function parseJsonBody<T>(req: NextRequest): Promise<T> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > RATE_LIMIT_CONFIG.maxBodySizeBytes) {
    throw new PayloadTooLargeError(
      `Request body (${contentLength} bytes) exceeds the maximum allowed size of ${RATE_LIMIT_CONFIG.maxBodySizeBytes} bytes (20 KB).`
    );
  }

  const rawText = await req.text();
  const byteLength = new TextEncoder().encode(rawText).length;

  if (byteLength > RATE_LIMIT_CONFIG.maxBodySizeBytes) {
    throw new PayloadTooLargeError(
      `Request body (${byteLength} bytes) exceeds the maximum allowed size of ${RATE_LIMIT_CONFIG.maxBodySizeBytes} bytes (20 KB).`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (e) {
    throw new Error(`Malformed JSON payload: ${e instanceof Error ? e.message : String(e)}`);
  }
}
