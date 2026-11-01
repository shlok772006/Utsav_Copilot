import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { createErrorResponse, handleApiError } from '@/lib/api/api-errors';
import { parseJsonBody } from '@/lib/api/body-parser';
import { callStructured } from '@/lib/llm/call-structured';
import { QuoteExtractionOutputSchema } from '@/lib/llm/schemas';
import { CoreCategorySchema, EventStateSchema } from '@/lib/domain/types';

const QuoteRequestSchema = z.object({
  state: EventStateSchema,
  category: CoreCategorySchema,
  rawText: z.string().min(1),
});

/**
 * POST /api/quote
 *
 * Unstructured vendor quote text extraction endpoint.
 * Ingests raw vendor quotes, WhatsApp messages, or estimate notes, extracting
 * structured line items, taxes, deliverables, and clarification questions.
 *
 * Invariants:
 * - Never hallucinates unmentioned prices, deliverables, or payment terms.
 * - Leaves absent fields as null or unstated with high fidelity.
 * - Extracts granular line items for downstream deterministic calculation.
 *
 * @param req - NextRequest containing EventState, category, and rawQuoteText.
 * @returns NextResponse with extraction results and follow-up vendor questions.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      429,
      'RATE_LIMITED',
      `Rate limit exceeded. Please wait ${Math.ceil(rateLimit.resetMs / 1000)}s before retrying.`,
      true,
    );
  }

  try {
    const rawBody = await parseJsonBody<unknown>(req);
    const body = QuoteRequestSchema.parse(rawBody);

    const output = await callStructured(
      'quote',
      {
        category: body.category,
        raw_quote_text: body.rawText,
      },
      QuoteExtractionOutputSchema,
      { temperature: 0.1 },
    );

    return NextResponse.json({
      extraction: output,
      questionsToAsk: output.questionsToAsk,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
