import { T } from '../lib/theme.js'

// Brief full-screen loading state used by the auth + family gates.
export function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div style={{
      minHeight: '100dvh', background: T.gradientBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 15, color: T.body, fontWeight: 600 }}>{label}</div>
    </div>
  )
}
