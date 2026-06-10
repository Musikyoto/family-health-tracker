import React from 'react'
import { Screen, PrimaryButton, GhostButton, TextInput, Field } from '../components/ui.jsx'
import { T } from '../lib/theme.js'
import { sendOtp, verifyOtp, signInWithPassword, signUpWithPassword } from '../lib/auth.js'

// ── AuthScreen ────────────────────────────────────────────────────────
// Three sub-steps: email entry → OTP verify (or password entry → sign-up fallback)
// Email-first: user types email, we send OTP; they can switch to password mode.

export function AuthScreen() {
  const [email, setEmail] = React.useState('')
  const [step, setStep] = React.useState('email') // 'email' | 'otp' | 'password' | 'signup'
  const [code, setCode] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState(null)

  const clearErr = () => setErr(null)

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true); clearErr()
    try {
      await sendOtp(email.trim())
      setStep('otp')
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true); clearErr()
    try {
      await verifyOtp(email.trim(), code.trim())
      // onAuthStateChange in AuthGate will pick up the new session
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
      // session fires via onAuthStateChange
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
          <div style={{ fontSize: 28, fontWeight: 800, color: T.deep, letterSpacing: '-0.5px' }}>
            Family Health
          </div>
          <div style={{ fontSize: 16, color: T.body, marginTop: 4 }}>
            {step === 'email' && 'Sign in or create an account'}
            {step === 'otp' && 'Check your email'}
            {step === 'password' && 'Sign in with password'}
            {step === 'signup' && 'Create your account'}
          </div>
        </div>

        {/* ── Email step ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email address">
              <TextInput
                type="email"
                value={email}
                onChange={(v) => { setEmail(v); clearErr() }}
                placeholder="you@example.com"
              />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleSendOtp} style={{ marginTop: 4 }}>
              {busy ? 'Sending…' : 'Send sign-in code'}
            </PrimaryButton>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <InlineLink onClick={() => { clearErr(); setStep('password') }}>
                Use a password instead
              </InlineLink>
            </div>
          </form>
        )}

        {/* ── OTP verify step ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, color: T.body, lineHeight: 1.5, marginBottom: 4 }}>
              We sent a 6-digit code to <strong style={{ color: T.deep }}>{email}</strong>. Enter it below.
            </div>
            <Field label="Code">
              <TextInput
                type="text"
                value={code}
                onChange={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); clearErr() }}
                placeholder="123456"
                style={{ letterSpacing: 4, fontSize: 22, textAlign: 'center' }}
              />
            </Field>
            {err && <ErrorMsg>{err}</ErrorMsg>}
            <PrimaryButton onClick={handleVerifyOtp}>
              {busy ? 'Verifying…' : 'Confirm code'}
            </PrimaryButton>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <InlineLink onClick={() => { clearErr(); setStep('email') }}>
                ← Back
              </InlineLink>
              {' · '}
              <InlineLink onClick={handleSendOtp}>Resend code</InlineLink>
            </div>
          </form>
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
              ← Use a code instead
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

function ErrorMsg({ children }) {
  return (
    <div style={{
      background: 'rgba(226,84,47,0.09)', border: '1px solid rgba(226,84,47,0.2)',
      borderRadius: 12, padding: '10px 14px', fontSize: 14, color: T.red, lineHeight: 1.4,
    }}>{children}</div>
  )
}

function InlineLink({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      color: T.accentSolid, fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
    }}>{children}</button>
  )
}
