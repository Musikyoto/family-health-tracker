import React from 'react'
import { onAuthStateChange } from './lib/auth.js'
import { AuthScreen } from './screens/AuthScreen.jsx'
import App from './App.jsx'

// AuthGate subscribes to Supabase auth state.
// Renders AuthScreen when logged out, App when logged in.
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
