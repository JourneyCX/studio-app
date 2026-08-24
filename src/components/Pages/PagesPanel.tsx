import { useEffect, useState } from 'react'
import { stratumApi } from '../../lib/api'
import type { ReorderChange } from '../../lib/api'
import type { StorePage, MenuLocation } from '../../lib/pages'
import { LINK_ONLY_PAGE_TYPES } from '../../lib/pages'
import { PageSettingsModal } from './PageSettingsModal'

interface PagesPanelProps {
  tenantId: number
  token: string
  // Whether the footer's brand block (logo/business name/tagline) is also showing
  // as a column — see StoreSettingsSection's checkbox. Narrows the footer's
  // top-level-page cap from 4 to 3 so the two combined never exceed 4 columns —
  // mirrors Store_builder_model::reorder_pages()'s server-side check.
  footerShowBrandColumn: boolean
  onClose: () => void
  // Routes through App.tsx's existing unsaved-changes guard before doing a
  // full-page navigation into the Puck editor for a different page — see
  // App.tsx's onNavigateToPage.
  onNavigateToPage: (slug: string) => void
}

const FOOTER_COLUMN_CAP_WITH_BRAND    = 3
const FOOTER_COLUMN_CAP_WITHOUT_BRAND = 4

type TopLevelRow = { page: StorePage; children: StorePage[] }

function groupSection(pages: StorePage[], location: MenuLocation): TopLevelRow[] {
  const inSection = pages.filter(p => p.menu_location === location)
  const byParent  = new Map<number, StorePage[]>()
  for (const p of inSection) {
    if (p.menu_parent_id) {
      const list = byParent.get(p.menu_parent_id) ?? []
      list.push(p)
      byParent.set(p.menu_parent_id, list)
    }
  }
  return inSection
    .filter(p => !p.menu_parent_id)
    .sort((a, b) => a.menu_order - b.menu_order)
    .map(page => ({
      page,
      children: (byParent.get(page.id) ?? []).sort((a, b) => a.menu_order - b.menu_order),
    }))
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const panel: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, height: '86vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
}
const sectionTitle: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase',
  letterSpacing: 0.5, margin: '20px 0 8px',
}
const smallBtn: React.CSSProperties = {
  fontSize: 12, padding: '4px 7px', borderRadius: 5, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', color: '#475569', cursor: 'pointer', lineHeight: 1,
}
const iconBtn: React.CSSProperties = { ...smallBtn, padding: '5px 8px' }

export function PagesPanel({ tenantId, token, footerShowBrandColumn, onClose, onNavigateToPage }: PagesPanelProps) {
  const [pages, setPages]     = useState<StorePage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [settingsPage, setSettingsPage] = useState<StorePage | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [dragId, setDragId]   = useState<number | null>(null)
  // Insertion-point indicator while dragging — id of the row currently being
  // hovered over, and whether the dragged row would land above or below it.
  // Computed from cursor Y vs. the hovered row's own vertical midpoint, so a
  // drop always lands exactly where the line is shown instead of the old
  // swap-with-target behavior (which had no visual feedback on which side
  // the dragged row would end up).
  const [dropTarget, setDropTarget] = useState<{ id: number; position: 'before' | 'after' } | null>(null)

  const footerColumnCap = footerShowBrandColumn ? FOOTER_COLUMN_CAP_WITH_BRAND : FOOTER_COLUMN_CAP_WITHOUT_BRAND
  const footerColumnCount = groupSection(pages, 'footer').length

  useEffect(() => {
    stratumApi.getPages(tenantId, token)
      .then(r => setPages(r.pages))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load pages'))
      .finally(() => setLoading(false))
  }, [tenantId, token])

  const applyChanges = async (changes: ReorderChange[], optimistic: StorePage[]) => {
    setPages(optimistic)
    try {
      await stratumApi.reorderPages(tenantId, changes, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order')
    }
  }

  // Reorders `draggedId` to land immediately before/after `targetId` within
  // their shared sibling group — either the top-level rows of one section
  // (parentId null) or the children of one top-level row (parentId set).
  // Both top-level rows and children are draggable (see renderRow); dragging
  // a row onto a target outside its own sibling group is a silent no-op
  // (indexOf returns -1 for an id not present in that group's list) — this
  // only ever reorders within a group, never re-parents. Changing parents is
  // still only done via the explicit ⇥/⇤ buttons.
  const reorderSiblings = (
    location: MenuLocation,
    parentId: number | null,
    draggedId: number,
    targetId: number,
    position: 'before' | 'after',
  ) => {
    const siblings = parentId
      ? pages.filter(p => p.menu_parent_id === parentId).sort((a, b) => a.menu_order - b.menu_order).map(p => p.id)
      : groupSection(pages, location).map(r => r.page.id)
    const from = siblings.indexOf(draggedId)
    if (from === -1 || siblings.indexOf(targetId) === -1 || draggedId === targetId) return
    siblings.splice(from, 1)
    const to = siblings.indexOf(targetId)
    siblings.splice(position === 'before' ? to : to + 1, 0, draggedId)

    const changes: ReorderChange[] = siblings.map((id, i) => ({ id, menuLocation: location, menuOrder: i, menuParentId: parentId }))
    const next = pages.map(p => {
      const idx = siblings.indexOf(p.id)
      return idx === -1 ? p : { ...p, menu_order: idx, menu_parent_id: parentId }
    })
    applyChanges(changes, next)
  }

  // Moves a top-level page (and, if it has children, its whole subtree) to a
  // different menu location, appended at the end. Every page moved into the
  // footer becomes a new top-level entry — i.e. a new column (see renderRow,
  // where the location <select> only renders for non-child rows) — so this is
  // the one place a move can push the footer over its column cap.
  const moveLocation = (page: StorePage, location: MenuLocation) => {
    if (location === 'footer' && page.menu_location !== 'footer' && footerColumnCount >= footerColumnCap) {
      setError(`Footer already has ${footerColumnCap} columns${footerShowBrandColumn ? ' (the logo/description column uses the 4th)' : ''}. Use the "↳ Add link to..." option in the dropdown to add this page inside an existing column instead.`)
      return
    }
    const children = pages.filter(p => p.menu_parent_id === page.id)
    const targetTop = groupSection(pages, location)
    const baseOrder = targetTop.length
    const changes: ReorderChange[] = [
      { id: page.id, menuLocation: location, menuOrder: baseOrder, menuParentId: null },
      ...children.map((c, i) => ({ id: c.id, menuLocation: location, menuOrder: baseOrder + i + 1, menuParentId: page.id })),
    ]
    const changedIds = new Set(changes.map(c => c.id))
    const next = pages.map(p => {
      const change = changes.find(c => c.id === p.id)
      return change && changedIds.has(p.id)
        ? { ...p, menu_location: change.menuLocation, menu_order: change.menuOrder, menu_parent_id: change.menuParentId }
        : p
    })
    applyChanges(changes, next)
  }

  // Moves `page` (from any section) directly into the footer as a link inside
  // an *existing* column, bypassing the column cap entirely — the cap only
  // limits how many top-level (column) entries the footer can have, not how
  // many links live inside one. Without this, a page couldn't be added to the
  // footer at all once at the cap: moveLocation() always creates a new
  // top-level column, and the ⇥ indent button only nests pages already inside
  // the footer section, so there was no way to add a brand-new page as a link
  // in an existing column once full — a real dead end, not intentional.
  // Only offered (see renderRow) for pages with no children of their own,
  // matching the same one-level-of-nesting rule indent() already enforces.
  const addToFooterColumn = (page: StorePage, columnPageId: number) => {
    const siblingCount = pages.filter(p => p.menu_parent_id === columnPageId).length
    const changes: ReorderChange[] = [{ id: page.id, menuLocation: 'footer', menuOrder: siblingCount, menuParentId: columnPageId }]
    const next = pages.map(p => p.id === page.id ? { ...p, menu_location: 'footer' as MenuLocation, menu_parent_id: columnPageId, menu_order: siblingCount } : p)
    applyChanges(changes, next)
  }

  // Nests `page` as the last child of the top-level row immediately before it
  // in the same section ("⇥ Indent"). Disallowed (button hidden) if `page`
  // already has children of its own — one level of nesting only.
  const indent = (location: MenuLocation, page: StorePage) => {
    const top = groupSection(pages, location).map(r => r.page)
    const idx = top.findIndex(p => p.id === page.id)
    if (idx <= 0) return
    const newParent = top[idx - 1]
    const siblingCount = pages.filter(p => p.menu_parent_id === newParent.id).length
    const changes: ReorderChange[] = [{ id: page.id, menuLocation: location, menuOrder: siblingCount, menuParentId: newParent.id }]
    const next = pages.map(p => p.id === page.id ? { ...p, menu_parent_id: newParent.id, menu_order: siblingCount } : p)
    applyChanges(changes, next)
  }

  // Un-nests `page` back to top-level, positioned right after its former
  // parent, then re-numbers every top-level row in the section so the order
  // stays contiguous (0..n-1) rather than gapped.
  const outdent = (location: MenuLocation, page: StorePage) => {
    if (!page.menu_parent_id) return
    if (location === 'footer' && footerColumnCount >= footerColumnCap) {
      setError(`Footer already has ${footerColumnCap} columns${footerShowBrandColumn ? ' (the logo/description column uses the 4th)' : ''}. Un-nesting this would add another one — remove or merge a column first.`)
      return
    }
    const rows = groupSection(pages, location).map(r => r.page.id)
    const parentIdx = rows.indexOf(page.menu_parent_id)
    rows.splice(parentIdx + 1, 0, page.id)

    const changes: ReorderChange[] = rows.map((id, i) => ({ id, menuLocation: location, menuOrder: i, menuParentId: null }))
    const next = pages.map(p => {
      const idx = rows.indexOf(p.id)
      if (idx === -1) return p
      return { ...p, menu_parent_id: null, menu_order: idx }
    })
    applyChanges(changes, next)
  }

  const handleDelete = async (page: StorePage) => {
    if (!confirm(`Delete "${page.page_name}"? This cannot be undone.`)) return
    try {
      await stratumApi.deletePage(tenantId, page.id, token)
      setPages(prev => prev.filter(p => p.id !== page.id).map(p => p.menu_parent_id === page.id ? { ...p, menu_parent_id: null } : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const result = await stratumApi.createPage(tenantId, name, token)
      setPages(prev => [...prev, result.page])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  // groupLabel is set for a top-level row that renders as more than a plain link —
  // a footer column heading (always, since build_footer_columns() treats every
  // top-level footer page as a heading) or a main-menu dropdown group (only when
  // it actually has nested pages — most top-level main-menu pages are plain links,
  // unlike the footer). Makes the heading/children structure that
  // build_footer_columns()/build_nav_links() derive visible here instead of
  // looking like a flat list.
  const renderRow = (location: MenuLocation, page: StorePage, isChild: boolean, canIndent: boolean, groupLabel?: string) => {
    const isLinkOnly = LINK_ONLY_PAGE_TYPES.includes(page.page_type)
    // Both top-level rows and children are draggable — reordering is scoped to
    // siblings sharing the same menu_parent_id (null for top-level), see
    // reorderSiblings(). Re-parenting (moving into/out of a group) is still
    // only done via the explicit ⇥/⇤ buttons, not drag.
    const draggable = true
    const indicator = dropTarget?.id === page.id ? dropTarget.position : null

    return (
      <div
        key={page.id}
        draggable={draggable}
        onDragStart={e => {
          setDragId(page.id)
          // Firefox drops a drag with no data transfer set — harmless payload,
          // the actual move is tracked via dragId state, not this.
          e.dataTransfer.setData('text/plain', String(page.id))
        }}
        onDragOver={e => {
          e.preventDefault()
          if (dragId === null || dragId === page.id) return
          const dragged = pages.find(p => p.id === dragId)
          if (!dragged || dragged.menu_parent_id !== page.menu_parent_id) return
          const rect = e.currentTarget.getBoundingClientRect()
          const position: 'before' | 'after' = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after'
          setDropTarget(prev => (prev?.id === page.id && prev.position === position ? prev : { id: page.id, position }))
        }}
        onDrop={e => {
          e.preventDefault()
          if (dragId === null || !dropTarget || dropTarget.id !== page.id) { setDragId(null); setDropTarget(null); return }
          reorderSiblings(location, page.menu_parent_id, dragId, page.id, dropTarget.position)
          setDragId(null)
          setDropTarget(null)
        }}
        onDragEnd={() => { setDragId(null); setDropTarget(null) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 10px', marginLeft: isChild ? 26 : 0, marginBottom: 4,
          borderRadius: 8, border: '1px solid #e2e8f0',
          borderTop: indicator === 'before' ? '2px solid #2563eb' : undefined,
          borderBottom: indicator === 'after' ? '2px solid #2563eb' : undefined,
          backgroundColor: dragId === page.id ? '#eff6ff' : '#fff',
          opacity: dragId === page.id ? 0.6 : 1,
        }}
      >
        <span style={{ cursor: 'grab', color: '#cbd5e1', fontSize: 13 }} title="Drag to reorder">⠿⠿</span>
        <span style={{ flex: 1, overflow: 'hidden' }}>
          {groupLabel && (
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {groupLabel}
            </div>
          )}
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {page.page_name}
          </span>
        </span>

        {location !== 'none' && !isChild && (
          canIndent
            ? <button style={iconBtn} title="Indent — nest under the page above" onClick={() => indent(location, page)}>⇥</button>
            : null
        )}
        {location !== 'none' && isChild && (
          <button style={iconBtn} title="Un-nest" onClick={() => outdent(location, page)}>⇤</button>
        )}

        {!isChild && (() => {
          const footerAtCap = page.menu_location !== 'footer' && footerColumnCount >= footerColumnCap
          // Direct "add as a link inside an existing column" shortcut — lets a
          // page reach the footer even once the column cap is hit (see
          // addToFooterColumn()), and skips the move-then-⇥-indent dance either
          // way. Only offered for a page not already a footer column itself,
          // and only when it has no children of its own (nesting it would
          // orphan them / create a disallowed 2-level tree).
          const canAddToColumn = page.menu_location !== 'footer' && !pages.some(p => p.menu_parent_id === page.id)
          const footerColumns = canAddToColumn ? groupSection(pages, 'footer') : []
          return (
            <select
              value={page.menu_location}
              onChange={e => {
                const v = e.target.value
                if (v.startsWith('footer:')) {
                  addToFooterColumn(page, Number(v.slice(7)))
                } else {
                  moveLocation(page, v as MenuLocation)
                }
              }}
              style={{ fontSize: 11.5, padding: '4px 6px', borderRadius: 5, border: '1px solid #e2e8f0', color: '#475569' }}
            >
              <option value="none">Not in menu</option>
              <option value="main">Main Menu</option>
              <option value="footer" disabled={footerAtCap}>
                Footer Menu{footerAtCap ? ' — new column (full)' : ''}
              </option>
              {footerColumns.map(col => (
                <option key={col.page.id} value={`footer:${col.page.id}`}>
                  ↳ Add link to "{col.page.page_name}"
                </option>
              ))}
            </select>
          )
        })()}

        <button style={iconBtn} title="Page settings" onClick={() => setSettingsPage(page)}>⚙️</button>
        {!isLinkOnly && (
          <button style={iconBtn} title="Edit in Studio" onClick={() => onNavigateToPage(page.page_slug)}>✏️ Edit</button>
        )}
        <button style={{ ...iconBtn, color: '#dc2626', borderColor: '#fecaca' }} title="Delete" onClick={() => handleDelete(page)}>🗑</button>
      </div>
    )
  }

  const renderSection = (title: string, location: MenuLocation) => {
    const rows = groupSection(pages, location)
    const isFooter = location === 'footer'
    const isMain   = location === 'main'
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={sectionTitle}>{title}</div>
          {isFooter && (
            <span style={{ fontSize: 11, fontWeight: 700, color: footerColumnCount >= footerColumnCap ? '#dc2626' : '#94a3b8' }}>
              {footerColumnCount} / {footerColumnCap} columns
            </span>
          )}
        </div>
        {isFooter && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
            Each top-level page here becomes a footer column heading — drag another
            page and hit ⇥ to nest it underneath as that column's link. Once at the
            cap, use a page's "↳ Add link to..." option (in Main Menu / Not in Menu)
            to add it straight into an existing column instead.
            {footerShowBrandColumn && ' The logo/description column (Site Settings → Footer) uses one of the 4.'}
          </p>
        )}
        {isMain && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
            Nest a page under another (⇥) to turn the page above it into a Menu
            Group — it becomes a hover dropdown on the live site instead of a
            plain link, and the nested page appears inside it.
          </p>
        )}
        {rows.length === 0 && <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 8px' }}>No pages here yet.</p>}
        {rows.map((row, i) => {
          // A page that already has children of its own can't also become a
          // child (see reorder_pages()'s server-side check of the same rule) —
          // the ⇥ button is hidden rather than allowed-then-rejected.
          const canIndent = location !== 'none' && i > 0 && row.children.length === 0
          const hasChildren = row.children.length > 0
          const groupLabel = isFooter
            ? `Column ${i + 1} · ${row.children.length || 1} link${(row.children.length || 1) === 1 ? '' : 's'}`
            : isMain && hasChildren
              ? `Menu Group · ${row.children.length} page${row.children.length === 1 ? '' : 's'}`
              : undefined
          return (
            <div key={row.page.id}>
              {renderRow(location, row.page, false, canIndent, groupLabel)}
              {row.children.map(child => renderRow(location, child, true, false))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Pages</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 24px' }}>
          {loading ? (
            <p style={{ fontSize: 13, color: '#64748b' }}>Loading…</p>
          ) : (
            <>
              {renderSection('Main Menu', 'main')}
              {renderSection('Footer Menu', 'footer')}
              {renderSection('Not in Menu', 'none')}
            </>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. About Us"
            style={{ flex: 1, fontSize: 13, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6 }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              backgroundColor: creating ? '#93c5fd' : '#2563eb', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: creating ? 'default' : 'pointer',
            }}
          >
            + Create New Page
          </button>
        </div>
      </div>

      {settingsPage && (
        <PageSettingsModal
          tenantId={tenantId}
          token={token}
          page={settingsPage}
          onClose={() => setSettingsPage(null)}
          onSaved={updated => {
            setPages(prev => prev.map(p => p.id === updated.id ? updated : p))
            setSettingsPage(null)
          }}
        />
      )}
    </div>
  )
}
