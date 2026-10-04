// Pure functions over the transaction list. No DOM, no storage.
import { MAX_AMOUNT, MAX_DESCRIPTION } from './config.js';
import { isValidISODate, todayISO } from './dates.js';

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {number} amount        rupees, max 2 decimals
 * @property {string} description
 * @property {string|null} category
 * @property {string} date          local "YYYY-MM-DD"
 * @property {string} createdAt     ISO timestamp
 * @property {string} [updatedAt]   ISO timestamp
 */

export function createId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseAmount(input) {
  const n = Number(String(input ?? '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/** Validates raw form values. Returns { ok, errors, value }. */
export function validate(draft) {
  const errors = {};

  const amount = parseAmount(draft.amount);
  if (!(amount > 0)) errors.amount = 'Enter an amount greater than ₹0.';
  else if (amount > MAX_AMOUNT) errors.amount = 'That amount is too large.';

  const description = String(draft.description ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_DESCRIPTION);
  if (!description) errors.description = 'Enter what you spent on.';

  const category = String(draft.category ?? '').trim() || null;

  const date = draft.date || todayISO();
  if (!isValidISODate(date)) errors.date = 'Pick a valid date.';

  return { ok: Object.keys(errors).length === 0, errors, value: { amount, description, category, date } };
}

export function isTransaction(t) {
  return t && typeof t === 'object'
    && typeof t.id === 'string'
    && Number.isFinite(t.amount)
    && typeof t.description === 'string'
    && isValidISODate(t.date);
}

export const addTransaction = (list, value, now = new Date()) =>
  [...list, { id: createId(), ...value, createdAt: now.toISOString() }];

export const updateTransaction = (list, id, value, now = new Date()) =>
  list.map((t) => (t.id === id ? { ...t, ...value, updatedAt: now.toISOString() } : t));

export const removeTransaction = (list, id) => list.filter((t) => t.id !== id);

export const findTransaction = (list, id) => list.find((t) => t.id === id) ?? null;

/** Newest date first; same-day entries by time added. */
export const sortNewestFirst = (list) =>
  [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
