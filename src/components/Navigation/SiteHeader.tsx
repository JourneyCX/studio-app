// Header/Footer are no longer Puck page components — they're fixed chrome rendered
// in App.tsx around <Puck>, sourced from one sb_site_settings row per tenant instead
// of per-page puck_json. See docs/site_settings_architecture_investigation.md.
import { useState } from 'react'
import type { SiteSettings } from '../../lib/siteSettings'

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const bg     = settings.headerBackgroundColor || '#ffffff'
  const fg     = settings.headerTextColor || '#1a202c'
  const accent = settings.headerAccentColor || fg

  const navLinks = settings.navLinks ?? []

  // Mobile nav panel open/closed, and which top-level links (by index) have
  // their children expanded — a tap-to-expand accordion, since the desktop
  // dropdown below is :hover-driven and doesn't work on touch at all.
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpanded = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <header
      style={{
        backgroundColor: bg,
        color: fg,
        position: settings.headerSticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        // Matches the body{zoom:1.25} rule on the live storefront (this chrome
        // renders outside Puck's own preview iframe, so it needs its own zoom
        // to stay visually in sync with what the merchant sees live).
        zoom: 1.25,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt={settings.logoAlt || 'Store logo'} style={{ height: settings.headerLogoHeight || 40, objectFit: 'contain' }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: fg }}>{settings.logoText || settings.businessName || 'Your Store'}</span>
          }
        </div>

        {/* Desktop nav — unchanged hover-dropdown behavior, hidden below the
            mobile breakpoint (styles/responsive.css). Wrapped in a plain div
            with no inline `display` of its own so .sb-nav-desktop-only's
            block/none toggle isn't fighting the nav's own `display:flex`. */}
        <div className="sb-nav-desktop-only">
          <nav style={{ display: 'flex', gap: 28 }}>
            {navLinks.map((link, i) => {
              const hasChildren = (link.children?.length ?? 0) > 0
              return (
                <div key={i} style={{ position: 'relative' }} className="sb-nav-item">
                  <a href={link.url} style={{ color: fg, textDecoration: 'none', fontSize: 15, fontWeight: 500, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                    {link.label}
                    {hasChildren && <span style={{ fontSize: 10 }}>▾</span>}
                  </a>
                  {hasChildren && (
                    // Outer wrapper starts flush at top:100% (no gap) and uses padding-top
                    // instead of margin-top for the visual offset, so the hoverable area is
                    // contiguous from the link down through to the dropdown box — a margin-top
                    // gap here breaks :hover the moment the pointer crosses it.
                    <div
                      className="sb-nav-dropdown"
                      style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 8, display: 'none', zIndex: 200 }}
                    >
                      <div
                        style={{
                          backgroundColor: '#fff', color: '#1a202c', minWidth: 160,
                          borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                          padding: '6px 0',
                        }}
                      >
                        {link.children!.map((child, j) => (
                          <a key={j} href={child.url} style={{ display: 'block', padding: '8px 14px', color: '#1a202c', textDecoration: 'none', fontSize: 14 }}>
                            {child.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <style>{`.sb-nav-item:hover .sb-nav-dropdown { display: block !important; }`}</style>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {settings.headerCtaText && (
            <a
              href={settings.headerCtaUrl || '#'}
              className="sb-nav-desktop-only"
              style={{
                backgroundColor: accent,
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {settings.headerCtaText}
            </a>
          )}
          <span style={{ fontSize: 22, cursor: 'pointer' }}>🛒</span>
          {navLinks.length > 0 && (
            <button
              type="button"
              className="sb-nav-mobile-only"
              onClick={() => setMobileOpen(open => !open)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: fg, padding: 4, lineHeight: 1 }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav panel — a stacked list, not a hover dropdown, so
          multi-level links use tap-to-expand instead of a :hover pattern
          that has no equivalent on touch. */}
      {mobileOpen && (
        <nav className="sb-nav-mobile-only" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          {navLinks.map((link, i) => {
            const hasChildren = (link.children?.length ?? 0) > 0
            const isExpanded = expanded.has(i)
            return (
              <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <a
                    href={link.url}
                    onClick={() => setMobileOpen(false)}
                    style={{ flex: 1, padding: '14px 24px', color: fg, textDecoration: 'none', fontSize: 16, fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {link.label}
                  </a>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(i)}
                      aria-label={isExpanded ? `Collapse ${link.label}` : `Expand ${link.label}`}
                      aria-expanded={isExpanded}
                      style={{ background: 'none', border: 'none', padding: '14px 24px', cursor: 'pointer', fontSize: 14, color: fg }}
                    >
                      {isExpanded ? '▴' : '▾'}
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div style={{ paddingBottom: 8 }}>
                    {link.children!.map((child, j) => (
                      <a
                        key={j}
                        href={child.url}
                        onClick={() => setMobileOpen(false)}
                        style={{ display: 'block', padding: '10px 24px 10px 40px', color: fg, opacity: 0.85, textDecoration: 'none', fontSize: 15 }}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}
    </header>
  )
}
