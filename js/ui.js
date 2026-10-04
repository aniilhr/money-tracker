// Rendering helpers. Builds DOM with textContent only (no innerHTML),
// so descriptions can never inject markup.
import { formatDayLabel, formatMoney, formatMonthLabel } from './format.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.filter((c) => c != null && c !== false));
  return el;
}

function txItem(tx, today) {
  return h('li', {},
    h('button', { type: 'button', class: 'tx', dataset: { id: tx.id } },
      h('span', { class: 'tx-amount' }, formatMoney(tx.amount)),
      h('span', { class: 'tx-body' },
        h('span', { class: 'tx-desc' }, tx.description),
        h('span', { class: 'tx-meta' },
          tx.category ? h('span', { class: 'tx-cat' }, tx.category) : null,
          h('span', {}, formatDayLabel(tx.date, today))))));
}

export function renderTxList(ul, items, today, emptyText) {
  ul.replaceChildren(...(items.length
    ? items.map((t) => txItem(t, today))
    : [h('li', { class: 'empty' }, emptyText)]));
}

export function renderCategoryTotals(container, rows) {
  const max = Math.max(...rows.map((r) => r.total), 0);
  container.replaceChildren(...rows.map(({ category, total }) => {
    const fill = h('span');
    fill.style.width = `${max ? (total / max) * 100 : 0}%`;
    return h('div', { class: 'cat-row' },
      h('span', { class: category ? 'cat-name' : 'cat-name is-none' }, category ?? 'No category'),
      h('span', { class: 'cat-total' }, formatMoney(total)),
      h('span', { class: 'cat-bar', 'aria-hidden': 'true' }, fill));
  }));
}

export function renderMonthGroups(container, groups, today) {
  if (!groups.length) {
    container.replaceChildren(h('p', { class: 'empty' }, 'No expenses yet.'));
    return;
  }
  container.replaceChildren(...groups.map((g) => {
    const ul = h('ul', { class: 'tx-list' });
    renderTxList(ul, g.items, today, '');
    return h('section', { class: 'month-group' },
      h('h3', { class: 'month-head' },
        h('span', {}, formatMonthLabel(g.key)),
        h('span', { class: 'month-head-total' }, formatMoney(g.total))),
      ul);
  }));
}

let toastTimer;
export function toast(el, message) {
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2200);
}
