-- 009 — Contacts: drop the contact-level `location` column.
--
-- Location now lives PER PHONE, inside the phones jsonb: each entry becomes
-- { label, location, number }. One contact (e.g. a doctor) can be reached on
-- different numbers at different hospitals/clinics, so location belongs to the
-- number, not the contact. The phones-shape change itself needs NO migration —
-- jsonb is schemaless — so this migration only removes the now-unused column.
--
-- ⚠️  RUN THE PRE-CHECK FIRST. This DROP is irreversible and discards whatever
--     text is in contacts.location. If any row still has a location set, copy it
--     into the relevant phone's Location field (in the app) before dropping:
--
--       select id, name, location
--       from public.contacts
--       where location is not null and btrim(location) <> '';
--
-- RLS/grants unchanged: the contacts policies gate rows by family_id and never
-- reference this column; the grant to `authenticated` has no column list.

alter table public.contacts drop column if exists location;
