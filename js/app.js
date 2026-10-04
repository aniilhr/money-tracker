// Wires state, storage and UI together.
import { CATEGORIES, RECENT_LIMIT } from './config.js';
import { monthKeyOf, todayISO } from './dates.js';
import { formatMoney, formatMonthName } from './format.js';
import * as storage from './storage.js';
import { categoryTotals, groupByMonth, inMonth, sum } from './totals.js';
import {
  addTransaction, findTransaction, removeTransaction,
  sortNewestFirst, updateTransaction, validate,
} from './transactions.js';
import * as ui from './ui.js';

const $ = (id) => document.getElementById(id);
const el = {
  totalAll: $('total-all'),
  totalMonth: $('total-month'),
  recent: $('recent-list'),
  seeAll: $('see-all'),
  editHint: $('edit-hint'),
  viewHome: $('view-home'),
  viewAll: $('view-all'),
  viewNotes: $('view-notes'),
  notesBtn: $('notes-btn'),
  noteText: $('note-text'),
  noteStatus: $('note-status'),
  addBar: $('add-bar'),
  catSection: $('cat-section'),
  catTitle: $('cat-title'),
  catTotals: $('category-totals'),
  monthGroups: $('month-groups'),
  addBtn: $('add-btn'),
  installBtn: $('install-btn'),
  toast: $('toast'),
  sheet: $('expense-sheet'),
  form: $('expense-form'),
  sheetTitle: $('sheet-title'),
  saveBtn: $('save-btn'),
  cancelBtn: $('cancel-btn'),
  deleteBtn: $('delete-btn'),
  f: {
    amount: $('f-amount'),
    description: $('f-description'),
    category: $('f-category'),
    date: $('f-date'),
  },
};

let transactions = storage.load();
let editingId = null;

/* ---------- Render ---------- */

function render() {
  const today = todayISO();
  const month = monthKeyOf(today);
  const sorted = sortNewestFirst(transactions);
  const thisMonth = inMonth(transactions, month);

  el.totalAll.textContent = formatMoney(sum(transactions));
  el.totalMonth.textContent = formatMoney(sum(thisMonth));

  ui.renderTxList(el.recent, sorted.slice(0, RECENT_LIMIT), today,
    'No expenses yet. Tap Add expense to record your first one.');
  el.seeAll.hidden = transactions.length === 0;
  el.editHint.hidden = transactions.length === 0;

  el.catSection.hidden = thisMonth.length === 0;
  el.catTitle.textContent = `${formatMonthName(month)} by category`;
  ui.renderCategoryTotals(el.catTotals, categoryTotals(thisMonth));
  ui.renderMonthGroups(el.monthGroups, groupByMonth(sorted), today);
}

function commit(next, message) {
  try {
    storage.save(next);
  } catch {
    ui.toast(el.toast, "Couldn't save. Your phone's storage may be full.");
    return false;
  }
  transactions = next;
  render();
  if (message) ui.toast(el.toast, message);
  return true;
}

/* ---------- Routing (#all = all expenses, #notes = notes) ---------- */

const VIEWS = { '#all': el.viewAll, '#notes': el.viewNotes };
let cameFromHome = false;

function route() {
  const target = VIEWS[location.hash] ?? el.viewHome;
  if (!target.hidden) return;
  for (const v of [el.viewHome, el.viewAll, el.viewNotes]) v.hidden = v !== target;
  el.addBar.hidden = target === el.viewNotes; // keep the keyboard area clear while writing
  el.notesBtn.hidden = target === el.viewNotes;
  window.scrollTo(0, 0);
}

function goTo(hash) { cameFromHome = true; location.hash = hash; }

el.seeAll.addEventListener('click', () => goTo('all'));
el.notesBtn.addEventListener('click', () => goTo('notes'));
document.querySelectorAll('.back-btn').forEach((btn) => btn.addEventListener('click', () => {
  if (cameFromHome) history.back();
  else location.replace('#');
  cameFromHome = false;
}));
window.addEventListener('hashchange', route);

/* ---------- Notes (one autosaving notepad) ---------- */

let noteTimer = null;

function flushNote() {
  if (noteTimer === null) return;
  clearTimeout(noteTimer);
  noteTimer = null;
  try {
    storage.saveNote(el.noteText.value);
    el.noteStatus.textContent = 'Saved';
  } catch {
    el.noteStatus.textContent = "Couldn't save";
  }
}

el.noteText.value = storage.loadNote();
el.noteText.addEventListener('input', () => {
  el.noteStatus.textContent = '';
  clearTimeout(noteTimer);
  noteTimer = setTimeout(flushNote, 400);
});
el.noteText.addEventListener('blur', flushNote);

/* ---------- Add / edit sheet ---------- */

for (const c of CATEGORIES) el.f.category.append(new Option(c, c));

function ensureCategoryOption(value) {
  if (value && ![...el.f.category.options].some((o) => o.value === value)) {
    el.f.category.append(new Option(value, value));
  }
}

function setErrors(errors = {}) {
  for (const name of ['amount', 'description', 'date']) {
    $(`e-${name}`).textContent = errors[name] ?? '';
    el.f[name].setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
  }
}

function openSheet(tx = null) {
  editingId = tx?.id ?? null;
  setErrors();
  ensureCategoryOption(tx?.category);

  el.sheetTitle.textContent = tx ? 'Edit expense' : 'Add expense';
  el.saveBtn.textContent = tx ? 'Save changes' : 'Save expense';
  el.deleteBtn.hidden = !tx;

  el.f.amount.value = tx ? String(tx.amount) : '';
  el.f.description.value = tx?.description ?? '';
  el.f.category.value = tx?.category ?? '';
  el.f.date.value = tx?.date ?? todayISO();

  el.sheet.showModal();
  history.pushState({ sheet: true }, '');
  // New expense: jump straight to the amount. Editing: don't pop the keyboard.
  if (tx) el.sheet.focus();
  else el.f.amount.focus();
}

const closeSheet = () => el.sheet.open && el.sheet.close();

// Closing by any means (Cancel, Esc, backdrop, save) removes the history entry
// we pushed, so the phone's Back button closes the sheet instead of the app.
el.sheet.addEventListener('close', () => {
  editingId = null;
  if (history.state?.sheet) history.back();
});
window.addEventListener('popstate', () => { closeSheet(); route(); });

el.sheet.addEventListener('click', (e) => { if (e.target === el.sheet) closeSheet(); });
el.cancelBtn.addEventListener('click', closeSheet);
el.addBtn.addEventListener('click', () => openSheet());

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { ok, errors, value } = validate({
    amount: el.f.amount.value,
    description: el.f.description.value,
    category: el.f.category.value,
    date: el.f.date.value,
  });
  setErrors(errors);
  if (!ok) {
    el.f[Object.keys(errors)[0]].focus();
    return;
  }
  const isEdit = Boolean(editingId);
  const next = isEdit
    ? updateTransaction(transactions, editingId, value)
    : addTransaction(transactions, value);
  if (commit(next, isEdit ? 'Changes saved' : 'Expense saved')) closeSheet();
});

el.deleteBtn.addEventListener('click', () => {
  const tx = findTransaction(transactions, editingId);
  if (!tx) return;
  const ok = window.confirm(`Delete "${tx.description}" (${formatMoney(tx.amount)})?\nThis can't be undone.`);
  if (ok && commit(removeTransaction(transactions, tx.id), 'Expense deleted')) closeSheet();
});

// Tap any transaction row (home or all view) to edit it.
document.addEventListener('click', (e) => {
  const row = e.target.closest('.tx');
  if (row) openSheet(findTransaction(transactions, row.dataset.id));
});

/* ---------- Install / Home Screen ---------- */

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  el.installBtn.hidden = false;
});
el.installBtn.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  el.installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { el.installBtn.hidden = true; });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

/* ---------- Start ---------- */

storage.onExternalChange((list) => { transactions = list; render(); });
storage.requestPersistence();

// Refresh "Today"/"Yesterday" labels and month totals when reopened on a new day.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushNote();
  else render();
});

render();
route();

// Home Screen shortcut: long-press icon → "Add expense".
if (new URLSearchParams(location.search).get('action') === 'add') {
  history.replaceState(null, '', location.pathname + location.hash);
  openSheet();
}
