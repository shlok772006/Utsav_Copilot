import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VendorsTab } from './VendorsTab';
import { useEventStore } from '@/lib/store/useEventStore';

describe('VendorsTab Component', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    vi.restoreAllMocks();
  });

  it('renders uninitialized empty state when plan is null', () => {
    render(<VendorsTab />);

    expect(screen.getByText(/Vendor Comparator Not Initialized/i)).toBeInTheDocument();
    expect(screen.getByText(/Set up your event in the chat/i)).toBeInTheDocument();
  });

  it('renders side-by-side comparison of pre-seeded quotes in sample event', () => {
    useEventStore.getState().loadSampleEvent();
    render(<VendorsTab />);

    expect(screen.getByText(/Vendor Quotes & Comparison/i)).toBeInTheDocument();

    // Check vendor names
    expect(screen.getAllByText(/Annapurna Caterers \(Pune\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Royal Feast Banquet Kitchens/i).length).toBeGreaterThan(0);

    // Check normalized prices
    expect(screen.getByText('₹40,950')).toBeInTheDocument();
    expect(screen.getByText('₹1,65,000')).toBeInTheDocument();

    // Check Under/Over budget badges
    expect(screen.getByText(/Under budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Over budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Over-Budget Notice:/i)).toBeInTheDocument();

    // Check "Not stated" tag for missing information
    expect(screen.getAllByText(/Not stated/i).length).toBeGreaterThan(0);

    // Questions to Ask section
    expect(screen.getByText(/Questions to Ask Vendors Before Booking/i)).toBeInTheDocument();
  });

  it('filters quotes by category pill', () => {
    useEventStore.getState().loadSampleEvent();
    render(<VendorsTab />);

    // Click Catering filter pill
    const cateringFilterBtn = screen.getByRole('button', { name: /Catering/i });
    fireEvent.click(cateringFilterBtn);

    expect(screen.getAllByText(/Annapurna Caterers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Royal Feast/i).length).toBeGreaterThan(0);
  });

  it('opens QuotePasteModal and submits new quote', async () => {
    useEventStore.getState().loadSampleEvent();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        extraction: {
          vendorName: 'Golden Mandap Decorators',
          category: 'decor',
          totalPrice: 28000,
          unitPrice: null,
          unitLabel: null,
          guestsCovered: null,
          inclusions: ['Stage backdrop', 'Entrance arch'],
          exclusions: ['Lighting generators'],
          additionalCharges: [],
          paymentTerms: 'Full advance',
          validity: '7 days',
          missing: ['Generator costs'],
          questionsToAsk: ['Does the quote include generator backup for lights?'],
        },
        questionsToAsk: ['Does the quote include generator backup for lights?'],
      }),
    } as unknown as Response);

    render(<VendorsTab />);

    // Click Add Vendor Quote
    const addBtn = screen.getByRole('button', { name: /Add Vendor Quote/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Add Vendor Quote for Comparison/i)).toBeInTheDocument();

    // Enter quote text
    const textarea = screen.getByPlaceholderText(/Shree Ganesh Caterers/i);
    fireEvent.change(textarea, {
      target: { value: 'Golden Mandap: Stage backdrop and arch for ₹28,000, generator extra' },
    });

    const submitBtn = screen.getByRole('button', { name: /Extract & Compare Quote/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Golden Mandap Decorators')).toBeInTheDocument();
    });

    expect(useEventStore.getState().quotes.some((q) => q.vendorName === 'Golden Mandap Decorators')).toBe(true);
  });
});
