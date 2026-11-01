import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from './LandingPage';
import { useEventStore } from '@/lib/store/useEventStore';

describe('LandingPage Component', () => {
  it('renders hero title, subtitle, and trust badges', () => {
    const onOpenService = vi.fn();
    const onLaunchPlanner = vi.fn();

    render(
      <LandingPage
        onOpenService={onOpenService}
        onLaunchPlanner={onLaunchPlanner}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /Plan Grand Indian Celebrations with Absolute Clarity/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/AI Understanding × Deterministic Math Engine/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/Math-Calculated Budgets/i)).toBeInTheDocument();
    expect(screen.getByText(/Protected Expense Lines/i)).toBeInTheDocument();
  });

  it('renders all 5 purpose-built services and triggers onOpenService when clicked', () => {
    const onOpenService = vi.fn();
    const onLaunchPlanner = vi.fn();

    render(
      <LandingPage
        onOpenService={onOpenService}
        onLaunchPlanner={onLaunchPlanner}
      />
    );

    expect(screen.getByText(/Conversational Intake Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Living Budget Breakdown Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical-Path Timeline & Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalized Celebration Concepts/i)).toBeInTheDocument();
    expect(screen.getByText(/Vendor Quote Analyzer & Comparator/i)).toBeInTheDocument();

    const budgetBtn = screen.getByRole('button', { name: /Explore Budget Engine/i });
    fireEvent.click(budgetBtn);
    expect(onOpenService).toHaveBeenCalledWith('budget');

    const timelineBtn = screen.getByRole('button', { name: /View Timeline & Tasks/i });
    fireEvent.click(timelineBtn);
    expect(onOpenService).toHaveBeenCalledWith('timeline');
  });

  it('triggers onLaunchPlanner when Start Planning button is clicked', () => {
    const onOpenService = vi.fn();
    const onLaunchPlanner = vi.fn();

    render(
      <LandingPage
        onOpenService={onOpenService}
        onLaunchPlanner={onLaunchPlanner}
      />
    );

    const startBtn = screen.getByRole('button', { name: /Start Planning Celebration/i });
    fireEvent.click(startBtn);
    expect(onLaunchPlanner).toHaveBeenCalledTimes(1);
  });

  it('loads sample event and triggers onLaunchPlanner when Try Live Demo is clicked', () => {
    const onOpenService = vi.fn();
    const onLaunchPlanner = vi.fn();
    useEventStore.getState().resetEvent();

    render(
      <LandingPage
        onOpenService={onOpenService}
        onLaunchPlanner={onLaunchPlanner}
      />
    );

    const demoBtn = screen.getByRole('button', { name: /Try Live Demo/i });
    fireEvent.click(demoBtn);

    expect(onLaunchPlanner).toHaveBeenCalledTimes(1);
    expect(useEventStore.getState().state.occasion).toBe('anniversary');
    expect(useEventStore.getState().state.totalBudget).toBe(300_000);
  });
});
