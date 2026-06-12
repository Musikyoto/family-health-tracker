// Shared UI primitives. Converted from the design export to ES modules.
import { T, PALETTE } from '../lib/theme.js';
import { Icon } from './Icon.jsx';

// ── Avatar ───────────────────────────────────────────────────────────
export function Avatar({ person, size = 38 }) {
  const p = PALETTE[person.color] || PALETTE.green;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: p.bg, color: p.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.42), flexShrink: 0, letterSpacing: '0.2px',
    }}>{person.name.charAt(0).toUpperCase()}</div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────
export function PrimaryButton({ children, onClick, full = true, icon, style, disabled = false }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      width: full ? '100%' : undefined, height: 52, borderRadius: 16, border: 'none',
      background: disabled ? T.fieldBg : T.accent, color: disabled ? T.muted : '#fff',
      fontSize: 17, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', boxShadow: disabled ? 'none' : T.shadowBtn, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, letterSpacing: '0.1px', ...style,
    }}>
      {icon && <Icon name={icon} size={20} color={disabled ? T.muted : '#fff'} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, danger, style }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 50, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
      background: danger ? T.redTint : T.fieldBg, color: danger ? T.red : T.body,
      border: `1px solid ${danger ? 'rgba(226,84,47,0.25)' : T.fieldBorder}`,
      fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style,
    }}>{children}</button>
  );
}

// ── Screen scaffold ──────────────────────────────────────────────────
export function Screen({ children, pad = true }) {
  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingBottom: pad ? 40 : 0 }}>{children}</div>
    </div>
  );
}

// Top bar for sub-screens (back + title + optional trailing action)
export function TopBar({ title, onBack, trailing, closeIcon = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '60px 14px 10px', position: 'sticky', top: 0, zIndex: 20,
    }}>
      <button onClick={onBack} aria-label="Back" style={{
        width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: '#fff', boxShadow: T.shadowSoft, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, padding: 0,
      }}>
        <Icon name={closeIcon ? 'close' : 'back'} size={21} color={T.deep} strokeWidth={2.2} />
      </button>
      <div style={{ flex: 1, fontSize: 19, fontWeight: 700, color: T.deep, letterSpacing: '0.1px' }}>{title}</div>
      {trailing}
    </div>
  );
}

// ── Form fields ──────────────────────────────────────────────────────
export function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: T.body, marginBottom: 8, letterSpacing: '0.2px' }}>{label}</div>}
      {children}
      {hint && <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export const inputStyle = {
  width: '100%', height: 50, borderRadius: 14, padding: '0 14px',
  background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, color: T.deep,
  fontSize: 16, fontWeight: 500, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export function TextInput({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, ...style }} />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, height: 'auto', padding: '13px 14px', resize: 'none', lineHeight: 1.4 }} />
  );
}

// Pill toggle (single or multi)
export function Pill({ label, active, onClick, icon, full }) {
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : undefined,
      height: 44, padding: '0 16px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit',
      border: active ? 'none' : `1px solid ${T.fieldBorder}`,
      background: active ? T.accent : T.fieldBg,
      color: active ? '#fff' : T.body, fontSize: 15, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      boxShadow: active ? '0 4px 12px rgba(31,169,160,0.28)' : 'none',
      transition: 'background 140ms ease, color 140ms ease',
    }}>
      {icon && <Icon name={icon} size={17} color={active ? '#fff' : T.body} strokeWidth={2} />}
      {label}
    </button>
  );
}

// ── Inline error box + inline text button (shared by auth/onboarding) ──
export function ErrorMsg({ children }) {
  return (
    <div style={{
      background: 'rgba(226,84,47,0.09)', border: '1px solid rgba(226,84,47,0.2)',
      borderRadius: 12, padding: '10px 14px', fontSize: 14, color: T.red, lineHeight: 1.4,
    }}>{children}</div>
  );
}

export function InlineLink({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      color: T.accentSolid, fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
    }}>{children}</button>
  );
}

// Single-select person picker (ringed in gradient) — SPEC §9 Form A/B
export function PersonPicker({ people, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {people.map((p) => {
        const sel = p.id === value;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 58,
          }}>
            <div style={{ padding: 3, borderRadius: '50%', background: sel ? T.accent : 'transparent' }}>
              <div style={{ padding: 2, borderRadius: '50%', background: '#fff' }}>
                <Avatar person={p} size={46} />
              </div>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: sel ? 700 : 600, color: sel ? T.deep : T.body }}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
