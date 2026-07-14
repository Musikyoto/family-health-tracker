-- 011 — Contacts: drop contact-level days/hours (schedule moved into phones).
--
-- The visiting schedule now lives PER PHONE inside the phones jsonb — each
-- entry is { label, location, number, days, hours } — because a doctor holds
-- different days/hours at different clinics (e.g. M/W/F mornings at one
-- hospital via one secretary, T/TH afternoons at another). Adding those keys
-- needed NO migration (jsonb is schemaless); this migration only removes the
-- two columns from migration 010, which nothing references once the per-phone
-- code is deployed.
--
-- ⚠️  ORDERING + PRE-CHECK. Deploy the per-phone code FIRST (it ignores these
--     columns), re-enter any listed schedule per phone row in the app, and
--     only then run the drop — it irreversibly discards the column values:
--
--       select id, name, days, hours
--       from public.contacts
--       where coalesce(array_length(days, 1), 0) > 0
--          or (hours is not null and btrim(hours) <> '');
--
-- RLS/grants unchanged: the contacts policies gate rows by family_id and
-- never reference these columns.

alter table public.contacts
  drop column if exists days,
  drop column if exists hours;
