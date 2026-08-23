import type { SiteSettings } from '../../lib/siteSettings'

// Site-wide notice bar rendered above SiteHeader — same chrome pattern as
// SiteHeader/SiteFooter/WhatsAppWidget (sourced from sb_site_settings, live-ported
// to nuxt-storefront's own AnnouncementBar.vue). 'static' renders the message once,
// centered; 'scroll' runs it as a continuous marquee via CSS keyframes. announcementSpeed
// is seconds per full loop (lower = faster). Renders null when disabled or no message is
// set, so an opted-out tenant sees no change/no reserved space at all.
//
// The message is repeated REPEAT_COUNT times per half-track (not just duplicated once)
// so the animated track is comfortably wider than the viewport regardless of message
// length -- a single short message (e.g. "Test") centered and translated by only its
// own narrow width drifts just a few px over a full loop, which reads as static, not
// scrolling. Repeating fills the bar edge-to-edge and makes the translateX(-50%) sweep
// (still exactly one half-track width, so the loop stays seamless) span real distance.
const REPEAT_COUNT = 6

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

  const repeated = (ariaHidden: boolean) => (
    <span style={{ display: 'inline-flex' }} aria-hidden={ariaHidden || undefined}>
      {Array.from({ length: REPEAT_COUNT }).map((_, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', paddingRight: 64 }}>{inner}</span>
      ))}
    </span>
  )

  return (
    <div
      style={{
        backgroundColor: bg,
        color: text,
        fontSize: 13,
        fontWeight: 500,
        padding: isScroll ? '10px 0' : '10px 16px',
        textAlign: isScroll ? 'left' : 'center',
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
          {repeated(false)}
          {repeated(true)}
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
