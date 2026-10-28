import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { useEventStore } from '@/lib/store/useEventStore';
import { HERO_DEMO_TEXT } from '@/components/replan/ChangeBar';

describe('Hero Flow Integration Test (Prompt Wars Challenge 5)', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  it('executes the full replan hero demo: disruption → diff modal → tradeoff selection → undo', async () => {
    // 1. Initial State: Load Sample Event (₹3 Lakh, 60 guests, 5 weeks ahead)
    useEventStore.getState().loadSampleEvent();
    expect(useEventStore.getState().state.totalBudget).toBe(300_000);
    expect(useEventStore.getState().state.guestCount).toBe(60);

    // Mock fetch for /api/change and /api/advise
    global.fetch = vi.fn().mockImplementation((url: string) => {
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
            summary:
              'Budget dropped by ₹1 Lakh and date moved 2 weeks earlier. Schedule is compressed. We recommend trimming guests to preserve food quality.',
            options: [
              { scenarioId: 'direct-change', analysis: 'Direct cut across all categories.' },
              { scenarioId: 'trim-guests', analysis: 'Trimming guests to ~51 keeps food quality high.' },
            ],
            recommendedScenarioId: 'trim-guests',
          }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<Home />);

    // Verify initial Event Card displays ₹3,00,000
    expect(screen.getByText('₹3,00,000')).toBeInTheDocument();

    // 2. Trigger the Disruption using Hero Demo Chip
    const heroChip = screen.getByText(new RegExp(HERO_DEMO_TEXT, 'i'));
    fireEvent.click(heroChip);

    // 3. Diff Modal opens with impact analysis
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Plan Revision & Impact Analysis/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Budget dropped by ₹1 Lakh/i)).toBeInTheDocument();

    // Check Tradeoff Scenario Options are rendered
    expect(screen.getByText(/Option A: Direct Revision/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B:/i)).toBeInTheDocument();

    // Check Budget Deltas tab
    const budgetDeltasTab = screen.getByRole('button', { name: /Budget Deltas/i });
    fireEvent.click(budgetDeltasTab);
    expect(screen.getByText(/Total Budget:/i)).toBeInTheDocument();
    expect(screen.getByText(/-₹1,00,000/i)).toBeInTheDocument();

    // Check Schedule Shifts tab
    const scheduleShiftsTab = screen.getByRole('button', { name: /Schedule Shifts/i });
    fireEvent.click(scheduleShiftsTab);
    expect(screen.getByText(/Schedule is now compressed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/14d earlier/i).length).toBeGreaterThan(0);

    // 4. Switch back to Scenarios and Apply the Selected Plan
    const scenariosTab = screen.getByRole('button', { name: /Tradeoff Options/i });
    fireEvent.click(scenariosTab);

    const applyBtn = screen.getByRole('button', { name: /Apply Selected Plan/i });
    fireEvent.click(applyBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 5. Verify plan was updated
    expect(screen.getByText(/Plan revision applied!/i)).toBeInTheDocument();

    // State reflects the replan
    const currentState = useEventStore.getState().state;
    expect(currentState.totalBudget).toBeLessThanOrEqual(300_000);

    // 6. Test Undo button in Header restores the original plan
    const undoBtn = screen.getByRole('button', { name: /Undo/i });
    expect(undoBtn).not.toBeDisabled();
    fireEvent.click(undoBtn);

    // Store is restored to original sample event (₹3,00,000)
    expect(useEventStore.getState().state.totalBudget).toBe(300_000);
    expect(useEventStore.getState().state.guestCount).toBe(60);
  });
});
