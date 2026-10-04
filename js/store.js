/**
 * Storage layer — the only module that touches persistence.
 * Data lives in this device's localStorage and is never sent anywhere.
 * To move to IndexedDB later, keep these exports and change the internals.
 */

export const STORAGE_KEY = 'money-tracker:transactions:v1';

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); // throws if storage is full
  cache = list;
}

const newestFirst = (a, b) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const clean = ({ amount, description, category, date }) => ({
  amount,
  description,
  category: category || null,
  date,
});

export const getAll = () => [...load()].sort(newestFirst);

export const get = (id) => load().find((t) => t.id === id) ?? null;

export function add(fields) {
  const tx = { id: newId(), ...clean(fields), createdAt: new Date().toISOString() };
  persist([...load(), tx]);
  return tx;
}

export function update(id, fields) {
  persist(load().map((t) =>
    t.id === id ? { ...t, ...clean(fields), updatedAt: new Date().toISOString() } : t));
}

export function remove(id) {
  persist(load().filter((t) => t.id !== id));
}

/** Drop the in-memory copy (e.g. after another tab changed storage). */
export function reload() {
  cache = null;
}
