import { supabase } from './supabase.js'

// Sends a magic-link email (works for both new and existing users on the
// default link-based template). The link returns to emailRedirectTo, where
// detectSessionInUrl (on by default) establishes the session.
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signInWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithPassword(email, password) {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(cb) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
