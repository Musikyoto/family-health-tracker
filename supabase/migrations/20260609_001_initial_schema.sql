-- =============================================================
-- Family Health Tracker — initial schema
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------

create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('editor','viewer')),
  display_name text not null,
  created_at   timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.people (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null,
  color      text not null,
  created_at timestamptz not null default now()
);

create table public.items (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  type        text not null,
  title       text not null,
  date        date not null,
  time        text,
  description text,
  refs        jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

create table public.meds (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  name       text not null,
  dose       text,
  times      text[] not null default '{}',
  food       text not null default 'none',
  note       text,
  created_at timestamptz not null default now()
);

create table public.invites (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  code       text not null unique,
  role       text not null check (role in ('editor','viewer')),
  created_by uuid not null references auth.users(id),
  revoked    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- RLS — enable on every table
-- ----------------------------------------------------------------

alter table public.families    enable row level security;
alter table public.memberships enable row level security;
alter table public.people      enable row level security;
alter table public.items       enable row level security;
alter table public.meds        enable row level security;
alter table public.invites     enable row level security;

-- ----------------------------------------------------------------
-- HELPER FUNCTIONS (security definer — avoid recursive policy issues)
-- ----------------------------------------------------------------

create or replace function public.is_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = fid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_editor(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = fid and m.user_id = auth.uid() and m.role = 'editor'
  );
$$;

-- ----------------------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------------------

-- families
create policy "families: members can select"
  on public.families for select
  using (public.is_member(id));

create policy "families: owner can insert"
  on public.families for insert
  with check (created_by = auth.uid());

create policy "families: editors can update"
  on public.families for update
  using (public.is_editor(id));

create policy "families: editors can delete"
  on public.families for delete
  using (public.is_editor(id));

-- memberships
create policy "memberships: members can select"
  on public.memberships for select
  using (public.is_member(family_id));

create policy "memberships: editors can update"
  on public.memberships for update
  using (public.is_editor(family_id));

create policy "memberships: editors can delete others, anyone can delete own"
  on public.memberships for delete
  using (public.is_editor(family_id) or user_id = auth.uid());

-- No direct INSERT on memberships from the client — create_family / join_family
-- RPCs (security definer) handle all membership creation.

-- people
create policy "people: members can select"
  on public.people for select
  using (public.is_member(family_id));

create policy "people: editors can insert"
  on public.people for insert
  with check (public.is_editor(family_id));

create policy "people: editors can update"
  on public.people for update
  using (public.is_editor(family_id));

create policy "people: editors can delete"
  on public.people for delete
  using (public.is_editor(family_id));

-- items
create policy "items: members can select"
  on public.items for select
  using (public.is_member(family_id));

create policy "items: editors can insert"
  on public.items for insert
  with check (public.is_editor(family_id));

create policy "items: editors can update"
  on public.items for update
  using (public.is_editor(family_id));

create policy "items: editors can delete"
  on public.items for delete
  using (public.is_editor(family_id));

-- meds
create policy "meds: members can select"
  on public.meds for select
  using (public.is_member(family_id));

create policy "meds: editors can insert"
  on public.meds for insert
  with check (public.is_editor(family_id));

create policy "meds: editors can update"
  on public.meds for update
  using (public.is_editor(family_id));

create policy "meds: editors can delete"
  on public.meds for delete
  using (public.is_editor(family_id));

-- invites
create policy "invites: members can select"
  on public.invites for select
  using (public.is_member(family_id));

create policy "invites: editors can insert"
  on public.invites for insert
  with check (public.is_editor(family_id));

create policy "invites: editors can update"
  on public.invites for update
  using (public.is_editor(family_id));

create policy "invites: editors can delete"
  on public.invites for delete
  using (public.is_editor(family_id));

-- ----------------------------------------------------------------
-- RPCs
-- ----------------------------------------------------------------

-- create_family: insert family + editor membership + two default invites
create or replace function public.create_family(
  p_name         text,
  p_display_name text
)
returns uuid language plpgsql security definer as $$
declare
  v_family_id uuid;
  v_editor_code text;
  v_viewer_code text;
begin
  -- insert family
  insert into public.families (name, created_by)
  values (p_name, auth.uid())
  returning id into v_family_id;

  -- insert editor membership for the creator
  insert into public.memberships (family_id, user_id, role, display_name)
  values (v_family_id, auth.uid(), 'editor', p_display_name);

  -- generate unique 9-char invite codes  (XXXX-NNNN format)
  loop
    v_editor_code := upper(substring(md5(random()::text) from 1 for 4))
                     || '-'
                     || lpad((floor(random() * 9000 + 1000))::text, 4, '0');
    exit when not exists (select 1 from public.invites where code = v_editor_code);
  end loop;

  loop
    v_viewer_code := upper(substring(md5(random()::text) from 1 for 4))
                     || '-'
                     || lpad((floor(random() * 9000 + 1000))::text, 4, '0');
    exit when not exists (select 1 from public.invites where code = v_viewer_code)
              and v_viewer_code <> v_editor_code;
  end loop;

  -- insert the two default invites
  insert into public.invites (family_id, code, role, created_by)
  values
    (v_family_id, v_editor_code, 'editor', auth.uid()),
    (v_family_id, v_viewer_code, 'viewer', auth.uid());

  return v_family_id;
end;
$$;

-- join_family: validate invite code, insert membership, return family_id + role
create or replace function public.join_family(
  p_code         text,
  p_display_name text
)
returns jsonb language plpgsql security definer as $$
declare
  v_invite   public.invites%rowtype;
  v_family_id uuid;
  v_role      text;
begin
  -- look up the invite (case-insensitive, not revoked)
  select * into v_invite
  from public.invites
  where upper(code) = upper(p_code)
    and revoked = false
  limit 1;

  if not found then
    raise exception 'Invalid or revoked invite code.';
  end if;

  v_family_id := v_invite.family_id;
  v_role      := v_invite.role;

  -- guard: already a member?
  if exists (
    select 1 from public.memberships
    where family_id = v_family_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this family.';
  end if;

  -- insert membership
  insert into public.memberships (family_id, user_id, role, display_name)
  values (v_family_id, auth.uid(), v_role, p_display_name);

  return jsonb_build_object('family_id', v_family_id, 'role', v_role);
end;
$$;
