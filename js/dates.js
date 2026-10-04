// Dates are stored as local "YYYY-MM-DD" strings (never UTC), so an expense
// added at 11pm stays on the right day.
const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(iso) {
  return typeof iso === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(iso)
    && toISODate(parseISODate(iso)) === iso;
}

export function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export const monthKeyOf = (iso) => iso.slice(0, 7); // "2026-10"
