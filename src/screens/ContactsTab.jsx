// Contacts tab — a flat, family-shared list of medical contacts (doctors,
// clinics). Not person-linked. Numbers are tap-to-call (tel:).
import { T } from '../lib/theme.js';
import { sortDays } from '../lib/data.js';
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
    display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
    fontSize: 11.5, fontWeight: 700, color: '#0C447C', background: 'rgba(59,122,196,0.14)',
    padding: '2px 8px 2px 6px', borderRadius: 999, textDecoration: 'none',
  };
  const inner = <><Icon name="video" size={12} color="#185FA5" strokeWidth={1.9} />NowServing</>;
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={style}>{inner}</a>
    : <span style={style}>{inner}</span>;
}

// Approved phase-1 card layout: name / compact tag row / hairline / soft
// tappable phone pills, each carrying its own gold schedule chip (a doctor
// holds different days/hours at different clinics). Tokens live in theme.js
// so the Calendar and Meds cards can adopt the same language later.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.hairline}` }}>
          {phones.map((p, i) => {
            // grey meta line combines the label and per-phone location, e.g. "Miss Jo · St Luke's"
            const meta = [p.label, p.location].map((s) => (s || '').trim()).filter(Boolean).join(' · ');
            const days = sortDays(p.days); // canonical week order, defensively
            const hoursText = (p.hours || '').trim();
            return (
              <a key={i} href={telHref(p.number)} onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 12, background: T.rowBg, textDecoration: 'none' }}>
                <Icon name="phone" size={18} color={T.tealDeep} strokeWidth={1.9} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {meta && <span style={{ fontSize: 11.5, fontWeight: 600, color: T.metaGrey, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>}
                  <span style={{ fontSize: 15, fontWeight: 500, color: T.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.number}</span>
                  {/* Gold schedule chip — this clinic's days/hours, when set. */}
                  {(days.length > 0 || hoursText) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', maxWidth: '100%', background: T.goldBg, borderRadius: 999, padding: '2.5px 9px', marginTop: 3 }}>
                      <Icon name="clock" size={11.5} color={T.goldInk} strokeWidth={2} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500 }}>
                        {days.length > 0 && <span style={{ color: T.goldInk, letterSpacing: '0.2px' }}>{days.join(' · ')}</span>}
                        {hoursText && <span style={{ color: T.goldSoft, marginLeft: days.length ? 5 : 0 }}>{hoursText}</span>}
                      </span>
                    </span>
                  )}
                </span>
                <Icon name="chevron" size={15} color={T.metaGrey} strokeWidth={2} style={{ flexShrink: 0 }} />
              </a>
            );
          })}
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
