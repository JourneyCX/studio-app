import type { SiteSettings } from '../../lib/siteSettings'

// Site-wide notice bar rendered above SiteHeader — same chrome pattern as
// SiteHeader/SiteFooter/WhatsAppWidget (sourced from sb_site_settings, live-ported
// to nuxt-storefront's own AnnouncementBar.vue). 'static' renders the message once,
// centered; 'scroll' runs it as a continuous marquee via CSS keyframes, duplicating
// the message so the loop has no visible seam. announcementSpeed is seconds per
// full loop (lower = faster). Renders null when disabled or no message is set, so
// an opted-out tenant sees no change/no reserved space at all.
export function AnnouncementBar({ settings }: { settings: SiteSettings }) {
  if (!settings.announcementEnabled || !settings.announcementMessage) {
    return null
  }

  const bg   = settings.announcementBgColor || '#dc2626'
  const text = settings.announcementTextColor || '#ffffff'
  const speed = Math.max(settings.announcementSpeed || 20, 5)
  const message = settings.announcementMessage
  const isScroll = settings.announcementMode === 'scroll'

  const content = (
    <>
      <span>{message}</span>
      {settings.announcementLinkUrl && <span aria-hidden="true" style={{ marginLeft: 8 }}>&rarr;</span>}
    </>
  )

  const inner = settings.announcementLinkUrl ? (
    <a href={settings.announcementLinkUrl} style={{ color: text, textDecoration: 'none' }}>
      {content}
    </a>
  ) : (
    <span style={{ color: text }}>{content}</span>
  )

  return (
    <div
      style={{
        backgroundColor: bg,
        color: text,
        fontSize: 13,
        fontWeight: 500,
        padding: isScroll ? '10px 0' : '10px 16px',
        textAlign: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {isScroll ? (
        <div
          style={{
            display: 'inline-flex',
            animation: `announcement-marquee ${speed}s linear infinite`,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', paddingRight: 48 }}>{inner}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', paddingRight: 48 }} aria-hidden="true">{inner}</span>
        </div>
      ) : (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{inner}</div>
      )}
      {isScroll && (
        <style>{`
          @keyframes announcement-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      )}
    </div>
  )
}
