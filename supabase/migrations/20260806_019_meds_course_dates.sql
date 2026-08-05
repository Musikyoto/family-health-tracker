-- =============================================================
-- Medicines: optional course dates (start / end).
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- Optional medication course dates. Both columns are nullable, so every
-- existing row is unaffected and reads as on-going — the 30 medicines
-- currently stored keep rendering exactly as they do today.
--
-- "Finished" is derived, never stored: end_date is not null AND end_date
-- is in the past (compared device-local in the client, via todayIso()).
-- There is deliberately no status column — a stored flag would need a
-- nightly job to stay true and would drift the moment a date is edited.
--
-- RLS and the integrity trigger are unaffected: the meds policies gate
-- rows by family_id, and check_person_in_family (005 / 006) reads
-- person_id only — neither inspects these columns.
--
-- Additive and safe to run before the code ships: the currently deployed
-- app neither reads nor writes these columns.

alter table public.meds add column if not exists start_date date;
alter table public.meds add column if not exists end_date   date;
