import { useEffect, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

export type SocialFeedProps = {
  platform: 'instagram' | 'twitter' | 'tiktok' | 'facebook'
  username: string
  twitterTimelineHeight: number
  tiktokVideoUrl: string
  facebookPageUrl: string
  facebookHeight: number
  instagramColumns: 2 | 3 | 4
  instagramCount: number
  headline: string
  showFollowButton: boolean
  backgroundColor: string
  textColor: string
  accentColor: string
  borderRadius: number
}

const IG_COLORS = ['#fde68a','#bfdbfe','#bbf7d0','#fecdd3','#ddd6fe','#fed7aa','#a5f3fc','#fbcfe8','#d9f99d']

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  )
}

function TwitterEmbed({ username, height, textColor, accentColor }: { username: string; height: number; textColor: string; accentColor: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!username || !containerRef.current) return

    containerRef.current.innerHTML = `<a class="twitter-timeline" data-height="${height}" data-theme="light" href="https://twitter.com/${username}?ref_src=twsrc%5Etfw">Tweets by @${username}</a>`

    const existing = document.getElementById('twitter-widget-script')
    if (existing) {
      // @ts-ignore
      if (window.twttr?.widgets) window.twttr.widgets.load(containerRef.current)
      return
    }
    const script    = document.createElement('script')
    script.id       = 'twitter-widget-script'
    script.src      = 'https://platform.twitter.com/widgets.js'
    script.async    = true
    script.charset  = 'utf-8'
    document.head.appendChild(script)
  }, [username, height])

  if (!username) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${textColor}30`, borderRadius: 12, color: textColor, opacity: 0.5 }}>
        <div style={{ color: accentColor, marginBottom: 12 }}><TwitterIcon /></div>
        <p style={{ margin: 0, fontSize: 14 }}>Enter a Twitter / X username in the panel</p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ minHeight: height }} />
}

function InstagramPlaceholder({ username, columns, count, accentColor, textColor, borderRadius }: { username: string; columns: number; count: number; accentColor: string; textColor: string; borderRadius: number }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1/1', backgroundColor: IG_COLORS[i % IG_COLORS.length], borderRadius: borderRadius / 3, overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, opacity: 0.4 }}>📷</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: accentColor + '10', borderRadius: 8, border: `1px dashed ${accentColor}44` }}>
        <p style={{ color: textColor, fontSize: 13, margin: 0, opacity: 0.7 }}>
          ℹ️ Instagram live feed requires the <strong>Instagram Basic Display API</strong> connected via your store settings. The grid above is a style preview.
          {username && <> Configure <strong>@{username}</strong> in Settings → Integrations.</>}
        </p>
      </div>
    </div>
  )
}

function TikTokEmbed({ videoUrl, borderRadius }: { videoUrl: string; borderRadius: number }) {
  const getId = (url: string) => {
    const m = url.match(/video\/(\d+)/) || url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
    return m ? m[1] : ''
  }
  const id = getId(videoUrl)

  if (!id) {
    return (
      <div style={{ height: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius, color: '#64748b' }}>
        <span style={{ fontSize: 36, marginBottom: 12 }}>🎵</span>
        <p style={{ margin: 0, fontSize: 14 }}>Paste a TikTok video URL in the panel</p>
        <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.6 }}>e.g. https://www.tiktok.com/@user/video/1234567890</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <iframe
        src={`https://www.tiktok.com/embed/v2/${id}`}
        allow="autoplay; fullscreen; picture-in-picture"
        style={{ width: 325, height: 580, border: 'none', borderRadius }}
      />
    </div>
  )
}

// Facebook's Page Plugin, embedded via its plain iframe endpoint — no App ID,
// JS SDK, or Graph API access required, same free-and-credential-less pattern
// as the Twitter/TikTok embeds above. Only works for Pages, not personal profiles.
function FacebookEmbed({ pageUrl, height, borderRadius }: { pageUrl: string; height: number; borderRadius: number }) {
  if (!pageUrl) {
    return (
      <div style={{ height: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius, color: '#64748b' }}>
        <div style={{ color: '#1877f2', marginBottom: 12 }}><FacebookIcon /></div>
        <p style={{ margin: 0, fontSize: 14 }}>Paste your Facebook Page URL in the panel</p>
        <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.6 }}>e.g. https://www.facebook.com/yourpage</p>
      </div>
    )
  }

  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=500&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <iframe
        src={src}
        style={{ border: 'none', overflow: 'hidden', width: '100%', maxWidth: 500, height, borderRadius }}
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    </div>
  )
}

export const SocialFeed: ComponentConfig<SocialFeedProps> = {
  label: 'Social Media Feed',
  fields: {
    platform:              { type: 'select', label: 'Platform', options: [{ label: 'Instagram (grid preview)', value: 'instagram' }, { label: 'Twitter / X (live timeline)', value: 'twitter' }, { label: 'TikTok (video embed)', value: 'tiktok' }, { label: 'Facebook (Page timeline)', value: 'facebook' }] },
    username:              { type: 'text',   label: 'Username (without @)' },
    twitterTimelineHeight: { type: 'number', label: 'Twitter Timeline Height (px)' },
    tiktokVideoUrl:        { type: 'text',   label: 'TikTok Video URL' },
    facebookPageUrl:       { type: 'text',   label: 'Facebook Page URL' },
    facebookHeight:        { type: 'number', label: 'Facebook Timeline Height (px)' },
    instagramColumns:      { type: 'select', label: 'Instagram Grid Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }] },
    instagramCount:        { type: 'number', label: 'Instagram Preview Cells' },
    headline:              { type: 'text',   label: 'Section Headline' },
    showFollowButton:      { type: 'radio',  label: 'Show Follow Button', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor:       { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:             { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:           { type: 'custom', label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius:          { type: 'number', label: 'Border Radius (px)' },
  },
  defaultProps: {
    platform:              'instagram',
    username:              '',
    twitterTimelineHeight: 480,
    tiktokVideoUrl:        '',
    facebookPageUrl:       '',
    facebookHeight:        500,
    instagramColumns:      3,
    instagramCount:        9,
    headline:              'Follow Us',
    showFollowButton:      true,
    backgroundColor:       '#ffffff',
    textColor:             '#1e293b',
    accentColor:           '#e1306c',
    borderRadius:          12,
  },
  render({ platform, username, twitterTimelineHeight, tiktokVideoUrl, facebookPageUrl, facebookHeight, instagramColumns, instagramCount, headline, showFollowButton, backgroundColor, textColor, accentColor, borderRadius }) {
    const platformLinks: Record<string, string> = { instagram: 'https://instagram.com/', twitter: 'https://twitter.com/', tiktok: 'https://tiktok.com/@' }
    const platformIcons: Record<string, React.ReactNode> = { instagram: <InstagramIcon />, twitter: <TwitterIcon />, tiktok: <span style={{ fontSize: 18 }}>🎵</span>, facebook: <FacebookIcon /> }
    const platformColors: Record<string, string> = { instagram: '#e1306c', twitter: '#000', tiktok: '#ff0050', facebook: '#1877f2' }
    const brandColor = platformColors[platform] || accentColor

    // Facebook has no bare "username" of its own here — the follow button
    // links straight to the configured Page URL instead of platformLinks+username.
    const followHref  = platform === 'facebook' ? facebookPageUrl : (username ? `${platformLinks[platform]}${username}` : '')
    const followLabel = platform === 'facebook' ? 'Follow on Facebook' : `Follow @${username}`

    return (
      <section style={{ backgroundColor, padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {(headline || showFollowButton) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
              {headline && <h2 style={{ color: textColor, fontSize: 28, fontWeight: 800, margin: 0 }}>{headline}</h2>}
              {showFollowButton && followHref && (
                <a
                  href={followHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: brandColor, color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
                >
                  <span style={{ color: '#fff' }}>{platformIcons[platform]}</span>
                  {followLabel}
                </a>
              )}
            </div>
          )}

          {platform === 'instagram' && <InstagramPlaceholder username={username} columns={instagramColumns} count={instagramCount} accentColor={accentColor} textColor={textColor} borderRadius={borderRadius} />}
          {platform === 'twitter'   && <TwitterEmbed username={username} height={twitterTimelineHeight} textColor={textColor} accentColor={accentColor} />}
          {platform === 'tiktok'    && <TikTokEmbed videoUrl={tiktokVideoUrl} borderRadius={borderRadius} />}
          {platform === 'facebook'  && <FacebookEmbed pageUrl={facebookPageUrl} height={facebookHeight} borderRadius={borderRadius} />}
        </div>
      </section>
    )
  },
}
