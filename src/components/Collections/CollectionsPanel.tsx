import { useEffect, useState } from 'react'
import { stratumApi, type StoreCollection, type StoreThemeOption } from '../../lib/api'
import { CollectionEditModal } from './CollectionEditModal'

interface CollectionsPanelProps {
  onClose: () => void
  // Same unsaved-changes-guarded navigation PagesPanel already uses for its
  // own "Edit in Studio" action — see App.tsx's onNavigateToPage. Only
  // callable once a collection has been published at least once (page_slug
  // is null until _sb_provision_collection_page() runs on first publish).
  onNavigateToPage: (slug: string) => void
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const panel: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, height: '86vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
}
const iconBtn: React.CSSProperties = {
  fontSize: 12, padding: '5px 8px', borderRadius: 5, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', color: '#475569', cursor: 'pointer', lineHeight: 1,
}

export function CollectionsPanel({ onClose, onNavigateToPage }: CollectionsPanelProps) {
  const [collections, setCollections] = useState<StoreCollection[]>([])
  const [themes, setThemes]   = useState<StoreThemeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState<StoreCollection | null | 'new'>(null)
  const [publishingId, setPublishingId] = useState<number | null>(null)
  // Which collection's inline theme-picker <select> is currently open — at
  // most one at a time, closed again on pick/cancel/blur.
  const [pickingThemeId, setPickingThemeId] = useState<number | null>(null)
  const [linkBusyId, setLinkBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([stratumApi.getActiveCollections(), stratumApi.getActiveCollectionThemes()])
      .then(([c, t]) => { setCollections(c.collections); setThemes(t.themes) })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load collections'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (c: StoreCollection) => {
    // Theme-linked collections never reach this confirm — their delete
    // button is disabled below — but the guard is real on the backend too
    // (collection_delete() returns 409), so a stale row from a second open
    // tab still fails safely with a clear message rather than a silent no-op.
    if (!confirm(`Delete "${c.name}"? This cannot be undone. Its storefront page (if published) is left in place — only the collection itself is removed.`)) return
    try {
      await stratumApi.deleteActiveCollection(c.id)
      setCollections(prev => prev.filter(x => x.id !== c.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleLinkTheme = async (c: StoreCollection, themeId: number) => {
    setLinkBusyId(c.id)
    setPickingThemeId(null)
    try {
      const result = await stratumApi.linkActiveCollectionTheme(c.id, themeId)
      setCollections(prev => prev.map(x => x.id === c.id ? { ...x, theme_id: result.theme_id, theme_name: result.theme_name } : x))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link theme')
    } finally {
      setLinkBusyId(null)
    }
  }

  const handleUnlinkTheme = async (c: StoreCollection) => {
    if (!confirm(`Unlink "${c.name}" from "${c.theme_name}"? It will no longer be protected from deletion.`)) return
    setLinkBusyId(c.id)
    try {
      await stratumApi.unlinkActiveCollectionTheme(c.id)
      setCollections(prev => prev.map(x => x.id === c.id ? { ...x, theme_id: null, theme_name: null } : x))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink theme')
    } finally {
      setLinkBusyId(null)
    }
  }

  const handleTogglePublish = async (c: StoreCollection) => {
    setPublishingId(c.id)
    try {
      const result = await stratumApi.setActiveCollectionPublished(c.id, !c.is_published)
      setCollections(prev => prev.map(x => x.id === c.id ? { ...x, is_published: !c.is_published, page_slug: result.page_slug ?? x.page_slug } : x))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publish state')
    } finally {
      setPublishingId(null)
    }
  }

  const handleSaved = (saved: StoreCollection) => {
    setCollections(prev => {
      const exists = prev.some(c => c.id === saved.id)
      return exists ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved]
    })
    setEditing(null)
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Collections</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 24px' }}>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
            Group products from any category under a named collection — e.g. "Golden Essentials" or
            "Summer Collection". Publishing one creates a real page listing its products, and gives you
            a "Live" collection to show in a Collection List block.
          </p>

          {loading ? (
            <p style={{ fontSize: 13, color: '#64748b' }}>Loading…</p>
          ) : collections.length === 0 ? (
            <p style={{ fontSize: 12.5, color: '#94a3b8' }}>No collections yet — create your first one below.</p>
          ) : (
            collections.map(c => (
              <div key={c.id} style={{ padding: '9px 10px', marginBottom: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.image_url
                    ? <img src={c.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', display: 'inline-block', flexShrink: 0 }} />}
                  <span style={{ flex: 1, overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                      {c.item_count ?? 0} item{(c.item_count ?? 0) === 1 ? '' : 's'} · {c.is_published ? 'Published' : 'Draft'}
                    </span>
                  </span>
                  <button
                    onClick={() => handleTogglePublish(c)}
                    disabled={publishingId === c.id}
                    style={{ ...iconBtn, color: c.is_published ? '#0f172a' : '#2563eb', fontWeight: 600 }}
                    title={c.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {publishingId === c.id ? '…' : c.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  {c.page_slug && (
                    <button style={iconBtn} title="Open this collection's page in the editor" onClick={() => onNavigateToPage(c.page_slug!)}>
                      Open in Editor
                    </button>
                  )}
                  <button style={iconBtn} title="Edit" onClick={() => setEditing(c)}>✏️ Edit</button>
                  <button
                    style={{ ...iconBtn, color: c.theme_id ? '#cbd5e1' : '#dc2626', borderColor: c.theme_id ? '#e2e8f0' : '#fecaca', cursor: c.theme_id ? 'not-allowed' : 'pointer' }}
                    title={c.theme_id ? `Protected by the "${c.theme_name}" theme — unlink to delete` : 'Delete'}
                    disabled={!!c.theme_id}
                    onClick={() => handleDelete(c)}
                  >
                    🗑
                  </button>
                </div>

                {/* "Belongs to a theme" protection — separate row so it reads as a
                    distinct, deliberate status rather than crowding the action bar
                    above. Linking is the actual delete-protection mechanism (see
                    collection_delete()'s 409 guard); this is just its UI. */}
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.theme_id ? (
                    <>
                      <span style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        🔒 Protected by <em style={{ fontStyle: 'normal', color: '#2563eb' }}>{c.theme_name}</em>
                      </span>
                      <button
                        onClick={() => handleUnlinkTheme(c)}
                        disabled={linkBusyId === c.id}
                        style={{ ...iconBtn, fontSize: 11, padding: '3px 7px', color: '#64748b' }}
                      >
                        {linkBusyId === c.id ? '…' : 'Unlink'}
                      </button>
                    </>
                  ) : pickingThemeId === c.id ? (
                    <>
                      <select
                        autoFocus
                        defaultValue=""
                        disabled={linkBusyId === c.id}
                        onChange={e => { const v = Number(e.target.value); if (v) handleLinkTheme(c, v) }}
                        onBlur={() => setPickingThemeId(null)}
                        style={{ fontSize: 11.5, padding: '3px 6px', borderRadius: 5, border: '1px solid #e2e8f0' }}
                      >
                        <option value="" disabled>Choose a theme…</option>
                        {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button onClick={() => setPickingThemeId(null)} style={{ ...iconBtn, fontSize: 11, padding: '3px 7px' }}>Cancel</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setPickingThemeId(c.id)}
                      disabled={themes.length === 0}
                      title={themes.length === 0 ? 'No published themes yet' : 'Link this collection to a theme so it can\'t be deleted by accident'}
                      style={{ ...iconBtn, fontSize: 11, padding: '3px 7px', color: '#64748b' }}
                    >
                      🔗 Belongs to a theme…
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button
            onClick={() => setEditing('new')}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + New Collection
          </button>
        </div>
      </div>

      {editing && (
        <CollectionEditModal
          collection={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
