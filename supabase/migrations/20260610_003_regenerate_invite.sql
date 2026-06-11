-- =============================================================
-- regenerate_invite RPC — "regenerate link" = revoke active + mint fresh
-- Apply via: Supabase dashboard → SQL Editor → Run
-- =============================================================
--
-- Editor-gated (raises if the caller isn't an editor of the family). Keeps one
-- active invite per role: revokes the current non-revoked invite(s) of p_role,
-- then inserts a new one with a fresh unique code. Returns the new code.
--
-- search_path is pinned to '' (empty) so a malicious object in another schema
-- can't be resolved ahead of the intended one — the standard hardening for
-- SECURITY DEFINER functions. Everything below is schema-qualified (public.*,
-- auth.*) or a pg_catalog built-in (always implicitly searched), so '' is safe.

create or replace function public.regenerate_invite(p_family_id uuid, p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if not public.is_editor(p_family_id) then
    raise exception 'Only editors can regenerate invites.';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'Invalid role: %', p_role;
  end if;

  -- revoke the current active invite(s) of this role
  update public.invites
     set revoked = true
   where family_id = p_family_id and role = p_role and revoked = false;

  -- mint a fresh unique code (XXXX-NNNN)
  loop
    v_code := upper(substring(md5(random()::text) from 1 for 4))
              || '-'
              || lpad((floor(random() * 9000 + 1000))::text, 4, '0');
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;

  insert into public.invites (family_id, code, role, created_by)
  values (p_family_id, v_code, p_role, auth.uid());

  return v_code;
end;
$$;
