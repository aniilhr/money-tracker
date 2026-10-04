import { addDays, parseISODate, todayISO } from './dates.js';

const LOCALE = 'en-IN';

const moneyWhole = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const moneyExact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const monthOnly = new Intl.DateTimeFormat(LOCALE, { month: 'long' });

/** ₹1,200 for whole rupees, ₹250.50 when there are paise. */
export const formatMoney = (n) => (Number.isInteger(n) ? moneyWhole : moneyExact).format(n);

/** "Today", "Yesterday", "02 Oct", or "02 Oct 2025" for other years. */
export function formatDayLabel(iso, today = todayISO()) {
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  const fmt = iso.slice(0, 4) === today.slice(0, 4) ? dayMonth : dayMonthYear;
  return fmt.format(parseISODate(iso));
}

export const formatMonthLabel = (monthKey) => monthYear.format(parseISODate(`${monthKey}-01`));
export const formatMonthName = (monthKey) => monthOnly.format(parseISODate(`${monthKey}-01`));
