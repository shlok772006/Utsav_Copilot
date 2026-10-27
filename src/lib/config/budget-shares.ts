import { CoreCategory, Occasion } from '../domain/types';

/**
 * Base budget distribution percentages per occasion.
 * These allocate the non-contingency portion (e.g. 92%) across the 8 core categories.
 * Each occasion must sum to exactly 1.0.
 */
export const BUDGET_BASE_SHARES: Record<Occasion, Record<CoreCategory, number>> = {
  wedding: {
    venue: 0.22,
    catering: 0.35,
    decor: 0.15,
    photography: 0.08,
    attire: 0.08,
    entertainment: 0.05,
    invitations_misc: 0.03,
    logistics: 0.04,
  },
  reception: {
    venue: 0.25,
    catering: 0.40,
    decor: 0.14,
    photography: 0.07,
    attire: 0.05,
    entertainment: 0.04,
    invitations_misc: 0.02,
    logistics: 0.03,
  },
  sangeet: {
    venue: 0.20,
    catering: 0.30,
    decor: 0.15,
    photography: 0.07,
    attire: 0.08,
    entertainment: 0.14,
    invitations_misc: 0.02,
    logistics: 0.04,
  },
  anniversary: {
    venue: 0.20,
    catering: 0.38,
    decor: 0.12,
    photography: 0.08,
    attire: 0.06,
    entertainment: 0.06,
    invitations_misc: 0.03,
    logistics: 0.07,
  },
  birthday: {
    venue: 0.20,
    catering: 0.35,
    decor: 0.18,
    photography: 0.06,
    attire: 0.04,
    entertainment: 0.10,
    invitations_misc: 0.03,
    logistics: 0.04,
  },
  engagement: {
    venue: 0.22,
    catering: 0.36,
    decor: 0.14,
    photography: 0.09,
    attire: 0.08,
    entertainment: 0.04,
    invitations_misc: 0.03,
    logistics: 0.04,
  },
  general: {
    venue: 0.22,
    catering: 0.36,
    decor: 0.14,
    photography: 0.08,
    attire: 0.06,
    entertainment: 0.06,
    invitations_misc: 0.04,
    logistics: 0.04,
  },
};

export function getBaseShares(occasion?: Occasion): Record<CoreCategory, number> {
  const selectedOccasion: Occasion = occasion && occasion in BUDGET_BASE_SHARES ? occasion : 'general';
  return { ...BUDGET_BASE_SHARES[selectedOccasion] };
}
