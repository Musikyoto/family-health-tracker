// Pending invite code handling.
//
// An invite link is `<origin>/?join=<code>`. A logged-out recipient who opens
// it then signs in via magic link returns to the bare origin (the query is
// dropped on the redirect), so we stash the code in localStorage at startup —
// before any auth redirect — and read it back once they reach the Join form.

const PENDING_KEY = 'pendingInviteCode'

// Run once at startup: move ?join=<code> from the URL into localStorage and
// tidy it out of the address bar. Safe to call when no code is present.
export function capturePendingInviteCode() {
  try {
    const code = new URLSearchParams(window.location.search).get('join')
    if (code) {
      localStorage.setItem(PENDING_KEY, code)
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
  } catch { /* localStorage / history may be unavailable */ }
}

export function readPendingInviteCode() {
  try { return localStorage.getItem(PENDING_KEY) || '' } catch { return '' }
}

export function clearPendingInviteCode() {
  try { localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
}
