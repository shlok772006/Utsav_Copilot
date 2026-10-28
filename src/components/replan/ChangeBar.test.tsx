import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangeBar, HERO_DEMO_TEXT } from './ChangeBar';
import { useEventStore } from '@/lib/store/useEventStore';

describe('ChangeBar Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  it('renders input, submit button, and hero demo suggestion chip', () => {
    render(<ChangeBar onReplanReady={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Change anything/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Replan/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(HERO_DEMO_TEXT, 'i'))).toBeInTheDocument();
  });

  it('handles clarification response from /api/change gracefully', async () => {
    const onReplanReady = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        clarification: 'Did you mean to reduce the total budget or increase it?',
      }),
    } as unknown as Response);

    render(<ChangeBar onReplanReady={onReplanReady} />);

    const input = screen.getByPlaceholderText(/Change anything/i);
    const submitBtn = screen.getByRole('button', { name: /Replan/i });

    fireEvent.change(input, { target: { value: 'Make it different' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clarification needed:/i)).toBeInTheDocument();
      expect(screen.getByText(/Did you mean to reduce the total budget/i)).toBeInTheDocument();
    });

    expect(onReplanReady).not.toHaveBeenCalled();
  });

  it('submits change request and invokes onReplanReady on successful ops', async () => {
    useEventStore.getState().loadSampleEvent();
    const onReplanReady = vi.fn();

    global.fetch = vi
      .fn()
      .mockImplementation((url: string) => {
        if (url.includes('/api/change')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ops: [
                { op: 'set_budget', value: 200000 },
                { op: 'shift_date_days', days: -14 },
              ],
            }),
          } as Response);
        }
        if (url.includes('/api/advise')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              summary: 'Budget dropped to ₹2 Lakh with tight 3-week timeline.',
              options: [
                { scenarioId: 'direct-change', analysis: 'Direct cut across all categories.' },
              ],
              recommendedScenarioId: 'direct-change',
            }),
          } as Response);
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

    render(<ChangeBar onReplanReady={onReplanReady} />);

    // Click hero demo chip
    const heroChip = screen.getByText(new RegExp(HERO_DEMO_TEXT, 'i'));
    fireEvent.click(heroChip);

    await waitFor(() => {
      expect(onReplanReady).toHaveBeenCalledTimes(1);
    });

    const payload = onReplanReady.mock.calls[0][0];
    expect(payload.proposedState.totalBudget).toBe(200000);
    expect(payload.diff.budgetDeltas.length).toBeGreaterThan(0);
    expect(payload.scenarios.length).toBeGreaterThan(0);
    expect(payload.advice.summary).toContain('₹2 Lakh');
  });

  it('displays error banner when /api/change returns 500 error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: 'Failed to process AI change request' },
      }),
    } as unknown as Response);

    render(<ChangeBar onReplanReady={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Change anything/i);
    const submitBtn = screen.getByRole('button', { name: /Replan/i });

    fireEvent.change(input, { target: { value: 'Cut budget to 2 lakh' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to process AI change request/i)).toBeInTheDocument();
    });
  });
});
