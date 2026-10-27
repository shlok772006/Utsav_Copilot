/**
 * Pure UI formatting helpers for Indian currency and numbers.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export function formatINR(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return inrFormatter.format(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  return numberFormatter.format(num);
}

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
