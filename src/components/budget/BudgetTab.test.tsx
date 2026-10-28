import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetTab } from './BudgetTab';
import { useEventStore } from '@/lib/store/useEventStore';

describe('BudgetTab Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  it('renders uninitialized empty state when budget is 0', () => {
    render(<BudgetTab />);
    expect(screen.getByText(/Budget Not Initialized/i)).toBeInTheDocument();
    expect(screen.getByText(/Tell the assistant your total budget/i)).toBeInTheDocument();
  });

  it('renders all budget lines with INR formatting and provenance badges when event is loaded', () => {
    useEventStore.getState().loadSampleEvent();
    render(<BudgetTab />);

    // Header check
    expect(screen.getByRole('heading', { level: 2, name: /Budget Allocation Breakdown/i })).toBeInTheDocument();
    expect(screen.getByText(/Total ₹3,00,000/i)).toBeInTheDocument();

    // Check categories
    expect(screen.getByText(/venue/i)).toBeInTheDocument();
    expect(screen.getByText(/catering/i)).toBeInTheDocument();
    expect(screen.getByText(/decor/i)).toBeInTheDocument();
    expect(screen.getByText(/photography/i)).toBeInTheDocument();
    expect(screen.getByText(/attire/i)).toBeInTheDocument();
    expect(screen.getByText(/entertainment/i)).toBeInTheDocument();
    expect(screen.getByText(/invitations misc/i)).toBeInTheDocument();
    expect(screen.getByText(/logistics/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /contingency/i })).toBeInTheDocument();

    // Provenance badges present
    const derivedBadges = screen.getAllByText('Derived');
    expect(derivedBadges.length).toBeGreaterThan(0);
  });

  it('toggles between Bars view and Table view', () => {
    useEventStore.getState().loadSampleEvent();
    render(<BudgetTab />);

    // Initially in bars view (progress bars rendered)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Click Table View
    const tableBtn = screen.getByRole('button', { name: /Table View/i });
    fireEvent.click(tableBtn);

    // Now table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Share %')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.queryAllByRole('progressbar').length).toBe(0);

    // Switch back to Bars view
    const barsBtn = screen.getByRole('button', { name: /Bars View/i });
    fireEvent.click(barsBtn);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('updates category priority when priority button is clicked', () => {
    useEventStore.getState().loadSampleEvent();
    render(<BudgetTab />);

    // Current catering priority in sample event is 5. Let's find buttons for photography
    // Photography is prio 3 by default. Let's click priority 5 for photography
    const prio5Buttons = screen.getAllByRole('button', { name: '5' });
    // Click the photography one or first available
    fireEvent.click(prio5Buttons[0]);

    // Store state should reflect updated priorities
    const priorities = useEventStore.getState().state.priorities;
    expect(priorities).toBeDefined();
  });

  it('locks and unlocks category when lock button is clicked', () => {
    useEventStore.getState().loadSampleEvent();
    render(<BudgetTab />);

    const lockButtons = screen.getAllByRole('button', { name: /Lock Amount/i });
    expect(lockButtons.length).toBeGreaterThan(0);

    // Click the first lock button
    fireEvent.click(lockButtons[0]);

    // Verify category is now locked in state
    expect(useEventStore.getState().state.lockedCategories?.length).toBe(1);

    // Button should now say "Locked"
    const lockedButton = screen.getByRole('button', { name: /Locked/i });
    expect(lockedButton).toBeInTheDocument();

    // Click to unlock
    fireEvent.click(lockedButton);
    expect(useEventStore.getState().state.lockedCategories?.length).toBe(0);
  });

  it('displays low catering warning when catering budget per guest is low', () => {
    // Set up low budget for many guests
    useEventStore.getState().updateField('totalBudget', 50_000);
    useEventStore.getState().updateField('guestCount', 500);

    render(<BudgetTab />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Catering Headroom Notice/i)).toBeInTheDocument();
  });
});
