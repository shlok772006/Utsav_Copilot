import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { createErrorResponse, handleApiError } from '@/lib/api/api-errors';
import { parseJsonBody } from '@/lib/api/body-parser';
import { callStructured } from '@/lib/llm/call-structured';
import { ChangeOutputSchema } from '@/lib/llm/schemas';
import { EventStateSchema } from '@/lib/domain/types';

const ChangeRequestSchema = z.object({
  state: EventStateSchema,
  text: z.string().min(1),
});

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
    const body = ChangeRequestSchema.parse(rawBody);

    const output = await callStructured(
      'change',
      {
        current_state: body.state,
        user_input: body.text,
      },
      ChangeOutputSchema,
      { temperature: 0.1 }
    );

    return NextResponse.json({
      ops: output.ops,
      clarification: output.clarification,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
