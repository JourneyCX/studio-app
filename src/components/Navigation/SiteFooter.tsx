// Header/Footer are no longer Puck page components — they're fixed chrome rendered
// in App.tsx around <Puck>, sourced from one sb_site_settings row per tenant instead
// of per-page puck_json. See docs/site_settings_architecture_investigation.md.
import type { SiteSettings } from '../../lib/siteSettings'

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📷',
  facebook: '📘',
  pinterest: '📌',
  twitter: '🐦',
  x: '✕',
  tiktok: '🎵',
  youtube: '▶️',
  linkedin: '💼',
}

function socialIcon(platform: string): string {
  return SOCIAL_ICONS[(platform || '').toLowerCase()] ?? (platform || '🔗')
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const bg     = settings.footerBackgroundColor || '#1a202c'
  const fg     = settings.footerTextColor || '#a0aec0'
  const accent = settings.footerAccentColor || '#ffffff'
  const hasColumns     = (settings.footerColumns ?? []).length > 0
  const hasSocialLinks = (settings.socialLinks ?? []).length > 0
  const hasBrandBlock  = Boolean(settings.businessName || settings.tagline)
  const hasContact     = Boolean(settings.contactPhone || settings.contactEmail || settings.contactAddress)
  const showRichRow    = hasBrandBlock || hasColumns || hasSocialLinks

  return (
    <footer style={{ backgroundColor: bg, color: fg, padding: '32px 24px', textAlign: 'center', zoom: 1.25 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {showRichRow && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 32,
              textAlign: 'left',
              paddingBottom: 24,
              marginBottom: 24,
              borderBottom: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {hasBrandBlock && (
              <div>
                {settings.businessName && <div style={{ fontSize: 18, fontWeight: 700, color: fg }}>{settings.businessName}</div>}
                {settings.tagline && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{settings.tagline}</div>}
                {hasContact && (
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 10, lineHeight: 1.6 }}>
                    {settings.contactAddress && <div>{settings.contactAddress}</div>}
                    {settings.contactPhone && <div>{settings.contactPhone}</div>}
                    {settings.contactEmail && <div>{settings.contactEmail}</div>}
                  </div>
                )}
              </div>
            )}
            {(settings.footerColumns ?? []).map((col, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, marginBottom: 10, color: accent }}>{col.heading}</div>
                {(col.links ?? []).map((link, j) => (
                  <a
                    key={j}
                    href={link.url}
                    style={{ display: 'block', marginBottom: 6, fontSize: 13, opacity: 0.85, textDecoration: 'none', color: fg }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
            {hasSocialLinks && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {(settings.socialLinks ?? []).map((social, i) => (
                  <a key={i} href={social.url} style={{ fontSize: 18, textDecoration: 'none', color: fg }} title={social.platform}>
                    {socialIcon(social.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 14 }}>{settings.footerCopyrightText || '© My Store'}</p>
      </div>
    </footer>
  )
}
