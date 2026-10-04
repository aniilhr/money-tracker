// Totals are summed in paise (integers) to avoid floating-point drift.
import { monthKeyOf } from './dates.js';

const toPaise = (amount) => Math.round(amount * 100);

export const sum = (list) => list.reduce((s, t) => s + toPaise(t.amount), 0) / 100;

export const inMonth = (list, monthKey) => list.filter((t) => monthKeyOf(t.date) === monthKey);

/** [{ category, total }] sorted by total, largest first. Uncategorised is null. */
export function categoryTotals(list) {
  const map = new Map();
  for (const t of list) {
    const key = t.category ?? null;
    map.set(key, (map.get(key) ?? 0) + toPaise(t.amount));
  }
  return [...map].map(([category, paise]) => ({ category, total: paise / 100 }))
    .sort((a, b) => b.total - a.total);
}

/** Expects a list already sorted newest first. Returns [{ key, items, total }]. */
export function groupByMonth(sorted) {
  const groups = [];
  for (const t of sorted) {
    const key = monthKeyOf(t.date);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) groups.push((g = { key, items: [] }));
    g.items.push(t);
  }
  return groups.map((g) => ({ ...g, total: sum(g.items) }));
}
