import { supabase } from './supabase.js'

// Thin data layer between the Supabase tables (snake_case) and the camelCase
// shapes the UI already uses. Step 4 covers families / memberships / invites;
// people / items / meds are added in later steps.

// ── Memberships ──────────────────────────────────────────────────────
// The families the current user belongs to, with their role in each.
export async function getMyMemberships() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('memberships')
    .select('family_id, role, display_name, families(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((m) => ({
    familyId: m.family_id,
    role: m.role,
    displayName: m.display_name,
    familyName: m.families?.name ?? '',
  }))
}

// ── Bootstrap RPCs (membership creation is controlled server-side) ───
export async function createFamily(name, displayName) {
  const { data, error } = await supabase.rpc('create_family', {
    p_name: name,
    p_display_name: displayName,
  })
  if (error) throw error
  return data // family id (uuid)
}

export async function joinFamily(code, displayName) {
  const { data, error } = await supabase.rpc('join_family', {
    p_code: code,
    p_display_name: displayName,
  })
  if (error) throw error
  return { familyId: data.family_id, role: data.role }
}
