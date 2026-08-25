import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Puck, usePuck, type Data } from '@measured/puck'
import { puckConfig } from './lib/puck/config'
import { stratumApi, setActiveToken, setActiveTenantId, STRATUM_ORIGIN, SessionExpiredError, type StudioSession } from './lib/api'
import { useTemplateManager, uid } from './lib/useTemplateManager'
import { TemplateSelector } from './components/TemplateSelector'
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog'
import { SessionExpiredDialog } from './components/SessionExpiredDialog'
import { SiteHeader } from './components/Navigation/SiteHeader'
import { SiteFooter } from './components/Navigation/SiteFooter'
import { WhatsAppWidget } from './components/Navigation/WhatsAppWidget'
import { AnnouncementBar } from './components/Navigation/AnnouncementBar'
import { SiteSettingsPanel } from './components/SiteSettings/SiteSettingsPanel'
import { PagesPanel } from './components/Pages/PagesPanel'
import { ThemesPanel } from './components/ThemesPanel'
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from './lib/siteSettings'

// SiteHeader/SiteFooter used to be page components stored inside puck_json —
// pages saved before this architecture change may still carry stale entries.
// Strip them so Puck never sees a component type it no longer has registered.
const CHROME_TYPES = new Set(['SiteHeader', 'SiteFooter'])
function stripChromeEntries(data: Data): Data {
  return { ...data, content: data.content.filter(item => !CHROME_TYPES.has(item.type)) }
}

// A "Product Filter" (sidebar layout) dropped straight onto the page canvas has
// no column to put a Product Grid beside it — Puck's root canvas is a single
// vertical DropZone, so it can only stack above/below other root-level blocks.
// The "Shop Page — Filters Sidebar" template (masterTemplates.ts) works around
// this by pre-wrapping the same filter in a "Sidebar Left (1:3)" Columns layout
// with the filter in col-0 and a grid in col-1. Do the same automatically the
// moment a sidebar filter is freshly dropped at the root, so an empty col-1 is
// immediately there to drop a Product Grid into — matching the template without
// the merchant needing to find and apply it.
//
// This has to be a component rendered *inside* <Puck> (via the `components`
// override below) and driven by usePuck()'s own `dispatch`, not a `data`/
// `editorKey` remount reacting to onChange from the parent — remounting the
// whole <Puck> tree synchronously while Puck's own dnd-kit drag handling is
// still settling the drop tears the canvas DOM out from under it and crashes
// to a blank white screen (confirmed live). Routing the mutation through
// Puck's own `setData` action instead goes through the same reducer dnd-kit's
// drop already uses, so there's nothing to tear down.
function ProductFilterAutoWrap() {
  const { appState, dispatch } = usePuck()
  // Ids already accounted for (present at last check) — starts from whatever
  // was already on the page at mount so pages loaded with a pre-existing
  // root-level filter aren't retroactively rewrapped.
  const knownIds = useRef<Set<string>>(new Set(appState.data.content.map(item => item.props.id)))

  useEffect(() => {
    const content = appState.data.content
    const previousIds = knownIds.current
    knownIds.current = new Set(content.map(item => item.props.id))

    const index = content.findIndex(item =>
      item.type === 'ProductFilter' && item.props.layout === 'sidebar' && !previousIds.has(item.props.id)
    )
    if (index === -1) return
    const droppedId = content[index].props.id

    dispatch({
      type: 'setData',
      data: (previous) => {
        const i = previous.content.findIndex(item => item.props.id === droppedId)
        if (i === -1) return {}
        const filterItem = previous.content[i]
        const columnsId = `Columns-${uid()}`
        const newContent = [...previous.content]
        newContent[i] = {
          type: 'Columns',
          props: { id: columnsId, distribution: 'sidebar13', gap: 32, backgroundColor: 'transparent' },
        }
        return {
          content: newContent,
          zones: { ...previous.zones, [`${columnsId}:col-0`]: [filterItem] },
        }
      },
    })
  }, [appState.data, dispatch])

  return null
}

// Elementor/WordPress-style single-column editor sidebar: shows either the
// block list (+ Outline) or the selected item's Fields, never both, so the
// canvas gets the width back that used to be split three ways. Puck always
// renders Components/Outline in its "left" grid area and Fields in "right"
// (fixed by the library, not swappable per-instance) — rather than fight
// that, ui.leftSideBarVisible stays permanently true and rightSideBarVisible
// permanently false (see INITIAL_PUCK_UI), and the [data-puck-panel="fields"]
// CSS rule in styles.css re-points the *rightSideBar* div at grid-area:left
// (and leftSideBar at grid-area:right) whenever a field is being edited —
// this reassigns whichever whole panel (title bar included) is active into
// the visible column, rather than moving individual pieces of content
// between panels, so each panel's own heading always still matches what's
// under it. If a future @measured/puck upgrade renumbers its CSS-module
// hash, that rule just stops matching and the editor falls back to Puck's
// stock side-by-side layout — safe, not broken.
//
// `onSelectionChange` must be a stable callback that does its own "did the
// id actually change" comparison using state that lives in App, not in a
// ref local to this component: `overrides` is a fresh object literal every
// App render (needed — headerActions closes over isDirty/liveUrl/etc that
// really do need to reflect each render), and Puck uses the `components`
// override as a real component type, so Puck remounts this component
// whenever that object's identity changes. A local ref would get wiped on
// every one of those remounts, making onModeChange re-fire as if the
// still-selected item had just been selected — confirmed live: it's why
// "Add Elements" was reverting straight back to the Fields panel.
function PanelModeSync({ onSelectionChange }: { onSelectionChange: (id: string | undefined) => void }) {
  const { selectedItem } = usePuck()
  const currentId = (selectedItem?.props as { id?: string } | undefined)?.id

  useEffect(() => {
    onSelectionChange(currentId)
  }, [currentId, onSelectionChange])

  return null
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

const headerIconButtonStyle: CSSProperties = {
  padding: '7px 12px',
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
}

// Puck's Blocks panel groups components by category (Layout, Content,
// E-commerce, …) as collapsible sections — collapsed is the built-in
// behavior, it just defaults `expanded` to true when unset. Start every
// category collapsed so the panel reads as a dropdown list rather than one
// long scroll; derived from config.ts's categories so a new category
// collapses by default too, without needing a matching edit here.
const INITIAL_PUCK_UI = {
  // Right sidebar (Fields) starts collapsed — nothing is selected on load,
  // so there's nothing to show there yet. See PanelModeSync above: these two
  // flags are never toggled again after this — only *which* panel occupies
  // the visible "left" column changes, via CSS.
  leftSideBarVisible: true,
  rightSideBarVisible: false,
  componentList: Object.fromEntries(
    Object.keys(puckConfig.categories ?? {}).map(id => [id, { expanded: false }])
  ),
}

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
  const [themesOpen, setThemesOpen] = useState(false)
  // 'blocks' = the add-elements list is the visible left-hand panel;
  // 'fields' = the selected item's properties are. See PanelModeSync.
  const [panelMode, setPanelMode] = useState<'blocks' | 'fields'>('blocks')
  // Lives here (not inside PanelModeSync) so it survives that component
  // being remounted — see the comment on PanelModeSync for why that matters.
  const lastSelectedId = useRef<string | undefined>(undefined)
  const handleSelectionChange = useCallback((currentId: string | undefined) => {
    if (currentId === lastSelectedId.current) return
    lastSelectedId.current = currentId
    setPanelMode(currentId ? 'fields' : 'blocks')
  }, [])
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

  // ── Session-expiry guard ───────────────────────────────────────────────────
  // The JWT (session.exp) is only good for 1 hour (store_builder_helper.php).
  // Without this, a stale token fails every save/publish with a silent 401
  // that's easy to miss (a plain alert()) and leaves "Unsaved changes" stuck
  // with no indication why — see project_social_feed_renderer_drift_fix memory.
  const [sessionExpiringSoon, setSessionExpiringSoon] = useState(false)
  const [sessionExpired,      setSessionExpired]      = useState(false)

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

  // Same cross-origin-safe navigation as goToPage, used to recover from an
  // expired session: navigating the *parent* window back to Store_builder::editor()
  // mints a fresh JWT server-side and rebuilds this iframe with it. If the
  // session expired before we ever loaded a page (verifyToken itself 401s),
  // there's no known slug yet — document.referrer is the parent admin page
  // that embedded this iframe (studio.php), which falls back to the tenant's
  // Store Builder pages list if even that isn't available.
  const reloadForFreshSession = () => {
    const target = session
      ? `${STRATUM_ORIGIN}/admin/store_builder/editor/${session.pageSlug}`
      : (document.referrer || `${STRATUM_ORIGIN}/admin/store_builder/pages`)
    try {
      window.top!.location.href = target
    } catch {
      window.location.href = target
    }
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
        if (err instanceof SessionExpiredError) {
          setSessionExpired(true)
        } else {
          setErrorMsg(err.message || 'Failed to load. Please close and reopen the editor.')
        }
        setStatus('error')
      })
  }, [token])

  // ── Proactive session-expiry warning ───────────────────────────────────────
  // Warns 5 minutes before the JWT actually expires (instead of only finding
  // out via a failed save/publish), and flips the same blocking dialog on at
  // the real expiry moment even if the user hasn't tried to save since.
  useEffect(() => {
    if (!session) return
    const msUntilExpiry = session.exp * 1000 - Date.now()
    if (msUntilExpiry <= 0) {
      setSessionExpired(true)
      return
    }
    const warnMs = Math.max(msUntilExpiry - 5 * 60 * 1000, 0)
    const warnTimer   = setTimeout(() => setSessionExpiringSoon(true), warnMs)
    const expireTimer = setTimeout(() => setSessionExpired(true), msUntilExpiry)
    return () => {
      clearTimeout(warnTimer)
      clearTimeout(expireTimer)
    }
  }, [session])

  // ── Auto-save draft on debounced change ───────────────────────────────────

  useEffect(() => {
    if (!session || !debouncedChange) return
    stratumApi
      .saveDraft(session.tenantId, session.pageSlug, debouncedChange, pageName, token)
      .then(() => syncDirty(false))
      .catch(err => {
        if (err instanceof SessionExpiredError) {
          setSessionExpired(true)
          return
        }
        console.warn('Auto-save failed:', err.message)
      })
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
      if (err instanceof SessionExpiredError) {
        setSessionExpired(true)
        return
      }
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

  // Puck uses several of these override slots (components, preview) as real
  // component types, not just plain render functions — a fresh object/inline-
  // function literal on every render gives each of those slots a new identity
  // every time, which makes Puck remount them (confirmed live: this is why
  // "Add Elements" originally bounced straight back to Fields, by wiping
  // PanelModeSync's tracking state on every remount). Memoizing the whole
  // overrides object here fixes the class of bug, not just one instance —
  // `preview` below renders WhatsAppWidget's sibling components, which hold
  // no state of their own, but it sits right next to `components`, which does
  // need to stay identity-stable.
  //
  // MUST be declared here, before the early `status` returns below — not
  // after them. A hook that only runs once `status === 'ready'` is called on
  // some renders and not others, which is a Rules-of-Hooks violation React
  // treats as fatal (confirmed live: this exact ordering mistake, in an
  // earlier version of this change, was what actually blanked the editor —
  // not the canvas/zoom risk that prompted asking first).
  const puckOverrides = useMemo(() => ({
    iframe: PuckIframeZoom,
    // AnnouncementBar/SiteHeader/SiteFooter used to render as page-level
    // siblings around <Puck>, entirely outside its scrollable canvas — which
    // gave the editor two independent scrollbars (the outer page, and Puck's
    // own fixed-height canvas), and no way to reach SiteFooter by scrolling
    // the canvas at all. Rendering them here instead — inside Puck's own
    // `preview` slot, which sits alongside the actual page iframe within its
    // existing (unmodified) scrollable canvas container — makes Puck's single
    // existing canvas scrollbar the only one, and it now naturally reaches
    // the footer, without touching any of Puck's own canvas sizing/overflow
    // CSS (which its auto-zoom feature measures) — confirmed via source that
    // the zoom measurement targets a *different, unaffected* element.
    // WhatsAppWidget stays a page-level sibling below (not moved in here):
    // it's `position:fixed`, and Puck's canvas applies a CSS `transform` to
    // scale the preview for zoom — a `transform` on an ancestor hijacks
    // `position:fixed` to be relative to *it* instead of the viewport, which
    // would visibly mis-place the button.
    preview: ({ children }: { children: ReactNode }) => (
      <>
        <AnnouncementBar settings={siteSettings} />
        <SiteHeader settings={siteSettings} />
        {children}
        <SiteFooter settings={siteSettings} />
      </>
    ),
    // The left panel's content when panelMode is 'blocks' — Puck's own
    // categorized component list, untouched. Pages/Site Settings/Themes
    // used to live here too, but this panel is hidden whenever fields
    // are showing (see the module-level comment on PanelModeSync above),
    // so those three moved to headerActions below, where they're always
    // reachable regardless of panel mode.
    components: ({ children }: { children: ReactNode }) => (
      <>
        <ProductFilterAutoWrap />
        <PanelModeSync onSelectionChange={handleSelectionChange} />
        {children}
      </>
    ),
    // Inject Pages/Site Settings/Themes, an "Add Elements" button back
    // to the block list, a "Templates" button, and an unsaved-changes
    // badge into the Puck header alongside the default actions. This
    // whole cluster lives in the header (not either side panel) because
    // it must stay reachable no matter which side panel is showing.
    headerActions: ({ children }: { children: ReactNode }) => (
      <>
        <button
          onClick={() => setPanelMode('blocks')}
          title="Show the elements list to add a new block"
          style={headerIconButtonStyle}
        >
          <span style={{ fontSize: 15 }}>➕</span> Add Elements
        </button>
        <button onClick={() => setPagesOpen(true)} title="Pages" style={headerIconButtonStyle}>
          <span style={{ fontSize: 15 }}>📄</span> Pages
        </button>
        <button onClick={() => setSiteSettingsOpen(true)} title="Site Settings" style={headerIconButtonStyle}>
          <span style={{ fontSize: 15 }}>⚙️</span> Site Settings
        </button>
        <button onClick={() => setThemesOpen(true)} title="Themes" style={headerIconButtonStyle}>
          <span style={{ fontSize: 15 }}>🎨</span> Themes
        </button>

        {/* Session-expiring-soon warning — fires 5 min before the JWT
            actually expires, so the blocking dialog (below) is a fallback,
                  not the first the user hears of it. */}
              {sessionExpiringSoon && !sessionExpired && (
                <span
                  title="Reload the editor soon to avoid losing changes"
            style={{
              padding: '4px 10px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              lineHeight: 1,
            }}
          >
            ⏳ Session expiring soon — save your work
          </span>
        )}

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
  }), [
    siteSettings, handleSelectionChange,
    sessionExpiringSoon, sessionExpired, isDirty, liveUrl, tm.openSelector,
    setPanelMode, setPagesOpen, setSiteSettingsOpen, setThemesOpen,
  ])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return <div className="loading-screen"><span>Loading editor…</span></div>
  }
  if (status === 'error') {
    if (sessionExpired) {
      return <SessionExpiredDialog onReload={reloadForFreshSession} />
    }
    return <div className="error-screen"><span>⚠ {errorMsg}</span></div>
  }

  return (
    <>
      <div data-puck-panel={panelMode}>
        <Puck
          key={editorKey}
          config={puckConfig}
          data={puckData}
          ui={INITIAL_PUCK_UI}
          headerTitle={pageName}
          onPublish={handlePublish}
          onChange={handleChange}
          overrides={puckOverrides}
        />
      </div>
      {/* position:fixed — must stay outside Puck's canvas, see puckOverrides above */}
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

      {/* Themes panel (🎨 Themes, top of the Blocks panel) — whole-site Theme
          Manager themes, distinct from the per-page Templates modal above. */}
      {themesOpen && session && (
        <ThemesPanel
          tenantId={session.tenantId}
          token={token}
          onClose={() => setThemesOpen(false)}
          onApplied={() => window.location.reload()}
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

      {/* Session-expired dialog — takes over from the exit dialog above once
          the JWT is dead, since neither Save nor Publish can succeed any more. */}
      {sessionExpired && <SessionExpiredDialog onReload={reloadForFreshSession} />}

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
