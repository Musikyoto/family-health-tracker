import React from 'react'
import { T } from '../lib/theme.js'
import { Icon } from '../components/Icon.jsx'
import { TopBar } from '../components/ui.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import { LinkCard, RegenerateDialog } from './Settings.jsx'
import { listInvites, regenerateInvite } from '../lib/api.js'

// The invite link embeds the code; opening it routes a logged-in, family-less
// user into the Join form (deep-link handling wired in a later slice).
const linkFor = (code) => `${window.location.origin}/?join=${code}`

// Container for the Invite screen: loads the family's active invites, shows the
// view/edit code + link, copy, and regenerate (revoke + mint fresh) with confirm.
export function InviteScreen({ familyId, onBack }) {
  const [invites, setInvites] = React.useState(undefined) // undefined = loading
  const [copied, setCopied] = React.useState(null)        // 'view' | 'edit'
  const [regenRole, setRegenRole] = React.useState(null)  // 'editor' | 'viewer'
  const [err, setErr] = React.useState(null)

  const load = React.useCallback(() => {
    listInvites(familyId)
      .then(setInvites)
      .catch((e) => { console.error('Failed to load invites:', e); setErr(e.message); setInvites({}) })
  }, [familyId])

  React.useEffect(() => { load() }, [load])

  const copy = (key, url) => {
    try { navigator.clipboard && navigator.clipboard.writeText(url) } catch { /* clipboard may be unavailable */ }
    setCopied(key); setTimeout(() => setCopied(null), 1600)
  }

  async function confirmRegen() {
    const role = regenRole
    setRegenRole(null); setErr(null)
    try {
      await regenerateInvite(familyId, role)
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  if (invites === undefined) return <LoadingScreen label="Loading invite links…" />

  const editor = invites.editor
  const viewer = invites.viewer

  return (
    <div style={{ minHeight: '100%', background: T.gradientBg, paddingBottom: 40 }}>
      <TopBar title="Invite links" onBack={onBack} />
      <div style={{ padding: '6px 16px 0' }}>
        <LinkCard
          kind="view"
          code={viewer?.code}
          url={viewer ? linkFor(viewer.code) : ''}
          copied={copied === 'view'}
          onCopy={() => viewer && copy('view', linkFor(viewer.code))}
          onRegen={() => setRegenRole('viewer')}
        />
        <LinkCard
          kind="edit"
          code={editor?.code}
          url={editor ? linkFor(editor.code) : ''}
          copied={copied === 'edit'}
          onCopy={() => editor && copy('edit', linkFor(editor.code))}
          onRegen={() => setRegenRole('editor')}
        />
        {err && (
          <div style={{ color: T.red, fontSize: 13, fontWeight: 600, padding: '4px 6px 10px' }}>{err}</div>
        )}
        <div style={{ display: 'flex', gap: 10, padding: '4px 6px', color: T.body }}>
          <Icon name="alert" size={18} color={T.muted} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
            Regenerating makes the old code and link stop working for anyone who hasn't joined yet. People who've already joined keep their access.
          </span>
        </div>
      </div>

      {regenRole && (
        <RegenerateDialog
          kind={regenRole === 'editor' ? 'edit' : 'view'}
          onCancel={() => setRegenRole(null)}
          onConfirm={confirmRegen}
        />
      )}
    </div>
  )
}
