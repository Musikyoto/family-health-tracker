// Settings home, People mgmt, Invite links, Regenerate dialog — SPEC §5, §10, §11.
// Converted from the design export to ES modules.
import React from 'react';
import { T, PALETTE, PALETTE_ORDER } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, TopBar, PrimaryButton, GhostButton, Field, TextInput } from '../components/ui.jsx';

// ── Settings home ────────────────────────────────────────────────────
export function SettingsHome({ role, onBack, onPeople, onInvite, peopleSummary, onSignOut }) {
  const editor = role === 'editor';
  const Row = ({ icon, title, sub, onClick, muted, badge }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px',
      cursor: onClick ? 'pointer' : 'default', opacity: muted ? 0.55 : 1,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: T.fieldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={20} color={T.accentSolid} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.deep }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: T.body, marginTop: 2, fontWeight: 500 }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize: 11.5, fontWeight: 700, color: T.muted, background: T.fieldBg, padding: '3px 9px', borderRadius: 999, letterSpacing: '0.3px' }}>{badge}</span>}
      {onClick && <Icon name="chevron" size={16} color={T.muted} strokeWidth={2} />}
    </div>
  );
  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 40 }}>
      <TopBar title="Settings" onBack={onBack} closeIcon />
      <div style={{ padding: '6px 16px 0' }}>
        {editor ? (
          <>
            <div style={{ background: T.card, borderRadius: 22, boxShadow: T.shadowCard, overflow: 'hidden' }}>
              <Row icon="users" title="People" sub={peopleSummary} onClick={onPeople} />
              <div style={{ height: 1, background: T.fieldBorder, marginLeft: 68 }} />
              <Row icon="link" title="Invite links" sub="View-only & edit access" onClick={onInvite} />
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, letterSpacing: '0.3px', padding: '22px 8px 10px' }}>COMING LATER</div>
            <div style={{ background: T.card, borderRadius: 22, boxShadow: T.shadowCard, overflow: 'hidden' }}>
              <Row icon="receipt" title="Bills" muted badge="SOON" />
              <div style={{ height: 1, background: T.fieldBorder, marginLeft: 68 }} />
              <Row icon="heart" title="Account" muted badge="SOON" />
            </div>
          </>
        ) : (
          <div style={{ background: T.card, borderRadius: 22, boxShadow: T.shadowCard, padding: '18px 18px', color: T.body, fontSize: 14.5, fontWeight: 500, lineHeight: 1.5 }}>
            You have view-only access to this family. An editor manages people and invite links.
          </div>
        )}

        {onSignOut && (
          <div style={{ padding: '22px 0 0' }}>
            <GhostButton onClick={onSignOut}>Sign out</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── People list ──────────────────────────────────────────────────────
export function PeopleList({ people, onBack, onAdd, onEdit }) {
  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 40 }}>
      <TopBar title="People" onBack={onBack} />
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 22, boxShadow: T.shadowCard, overflow: 'hidden', marginBottom: 16 }}>
          {people.map((p, i) => (
            <div key={p.id}>
              <div onClick={() => onEdit(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', cursor: 'pointer' }}>
                <Avatar person={p} size={42} />
                <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: T.deep }}>{p.name}</div>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: PALETTE[p.color].dot, marginRight: 4 }} />
                <Icon name="chevron" size={16} color={T.muted} strokeWidth={2} />
              </div>
              {i < people.length - 1 && <div style={{ height: 1, background: T.fieldBorder, marginLeft: 72 }} />}
            </div>
          ))}
          {!people.length && <div style={{ padding: '28px 16px', textAlign: 'center', color: T.body, fontWeight: 500 }}>No one added yet.</div>}
        </div>
        <PrimaryButton icon="plus" onClick={onAdd}>Add a person</PrimaryButton>
      </div>
    </div>
  );
}

// ── Person add/edit ──────────────────────────────────────────────────
export function PersonForm({ people, initial, onSave, onCancel, onDelete }) {
  const editing = !!initial;
  const used = people.filter((p) => p.id !== initial?.id).map((p) => p.color);
  const [name, setName] = React.useState(initial?.name || '');
  const [color, setColor] = React.useState(initial?.color || PALETTE_ORDER.find((c) => !used.includes(c)) || 'green');
  const canSave = name.trim().length > 0;

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 16px 12px', position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(180deg, #E6F2EC 60%, rgba(230,242,236,0) 100%)' }}>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: T.body, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' }}>Cancel</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>{editing ? 'Edit person' : 'New person'}</span>
        <button onClick={canSave ? () => onSave({ id: initial?.id, name: name.trim(), color }) : undefined} style={{ border: 'none', borderRadius: 999, padding: '9px 18px', cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit', background: canSave ? T.accent : T.fieldBg, color: canSave ? '#fff' : T.muted, fontSize: 15, fontWeight: 700, boxShadow: canSave ? '0 4px 12px rgba(31,169,160,0.30)' : 'none' }}>Save</button>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        {/* live preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: PALETTE[color].bg, color: PALETTE[color].fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32 }}>
            {(name.trim().charAt(0) || '?').toUpperCase()}
          </div>
        </div>

        <Field label="NAME" hint="The first letter becomes their avatar.">
          <TextInput value={name} onChange={setName} placeholder="e.g. Grandpa" />
        </Field>

        <Field label="COLOR">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {PALETTE_ORDER.map((c) => {
              const sel = c === color;
              const taken = used.includes(c);
              return (
                <button key={c} onClick={() => !taken && setColor(c)} disabled={taken} style={{
                  width: 46, height: 46, borderRadius: '50%', border: sel ? `3px solid ${T.accentSolid}` : '3px solid transparent',
                  background: PALETTE[c].bg, cursor: taken ? 'not-allowed' : 'pointer', opacity: taken ? 0.3 : 1, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Icon name="check" size={20} color={PALETTE[c].fg} strokeWidth={2.6} />}
                </button>
              );
            })}
          </div>
        </Field>

        {editing && (
          <div style={{ marginTop: 12 }}>
            <GhostButton danger onClick={onDelete}><Icon name="trash" size={18} color={T.red} strokeWidth={1.9} /> Remove person</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Invite links ─────────────────────────────────────────────────────
export function LinkCard({ kind, code, url, onCopy, onRegen, copied }) {
  const isEdit = kind === 'edit';
  return (
    <div style={{ background: T.card, borderRadius: 22, padding: 18, boxShadow: T.shadowCard, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: T.deep }}>{isEdit ? 'Edit link' : 'View-only link'}</span>
        {isEdit && <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redTint, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.3px' }}>KEEP PRIVATE</span>}
      </div>
      <div style={{ fontSize: 13.5, color: T.body, fontWeight: 500, lineHeight: 1.45, marginBottom: 14 }}>
        {isEdit ? 'Full access — view, add, edit, delete. Share only with people who manage records.' : 'Read-only. Hand out freely to family who just need to see what\'s scheduled.'}
      </div>
      {code && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: T.selFill, borderRadius: 13, padding: '11px 14px', marginBottom: 12 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: T.body, letterSpacing: '0.4px' }}>CODE</span>
          <span style={{ fontSize: 19, fontWeight: 800, color: T.deep, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '1.5px' }}>{code}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, borderRadius: 13, padding: '11px 13px', marginBottom: 12 }}>
        <Icon name="link" size={17} color={T.muted} strokeWidth={1.8} />
        <span style={{ flex: 1, fontSize: 13.5, color: T.body, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url || 'No active link yet'}</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCopy} style={{ flex: 1, height: 46, borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: T.accent, color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 12px rgba(31,169,160,0.28)' }}>
          <Icon name={copied ? 'check' : 'copy'} size={17} color="#fff" strokeWidth={2.1} /> {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={onRegen} style={{ flex: 1, height: 46, borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, color: T.body, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="refresh" size={16} color={T.body} strokeWidth={1.9} /> Regenerate
        </button>
      </div>
    </div>
  );
}

// ── Delete-person confirmation dialog (warns about the cascade) ──────
export function DeletePersonDialog({ person, itemCount, medCount, onCancel, onConfirm }) {
  const parts = [];
  if (itemCount) parts.push(`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`);
  if (medCount) parts.push(`${medCount} ${medCount === 1 ? 'medication' : 'medications'}`);
  const cascade = parts.join(' and ');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(31,74,64,0.32)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', background: '#fff', borderRadius: '26px 26px 0 0', padding: '26px 22px 30px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.redTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="trash" size={22} color={T.red} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.deep, marginBottom: 8 }}>Remove {person.name}?</div>
        <div style={{ fontSize: 15, color: T.body, fontWeight: 500, lineHeight: 1.5, marginBottom: 22 }}>
          {cascade
            ? <>This also permanently deletes <b style={{ color: T.deep }}>{person.name}'s {cascade}</b>. This can't be undone.</>
            : <>This removes <b style={{ color: T.deep }}>{person.name}</b>. This can't be undone.</>}
        </div>
        <button onClick={onConfirm} style={{ width: '100%', height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: T.red, color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Remove {person.name}</button>
        <button onClick={onCancel} style={{ width: '100%', height: 50, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, color: T.body, fontSize: 16, fontWeight: 700 }}>Cancel</button>
      </div>
    </div>
  );
}
export function SignOutDialog({ onCancel, onConfirm }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(31,74,64,0.32)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', background: '#fff', borderRadius: '26px 26px 0 0', padding: '26px 22px 30px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="logout" size={22} color={T.accentSolid} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.deep, marginBottom: 8 }}>Sign out?</div>
        <div style={{ fontSize: 15, color: T.body, fontWeight: 500, lineHeight: 1.5, marginBottom: 22 }}>
          You'll need to sign in again with your email link or password to get back in.
        </div>
        <button onClick={onConfirm} style={{ width: '100%', height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: T.accent, color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Sign out</button>
        <button onClick={onCancel} style={{ width: '100%', height: 50, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, color: T.body, fontSize: 16, fontWeight: 700 }}>Cancel</button>
      </div>
    </div>
  );
}
export function RegenerateDialog({ kind, onCancel, onConfirm }) {
  const isEdit = kind === 'edit';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(31,74,64,0.32)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', background: '#fff', borderRadius: '26px 26px 0 0', padding: '26px 22px 30px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.redTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="alert" size={24} color={T.red} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.deep, marginBottom: 8 }}>Regenerate {isEdit ? 'edit' : 'view-only'} link?</div>
        <div style={{ fontSize: 15, color: T.body, fontWeight: 500, lineHeight: 1.5, marginBottom: 22 }}>
          The current {isEdit ? 'edit' : 'view-only'} code and link will <b style={{ color: T.deep }}>stop working</b> for anyone who hasn't joined yet. People who've already joined keep their access.
        </div>
        <button onClick={onConfirm} style={{ width: '100%', height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: T.red, color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Regenerate link</button>
        <button onClick={onCancel} style={{ width: '100%', height: 50, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, color: T.body, fontSize: 16, fontWeight: 700 }}>Cancel</button>
      </div>
    </div>
  );
}
