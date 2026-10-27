import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimits } from '@/lib/api/rate-limit';
import { setDefaultLlmClient } from '@/lib/llm/call-structured';
import { FakeLlmClient } from '@/lib/llm/fake-client';
import { createTestEventState } from '@/test/fixtures';
import { POST as intakeHandler } from './intake/route';
import { POST as changeHandler } from './change/route';
import { POST as adviseHandler } from './advise/route';
import { POST as ideasHandler } from './ideas/route';
import { POST as quoteHandler } from './quote/route';

describe('API Routes Integration & Security', () => {
  let fakeClient: FakeLlmClient;

  beforeEach(() => {
    resetRateLimits();
    fakeClient = new FakeLlmClient();
    setDefaultLlmClient(fakeClient);
  });

  function createNextRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
    const jsonString = JSON.stringify(body);
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(Buffer.byteLength(jsonString)),
        'x-forwarded-for': '192.168.1.100',
        ...headers,
      },
      body: jsonString,
    });
  }

  it('rejects oversized request body with 413 PAYLOAD_TOO_LARGE', async () => {
    // Generate a payload > 20 KB
    const bigString = 'A'.repeat(25 * 1024);
    const req = createNextRequest('http://localhost:3000/api/change', {
      state: createTestEventState(),
      text: bigString,
    });

    const res = await changeHandler(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects malformed request body shape with 400 VALIDATION', async () => {
    const req = createNextRequest('http://localhost:3000/api/change', {
      invalidField: true,
    });

    const res = await changeHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION');
  });

  it('enforces rate limit returning 429 RATE_LIMITED after max requests', async () => {
    fakeClient.queueResponses(
      Array(25).fill(JSON.stringify({ ops: [], clarification: null }))
    );

    const validBody = {
      state: createTestEventState(),
      text: 'make food priority 5',
    };

    let lastStatus = 200;
    // Limit is 20 requests
    for (let i = 0; i < 22; i++) {
      const req = createNextRequest('http://localhost:3000/api/change', validBody, {
        'x-forwarded-for': '10.0.0.1',
      });
      const res = await changeHandler(req);
      lastStatus = res.status;
      if (res.status === 429) {
        const data = await res.json();
        expect(data.error.code).toBe('RATE_LIMITED');
        break;
      }
    }

    expect(lastStatus).toBe(429);
  });

  it('/api/intake successfully processes messages and returns assistantMessage and ops', async () => {
    fakeClient.queueResponse(
      JSON.stringify({
        ops: [{ op: 'set_budget', value: 300000 }],
        date_hint: 'in 5 weeks',
        assistantMessage: 'Understood. A budget of ₹3 Lakhs has been recorded.',
        readyToPlan: false,
      })
    );

    const req = createNextRequest('http://localhost:3000/api/intake', {
      state: createTestEventState({ totalBudget: undefined }),
      messages: [{ role: 'user', content: 'Our budget is 3 lakh and event is in 5 weeks.' }],
    });

    const res = await intakeHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistantMessage).toContain('₹3 Lakhs');
    expect(data.stateUpdates).toHaveLength(1);
    expect(data.date_hint).toBe('in 5 weeks');
  });

  it('/api/change parses relative operations correctly', async () => {
    fakeClient.queueResponse(
      JSON.stringify({
        ops: [{ op: 'scale_budget', factor: 0.5 }],
        clarification: null,
      })
    );

    const req = createNextRequest('http://localhost:3000/api/change', {
      state: createTestEventState(),
      text: 'our budget dropped by 50%',
    });

    const res = await changeHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ops[0].op).toBe('scale_budget');
    expect(data.ops[0].factor).toBe(0.5);
  });

  it('/api/advise returns structured tradeoff summary and scenario recommendations', async () => {
    fakeClient.queueResponse(
      JSON.stringify({
        summary: 'Budget scaled down; catering per guest decreased.',
        options: [
          {
            scenarioId: 'trim-guests',
            headline: 'Trim Guest Count',
            why: 'Maintains per-head food quality',
            tradeoff: 'Smaller invite list',
          },
        ],
        recommendedScenarioId: 'trim-guests',
      })
    );

    const req = createNextRequest('http://localhost:3000/api/advise', {
      state: createTestEventState(),
      diff: {
        budgetDeltas: [],
        shiftedTasks: [],
        statusChanges: [],
        addedWarnings: [],
        resolvedWarnings: [],
      },
      scenarios: [
        {
          id: 'trim-guests',
          headline: 'Trim Guest Count',
          why: 'Preserves quality',
          ops: [{ op: 'scale_guest_count', factor: 0.85 }],
          tradeoff: 'Smaller gathering',
        },
      ],
    });

    const res = await adviseHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.recommendedScenarioId).toBe('trim-guests');
  });

  it('/api/ideas returns 3 concept cards without rupee amounts', async () => {
    fakeClient.queueResponse(
      JSON.stringify({
        concepts: [
          {
            name: 'Royal Heritage Courtyard',
            vibe: 'Warm marigolds and acoustic sitar',
            whereMoneyGoes: 'Prioritizes grand regional feast',
            costLevel: 'similar',
            comfortNotes: 'Ramps and lounge seating for elders',
            risks: 'Weather sensitivity',
            firstThreeSteps: ['Book courtyard', 'Draft menu', 'Audio sync'],
          },
          {
            name: 'Minimal Chic Evening',
            vibe: 'Modern lights and cocktail tables',
            whereMoneyGoes: 'Live counters and photography',
            costLevel: 'lower',
            comfortNotes: 'Dedicated kid activity corner',
            risks: 'Venue capacity',
            firstThreeSteps: ['Lock hall', 'DJ booking', 'Outfit trial'],
          },
          {
            name: 'Festive Carnival',
            vibe: 'Colorful drapes and folk music',
            whereMoneyGoes: 'Entertainment and dessert stations',
            costLevel: 'higher',
            comfortNotes: 'Ample shaded seating',
            risks: 'Turnaround time',
            firstThreeSteps: ['Decor vendor', 'Musicians', 'Lighting grid'],
          },
        ],
      })
    );

    const req = createNextRequest('http://localhost:3000/api/ideas', {
      state: createTestEventState(),
      budgetLines: [
        {
          category: 'catering',
          share: 0.35,
          amount: 350000,
          provenance: 'derived',
        },
      ],
      feedback: 'Focus on good food',
    });

    const res = await ideasHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.concepts).toHaveLength(3);
    data.concepts.forEach((c: { costLevel: string }) => {
      expect(['lower', 'similar', 'higher']).toContain(c.costLevel);
    });
  });

  it('/api/quote structures vendor quotations and surfaces concrete questions', async () => {
    fakeClient.queueResponse(
      JSON.stringify({
        vendorName: 'Shahi Biryani & Caterers',
        category: 'catering',
        totalPrice: null,
        unitPrice: 950,
        unitLabel: 'per plate',
        guestsCovered: 200,
        inclusions: ['4 starters', '2 main gravies', 'gulab jamun'],
        exclusions: ['Mineral water', 'Live chaat stall'],
        additionalCharges: ['GST 18% extra'],
        paymentTerms: '50% advance',
        validity: '15 days',
        missing: ['totalPrice'],
        questionsToAsk: [
          'Is 18% GST extra on the final bill?',
          'Are service staff uniforms and crockery provided?',
        ],
      })
    );

    const req = createNextRequest('http://localhost:3000/api/quote', {
      state: createTestEventState(),
      category: 'catering',
      rawText: 'Rs 950 per plate for 200 guests. GST extra. 50% advance.',
    });

    const res = await quoteHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.extraction.vendorName).toBe('Shahi Biryani & Caterers');
    expect(data.extraction.unitPrice).toBe(950);
    expect(data.questionsToAsk.length).toBeGreaterThan(0);
  });
});
