// Shared data helpers (dates, contact day chips). The in-memory seed data
// that once lived here was deleted when Supabase became the data layer.

// Device-local calendar date (YYYY-MM-DD), computed on demand so "today"
// comparisons re-badge after midnight. Local getters on purpose — the app
// has no timezone conversion anywhere (toISOString would shift to UTC).
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Contact visiting-schedule day chips, in canonical week order. These exact
// strings are stored in each phone entry's schedules pairs inside
// contacts.phones (jsonb) — the contact-level columns were dropped in 011.
export const DAYS = ['M', 'T', 'W', 'TH', 'F', 'SAT', 'SUN'];
// Canonical-order (and deduped) copy of a selected-days array.
export const sortDays = (days) => DAYS.filter((d) => (days || []).includes(d));
