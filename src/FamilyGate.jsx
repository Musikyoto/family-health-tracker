import React from 'react'
import { getMyMemberships } from './lib/api.js'
import { signOut } from './lib/auth.js'
import { CreateJoinScreen } from './screens/CreateJoinScreen.jsx'
import { LoadingScreen } from './components/LoadingScreen.jsx'
import App from './App.jsx'

// Rendered once a user is authenticated. Decides between onboarding and the app:
//   no membership  → Create/Join screen
//   ≥1 membership  → the app, scoped to the active family (first for now;
//                    the schema supports multiple, the UI assumes one active)
export default function FamilyGate() {
  const [memberships, setMemberships] = React.useState(undefined) // undefined = loading

  // Async-only setState (the fetch resolves later), so this is safe to call
  // from an effect without triggering cascading synchronous renders.
  const reload = React.useCallback(() => {
    getMyMemberships()
      .then(setMemberships)
      .catch((e) => { console.error('Failed to load memberships:', e); setMemberships([]) })
  }, [])

  React.useEffect(() => { reload() }, [reload])

  if (memberships === undefined) return <LoadingScreen label="Loading your family…" />

  if (memberships.length === 0) {
    return <CreateJoinScreen onDone={reload} onSignOut={signOut} />
  }

  const active = memberships[0]
  return (
    <App
      family={{ id: active.familyId, name: active.familyName }}
      role={active.role}
      displayName={active.displayName}
      onSignOut={signOut}
    />
  )
}
