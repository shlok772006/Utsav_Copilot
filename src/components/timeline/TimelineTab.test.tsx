import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineTab } from './TimelineTab';
import { useEventStore } from '@/lib/store/useEventStore';
import { addDays, formatISODate } from '@/lib/domain/timeline';

describe('TimelineTab Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  it('renders uninitialized empty state when no plan is present', () => {
    render(<TimelineTab />);
    expect(screen.getByText(/Timeline Not Initialized/i)).toBeInTheDocument();
    expect(screen.getByText(/Provide your event date and occasion/i)).toBeInTheDocument();
  });

  it('renders task list in dependency order with status chips for loaded event', () => {
    useEventStore.getState().loadSampleEvent();
    render(<TimelineTab />);

    // Header checks
    expect(screen.getByRole('heading', { level: 2, name: /Timeline & Task Critical Path/i })).toBeInTheDocument();
    expect(screen.getByText(/Critical path:/i)).toBeInTheDocument();

    // Check that some tasks are rendered
    expect(screen.getAllByText(/Draft initial guest list and headcounts/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fix event date and muhurat/i).length).toBeGreaterThan(0);

    // Provenance badges present
    const heuristicBadges = screen.getAllByText('Heuristic');
    expect(heuristicBadges.length).toBeGreaterThan(0);
  });

  it('displays compressed timeline banner when days available < critical path', () => {
    // 5 days ahead
    const today = formatISODate(new Date());
    const tightDate = addDays(today, 5);

    useEventStore.getState().updateField('eventDate', tightDate);
    useEventStore.getState().updateField('occasion', 'wedding');

    render(<TimelineTab />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Compressed Timeline Warning/i)).toBeInTheDocument();
  });

  it('toggles task completion and unblocks downstream tasks locally', () => {
    useEventStore.getState().loadSampleEvent();
    render(<TimelineTab />);

    // In sample event: "Draft initial guest list and headcounts" (guest-list-v1) is ready
    const guestListCheckbox = screen.getByRole('checkbox', {
      name: /Draft initial guest list and headcounts/i,
    });
    expect(guestListCheckbox).not.toBeChecked();

    // Before clicking, venue-shortlist is blocked waiting on dependencies
    expect(screen.getAllByText(/Waiting on:/i).length).toBeGreaterThan(0);

    // Complete "Draft initial guest list and headcounts"
    fireEvent.click(guestListCheckbox);

    // State should now contain guest-list-v1
    expect(useEventStore.getState().state.completedTasks).toContain('guest-list-v1');
    expect(guestListCheckbox).toBeChecked();

    // Toggling again marks it incomplete
    fireEvent.click(guestListCheckbox);
    expect(useEventStore.getState().state.completedTasks).not.toContain('guest-list-v1');
  });

  it('filters tasks by status pill', () => {
    useEventStore.getState().loadSampleEvent();
    render(<TimelineTab />);

    // Click "Ready to Do"
    const readyFilterBtn = screen.getByRole('button', { name: /Ready to Do/i });
    fireEvent.click(readyFilterBtn);

    // Click "Blocked"
    const blockedFilterBtn = screen.getByRole('button', { name: /Blocked/i });
    fireEvent.click(blockedFilterBtn);

    // Click "All Tasks"
    const allFilterBtn = screen.getByRole('button', { name: /All Tasks/i });
    fireEvent.click(allFilterBtn);

    expect(screen.getAllByText(/Draft initial guest list and headcounts/i).length).toBeGreaterThan(0);
  });
});
