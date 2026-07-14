-- 010 — Contacts: visiting schedule (days + hours).
--
-- days  text[]  not null default '{}'
--   The days this contact holds clinic, stored as the app's chip keys:
--   M, T, W, TH, F, SAT, SUN. text[] rather than jsonb to match meds.times —
--   the codebase rule is: flat list of fixed short labels → text[]
--   (meds.times), list of objects → jsonb (contacts.phones, items.refs).
--   No CHECK constraint, same as meds.times: the form chips are the only
--   writer and emit only these seven values.
--
-- hours text (nullable)
--   Free-form display text, e.g. '9:00 AM – 12:00 NN'. Deliberately
--   unstructured — clinic-hours phrasing varies too much to model.
--
-- Purely additive: the currently deployed app selects explicit columns, so
-- this can run before the feature code ships (and must — the new code
-- selects these columns).
--
-- RLS/grants: nothing to change. The contacts policies gate rows by
-- family_id and never name columns, and the table grant to `authenticated`
-- has no column list, so new columns are covered automatically. Slice 2
-- extends the harnesses to prove this empirically, as with now_serving.

alter table public.contacts
  add column if not exists days text[] not null default '{}'::text[],
  add column if not exists hours text;
