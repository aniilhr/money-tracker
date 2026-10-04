// The only module that touches persistence. Data never leaves the device.
import { NOTES_KEY, STORAGE_KEY } from './config.js';
import { isTransaction } from './transactions.js';

export function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTransaction) : [];
  } catch {
    // Keep a copy of unreadable data instead of silently overwriting it.
    localStorage.setItem(`${STORAGE_KEY}.corrupt-${Date.now()}`, raw);
    return [];
  }
}

/** Throws if storage is full or unavailable; callers handle it. */
export function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const loadNote = () => localStorage.getItem(NOTES_KEY) ?? '';
export const saveNote = (text) => localStorage.setItem(NOTES_KEY, text);

/** Keeps other open tabs in sync. */
export function onExternalChange(callback) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) callback(load());
  });
}

/** Asks the browser not to evict local data under storage pressure. */
export async function requestPersistence() {
  try { await navigator.storage?.persist?.(); } catch { /* not supported */ }
}
