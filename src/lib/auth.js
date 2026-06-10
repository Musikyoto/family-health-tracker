import { supabase } from './supabase.js'

export async function sendOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyOtp(email, token) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
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
