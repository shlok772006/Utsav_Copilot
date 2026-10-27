import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { createErrorResponse, handleApiError } from '@/lib/api/api-errors';
import { parseJsonBody } from '@/lib/api/body-parser';
import { callStructured } from '@/lib/llm/call-structured';
import { IntakeOutputSchema } from '@/lib/llm/schemas';
import { EventStateSchema } from '@/lib/domain/types';

const IntakeRequestSchema = z.object({
  state: EventStateSchema,
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).min(1),
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
    const body = IntakeRequestSchema.parse(rawBody);

    const latestUserMessage =
      [...body.messages].reverse().find((m) => m.role === 'user')?.content || '';

    const missingRequired: string[] = [];
    if (!body.state.occasion) missingRequired.push('occasion');
    if (!body.state.totalBudget || body.state.totalBudget <= 0) missingRequired.push('totalBudget');
    if (!body.state.guestCount || body.state.guestCount <= 0) missingRequired.push('guestCount');
    if (!body.state.eventDate) missingRequired.push('eventDate');

    const output = await callStructured(
      'intake',
      {
        current_state: body.state,
        missing_required: missingRequired,
        recent_messages: body.messages.slice(-6),
        latest_user_message: latestUserMessage,
      },
      IntakeOutputSchema,
      { temperature: 0.1 }
    );

    return NextResponse.json({
      assistantMessage: output.assistantMessage,
      stateUpdates: output.ops,
      readyToPlan: output.readyToPlan,
      date_hint: output.date_hint,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
