-- 017 — Rename step 1/2 (expand): add items.tentative, backfill from important.
-- Additive & backward-compatible: production keeps using `important`, the
-- tentative-flag branch uses `tentative`, both coexist on the shared project
-- with zero downtime. After merge + prod deploy, run 018 to drop `important`.
alter table public.items add column if not exists tentative boolean not null default false;
update public.items set tentative = important;
