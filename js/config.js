// App-wide settings. Edit here to change categories or list sizes.
export const STORAGE_KEY = 'money-tracker.transactions.v1';
export const NOTES_KEY = 'money-tracker.notes.v1';

export const CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
];

export const RECENT_LIMIT = 8;
export const MAX_DESCRIPTION = 80;
export const MAX_AMOUNT = 1_00_00_00_000; // ₹100 crore sanity cap
