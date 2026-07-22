// Calendar tab + Item detail — SPEC §6, §7. Converted from the design export.
import React from 'react';
import { T, safeArea } from '../lib/theme.js';
import { todayIso } from '../lib/data.js';
import { Icon } from '../components/Icon.jsx';
import { Avatar, PrimaryButton, TopBar } from '../components/ui.jsx';
import { NowServingBadge, ContactPhoneList } from '../components/ContactPhones.jsx';
import { Copyright } from '../components/Copyright.jsx';

const pad2 = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const FULL_WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Make a user-entered reference URL safe to open. Preserve an explicit scheme
// (https://…, mailto:, tel:), otherwise default to https:// so a bare
// "example.com" opens as an absolute URL instead of a relative path.
function normalizeUrl(url) {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u) || /^(mailto|tel):/i.test(u)) return u;
  return `https://${u}`;
}

function buildWeeks(year, month) {
  const first = new Date(year, month, 1).getDay();           // 0=Sun
  const dim = new Date(year, month + 1, 0).getDate();
  const prevDim = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prevDim - i, inMonth: false });
  for (let d = 1; d <= dim; d++) cells.push({ day: d, inMonth: true });
  let nx = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nx++, inMonth: false });
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Shared header: tabs + a top-right slot — gear (→ Settings) for editors,
// sign-out for viewers (who can't reach Settings).
const slotBtnStyle = {
  width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#fff',
  boxShadow: T.shadowSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0,
};
// Tab key (used for routing + active state) is decoupled from the display
// label, so the medication tab can show "Meds" while staying keyed 'medication'.
const TABS = [
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'medication', label: 'Meds', icon: 'pill' },
  { key: 'contacts', label: 'Contacts', icon: 'stethoscope' },
  { key: 'todo', label: 'To-do', icon: 'checklist' },
];
// Sticky so the tabs stay reachable at any scroll depth (same idiom as
// FormBar/TopBar: gradient fade, zIndex 20 — below the zIndex-60 overlays).
// Four tabs need the width three didn't: outer gaps 12->8 and labels 11->10.5.
export function TabHeader({ active, onTab, role, onGear, onSignOut, todoBadge = 0 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: `${safeArea.top(60)} 16px 16px`,
      position: 'sticky', top: 0, zIndex: 20,
      // opaque past the tab pill's bottom edge, then a short fade — otherwise
      // scrolled content shows through beside the pill
      background: 'linear-gradient(180deg, #E6F2EC 86%, rgba(230,242,236,0) 100%)',
    }}>
      <img src="/mamori-mark.svg" alt="Mamori" width={54} height={54} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 15, boxShadow: T.shadowSoft }}>
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <button key={t.key} className="tap" onClick={() => onTab(t.key)} style={{
              position: 'relative',
              flex: 1, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0,
              background: on ? T.tealDeep : 'transparent', color: on ? '#fff' : T.body,
              fontSize: 10.5, fontWeight: on ? 700 : 600, letterSpacing: '0.1px',
              boxShadow: on ? T.shadowActive : 'none',
              transition: 'background 160ms ease, color 160ms ease',
            }}>
              <Icon name={t.icon} size={16} color={on ? '#fff' : T.body} strokeWidth={1.9} />
              {t.label}
              {/* count of important-and-unbooked items — absolute, so it can't widen the tab or wrap the row */}
              {t.key === 'todo' && todoBadge > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 4, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box',
                  borderRadius: 999, background: T.flag, color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{todoBadge}</span>
              )}
            </button>
          );
        })}
      </div>
      {role === 'editor' ? (
        <button onClick={onGear} aria-label="Settings" style={slotBtnStyle}>
          <Icon name="gear" size={22} color={T.body} />
        </button>
      ) : (
        <button onClick={onSignOut} aria-label="Sign out" style={slotBtnStyle}>
          <Icon name="logout" size={21} color={T.body} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ icon, title, body, action }) {
  return (
    <div style={{ padding: '38px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: '#fff', boxShadow: T.shadowSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon name={icon} size={28} color={T.accentSolid} strokeWidth={1.7} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.deep, marginBottom: 7 }}>{title}</div>
      <div style={{ fontSize: 14.5, color: T.body, lineHeight: 1.5, maxWidth: 250, fontWeight: 500 }}>{body}</div>
      {action && <div style={{ marginTop: 20, width: '100%', maxWidth: 220 }}>{action}</div>}
    </div>
  );
}

export function FAB({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Add item" className="tap" style={{
      position: 'absolute', right: 20, bottom: safeArea.bottom(30), width: 58, height: 58, borderRadius: '50%', border: 'none',
      cursor: 'pointer', background: T.accent, color: '#fff', boxShadow: '0 8px 22px rgba(31,169,160,0.40)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }}>
      <Icon name="plus" size={26} color="#fff" strokeWidth={2.4} />
    </button>
  );
}

// `sub` overrides the default meta line (the To-do tab passes its own).
// `flag` prepends the red important glyph before the title (To-do rows only);
// flagged titles ellipsize to one line, unflagged titles are left untouched.
export function ItemRow({ item, person, onClick, sub, flag = false }) {
  const meta = [person.name, item.type === 'Bill' ? 'Bill' : item.time, item.type === 'Bill' && !item.time ? 'due today' : null]
    .filter(Boolean).join(' · ');
  return (
    <div onClick={onClick} className="tap" style={{
      background: T.card, borderRadius: 18, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 13,
      minHeight: 44, boxShadow: T.shadowSoft, cursor: 'pointer',
    }}>
      <Avatar person={person} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {flag ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Icon name="flag" size={15} color={T.flag} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.25 }}>{item.title}</div>
        )}
        <div style={{ fontSize: 12.5, color: T.metaGrey, marginTop: 3, fontWeight: 500, minWidth: 0 }}>{sub ?? meta}</div>
      </div>
      <Icon name="chevron" size={16} color={T.metaGrey} strokeWidth={2} style={{ flexShrink: 0 }} />
    </div>
  );
}

export function CalendarTab({ data, role, todoBadge, onTab, onGear, onAdd, onAddPerson, onOpenItem, onSignOut }) {
  // "today" is computed per render (so the badge stays honest across
  // midnight), but the visible month + selection initialize ONCE at mount —
  // the focus refetch must never move the user's navigation.
  const today = todayIso();
  const [vy, setVy] = React.useState(() => Number(todayIso().slice(0, 4)));
  const [vm, setVm] = React.useState(() => Number(todayIso().slice(5, 7)) - 1);
  const [selected, setSelected] = React.useState(() => todayIso());
  const peopleById = Object.fromEntries(data.people.map((p) => [p.id, p]));

  // Undated items live in the To-do tab — they must not reach the grid, the
  // dots, the day lists, or the empty-state check (a family with only to-dos
  // would otherwise see an empty day list instead of the empty state).
  const datedItems = data.items.filter((it) => it.date);
  const itemsByDate = {};
  datedItems.forEach((it) => { (itemsByDate[it.date] = itemsByDate[it.date] || []).push(it); });

  const weeks = buildWeeks(vy, vm);
  const noItems = datedItems.length === 0;
  const selInView = selected && selected.startsWith(isoOf(vy, vm, 1).slice(0, 7));
  const selItems = (selected && itemsByDate[selected]) || [];
  const selDate = selected ? new Date(selected + 'T00:00:00') : null;

  const shiftMonth = (dir) => {
    let m = vm + dir, y = vy;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setVm(m); setVy(y); setSelected(null);
  };

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(120) }}>
      <TabHeader active="calendar" onTab={onTab} role={role} onGear={onGear} onSignOut={onSignOut} todoBadge={todoBadge} />

      {/* Calendar card */}
      <div style={{ background: T.card, borderRadius: 18, margin: '0 16px', padding: '20px 16px 18px', boxShadow: T.shadowSoft }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 14px' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: '0.1px' }}>{MONTHS[vm]} {vy}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[-1, 1].map((d) => (
              <button key={d} onClick={() => shiftMonth(d)} style={{
                width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: T.rowBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}>
                <Icon name={d < 0 ? 'back' : 'chevron'} size={16} color={T.tealDeep} strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', marginBottom: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.metaGrey, letterSpacing: '0.5px' }}>{w}</div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', marginTop: 6 }}>
            {week.map((cell, ci) => {
              const iso = cell.inMonth ? isoOf(vy, vm, cell.day) : null;
              const has = iso && itemsByDate[iso];
              const isToday = iso === today;
              const isSel = iso && iso === selected && !isToday;
              const tappable = isToday || has;
              let numColor = T.metaGrey, weight = 400, circle = {};
              if (!cell.inMonth) { numColor = T.faint; }
              // today = the same tealDeep-fill + soft lift the header's active tab uses
              else if (isToday) { numColor = '#fff'; weight = 700; circle = { background: T.tealDeep, boxShadow: T.shadowActive }; }
              else if (isSel) { numColor = T.ink; weight = 700; circle = { background: T.selFill }; }
              else if (has) { numColor = T.ink; weight = 600; }
              return (
                <div key={ci} onClick={tappable ? () => setSelected(iso) : undefined}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, cursor: tappable ? 'pointer' : 'default', userSelect: 'none' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: weight, color: numColor, fontVariantNumeric: 'tabular-nums', transition: 'background 140ms ease', ...circle,
                  }}>{cell.day}</div>
                  <div style={{ height: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    {/* one ink-green dot per day with items, whatever the count */}
                    {has && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.92)' : T.tealDeep }} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Below the grid */}
      {noItems ? (
        role === 'editor' ? (
          data.people.length === 0 ? (
            <EmptyBlock icon="users" title="Add your first person"
              body="Start with the people you're tracking — then you can add their appointments and bills."
              action={<PrimaryButton icon="plus" onClick={onAddPerson}>Add a person</PrimaryButton>} />
          ) : (
            <EmptyBlock icon="inbox" title="No appointments yet"
              body="Add an appointment or a bill and it'll show up here on the day."
              action={<PrimaryButton icon="plus" onClick={onAdd}>Add item</PrimaryButton>} />
          )
        ) : (
          <EmptyBlock icon="inbox" title="Nothing scheduled yet"
            body="When appointments or bills are added, they'll appear here. Check back soon." />
        )
      ) : selInView ? (
        <div style={{ margin: '22px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px 12px' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>
              {FULL_WD[selDate.getDay()]}, {MONTHS[selDate.getMonth()]} {selDate.getDate()}
            </span>
            {selected === today && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.3px' }}>TODAY</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selItems.length ? selItems.map((it) => (
              <ItemRow key={it.id} item={it} person={peopleById[it.personId]} onClick={() => onOpenItem(it.id)} />
            )) : (
              <div style={{ background: T.card, borderRadius: 18, padding: '26px 16px', textAlign: 'center', boxShadow: T.shadowSoft, color: T.metaGrey, fontSize: 15, fontWeight: 500 }}>Nothing scheduled</div>
            )}
          </div>
        </div>
      ) : (
        // hint line outside a card: T.muted, same as the Contacts footnote
        <div style={{ margin: '26px 16px 0', textAlign: 'center', color: T.muted, fontSize: 14.5, fontWeight: 500 }}>
          Tap a day to see what's on.
        </div>
      )}

      <Copyright />
      {role === 'editor' && <FAB onClick={onAdd} />}
    </div>
  );
}

// ── Item detail (deep-dive) — SPEC §7 ────────────────────────────────
export function ItemDetail({ item, person, role, onBack, onEdit }) {
  const Row = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: 13, padding: '14px 0', borderBottom: `1px solid ${T.hairline}` }}>
      <Icon name={icon} size={20} color={T.tealDeep} strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.metaGrey, letterSpacing: '0.3px', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.ink, lineHeight: 1.45 }}>{value}</div>
      </div>
    </div>
  );
  // An undated item is a To-do; say so rather than rendering an Invalid Date.
  const dateObj = item.date ? new Date(item.date + 'T00:00:00') : null;
  const dateStr = dateObj
    ? `${FULL_WD[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
    : null;

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: safeArea.bottom(40) }}>
      <TopBar title="" onBack={onBack}
        trailing={role === 'editor' && (
          <button onClick={onEdit} style={{ height: 42, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#fff', boxShadow: T.shadowSoft, color: T.accentSolid, fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }}>Edit</button>
        )} />

      <div style={{ padding: '4px 16px 0' }}>
        {/* hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Avatar person={person} size={54} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* read-only flag reflection so viewers (who never see the form) can tell it's important */}
            {item.important ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Icon name="flag" size={20} color={T.flag} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 4 }} />
                <div style={{ fontSize: 23, fontWeight: 700, color: T.ink, lineHeight: 1.2, letterSpacing: '0.1px' }}>{item.title}</div>
              </div>
            ) : (
              <div style={{ fontSize: 23, fontWeight: 700, color: T.ink, lineHeight: 1.2, letterSpacing: '0.1px' }}>{item.title}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: T.metaGrey }}>{person.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.metaGrey, background: T.rowBg, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.type}</span>
            </div>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: 18, padding: '4px 18px 16px', boxShadow: T.shadowSoft }}>
          <Row icon="calendar" label="DATE" value={dateStr
            || <span style={{ color: T.metaGrey }}>Not scheduled yet</span>} />
          {item.time && <Row icon="clock" label="TIME" value={item.time} />}
          {/* pre-wrap keeps the user's line breaks; anywhere guards long unbroken strings */}
          {item.description && <Row icon="doc" label="DESCRIPTION"
            value={<span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.description}</span>} />}

          {/* Doctor — only when a contact is linked (items.contact_id) */}
          {item.contact && (
            <div style={{ padding: '16px 0 14px', borderBottom: `1px solid ${T.hairline}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.metaGrey, letterSpacing: '0.3px', marginBottom: 8 }}>DOCTOR</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: item.contact.phones?.length ? 10 : 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{item.contact.name}</span>
                {item.contact.specialty && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: T.accentSolid, background: T.accentTint, padding: '2px 8px', borderRadius: 999 }}>{item.contact.specialty}</span>
                )}
                {item.contact.nowServing && <NowServingBadge />}
              </div>
              {item.contact.phones?.length > 0 && <ContactPhoneList phones={item.contact.phones} />}
            </div>
          )}

          {/* References */}
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.metaGrey, letterSpacing: '0.3px', marginBottom: 10 }}>REFERENCES &amp; DOCUMENTS</div>
            {item.refs && item.refs.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {item.refs.map((r, i) => {
                  const href = normalizeUrl(r.url);
                  const Tag = href ? 'a' : 'div';
                  return (
                    <Tag key={i} {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 12, background: T.rowBg, cursor: href ? 'pointer' : 'default', textDecoration: 'none', color: 'inherit' }}>
                      <Icon name={r.kind === 'image' ? 'image' : 'doc'} size={20} color={T.tealDeep} strokeWidth={1.8} />
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: T.inkSoft }}>{r.label || href}</span>
                      {href && <Icon name="link" size={17} color={T.metaGrey} strokeWidth={1.8} />}
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.metaGrey, fontWeight: 500, padding: '4px 0' }}>No links added.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
