// Header/Footer are no longer Puck page components — they're fixed chrome rendered
// in App.tsx around <Puck>, sourced from one sb_site_settings row per tenant instead
// of per-page puck_json. See docs/site_settings_architecture_investigation.md.
import type { SiteSettings } from '../../lib/siteSettings'

// Brand mark paths (viewBox 0 0 24 24), keyed by platform. Kept in sync with
// nuxt-storefront's SiteFooter.vue.
const SOCIAL_ICON_PATHS: Record<string, string> = {
  facebook: 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z',
  instagram: 'M12 0C8.741 0 8.332.014 7.052.072 2.695.272.272 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.354 2.618 6.782 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 1 0 12.324 6.162 6.162 0 0 1 0-12.324zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6.406-11.845a1.44 1.44 0 1 1 0 2.881 1.44 1.44 0 0 1 0-2.881z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z',
  tiktok: 'M16.6 5.82c-.9-.87-1.47-2.06-1.6-3.35V2h-3.5v13.4a2.72 2.72 0 1 1-1.92-2.6V9.2a6.22 6.22 0 1 0 5.42 6.17V9.01a9.14 9.14 0 0 0 4.94 1.44V6.95a5.86 5.86 0 0 1-3.3-1.13z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 1 1 0-4.128 2.064 2.064 0 0 1 0 4.128zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  pinterest: 'M12 0a12 12 0 0 0-4.373 23.178c-.035-.947-.007-2.086.235-3.117.259-1.104 1.732-7.336 1.732-7.336s-.43-.86-.43-2.132c0-1.997 1.158-3.489 2.6-3.489 1.226 0 1.818.92 1.818 2.023 0 1.233-.784 3.075-1.19 4.782-.338 1.428.716 2.593 2.124 2.593 2.548 0 4.508-2.687 4.508-6.565 0-3.433-2.467-5.834-5.99-5.834-4.08 0-6.474 3.061-6.474 6.226 0 1.233.475 2.556 1.068 3.276.117.142.134.267.099.411-.109.451-.35 1.428-.398 1.627-.062.263-.206.319-.475.192-1.775-.826-2.884-3.421-2.884-5.507 0-4.485 3.259-8.604 9.394-8.604 4.933 0 8.766 3.516 8.766 8.216 0 4.9-3.09 8.847-7.38 8.847-1.44 0-2.797-.749-3.261-1.635 0 0-.712 2.717-.885 3.383-.321 1.235-1.189 2.782-1.771 3.726A12 12 0 1 0 12 0z',
}

// Free-text aliases a merchant might type into the "platform" field, normalized to the keys above.
const SOCIAL_ALIASES: Record<string, string> = {
  fb: 'facebook',
  ig: 'instagram',
  insta: 'instagram',
  twitter: 'x',
  'twitter/x': 'x',
  yt: 'youtube',
  li: 'linkedin',
}

function resolvedPlatform(platform: string): string {
  const key = (platform || '').trim().toLowerCase()
  return SOCIAL_ALIASES[key] ?? key
}

function SocialIcon({ platform }: { platform: string }) {
  const path = SOCIAL_ICON_PATHS[resolvedPlatform(platform)]
  if (path) {
    return (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
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
                  <a key={i} href={social.url} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: fg }} title={social.platform}>
                    <SocialIcon platform={social.platform} />
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
