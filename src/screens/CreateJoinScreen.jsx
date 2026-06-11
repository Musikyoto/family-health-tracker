import React from 'react'
import { Screen, PrimaryButton, TextInput, Field, Pill, ErrorMsg, InlineLink } from '../components/ui.jsx'
import { T } from '../lib/theme.js'
import { createFamily, joinFamily } from '../lib/api.js'
import { clearPendingInviteCode } from '../lib/invite.js'

// Shown to a logged-in user who has no family membership yet.
// They either create a new family (become its editor/owner) or join an
// existing one with an invite code. `initialCode`/`initialMode` let an invite
// deep-link prefill the join form (wired in a later slice).
export function CreateJoinScreen({ onDone, onSignOut, initialCode = '', initialMode }) {
  const [mode, setMode] = React.useState(initialMode || (initialCode ? 'join' : 'create'))
  const [familyName, setFamilyName] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [code, setCode] = React.useState(initialCode)
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState(null)

  const switchMode = (m) => { setMode(m); setErr(null) }

  async function handleCreate(e) {
    e.preventDefault()
    if (busy || !familyName.trim() || !displayName.trim()) return
    setBusy(true); setErr(null)
    try {
      await createFamily(familyName.trim(), displayName.trim())
      clearPendingInviteCode() // onboarding done; discard any stashed invite
      onDone() // FamilyGate reloads memberships → this screen unmounts
    } catch (ex) {
      setErr(ex.message); setBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (busy || !code.trim() || !displayName.trim()) return
    setBusy(true); setErr(null)
    try {
      await joinFamily(code.trim(), displayName.trim())
      clearPendingInviteCode()
      onDone()
    } catch (ex) {
      setErr(ex.message); setBusy(false)
    }
  }

  return (
    <Screen>
      <div style={{ padding: '72px 24px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.deep, letterSpacing: '-0.5px' }}>
            Family Health
          </div>
          <div style={{ fontSize: 16, color: T.body, marginTop: 4 }}>
            {mode === 'create' ? 'Start a family to track' : 'Join your family'}
          </div>
        </div>

        {/* Create / Join toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <Pill label="Create" active={mode === 'create'} onClick={() => switchMode('create')} full />
          <Pill label="Join" active={mode === 'join'} onClick={() => switchMode('join')} full />
        </div>

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Field label="Family name" hint="e.g. The Wang Family">
              <TextInput value={familyName} onChange={(v) => { setFamilyName(v); setErr(null) }} placeholder="Family name" />
            </Field>
            <Field label="Your name" hint="How your family sees you (e.g. Mum, Dad).">
              <TextInput value={displayName} onChange={(v) => { setDisplayName(v); setErr(null) }} placeholder="Your name" />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleCreate} style={{ marginTop: 8 }}>
              {busy ? 'Creating…' : 'Create family'}
            </PrimaryButton>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Field label="Invite code" hint="From whoever invited you, e.g. WANG-4827.">
              <TextInput
                value={code}
                onChange={(v) => { setCode(v.toUpperCase()); setErr(null) }}
                placeholder="WANG-4827"
                style={{ letterSpacing: 1, fontFamily: 'ui-monospace, Menlo, monospace' }}
              />
            </Field>
            <Field label="Your name" hint="How your family sees you (e.g. Aimee).">
              <TextInput value={displayName} onChange={(v) => { setDisplayName(v); setErr(null) }} placeholder="Your name" />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleJoin} style={{ marginTop: 8 }}>
              {busy ? 'Joining…' : 'Join family'}
            </PrimaryButton>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <InlineLink onClick={onSignOut}>Sign out</InlineLink>
        </div>
      </div>
    </Screen>
  )
}
