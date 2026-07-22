// Contacts tab — a flat, family-shared list of medical contacts (doctors,
// clinics). Not person-linked. Numbers are tap-to-call (tel:).
// The badge + phone-row components live in components/ContactPhones.jsx,
// shared with the item detail's doctor block.
import { T, safeArea } from '../lib/theme.js';
import { PrimaryButton } from '../components/ui.jsx';
import { NowServingBadge, ContactPhoneList } from '../components/ContactPhones.jsx';
import { TabHeader, EmptyBlock, FAB } from './CalendarTab.jsx';
import { Copyright } from '../components/Copyright.jsx';

// Approved phase-1 card layout: name / compact tag row / hairline / soft
// tappable phone pills, each stacking one gold chip per schedule pair (the
// same number can have different hours on different days). Tokens live in
// theme.js so the Calendar and Meds cards can adopt the same language later.
function ContactCard({ contact, onClick }) {
  const { name, specialty, phones, nowServing } = contact;
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 18, padding: '15px 16px', boxShadow: T.shadowSoft,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Name on its own line. */}
      <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>{name}</div>

      {/* Compact tag row. */}
      {(specialty || nowServing) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {specialty && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 8px', borderRadius: 999 }}>{specialty}</span>
          )}
          {nowServing && <NowServingBadge />}
        </div>
      )}

      {/* Soft tappable phone pills behind a hairline divider. */}
      {phones && phones.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.hairline}` }}>
          <ContactPhoneList phones={phones} />
        </div>
      )}
    </div>
  );
}

export function ContactsTab({ contacts, role, todoBadge, onTab, onGear, onAdd, onOpenContact, onSignOut }) {
  const noContacts = contacts.length === 0;
  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(120) }}>
      <TabHeader active="contacts" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} todoBadge={todoBadge} />

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

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}
