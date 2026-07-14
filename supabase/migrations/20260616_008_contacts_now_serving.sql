-- =============================================================
-- Add a NowServing availability flag to contacts.
-- NowServing is a Philippine telehealth app; some doctors take online
-- consultations through it.
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- No RLS changes needed: the contacts policies are row-level (they gate whole
-- rows via is_member / is_editor and never reference columns), and the
-- table-level GRANT to authenticated (no column list) already covers every
-- column, including ones added later. So member-read / editor-write extends to
-- this column automatically.

alter table public.contacts
  add column now_serving boolean not null default false;
