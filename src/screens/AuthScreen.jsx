import React from 'react'
import { Screen, PrimaryButton, GhostButton, TextInput, Field, ErrorMsg, InlineLink } from '../components/ui.jsx'
import { T } from '../lib/theme.js'
import { sendMagicLink, signInWithPassword, signUpWithPassword } from '../lib/auth.js'

// ── AuthScreen ────────────────────────────────────────────────────────
// Email-first magic link. Default Supabase templates are link-based and
// can't be edited on the built-in email service, so we use the link (not a
// 6-digit code): user enters email → we send a link → they tap it → the app
// reopens already authenticated (handled by detectSessionInUrl in AuthGate).
// Password is offered as a secondary method.

export function AuthScreen() {
  const [email, setEmail] = React.useState('')
  const [step, setStep] = React.useState('email') // 'email' | 'sent' | 'password' | 'signup'
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState(null)

  const clearErr = () => setErr(null)

  async function handleSendLink(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true); clearErr()
    try {
      await sendMagicLink(email.trim())
      setStep('sent')
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    if (!password) return
    setBusy(true); clearErr()
    try {
      await signInWithPassword(email.trim(), password)
    } catch (ex) {
      // If sign-in fails with "invalid credentials", offer sign-up
      if (ex.message?.toLowerCase().includes('invalid') || ex.message?.toLowerCase().includes('not found')) {
        setStep('signup')
      } else {
        setErr(ex.message)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!password) return
    setBusy(true); clearErr()
    try {
      await signUpWithPassword(email.trim(), password)
      // If email confirmation is on, no session yet → tell them to check email.
      // If it's off, onAuthStateChange fires and AuthGate swaps to the app.
      setStep('sent')
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <div style={{ padding: '72px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Wordmark */}
        <div style={{ marginBottom: 36 }}>
          <img src="/mamori-mark.svg" alt="" width={56} height={56} style={{ display: 'block', marginBottom: 14 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: T.deep, letterSpacing: '-0.5px' }}>
            Mamori
          </div>
          <div style={{ fontSize: 16, color: T.body, marginTop: 4 }}>
            {step === 'email' && 'Sign in or create an account'}
            {step === 'sent' && 'Check your email'}
            {step === 'password' && 'Sign in with password'}
            {step === 'signup' && 'Create your account'}
          </div>
        </div>

        {/* ── Email step ── */}
        {step === 'email' && (
          <form onSubmit={handleSendLink} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email address">
              <TextInput
                type="email"
                value={email}
                onChange={(v) => { setEmail(v); clearErr() }}
                placeholder="you@example.com"
              />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleSendLink} style={{ marginTop: 4 }}>
              {busy ? 'Sending…' : 'Send sign-in link'}
            </PrimaryButton>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <InlineLink onClick={() => { clearErr(); setStep('password') }}>
                Use a password instead
              </InlineLink>
            </div>
          </form>
        )}

        {/* ── Sent (check email) step ── */}
        {step === 'sent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, color: T.body, lineHeight: 1.55 }}>
              We sent a sign-in link to <strong style={{ color: T.deep }}>{email}</strong>.
              Tap it to finish signing in — you can open it on this device or your phone.
              You can close this tab once you’ve tapped the link.
            </div>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <GhostButton onClick={handleSendLink}>
              {busy ? 'Resending…' : 'Resend link'}
            </GhostButton>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <InlineLink onClick={() => { clearErr(); setStep('email') }}>
                ← Use a different email
              </InlineLink>
            </div>
          </div>
        )}

        {/* ── Password sign-in step ── */}
        {step === 'password' && (
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email address">
              <TextInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(v) => { setPassword(v); clearErr() }}
                placeholder="••••••••"
              />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handlePassword}>
              {busy ? 'Signing in…' : 'Sign in'}
            </PrimaryButton>
            <GhostButton onClick={() => { clearErr(); setStep('email') }}>
              ← Use a link instead
            </GhostButton>
          </form>
        )}

        {/* ── Sign-up step (password path, new user) ── */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, color: T.body, lineHeight: 1.5, marginBottom: 4 }}>
              No account found for <strong style={{ color: T.deep }}>{email}</strong>. Create one?
            </div>
            <Field label="Choose a password">
              <TextInput
                type="password"
                value={password}
                onChange={(v) => { setPassword(v); clearErr() }}
                placeholder="••••••••"
              />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleSignUp}>
              {busy ? 'Creating account…' : 'Create account'}
            </PrimaryButton>
            <GhostButton onClick={() => { clearErr(); setStep('email') }}>
              ← Back
            </GhostButton>
          </form>
        )}
      </div>
    </Screen>
  )
}
