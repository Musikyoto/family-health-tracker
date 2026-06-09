# Supabase Backend — Build Brief (for Claude Code)

> **Read this first.** This brief takes the Family Health Tracker from in-memory seed data to a real, multi-tenant Supabase backend with authentication, families, role-based access, and invites. The frontend is already built and working — this is the data + auth layer underneath it.
>
> **Project:** `~/Desktop/Project-Musikyoto/family-health-tracker` (React + Vite, repo: github.com/Musikyoto/family-health-tracker)
>
> **Working discipline (the owner's standard): one task at a time, verify before proceeding, commit + push after each working milestone, show diffs with surrounding context for any change.**

---

## 0. The golden rule for this phase

This is medical data for multiple separate families. **Row-Level Security (RLS) correctness is the single most important thing in this entire build.** A family must NEVER be able to read or write another family's data. Every table gets RLS enabled, every policy gets tested by actively trying to break it. If anything is uncertain, stop and verify rather than guess. Do not ship a table with RLS disabled "to get it working" — that is the one shortcut that must never be taken.

---

## 1. The decided model (do not re-litigate — these are settled)

- **Everyone has a real account** (Supabase Auth). Smooth onboarding is a hard requirement, not a nice-to-have.
- **Sign-in: email-first.** Primary method is a passwordless email code/magic link (Supabase OTP). Also offer email + password as a secondary option ("use a password instead"). Lead with email; do not force a method choice up front.
- **Families:** a user signs in, then either **creates a family** (becomes its owner) or **joins one** via invite.
- **Roles per membership:** `editor` (view + add/edit/delete + settings/invites) or `viewer` (read-only). Invites carry the role.
- **Invites:** creating/managing a family produces **both an invite code** (e.g. `WANG-4827`) **and an invite link**. Each invite grants a specific role.
- **A user can belong to multiple families** (model for it now; the UI can assume one active family for the owner's use, but don't make the schema single-family).

---

## 2. Target schema

All tables in the `public` schema. Use `uuid` PKs (`default gen_random_uuid()`), `timestamptz created_at default now()`.

### `families`
- `id` uuid PK
- `name` text not null
- `created_by` uuid not null → `auth.users(id)`
- `created_at` timestamptz

### `memberships` (who belongs to which family, and their role)
- `id` uuid PK
- `family_id` uuid not null → `families(id)` on delete cascade
- `user_id` uuid not null → `auth.users(id)` on delete cascade
- `role` text not null check (role in ('editor','viewer'))
- `display_name` text not null  ← the name they entered when joining ("Mum", "Aimee")
- `created_at` timestamptz
- unique (family_id, user_id)

### `people` (the family members being tracked — NOT the same as app users)
> Note: "people" here = Dad/Mum/Aimee as *subjects of health records*. A person is not necessarily an app user, and an app user is not necessarily a person. Keep them separate.
- `id` uuid PK
- `family_id` uuid not null → `families(id)` on delete cascade
- `name` text not null
- `color` text not null   ← one of: amber, blue, pink, green, lavender, peach, aqua
- `created_at` timestamptz

### `items` (calendar items: appointments / tests / bills / custom)
- `id` uuid PK
- `family_id` uuid not null → `families(id)` on delete cascade
- `person_id` uuid not null → `people(id)` on delete cascade
- `type` text not null         ← 'Appointment' | 'Test' | 'Bill' | custom string
- `title` text not null
- `date` date not null
- `time` text                  ← display string like '9:00 AM' or '' (keep simple; not a true time type)
- `description` text
- `refs` jsonb not null default '[]'   ← array of { label, url, kind } where kind ∈ 'doc'|'image'
- `created_at` timestamptz

### `meds` (medications)
- `id` uuid PK
- `family_id` uuid not null → `families(id)` on delete cascade
- `person_id` uuid not null → `people(id)` on delete cascade
- `name` text not null
- `dose` text
- `times` text[] not null default '{}'   ← subset of {'Morning','Noon','Evening'}
- `food` text not null default 'none'    ← 'with' | 'without' | 'none'
- `note` text
- `created_at` timestamptz

### `invites` (codes/links granting a role into a family)
- `id` uuid PK
- `family_id` uuid not null → `families(id)` on delete cascade
- `code` text not null unique         ← e.g. 'WANG-4827'; the invite link embeds this
- `role` text not null check (role in ('editor','viewer'))
- `created_by` uuid not null → `auth.users(id)`
- `revoked` boolean not null default false
- `created_at` timestamptz

> The "regenerate link" feature = mark old invite revoked (or delete) + create a new one. The "two links" concept from earlier (one view, one edit) maps to: keep one active non-revoked invite per role per family, surface those two in the Invite screen.

---

## 3. RLS — the critical part

Enable RLS on **every** table above. The core predicate everywhere is **"is the current user a member of this family?"** Implement a SQL helper to avoid recursive policy problems:

```sql
-- SECURITY DEFINER helper: is the logged-in user a member of :fid?
create or replace function public.is_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = fid and m.user_id = auth.uid()
  );
$$;

-- editor check
create or replace function public.is_editor(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = fid and m.user_id = auth.uid() and m.role = 'editor'
  );
$$;
```

Policy intent per table (translate to explicit `select`/`insert`/`update`/`delete` policies):

- **families:** SELECT if `is_member(id)`. INSERT if `created_by = auth.uid()`. UPDATE/DELETE if `is_editor(id)` (or restrict delete to owner only — your call, but at minimum editor).
- **memberships:** SELECT if `is_member(family_id)` (members can see who's in their family). INSERT — see invite flow below (a user can insert their OWN membership only via the join RPC). UPDATE/DELETE role changes restricted to `is_editor(family_id)`. A user may delete their own membership (leave).
- **people / items / meds:** SELECT if `is_member(family_id)`. INSERT/UPDATE/DELETE if `is_editor(family_id)`. ← viewers can read, only editors can write. This is where the role gating becomes real (the frontend already hides edit UI from viewers, but RLS is what actually enforces it).
- **invites:** SELECT if `is_member(family_id)`. INSERT/UPDATE/DELETE if `is_editor(family_id)`. PLUS a way for a joining user to look up an invite by code (see join flow — do this via a SECURITY DEFINER RPC, not a broad select policy, so randoms can't enumerate invites).

**Test RLS explicitly:** create two test families with two users, confirm user A cannot select/update/delete user B's people/items/meds even by guessing ids. Don't consider this phase done until that test passes.

---

## 4. Join flow (do via RPCs, not raw client inserts)

Two `security definer` functions so membership creation is controlled:

- `create_family(p_name text, p_display_name text)` → inserts a family (created_by = auth.uid()), inserts an editor membership for the caller with display_name, auto-creates the two default invites (one editor, one viewer), returns the family id.
- `join_family(p_code text, p_display_name text)` → looks up a non-revoked invite by code; if found, inserts a membership for auth.uid() with that invite's role + display_name (guard against duplicate membership); returns family id + role. If code invalid/revoked, raise a clear error.

This keeps the client from ever inserting memberships directly, which is the safe pattern.

---

## 5. Frontend rewiring — order of work

The app currently holds all state in `src/App.jsx` via `seedData()` and mutates a local `data` object. Replace that with Supabase, **one slice at a time**, keeping the app runnable after each step.

**Build order (verify + commit after each):**

1. **Install + env.** `npm i @supabase/supabase-js`. Create `src/lib/supabase.js` exporting a configured client reading `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Put those in `.env.local` (already gitignored). Add a `.env.example` with the var names (no values) and commit that.
2. **Schema + RLS + RPCs.** Write as SQL migration(s). Apply to the Supabase project. Test RLS with two users (section 3). Commit the SQL into the repo (e.g. `/supabase/migrations/`).
3. **Auth.** Build the sign-in screen (email-first OTP + password fallback) and an auth gate so the app only renders for a logged-in user. Use Supabase `onAuthStateChange`. Test: sign up, receive code/link, land logged in; refresh keeps you logged in.
4. **Family bootstrap.** After login: if the user has no membership → show Create/Join screen (designed already). Wire `create_family` and `join_family` RPCs. Build the Invite screen (code + copyable link, role toggle) backed by the `invites` table; "regenerate" = revoke + new invite. Test the full create → invite link → second user joins as viewer loop.
5. **People.** Swap People management to read/write the `people` table for the active family. Verify realtime or refetch-on-change so edits show up.
6. **Items.** Swap Calendar items to the `items` table. Map `refs` jsonb ↔ the existing `{label,url,kind}` shape the UI already uses. Keep date as `date`, time as the display string.
7. **Meds.** Swap medications to the `meds` table (`times` text[], `food`, `note`).
8. **Role gating end-to-end.** Confirm a viewer account: sees data, has no gear/＋/edit (frontend already does this), AND is blocked by RLS even if they tried to call a write. Confirm an editor can do everything.
9. **Welcome/first-run reconciliation.** The current `?role=view` / `?firstrun=1` URL simulation is now replaced by *real* auth + membership role. Remove the URL-param simulation. The "link recipient welcome" can become the join screen; the "editor first-run (add a person)" now triggers naturally when an editor's family has zero people.
10. **Realtime (optional, nice).** Supabase realtime subscriptions so a change by one family member appears on another's device without refresh. If skipped, refetch on focus.

### Data-shape mapping (current UI ↔ DB)
The UI in `src/App.jsx` / screens uses these field names — keep them in the app layer, map to snake_case columns in the data layer:
- person: `{ id, name, color }` ↔ people row
- item: `{ id, personId, type, title, date, time, description, refs:[{label,url,kind}] }` ↔ items row (`person_id`, `refs` jsonb)
- med: `{ id, personId, name, dose, times:[], food, note }` ↔ meds row (`person_id`)

Write a thin mapping layer (e.g. `src/lib/api.js`) with functions like `listPeople(familyId)`, `upsertItem(...)`, `deleteMed(id)` etc., returning the camelCase shapes the components already expect. This isolates Supabase from the UI and means the screens barely change.

---

## 6. Things NOT in scope for this phase (keep deferred)
- File/photo *upload* + storage (refs stay external links — Drive/Photos URLs). Storage comes later.
- Billing / subscriptions.
- Per-person *granular* permissions (a viewer sees the whole family or nothing — no per-person hiding).
- Custom item-type theming.
- Push notifications.

---

## 7. Deployment note (later, after the above works locally)
- Deploy to Vercel (the owner has shipped there before). Set the two `VITE_SUPABASE_*` env vars in the Vercel project settings.
- Configure Supabase Auth redirect URLs to include the Vercel domain (and localhost for dev) so magic links work in both.
- PWA: keep the app installable ("add to home screen"); confirm a manifest + icons exist.

---

## 8. Suggested first message to Claude Code

> "I'm adding a Supabase backend to my existing React+Vite app (family health tracker). I have a build brief at `docs/SUPABASE_BUILD_BRIEF.md`. Read it, then let's start with step 1 (install + env + supabase client). Go one step at a time, show me diffs, and we commit after each working step. Don't disable RLS at any point."
