-- 018 — Rename step 2/2 (contract): drop the now-unused items.important column.
-- Safe to run now: the tentative-flag code is live in production (merged &
-- deployed), so nothing reads or writes `important` anymore — every path uses
-- `tentative` (added + backfilled by migration 017). RLS and both integrity
-- triggers never referenced this column.
alter table public.items drop column if exists important;
