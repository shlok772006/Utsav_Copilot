import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProvenanceBadge } from './ProvenanceBadge';
import { Provenance } from '@/lib/domain/types';

describe('ProvenanceBadge Component', () => {
  const provenanceTypes: Array<{ type: Provenance; expectedLabel: string }> = [
    { type: 'user', expectedLabel: 'Your input' },
    { type: 'derived', expectedLabel: 'Derived' },
    { type: 'heuristic', expectedLabel: 'Heuristic' },
    { type: 'ai', expectedLabel: 'AI estimate' },
    { type: 'vendor', expectedLabel: 'Vendor quote' },
  ];

  provenanceTypes.forEach(({ type, expectedLabel }) => {
    it(`renders visible label and accessible aria-label for "${type}"`, () => {
      render(<ProvenanceBadge provenance={type} />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(expectedLabel);
      expect(badge).toHaveAttribute('aria-label', `Data source: ${expectedLabel}`);
    });
  });
});
