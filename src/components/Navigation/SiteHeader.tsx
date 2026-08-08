// Header/Footer are no longer Puck page components — they're fixed chrome rendered
// in App.tsx around <Puck>, sourced from one sb_site_settings row per tenant instead
// of per-page puck_json. See docs/site_settings_architecture_investigation.md.
import type { SiteSettings } from '../../lib/siteSettings'

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const bg     = settings.headerBackgroundColor || '#ffffff'
  const fg     = settings.headerTextColor || '#1a202c'
  const accent = settings.headerAccentColor || fg

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
            ? <img src={settings.logoUrl} alt={settings.logoAlt || 'Store logo'} style={{ height: 40, objectFit: 'contain' }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: fg }}>{settings.logoText || settings.businessName || 'Your Store'}</span>
          }
        </div>
        <nav style={{ display: 'flex', gap: 28 }}>
          {(settings.navLinks ?? []).map((link, i) => (
            <a key={i} href={link.url} style={{ color: fg, textDecoration: 'none', fontSize: 15, fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}>
              {link.label}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {settings.headerCtaText && (
            <a
              href={settings.headerCtaUrl || '#'}
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
        </div>
      </div>
    </header>
  )
}
