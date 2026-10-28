import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeasTab } from './IdeasTab';
import { useEventStore } from '@/lib/store/useEventStore';

describe('IdeasTab Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  it('renders uninitialized empty state when plan is null', () => {
    render(<IdeasTab />);

    expect(screen.getByText(/Ideas Not Available Yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Tell the assistant about your event/i)).toBeInTheDocument();
  });

  it('renders 3 concept cards with strictly relative cost levels and NO rupee prices', () => {
    useEventStore.getState().loadSampleEvent();
    render(<IdeasTab />);

    // Header check
    expect(screen.getByText(/Personalized Celebration Concepts/i)).toBeInTheDocument();

    // Check titles of pre-seeded concepts
    expect(screen.getByText(/Silver Jubilee Royal Feast/i)).toBeInTheDocument();
    expect(screen.getByText(/Intimate Candlelit Garden Soirée/i)).toBeInTheDocument();
    expect(screen.getByText(/Grand Darbar Heritage Gala/i)).toBeInTheDocument();

    // Check relative cost levels
    expect(screen.getByText('Cost Level: Similar')).toBeInTheDocument();
    expect(screen.getByText('Cost Level: Lower')).toBeInTheDocument();
    expect(screen.getByText('Cost Level: Higher')).toBeInTheDocument();

    // CRITICAL PRODUCT & TRUST RULE: Check that concept cards DO NOT display rupee prices!
    const concept1Card = screen.getByText(/Silver Jubilee Royal Feast/i).closest('div');
    expect(concept1Card?.textContent).not.toMatch(/₹\s*\d+/);
    expect(concept1Card?.textContent).not.toMatch(/Rs\.\s*\d+/i);
  });

  it('submits feedback through refine bar and updates concepts', async () => {
    useEventStore.getState().loadSampleEvent();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        concepts: [
          {
            name: 'Refined Maharashtrian Heritage Courtyard',
            vibe: 'Enhanced traditional elements with authentic Pune live counters.',
            whereMoneyGoes: 'Largest allocation into live food stations.',
            costLevel: 'similar',
            comfortNotes: 'Ground floor priority seating for grandparents.',
            risks: 'Queue management needed at live counter.',
            firstThreeSteps: ['Book menu tasting', 'Reserve hall', 'Plan photo gallery'],
          },
        ],
      }),
    } as unknown as Response);

    render(<IdeasTab />);

    const input = screen.getByPlaceholderText(/Too heavy on decor/i);
    const refineBtn = screen.getByRole('button', { name: /Refine/i });

    fireEvent.change(input, { target: { value: 'Make it more traditional Maharashtrian' } });
    fireEvent.click(refineBtn);

    await waitFor(() => {
      expect(screen.getByText('Refined Maharashtrian Heritage Courtyard')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ideas',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('displays error and allows retry when /api/ideas fails', async () => {
    // Clear sample concepts and trigger fetch
    useEventStore.getState().loadSampleEvent();
    useEventStore.getState().setConcepts([]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: 'Gemini service temporarily unavailable' },
      }),
    } as unknown as Response);

    render(<IdeasTab />);

    const generateBtn = screen.getByRole('button', { name: /Generate Celebration Concepts/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Gemini service temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
