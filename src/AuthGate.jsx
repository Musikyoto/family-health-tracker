import React from 'react'
import { onAuthStateChange, getUser } from './lib/auth.js'
import { AuthScreen } from './screens/AuthScreen.jsx'
import App from './App.jsx'

// AuthGate subscribes to Supabase auth state.
// Renders AuthScreen when logged out, App when logged in.
// getUser() on mount handles the "refresh keeps you logged in" requirement.
export default function AuthGate() {
  const [user, setUser] = React.useState(undefined) // undefined = loading

  React.useEffect(() => {
    // Populate from existing session on first load
    getUser().then(setUser)
    // Subscribe to future changes (sign in, sign out, token refresh)
    return onAuthStateChange(setUser)
  }, [])

  if (user === undefined) return <LoadingScreen />
  if (!user) return <AuthScreen />
  return <App />
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #E6F2EC 0%, #E8F3F1 55%, #EFF3ED 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 15, color: '#6E938A', fontWeight: 600 }}>Loading…</div>
    </div>
  )
}
