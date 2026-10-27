import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { createErrorResponse, handleApiError } from '@/lib/api/api-errors';
import { parseJsonBody } from '@/lib/api/body-parser';
import { callStructured } from '@/lib/llm/call-structured';
import { AdviseOutputSchema } from '@/lib/llm/schemas';
import { EventStateSchema, PlanDiffSchema, ScenarioSchema } from '@/lib/domain/types';

const AdviseRequestSchema = z.object({
  state: EventStateSchema,
  diff: PlanDiffSchema,
  scenarios: z.array(ScenarioSchema).min(1),
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
    const body = AdviseRequestSchema.parse(rawBody);

    const output = await callStructured(
      'advise',
      {
        diff: body.diff,
        warnings: body.diff.addedWarnings,
        priorities_and_constraints: {
          priorities: body.state.priorities,
          constraints: body.state.constraints,
        },
        scenarios: body.scenarios,
      },
      AdviseOutputSchema,
      { temperature: 0.3 }
    );

    return NextResponse.json({
      summary: output.summary,
      options: output.options,
      recommendedScenarioId: output.recommendedScenarioId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
