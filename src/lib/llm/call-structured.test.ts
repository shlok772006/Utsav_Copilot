import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { callStructured, LlmBadOutputError, LlmUnavailableError } from './call-structured';
import { FakeLlmClient } from './fake-client';

const TestSchema = z.object({
  greeting: z.string(),
  count: z.number(),
});

describe('callStructured with repair retry', () => {
  it('succeeds on first attempt when valid JSON is returned', async () => {
    const validJson = JSON.stringify({ greeting: 'Namaste', count: 108 });
    const fakeClient = new FakeLlmClient([validJson]);

    const result = await callStructured(
      'change',
      { current_state: {}, user_input: 'test' },
      TestSchema,
      { client: fakeClient }
    );

    expect(result).toEqual({ greeting: 'Namaste', count: 108 });
    expect(fakeClient.calls).toHaveLength(1);
  });

  it('triggers exactly one repair retry on invalid JSON and succeeds when repair returns valid JSON', async () => {
    const badJson = '{"greeting": 12345}'; // invalid type for greeting, missing count
    const repairedJson = JSON.stringify({ greeting: 'Corrected Namaste', count: 50 });
    const fakeClient = new FakeLlmClient([badJson, repairedJson]);

    const result = await callStructured(
      'change',
      { current_state: {}, user_input: 'test' },
      TestSchema,
      { client: fakeClient }
    );

    expect(result).toEqual({ greeting: 'Corrected Namaste', count: 50 });
    expect(fakeClient.calls).toHaveLength(2);
    // Check that repair prompt included repair instruction
    expect(fakeClient.calls[1].prompt).toContain('CRITICAL REPAIR INSTRUCTION');
  });

  it('throws LlmBadOutputError when repair attempt also fails', async () => {
    const badJson1 = '{"greeting": 12345}';
    const badJson2 = 'not valid json at all';
    const fakeClient = new FakeLlmClient([badJson1, badJson2]);

    await expect(
      callStructured(
        'change',
        { current_state: {}, user_input: 'test' },
        TestSchema,
        { client: fakeClient }
      )
    ).rejects.toThrow(LlmBadOutputError);

    expect(fakeClient.calls).toHaveLength(2);
  });

  it('throws LlmUnavailableError when client throws a connection error', async () => {
    const fakeClient = new FakeLlmClient([new Error('Network failure')]);

    await expect(
      callStructured(
        'change',
        { current_state: {}, user_input: 'test' },
        TestSchema,
        { client: fakeClient }
      )
    ).rejects.toThrow(LlmUnavailableError);
  });
});
