// Contacts tab — a flat, family-shared list of medical contacts (doctors,
// clinics). Not person-linked. Numbers are tap-to-call (tel:).
import { T } from '../lib/theme.js';
import { Icon } from '../components/Icon.jsx';
import { PrimaryButton } from '../components/ui.jsx';
import { TabHeader, EmptyBlock, FAB } from './CalendarTab.jsx';

// Strip a displayed number down to a dialable tel: target.
const telHref = (num) => 'tel:' + String(num || '').replace(/[^\d+*#]/g, '');

// NowServing (telehealth) capability badge. Deliberately a different tint from
// the teal specialty pill so it reads as a capability, not a specialty.
// Future-ready: pass a `url` to render it as a tappable booking link.
function NowServingBadge({ url }) {
  const style = {
    display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
    fontSize: 12, fontWeight: 700, color: '#0C447C', background: 'rgba(59,122,196,0.14)',
    padding: '3px 10px 3px 8px', borderRadius: 999, textDecoration: 'none',
  };
  const inner = <><Icon name="video" size={13} color="#185FA5" strokeWidth={1.9} />NowServing</>;
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={style}>{inner}</a>
    : <span style={style}>{inner}</span>;
}

function ContactCard({ contact, onClick }) {
  const { name, specialty, location, phones, nowServing } = contact;
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 18, padding: '14px 16px', boxShadow: T.shadowSoft,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16.5, fontWeight: 700, color: T.deep, marginRight: 'auto' }}>{name}</span>
        {specialty && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 10px', borderRadius: 999, flexShrink: 0 }}>{specialty}</span>
        )}
        {nowServing && <NowServingBadge />}
      </div>
      {location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, color: T.body }}>
          <Icon name="link" size={15} color={T.muted} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{location}</span>
        </div>
      )}
      {phones && phones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {phones.map((p, i) => (
            <a key={i} href={telHref(p.number)} onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 13, background: T.fieldBg, border: `1px solid ${T.fieldBorder}`, textDecoration: 'none' }}>
              <Icon name="phone" size={18} color={T.accentSolid} strokeWidth={1.9} />
              <span style={{ flex: 1, minWidth: 0 }}>
                {p.label && <span style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, letterSpacing: '0.2px', marginRight: 8 }}>{p.label}</span>}
                <span style={{ fontSize: 15.5, fontWeight: 600, color: T.deep }}>{p.number}</span>
              </span>
              <Icon name="chevron" size={15} color={T.muted} strokeWidth={2} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactsTab({ contacts, role, onTab, onGear, onAdd, onOpenContact, onSignOut }) {
  const noContacts = contacts.length === 0;
  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 120 }}>
      <TabHeader active="contacts" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} />

      {noContacts ? (
        role === 'editor' ? (
          <EmptyBlock icon="phone" title="No contacts yet"
            body="Add a doctor, clinic, or pharmacy with their phone numbers to keep them one tap away."
            action={<PrimaryButton icon="plus" onClick={onAdd}>Add a contact</PrimaryButton>} />
        ) : (
          <EmptyBlock icon="phone" title="No contacts yet"
            body="When contacts are added, they'll appear here." />
        )
      ) : (
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c}
              onClick={role === 'editor' && onOpenContact ? () => onOpenContact(c.id) : undefined} />
          ))}
          <div style={{ textAlign: 'center', color: T.muted, fontSize: 13, fontWeight: 500, padding: '4px 0 0' }}>
            Shared with everyone in the family.
          </div>
        </div>
      )}

      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
