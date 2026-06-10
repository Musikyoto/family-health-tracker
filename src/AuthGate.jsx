import React from 'react'
import { onAuthStateChange } from './lib/auth.js'
import { AuthScreen } from './screens/AuthScreen.jsx'
import { LoadingScreen } from './components/LoadingScreen.jsx'
import FamilyGate from './FamilyGate.jsx'

// AuthGate subscribes to Supabase auth state.
// Logged out → AuthScreen. Logged in → FamilyGate (which then decides between
// onboarding and the app).
// onAuthStateChange fires INITIAL_SESSION on subscribe — AFTER the client has
// processed any magic-link hash in the URL (detectSessionInUrl) and restored
// any stored session — so this single subscription covers first load, refresh
// (stays logged in), and the magic-link return without flashing the login UI.
export default function AuthGate() {
  const [user, setUser] = React.useState(undefined) // undefined = loading

  React.useEffect(() => {
    return onAuthStateChange(setUser)
  }, [])

  if (user === undefined) return <LoadingScreen />
  if (!user) return <AuthScreen />
  return <FamilyGate />
}
