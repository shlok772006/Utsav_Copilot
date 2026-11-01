import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { createErrorResponse, handleApiError } from '@/lib/api/api-errors';
import { parseJsonBody } from '@/lib/api/body-parser';
import { callStructured } from '@/lib/llm/call-structured';
import { IdeasOutputSchema } from '@/lib/llm/schemas';
import { BudgetLineSchema, EventStateSchema } from '@/lib/domain/types';

const IdeasRequestSchema = z.object({
  state: EventStateSchema,
  budgetLines: z.array(BudgetLineSchema).min(1),
  feedback: z.string().optional(),
});

/**
 * POST /api/ideas
 *
 * Cultural celebration theme & concept ideation endpoint.
 * Generates thematic concepts tailored to cultural tradition, scale, and budget lines.
 *
 * Invariants:
 * - Employs relative cost levels (budget-friendly, moderate, premium) rather than invented rupee prices.
 * - Adheres to cultural authenticity and user taste constraints.
 *
 * @param req - NextRequest containing EventState, BudgetLines, and optional user feedback.
 * @returns NextResponse containing structured concept array.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      429,
      'RATE_LIMITED',
      `Rate limit exceeded. Please wait ${Math.ceil(rateLimit.resetMs / 1000)}s before retrying.`,
      true
    );
  }

  try {
    const rawBody = await parseJsonBody<unknown>(req);
    const body = IdeasRequestSchema.parse(rawBody);

    const output = await callStructured(
      'ideas',
      {
        state: body.state,
        budget_lines: body.budgetLines,
        feedback: body.feedback || 'None provided',
      },
      IdeasOutputSchema,
      { temperature: 0.7 }
    );

    return NextResponse.json({
      concepts: output.concepts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
