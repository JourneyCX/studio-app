import { useEffect, useState } from 'react'
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

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

// announcement_countdown_end round-trips through a MySQL DATETIME column, which comes
// back as a naive "YYYY-MM-DD HH:mm:ss" string (no timezone) -- new Date() parses that
// space-separated form as LOCAL time in whichever runtime evaluates it, not UTC, which
// silently shifts the countdown by the local UTC offset (and can even flip it "done"
// early). The value is always UTC by convention here (studio-app's own picker converts
// via toISOString() before saving), so force it to be read as UTC unless it already
// carries an explicit offset.
function toUtcIso(target: string): string {
  return /Z$|[+-]\d{2}:?\d{2}$/.test(target) ? target : `${target.replace(' ', 'T')}Z`
}

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(toUtcIso(target)).getTime() - Date.now()
  if (isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

// Ticks every second while a countdown target is set — mirrors Media/CountdownTimer's
// getTimeLeft()/setInterval pattern, kept as a separate small copy rather than a shared
// import since that component is a full Puck section (card/neon/bar styles, CTA button)
// and this bar is unrelated site chrome with its own simpler render path.
function CountdownDisplay({ target, textColor }: { target: string; textColor: string }) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(target))

  useEffect(() => {
    setTime(getTimeLeft(target))
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const done = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0
  if (done) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        fontSize: 13, fontWeight: 700, color: textColor, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{pad(time.days)} Days</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>:</span>
      <span>{pad(time.hours)} Hours</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>:</span>
      <span>{pad(time.minutes)} Mins</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>:</span>
      <span>{pad(time.seconds)} Sec</span>
    </div>
  )
}

export function AnnouncementBar({ settings }: { settings: SiteSettings }) {
  if (!settings.announcementEnabled || !settings.announcementMessage) {
    return null
  }

  const bg   = settings.announcementBgColor || '#dc2626'
  const text = settings.announcementTextColor || '#ffffff'
  const speed = Math.max(settings.announcementSpeed || 20, 5)
  const message = settings.announcementMessage
  const isScroll = settings.announcementMode === 'scroll'
  const showCountdown = settings.announcementShowCountdown && !!settings.announcementCountdownEnd

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
        padding: isScroll && !showCountdown ? '10px 0' : '10px 16px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isScroll ? 'flex-start' : 'center',
          gap: 16,
          flexWrap: isScroll ? 'nowrap' : 'wrap',
        }}
      >
        {isScroll ? (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ display: 'inline-flex', animation: `announcement-marquee ${speed}s linear infinite` }}>
              {repeated(false)}
              {repeated(true)}
            </div>
          </div>
        ) : (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inner}</div>
        )}
        {showCountdown && (
          <CountdownDisplay target={settings.announcementCountdownEnd as string} textColor={text} />
        )}
      </div>
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
