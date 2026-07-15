// Contact phone UI shared by the Contacts card and the item detail's doctor
// block — the NowServing badge and tap-to-call phone rows with one gold
// schedule chip per {days, hours} pair. Lifted verbatim from ContactsTab:
// same markup, same styles, props only.
import { T } from '../lib/theme.js';
import { sortDays } from '../lib/data.js';
import { Icon } from './Icon.jsx';

// Strip a displayed number down to a dialable tel: target.
const telHref = (num) => 'tel:' + String(num || '').replace(/[^\d+*#]/g, '');

// NowServing (telehealth) capability badge. Deliberately a different tint from
// the teal specialty pill so it reads as a capability, not a specialty.
// Future-ready: pass a `url` to render it as a tappable booking link.
export function NowServingBadge({ url }) {
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

// Soft tappable phone pills; taps stopPropagation so parent cards stay inert.
export function ContactPhoneList({ phones }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {phones.map((p, i) => {
        // grey meta line combines the label and per-phone location, e.g. "Miss Jo · St Luke's"
        const meta = [p.label, p.location].map((s) => (s || '').trim()).filter(Boolean).join(' · ');
        // one gold chip per schedule pair — canonical day order, empty pairs skipped
        const schedules = (p.schedules ?? [])
          .map((s) => ({ days: sortDays(s?.days), hours: (s?.hours || '').trim() }))
          .filter((s) => s.days.length > 0 || s.hours);
        return (
          <a key={i} href={telHref(p.number)} onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 12, background: T.rowBg, textDecoration: 'none' }}>
            <Icon name="phone" size={18} color={T.tealDeep} strokeWidth={1.9} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {meta && <span style={{ fontSize: 11.5, fontWeight: 600, color: T.metaGrey, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>}
              <span style={{ fontSize: 15, fontWeight: 500, color: T.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.number}</span>
              {/* Gold schedule chips — one per day/hour pair at this clinic. */}
              {schedules.length > 0 && (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginTop: 3 }}>
                  {schedules.map((s, si) => (
                    <span key={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', background: T.goldBg, borderRadius: 999, padding: '2.5px 9px' }}>
                      <Icon name="clock" size={11.5} color={T.goldInk} strokeWidth={2} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500 }}>
                        {s.days.length > 0 && <span style={{ color: T.goldInk, letterSpacing: '0.2px' }}>{s.days.join(' · ')}</span>}
                        {s.hours && <span style={{ color: T.goldSoft, marginLeft: s.days.length ? 5 : 0 }}>{s.hours}</span>}
                      </span>
                    </span>
                  ))}
                </span>
              )}
            </span>
            <Icon name="chevron" size={15} color={T.metaGrey} strokeWidth={2} style={{ flexShrink: 0 }} />
          </a>
        );
      })}
    </div>
  );
}
