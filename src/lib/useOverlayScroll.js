// Overlays (item detail, every form, settings) mount inside #root — the app's
// scroll container — as an absolutely-positioned layer, with the tab screen
// left mounted underneath. The scroller therefore keeps whatever offset the
// list had, so an overlay opened from far down a long list starts mid-screen
// instead of at its first field.
//
// Scrolling to the top on open is only half of it: because the list shares that
// same scroller, the reset would also throw away the position to return to when
// the overlay closes. So each opening remembers the offset it left behind,
// keyed by stack depth, and each close restores it — the person lands back
// where they were, however deep the overlays were stacked.
//
// useLayoutEffect rather than useEffect: the scroll lands in the same frame as
// the DOM change, so neither move is ever painted. Instant by design — an
// animated scroll on open reads as a glitch.
import { useLayoutEffect, useRef } from 'react';

export function useOverlayScrollReset(depth) {
  const prevDepth = useRef(0);
  const offsets = useRef([]);

  useLayoutEffect(() => {
    const el = document.getElementById('root');
    if (!el) return;
    const prev = prevDepth.current;
    if (depth > prev) {
      offsets.current[prev] = el.scrollTop;           // remember where we left
      el.scrollTo({ top: 0, behavior: 'instant' });   // open at the top
    } else if (depth < prev) {
      el.scrollTo({ top: offsets.current[depth] ?? 0, behavior: 'instant' });
    }
    prevDepth.current = depth;
  }, [depth]);
}
