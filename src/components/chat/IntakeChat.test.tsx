import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntakeChat } from './IntakeChat';
import { useEventStore } from '@/lib/store/useEventStore';

describe('IntakeChat Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  it('renders initial welcome message and quick start chips', () => {
    render(<IntakeChat />);

    expect(screen.getByText(/Namaste! Welcome to Utsav Copilot/i)).toBeInTheDocument();
    expect(screen.getByText("Parents' 25th Anniversary")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Budget 4 lakh/i)).toBeInTheDocument();
  });

  it('sends user message and updates state on successful /api/intake response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        assistantMessage: 'Great, noted ₹3 Lakh budget!',
        stateUpdates: [{ op: 'set_budget', value: 300000 }],
        readyToPlan: false,
        date_hint: null,
      }),
    } as unknown as Response);

    render(<IntakeChat />);

    const input = screen.getByPlaceholderText(/Budget 4 lakh/i);
    const sendBtn = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Our budget is 3 lakh' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Our budget is 3 lakh')).toBeInTheDocument();
      expect(screen.getByText('Great, noted ₹3 Lakh budget!')).toBeInTheDocument();
    });

    expect(useEventStore.getState().state.totalBudget).toBe(300000);
  });

  it('displays error message and retry button when /api/intake fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: 'Server temporarily unavailable' },
      }),
    } as unknown as Response);

    render(<IntakeChat />);

    const input = screen.getByPlaceholderText(/Budget 4 lakh/i);
    const sendBtn = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Our budget is 3 lakh' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Server temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
