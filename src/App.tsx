import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Puck, type Data } from '@measured/puck'
import { puckConfig } from './lib/puck/config'
import { stratumApi, setActiveToken, setActiveTenantId, STRATUM_ORIGIN, type StudioSession } from './lib/api'
import { useTemplateManager } from './lib/useTemplateManager'
import { TemplateSelector } from './components/TemplateSelector'
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog'
import { SiteHeader } from './components/Navigation/SiteHeader'
import { SiteFooter } from './components/Navigation/SiteFooter'
import { WhatsAppWidget } from './components/Navigation/WhatsAppWidget'
import { SiteSettingsPanel } from './components/SiteSettings/SiteSettingsPanel'
import { PagesPanel } from './components/Pages/PagesPanel'
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from './lib/siteSettings'

// SiteHeader/SiteFooter used to be page components stored inside puck_json —
// pages saved before this architecture change may still carry stale entries.
// Strip them so Puck never sees a component type it no longer has registered.
const CHROME_TYPES = new Set(['SiteHeader', 'SiteFooter'])
function stripChromeEntries(data: Data): Data {
  return { ...data, content: data.content.filter(item => !CHROME_TYPES.has(item.type)) }
}

// Debounce auto-save — fires 2s after the last change
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const EMPTY_DATA: Data = { root: { props: {} }, content: [], zones: {} }

// Matches the same body{zoom:1.25} rule added to the live storefront's
// layouts/default.vue — every storefront component hardcodes its own px
// font-size with no shared base, so this keeps the Puck preview's scale in
// sync with what the merchant will actually see live, without duplicating
// the change into ~40 mirrored React components. Targets <body>, not <html>
// (matches the live storefront's rule) — kept consistent even though this
// iframe has no viewport meta tag of its own, in case Puck ever adds one.
// Must be a module-level (stable-identity) component, not an inline arrow
// function defined inside App's JSX — Puck remounts the actual <iframe>
// whenever the `iframe` override's function identity changes, which an
// inline definition does on every single re-render (e.g. every Puck
// onChange), destroying and recreating the iframe's document and wiping
// the rendered page content.
function PuckIframeZoom({ children, document }: { children: ReactNode; document?: Document }) {
  useEffect(() => {
    if (!document) return
    const style = document.createElement('style')
    style.textContent = 'body { zoom: 1.25; }'
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [document])
  return <>{children}</>
}

export default function App() {
  const params  = new URLSearchParams(window.location.search)
  const token   = params.get('token') ?? ''

  const [session,    setSession]    = useState<StudioSession | null>(null)
  const [puckData,   setPuckData]   = useState<Data>(EMPTY_DATA)
  const [pageName,   setPageName]   = useState('Page')
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)
  // Slug queued for navigation once the unsaved-changes dialog resolves — set
  // only when onNavigateToPage is called while isDirty; null means the dialog
  // (when shown at all) is here because of the parent-window back-button guard
  // instead, which doExit() already handles.
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState('')
  const [status,     setStatus]     = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [lastChange, setLastChange] = useState<Data | null>(null)

  // Incrementing this key forces <Puck> to remount with fresh data after a
  // template is applied — necessary because Puck treats `data` as initial state.
  const [editorKey, setEditorKey] = useState(0)

  const debouncedChange = useDebounce(lastChange, 2000)

  // ── Unsaved-changes guard ──────────────────────────────────────────────────
  const [isDirty,        setIsDirty]        = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [dialogSaving,   setDialogSaving]   = useState(false)

  // Ref keeps the latest isDirty value accessible inside event handlers
  // without requiring them to be torn down and re-created on every render.
  const isDirtyRef   = useRef(false)
  const guardPushed  = useRef(false)   // true once we've pushed the guard history entry

  const syncDirty = (value: boolean) => {
    isDirtyRef.current = value
    setIsDirty(value)
  }

  // Push one extra entry into the *parent* window's history the first time
  // the page becomes dirty so we can intercept the back button.
  useEffect(() => {
    if (!isDirty || guardPushed.current) return
    guardPushed.current = true
    try {
      window.parent.history.pushState({ studioGuard: true }, '')
    } catch {
      // cross-origin iframe — will rely on beforeunload only
    }
  }, [isDirty])

  // Listen for popstate on the *parent* window (back/forward button).
  // Set up once on mount; uses ref to avoid stale-closure issues.
  useEffect(() => {
    const handlePopState = () => {
      if (!isDirtyRef.current) return
      // Re-push the guard to hold the current position, then show our dialog.
      try {
        window.parent.history.pushState({ studioGuard: true }, '')
      } catch {
        return  // cross-origin, cannot intercept
      }
      setShowExitDialog(true)
    }

    try {
      window.parent.addEventListener('popstate', handlePopState)
      return () => window.parent.removeEventListener('popstate', handlePopState)
    } catch {
      // cross-origin — no-op
    }
  }, [])

  // Native browser warning for tab-close, reload, or any navigation that
  // bypasses the popstate hook (e.g. entering a URL directly).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Exit dialog actions ────────────────────────────────────────────────────

  const doExit = () => {
    syncDirty(false)
    guardPushed.current = false
    setShowExitDialog(false)
    // go(-2): undo the guard push AND leave the studio page
    try {
      window.parent.history.go(-2)
    } catch {
      window.history.back()
    }
  }

  // Full-page navigation to a different page's editor — mints a fresh JWT
  // server-side (Store_builder::editor()), same one-JWT-per-page model the
  // rest of Studio already uses. Reconstructs the tenant-scoped admin path
  // the same way studio.php derives it: admin_url('') minus its trailing
  // /admin, /admin/... re-appended.
  const goToPage = (slug: string) => {
    window.top!.location.href = `${STRATUM_ORIGIN}/admin/store_builder/editor/${slug}`
  }

  const handleDialogSaveAndExit = async () => {
    setDialogSaving(true)
    try {
      if (lastChange && session) {
        await stratumApi.saveDraft(session.tenantId, session.pageSlug, lastChange, pageName, token)
      }
    } catch (err) {
      console.warn('Save before exit failed:', err)
    } finally {
      setDialogSaving(false)
    }
    if (pendingNavigation) {
      goToPage(pendingNavigation)
      return
    }
    doExit()
  }

  const handleDialogExitWithoutSaving = () => {
    if (pendingNavigation) {
      goToPage(pendingNavigation)
      return
    }
    doExit()
  }

  const handleDialogKeepEditing = () => {
    setShowExitDialog(false)
    setPendingNavigation(null)
  }

  // Pages panel's "Edit" action — routed through the same unsaved-changes
  // guard as the parent-window back button, rather than a bare navigation
  // that could silently discard in-progress Puck edits.
  const handleNavigateToPage = (slug: string) => {
    if (!isDirtyRef.current) {
      goToPage(slug)
      return
    }
    setPendingNavigation(slug)
    setShowExitDialog(true)
  }

  // ── Template manager ───────────────────────────────────────────────────────

  const tm = useTemplateManager(
    session?.tenantId ?? null,
    token,
    session?.pageSlug ?? null,
  )

  // ── Load on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setErrorMsg('No session token found. Please open the editor from the Stratum admin panel.')
      setStatus('error')
      return
    }
    stratumApi.verifyToken(token)
      .then(async sess => {
        setActiveToken(token)
        setActiveTenantId(sess.tenantId)
        setSession(sess)
        // Parallel, not sequential — page content and site settings are independent
        // fetches (both only need tenantId), matching the same no-added-latency
        // pattern used for the storefront's settings fetch.
        const [page, settingsResult, liveUrlResult] = await Promise.all([
          stratumApi.loadPage(sess.tenantId, sess.pageSlug, token),
          stratumApi.getSiteSettings(sess.tenantId, token).catch(() => ({ settings: null })),
          stratumApi.getLiveUrl(sess.tenantId, token).catch(() => ({ liveUrl: '' })),
        ])
        const loaded = (page.puckJson as Data) ?? EMPTY_DATA
        setPuckData(stripChromeEntries(loaded))
        setPageName(page.name)
        setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...(settingsResult.settings ?? {}) })
        setLiveUrl(liveUrlResult.liveUrl)
        setStatus('ready')
      })
      .catch(err => {
        setErrorMsg(err.message || 'Failed to load. Please close and reopen the editor.')
        setStatus('error')
      })
  }, [token])

  // ── Auto-save draft on debounced change ───────────────────────────────────

  useEffect(() => {
    if (!session || !debouncedChange) return
    stratumApi
      .saveDraft(session.tenantId, session.pageSlug, debouncedChange, pageName, token)
      .then(() => syncDirty(false))
      .catch(err => console.warn('Auto-save failed:', err.message))
  }, [debouncedChange])

  // ── Puck callbacks ─────────────────────────────────────────────────────────

  const handleChange = (data: Data) => {
    setLastChange(data)
    syncDirty(true)
  }

  const handlePublish = async (data: Data) => {
    if (!session) return
    try {
      const result = await stratumApi.publishPage(session.tenantId, session.pageSlug, data, token)
      syncDirty(false)
      const msg = result.publishedUrl
        ? `Published! Live at ${result.publishedUrl}`
        : 'Published successfully.'
      alert(msg)
    } catch (err: unknown) {
      alert('Publish failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Called by useTemplateManager after a template is saved as draft.
  // Remounting Puck via editorKey is the only reliable way to replace its
  // internal state — Puck 0.18 treats the `data` prop as initial-only.
  //
  // KNOWN GAP (flagged, not fixed here): master/personal templates still embed
  // SiteHeader/SiteFooter content items (masterTemplates.ts, sb_templates) from
  // before this architecture change. stripChromeEntries() prevents Puck from
  // choking on them, but a template's intended header/footer branding is silently
  // dropped rather than applied to the tenant's site_settings — "Apply Theme"
  // no longer changes the rendered chrome the way it used to. Needs a follow-up
  // to extract a template's chrome content into a site_settings write when a
  // theme/template is applied.
  const handleTemplateApplied = (data: Data) => {
    setPuckData(stripChromeEntries(data))
    setLastChange(null)
    syncDirty(false)
    guardPushed.current = false
    setEditorKey(k => k + 1)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return <div className="loading-screen"><span>Loading editor…</span></div>
  }
  if (status === 'error') {
    return <div className="error-screen"><span>⚠ {errorMsg}</span></div>
  }

  return (
    <>
      {/* Fixed chrome around the whole Puck editor (toolbar + sidebar + canvas) —
          not injected inside Puck's own preview iframe. Gives the merchant an
          accurate, live preview of the real page's Header/Footer while editing,
          without Header/Footer being draggable/editable Puck components anymore. */}
      <SiteHeader settings={siteSettings} />
      <Puck
        key={editorKey}
        config={puckConfig}
        data={puckData}
        onPublish={handlePublish}
        onChange={handleChange}
        overrides={{
          iframe: PuckIframeZoom,
          // Gear icon at the top of the Blocks panel (not the page header, where
          // Templates/unsaved-changes already live via headerActions below) — opens
          // the Site Settings overlay. `components` wraps Puck's own categorized
          // component list, so this renders as a header row above it, inside the
          // same panel frame — no collision with anything Puck already renders there.
          components: ({ children }) => (
            <>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => setPagesOpen(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 15 }}>📄</span> Pages
                </button>
                <button
                  onClick={() => setSiteSettingsOpen(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 15 }}>⚙️</span> Site Settings
                </button>
              </div>
              {children}
            </>
          ),
          // Inject a "Templates" button and an unsaved-changes badge into the
          // Puck header alongside the default actions.
          headerActions: ({ children }) => (
            <>
              {/* Unsaved-changes indicator */}
              {isDirty && (
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  lineHeight: 1,
                }}>
                  ● Unsaved changes
                </span>
              )}

              <button
                onClick={tm.openSelector}
                title="Browse and apply store templates"
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  lineHeight: 1,
                }}
              >
                🎨 Templates
              </button>

              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open the live storefront in a new tab"
                  style={{
                    padding: '7px 14px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    lineHeight: 1,
                    textDecoration: 'none',
                  }}
                >
                  🔗 View Live Site
                </a>
              )}
              {children}
            </>
          ),
        }}
      />
      <SiteFooter settings={siteSettings} />
      <WhatsAppWidget settings={siteSettings} />

      {/* Template selector modal */}
      {tm.isOpen && (
        <TemplateSelector
          templates={tm.allTemplates}
          loadingPersonal={tm.loadingPersonal}
          applying={tm.applying}
          currentPuckData={puckData}
          savingAsTemplate={tm.savingAsTemplate}
          onApply={template => tm.applyTemplate(template, handleTemplateApplied)}
          onSaveAsTemplate={tm.saveAsTemplate}
          onClose={tm.closeSelector}
        />
      )}

      {/* Pages panel (📄 Pages, top of the Blocks panel) */}
      {pagesOpen && session && (
        <PagesPanel
          tenantId={session.tenantId}
          token={token}
          onClose={() => setPagesOpen(false)}
          onNavigateToPage={handleNavigateToPage}
        />
      )}

      {/* Site Settings overlay (gear icon, top of the Blocks panel) */}
      {siteSettingsOpen && session && (
        <SiteSettingsPanel
          tenantId={session.tenantId}
          token={token}
          initialSettings={siteSettings}
          onClose={() => setSiteSettingsOpen(false)}
          onSaved={updated => setSiteSettings(updated)}
        />
      )}

      {/* Unsaved-changes exit dialog */}
      {showExitDialog && (
        <UnsavedChangesDialog
          saving={dialogSaving}
          onSaveAndExit={handleDialogSaveAndExit}
          onExitWithoutSaving={handleDialogExitWithoutSaving}
          onKeepEditing={handleDialogKeepEditing}
        />
      )}

      {/* Toast notification */}
      {tm.notification && (
        <div
          onClick={tm.dismissNotification}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10000,
            backgroundColor: tm.notification.type === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff',
            padding: '13px 18px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            animation: 'slideUp 0.2s ease',
          }}
          title="Click to dismiss"
        >
          <span style={{ fontSize: 16 }}>
            {tm.notification.type === 'success' ? '✓' : '⚠'}
          </span>
          <span>{tm.notification.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
