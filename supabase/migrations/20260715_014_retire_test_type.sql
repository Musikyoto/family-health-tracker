-- =============================================================
-- Retire the 'Test' item type: tests are appointments now.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- Product decision from real-device use: a medical test IS an
-- appointment — the title and description carry the specifics, and the
-- separate chip earned nothing. The form now offers
-- Appointment | Bill | + Custom; this backfills existing rows so no
-- item is left pointing at the retired chip (a straggler would still
-- round-trip via the form's custom-type path, but shouldn't exist).
--
-- Runs in the SQL Editor as postgres, which BYPASSES RLS — deliberate
-- here: one real family plus transient harness families, and every
-- 'Test' row should convert regardless of owner. The editor reports
-- the affected-row count; zero is fine if the type was never used.

update public.items set type = 'Appointment' where type = 'Test';
