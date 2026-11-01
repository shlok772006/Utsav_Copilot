/**
 * Pure UI formatting helpers for Indian currency and numbers.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

/**
 * Formats a monetary integer amount into Indian Rupees (e.g. ₹3,00,000).
 * Uses Intl.NumberFormat('en-IN') with zero fraction digits.
 *
 * @param amount - The numerical amount in INR, or null/undefined.
 * @returns Formatted currency string with ₹ symbol and Indian grouping.
 */
export function formatINR(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return inrFormatter.format(amount);
}

/**
 * Formats a raw integer into Indian numbering format with comma grouping (e.g. 1,00,000).
 *
 * @param num - The raw integer number, or null/undefined.
 * @returns Formatted number string with en-IN separators.
 */
export function formatNumber(num: number | null | undefined): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  return numberFormatter.format(num);
}

/**
 * Formats an ISO 'YYYY-MM-DD' calendar date string into an accessible display date (e.g. '6 Dec 2026').
 * Guarantees pure UTC rendering without local timezone shift artifacts.
 *
 * @param isoDate - Valid ISO string formatted as 'YYYY-MM-DD', or null/undefined.
 * @returns Human-friendly formatted date string, or 'Not set' if null or invalid.
 */
export function formatDateDisplay(isoDate: string | null | undefined): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return 'Not set';
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
