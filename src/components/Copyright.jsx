// Tiny shared copyright footer — sits in the normal scroll flow at the
// bottom of each tab and the sign-in screen.
import { T } from '../lib/theme.js';

const COPYRIGHT_NAME = 'Adrian Wang · 王明輝';

export function Copyright({ style }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: T.metaGrey, padding: '28px 16px 12px', ...style }}>
      © {new Date().getFullYear()} {COPYRIGHT_NAME}
    </div>
  );
}
