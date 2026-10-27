import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';
import { useEventStore } from '@/lib/store/useEventStore';

describe('EventCard Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  it('renders initial state with "Not stated" placeholders and "In Progress" status', () => {
    render(<EventCard />);

    expect(screen.getByText('Event Snapshot')).toBeInTheDocument();
    expect(screen.getByText('◌ In Progress')).toBeInTheDocument();
    expect(screen.getAllByText('Not stated').length).toBeGreaterThan(0);
  });

  it('displays populated fields and "Plan Ready" badge when sample event is loaded', () => {
    useEventStore.getState().loadSampleEvent();
    render(<EventCard />);

    expect(screen.getByText('✓ Plan Ready')).toBeInTheDocument();
    expect(screen.getByText(/anniversary/i)).toBeInTheDocument();
    expect(screen.getByText('60 guests')).toBeInTheDocument();
    expect(screen.getByText(/Pune/)).toBeInTheDocument();
  });

  it('allows entering edit mode and updating fields directly', () => {
    render(<EventCard />);

    // Click edit
    const editBtn = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Direct Field Override')).toBeInTheDocument();

    // Fill budget
    const budgetInput = screen.getByLabelText(/Budget/i);
    fireEvent.change(budgetInput, { target: { value: '450000' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Save Overrides/i });
    fireEvent.click(saveBtn);

    expect(useEventStore.getState().state.totalBudget).toBe(450000);
  });
});
