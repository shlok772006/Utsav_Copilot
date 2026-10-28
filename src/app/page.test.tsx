import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './page';
import { useEventStore } from '@/lib/store/useEventStore';

describe('Home Page Integration', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  it('renders tab navigation with initial Chat & Intake view', () => {
    render(<Home />);

    // Tab buttons
    expect(screen.getByRole('tab', { name: /Chat & Intake/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Budget Breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Timeline & Tasks/i })).toBeInTheDocument();

    // Intake chat initially active
    expect(screen.getByPlaceholderText(/Budget 4 lakh/i)).toBeInTheDocument();

    // Event card present on right
    expect(screen.getByRole('heading', { level: 2, name: /Event Snapshot/i })).toBeInTheDocument();
  });

  it('switches between Intake, Budget, and Timeline tabs', () => {
    useEventStore.getState().loadSampleEvent();
    render(<Home />);

    // Switch to Budget tab
    const budgetTabBtn = screen.getByRole('tab', { name: /Budget Breakdown/i });
    fireEvent.click(budgetTabBtn);

    expect(screen.getByRole('heading', { level: 2, name: /Budget Allocation Breakdown/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Budget 4 lakh/i)).not.toBeInTheDocument();

    // Switch to Timeline tab
    const timelineTabBtn = screen.getByRole('tab', { name: /Timeline & Tasks/i });
    fireEvent.click(timelineTabBtn);

    expect(screen.getByRole('heading', { level: 2, name: /Timeline & Task Critical Path/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: /Budget Allocation Breakdown/i })).not.toBeInTheDocument();

    // Switch back to Intake tab
    const intakeTabBtn = screen.getByRole('tab', { name: /Chat & Intake/i });
    fireEvent.click(intakeTabBtn);

    expect(screen.getByPlaceholderText(/Budget 4 lakh/i)).toBeInTheDocument();
  });

  it('disables future tabs with Phase badges', () => {
    render(<Home />);

    const ideasTab = screen.getByRole('tab', { name: /Tradeoffs & Ideas/i });
    const vendorsTab = screen.getByRole('tab', { name: /Vendor Quotes/i });

    expect(ideasTab).toBeDisabled();
    expect(vendorsTab).toBeDisabled();
    expect(screen.getAllByText('Phase 6').length).toBe(2);
  });
});
