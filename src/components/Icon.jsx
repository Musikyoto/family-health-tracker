// Line UI icons. Converted from the design export to a proper ES module.

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.8, style }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  const paths = {
    gear: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    back: <path d="M15 5l-7 7 7 7" />,
    chevron: <path d="M9 5l7 7-7 7" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2.4" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    refresh: <><path d="M3.5 9a8 8 0 0 1 13.4-3L21 9M20.5 15a8 8 0 0 1-13.4 3L3 15" /><path d="M21 4v5h-5M3 20v-5h5" /></>,
    doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    image: <><rect x="4" y="4" width="16" height="16" rx="2.4" /><circle cx="9" cy="9.5" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3.2" /></>,
    sunrise: <><path d="M12 4v4M5.6 9.6 4.2 8.2M18.4 9.6l1.4-1.4M3 18h18M6 18a6 6 0 0 1 12 0" /></>,
    sun: <><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" /></>,
    moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5z" />,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M16.5 19h4a5 5 0 0 0-4-4.9" /></>,
    link: <><path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5L12.5 17" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.4" /><path d="M3.5 9.5h17M8 3v3.4M16 3v3.4" /></>,
    clock: <><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></>,
    pill: <><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)" /><path d="M9 9l6 6" /></>,
    receipt: <><path d="M5 3.5h14v17l-2.3-1.4-2.3 1.4-2.4-1.4L9.6 20.5 7.3 19 5 20.5z" /><path d="M8.5 8h7M8.5 12h7" /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
    heart: <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />,
    inbox: <><path d="M3.5 13h4l1.5 2.5h6L16.5 13h4" /><path d="M5 13 7 5.5h10L19 13v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5z" /></>,
    alert: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17.4v.1" /></>,
    logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5M15 12H3" /></>,
    phone: <path d="M21 16.5v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17 17 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.1 5.1 1.8 1.8 0 0 1 4.9 3h2.6a1.8 1.8 0 0 1 1.8 1.6c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14 14 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.6 1.8z" />,
    video: <><rect x="3" y="6" width="13" height="12" rx="2.6" /><path d="M16 10.5l5-3v9l-5-3z" /></>,
    stethoscope: <><path d="M6.5 3v6a3.5 3.5 0 0 0 7 0V3" /><path d="M10 12.5V15a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="10.8" r="2.2" /></>,
    checklist: <><path d="M3.5 6.5l2 2 3-3.5M3.5 14l2 2 3-3.5" /><path d="M12.5 7h8M12.5 15h8" /></>,
    flag: <><path d="M5 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M5 22v-7" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}
