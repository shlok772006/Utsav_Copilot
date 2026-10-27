import { addDays } from '../domain/timeline';

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

/**
 * Deterministically resolves date hints without letting the LLM perform calendar math.
 * Handles relative phrases ("in 5 weeks", "in 2 months", "in 10 days")
 * and common date string formats ("15 Dec 2026", "2026-12-15").
 */
export function resolveDateHint(hint: string | null | undefined, today: string): string | null {
  if (!hint) return null;
  const clean = hint.trim().toLowerCase();

  // 1. Direct ISO match: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // 2. Relative weeks: "in 5 weeks", "5 weeks", "in a week"
  const weeksMatch = clean.match(/(?:in\s+)?(\d+|a|an|one)\s+weeks?/);
  if (weeksMatch) {
    const num = weeksMatch[1] === 'a' || weeksMatch[1] === 'an' || weeksMatch[1] === 'one' ? 1 : parseInt(weeksMatch[1], 10);
    return addDays(today, num * 7);
  }

  // 3. Relative months: "in 2 months", "2 months", "in a month"
  const monthsMatch = clean.match(/(?:in\s+)?(\d+|a|an|one)\s+months?/);
  if (monthsMatch) {
    const num = monthsMatch[1] === 'a' || monthsMatch[1] === 'an' || monthsMatch[1] === 'one' ? 1 : parseInt(monthsMatch[1], 10);
    return addDays(today, num * 30);
  }

  // 4. Relative days: "in 10 days", "10 days"
  const daysMatch = clean.match(/(?:in\s+)?(\d+)\s+days?/);
  if (daysMatch) {
    const num = parseInt(daysMatch[1], 10);
    return addDays(today, num);
  }

  // 5. Explicit date format: "15 Dec 2026", "15th December 2026", "December 15 2026"
  const dayMonthYearMatch = clean.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (dayMonthYearMatch) {
    const day = dayMonthYearMatch[1].padStart(2, '0');
    const monthStr = dayMonthYearMatch[2];
    const month = MONTH_MAP[monthStr];
    if (month) {
      const year = dayMonthYearMatch[3] || today.split('-')[0];
      return `${year}-${month}-${day}`;
    }
  }

  const monthDayYearMatch = clean.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1];
    const month = MONTH_MAP[monthStr];
    if (month) {
      const day = monthDayYearMatch[2].padStart(2, '0');
      const year = monthDayYearMatch[3] || today.split('-')[0];
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}
