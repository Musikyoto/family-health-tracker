// Shared theme: tokens + person palette.
// Visual language per SPEC §13 (LOCKED). Inline-style approach (no Tailwind).

export const T = {
  gradientBg: 'linear-gradient(160deg, #E6F2EC 0%, #E8F3F1 55%, #EFF3ED 100%)',
  accent: 'linear-gradient(135deg, #2E8B57 0%, #1FA9A0 100%)',
  accentSolid: '#1FA9A0',
  accentTint: 'rgba(31,169,160,0.12)',
  red: '#E2542F',
  redTint: 'rgba(226,84,47,0.10)',
  deep: '#1F4A40',
  body: '#6E938A',
  muted: '#9CBAB1',
  faint: '#C2D8D0',
  card: '#FFFFFF',
  fieldBg: '#F5FAF8',
  fieldBorder: '#DEEAE5',
  selFill: '#DBEFE8',
  shadowCard: '0 8px 28px rgba(31,74,64,0.08)',
  shadowSoft: '0 2px 10px rgba(31,74,64,0.06)',
  shadowBtn: '0 6px 18px rgba(31,169,160,0.32)',
};

// Person identity colors (independent of theme). Presets per SPEC §13.
export const PALETTE = {
  amber:    { bg: '#FBE6C0', fg: '#7A4E08', dot: '#E0A437' },
  blue:     { bg: '#C9DEF5', fg: '#0C447C', dot: '#3B7AC4' },
  pink:     { bg: '#F4CBDA', fg: '#72243E', dot: '#C45B82' },
  green:    { bg: '#A8D5BA', fg: '#1F4A40', dot: '#4E9C6E' },
  lavender: { bg: '#D4C5E8', fg: '#3F2A63', dot: '#8163B0' },
  peach:    { bg: '#F4CBA0', fg: '#7A3E08', dot: '#D08A45' },
  aqua:     { bg: '#A0CFD8', fg: '#0C4A52', dot: '#3C97A4' },
};

export const PALETTE_ORDER = ['amber', 'blue', 'pink', 'green', 'lavender', 'peach', 'aqua'];

export const FOOD_LABEL = { with: 'with food', without: 'without food', none: '' };
