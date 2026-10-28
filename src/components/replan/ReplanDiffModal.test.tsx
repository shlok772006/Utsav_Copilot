import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReplanDiffModal } from './ReplanDiffModal';
import { useEventStore } from '@/lib/store/useEventStore';
import { ReplanReviewPayload } from './ChangeBar';
import { createSampleEventState } from '@/lib/store/useEventStore';
import { buildPlan } from '@/lib/domain/plan';
import { diffPlans } from '@/lib/domain/diff';

describe('ReplanDiffModal Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  function createMockPayload(): ReplanReviewPayload {
    const originalState = createSampleEventState('2026-10-28');
    const originalPlan = buildPlan(originalState, '2026-10-28');

    const proposedState = {
      ...originalState,
      totalBudget: 200_000, // Dropped from 300,000 to 200,000
    };
    const proposedPlan = buildPlan(proposedState, '2026-10-28');
    const diff = diffPlans(originalPlan, proposedPlan);

    return {
      proposedState,
      proposedPlan,
      diff,
      scenarios: [
        {
          id: 'direct-change',
          headline: 'Direct Revision (Cut across all categories)',
          why: 'Adjusts all unlocked categories to fit the ₹2 Lakh budget.',
          ops: [{ op: 'set_budget', value: 200000 }],
          tradeoff: 'Per-guest catering drops.',
        },
        {
          id: 'trim-guests',
          headline: 'Trim Guest List to 51 Guests',
          why: 'Maintains catering quality per guest.',
          ops: [{ op: 'set_guest_count', value: 51 }],
          tradeoff: 'Requires reducing guest list.',
          savingsAmount: 25000,
        },
      ],
      advice: {
        summary: 'Budget decreased by ₹1 Lakh. We recommend trimming guests to preserve food quality.',
        options: [
          { scenarioId: 'direct-change', analysis: 'Risks poor food experience.' },
          { scenarioId: 'trim-guests', analysis: 'Preserves good guest experience.' },
        ],
        recommendedScenarioId: 'trim-guests',
      },
      directOps: [{ op: 'set_budget', value: 200000 }],
      userText: 'Budget is now 2 lakh',
    };
  }

  it('renders nothing when isOpen is false', () => {
    const payload = createMockPayload();
    render(<ReplanDiffModal payload={payload} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with advisor summary and tradeoff scenarios', () => {
    const payload = createMockPayload();
    render(<ReplanDiffModal payload={payload} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Triggered by:/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget is now 2 lakh/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget decreased by ₹1 Lakh/i)).toBeInTheDocument();

    // Tradeoff radio cards
    expect(screen.getByText(/Option A: Direct Revision/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B: Trim Guest List to 51 Guests/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ Recommended/i)).toBeInTheDocument();
  });

  it('switches between Scenarios, Budget Deltas, Timeline Shifts, and Warnings tabs', () => {
    const payload = createMockPayload();
    render(<ReplanDiffModal payload={payload} isOpen={true} onClose={vi.fn()} />);

    // Click Budget Deltas Tab
    const budgetTabBtn = screen.getByRole('button', { name: /Budget Deltas/i });
    fireEvent.click(budgetTabBtn);

    expect(screen.getByText(/Total Budget:/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous/i)).toBeInTheDocument();
    expect(screen.getByText(/Revised/i)).toBeInTheDocument();

    // Click Timeline Shifts Tab
    const timelineTabBtn = screen.getByRole('button', { name: /Schedule Shifts/i });
    fireEvent.click(timelineTabBtn);

    // Click Warnings Tab
    const warningsTabBtn = screen.getByRole('button', { name: /Warnings/i });
    fireEvent.click(warningsTabBtn);
  });

  it('applies chosen scenario and closes modal when Apply is clicked', () => {
    useEventStore.getState().loadSampleEvent();
    const payload = createMockPayload();
    const onClose = vi.fn();
    const onApplied = vi.fn();

    render(
      <ReplanDiffModal
        payload={payload}
        isOpen={true}
        onClose={onClose}
        onApplied={onApplied}
      />
    );

    // Apply button
    const applyBtn = screen.getByRole('button', { name: /Apply Selected Plan/i });
    fireEvent.click(applyBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onApplied).toHaveBeenCalled();

    // The store should reflect the applied scenario ops
    expect(useEventStore.getState().state.guestCount).toBe(51); // trim-guests was recommended and selected
  });

  it('closes modal without applying changes when Discard is clicked', () => {
    useEventStore.getState().loadSampleEvent();
    const initialBudget = useEventStore.getState().state.totalBudget;
    const payload = createMockPayload();
    const onClose = vi.fn();

    render(<ReplanDiffModal payload={payload} isOpen={true} onClose={onClose} />);

    const discardBtn = screen.getByRole('button', { name: /Discard & Keep Current Plan/i });
    fireEvent.click(discardBtn);

    expect(onClose).toHaveBeenCalled();
    expect(useEventStore.getState().state.totalBudget).toBe(initialBudget);
  });

  it('closes modal on Escape key press', () => {
    const payload = createMockPayload();
    const onClose = vi.fn();

    render(<ReplanDiffModal payload={payload} isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
