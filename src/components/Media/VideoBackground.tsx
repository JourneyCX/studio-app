import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { VideoUploadField } from '../shared/VideoUploadField'
import { ColorField } from '../shared/ColorField'

export type VideoBackgroundProps = {
  videoType: 'mp4' | 'youtube'
  videoUrl: string
  fallbackImage: string
  overlayColor: string
  overlayOpacity: number
  minHeight: number
  headline: string
  subheadline: string
  primaryButtonText: string
  primaryButtonUrl: string
  primaryButtonColor: string
  secondaryButtonText: string
  secondaryButtonUrl: string
  textAlign: 'left' | 'center'
  showMuteToggle: boolean
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]+)/)
  return match ? match[1] : ''
}

export const VideoBackground: ComponentConfig<VideoBackgroundProps> = {
  label: 'Video Background',
  fields: {
    videoType:           { type: 'select',   label: 'Video Source', options: [{ label: 'Direct MP4 URL', value: 'mp4' }, { label: 'YouTube', value: 'youtube' }] },
    videoUrl:            { type: 'custom',   label: 'Video URL (paste an MP4/YouTube link, or upload an MP4 below)', render: ({ value, onChange }) => <VideoUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    fallbackImage:       { type: 'custom',   label: 'Fallback Image (shown when no video)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayColor:        { type: 'custom',   label: 'Overlay Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:      { type: 'number',   label: 'Overlay Opacity (0–100)' },
    minHeight:           { type: 'number',   label: 'Min Height (px)' },
    headline:            { type: 'text',     label: 'Headline' },
    subheadline:         { type: 'textarea', label: 'Subheadline' },
    primaryButtonText:   { type: 'text',     label: 'Primary Button Text' },
    primaryButtonUrl:    { type: 'text',     label: 'Primary Button URL' },
    primaryButtonColor:  { type: 'custom',   label: 'Primary Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    secondaryButtonText: { type: 'text',     label: 'Secondary Button Text' },
    secondaryButtonUrl:  { type: 'text',     label: 'Secondary Button URL' },
    textAlign:           { type: 'select',   label: 'Content Alignment', options: [{ label: 'Centre', value: 'center' }, { label: 'Left', value: 'left' }] },
    showMuteToggle:      { type: 'radio',    label: 'Show Mute Toggle (MP4 only)', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    videoType:           'mp4',
    videoUrl:            '',
    fallbackImage:       '',
    overlayColor:        '#000000',
    overlayOpacity:      50,
    minHeight:           560,
    headline:            'Experience the Difference',
    subheadline:         'High-quality products, delivered with care.',
    primaryButtonText:   'Shop Now',
    primaryButtonUrl:    '/shop',
    primaryButtonColor:  '#ffffff',
    secondaryButtonText: 'Learn More',
    secondaryButtonUrl:  '/about',
    textAlign:           'center',
    showMuteToggle:      true,
  },
  render({ videoType, videoUrl, fallbackImage, overlayColor, overlayOpacity, minHeight, headline, subheadline, primaryButtonText, primaryButtonUrl, primaryButtonColor, secondaryButtonText, secondaryButtonUrl, textAlign, showMuteToggle: _showMuteToggle }) {
    // showMuteToggle is accepted for schema parity with stored puck_json (and with the
    // storefront Vue renderer) but not yet wired to actual mute control — the <video>
    // element below is unconditionally muted. Wire this up if/when real audio control
    // is needed; until then it intentionally has no visual effect in either renderer.
    const hasVideo  = !!videoUrl
    const ytId      = videoType === 'youtube' ? getYouTubeId(videoUrl) : ''
    const hasYt     = videoType === 'youtube' && !!ytId
    const hasMp4    = videoType === 'mp4' && !!videoUrl
    const hasFallback = !!fallbackImage

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return isNaN(r) ? '0,0,0' : `${r},${g},${b}`
    }

    return (
      <div
        style={{
          position: 'relative',
          minHeight,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Background layer */}
        {hasMp4 && (
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}

        {hasYt && (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3`}
            allow="autoplay; fullscreen"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', transform: 'scale(1.1)' }}
          />
        )}

        {!hasVideo && hasFallback && (
          <img src={fallbackImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {!hasVideo && !hasFallback && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(139,92,246,0.1) 0%, transparent 50%)' }} />
          </div>
        )}

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(${hexToRgb(overlayColor)},${overlayOpacity / 100})` }} />

        {/* No-video notice in editor */}
        {!hasVideo && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '6px 12px', borderRadius: 6, zIndex: 2 }}>
            📹 Add a Video URL in the panel
          </div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: textAlign === 'center' ? 700 : 580, padding: '64px 40px', textAlign }}>
          {headline && (
            <h1 style={{ color: '#fff', fontSize: 52, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              {headline}
            </h1>
          )}
          {subheadline && (
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 19, margin: '0 0 40px', lineHeight: 1.65, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>
              {subheadline}
            </p>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: textAlign === 'center' ? 'center' : 'flex-start' }}>
            {primaryButtonText && (
              <a href={primaryButtonUrl} style={{ display: 'inline-block', backgroundColor: primaryButtonColor, color: primaryButtonColor === '#ffffff' || primaryButtonColor === '#fff' ? '#1e293b' : '#fff', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a href={secondaryButtonUrl} style={{ display: 'inline-block', backgroundColor: 'transparent', color: '#fff', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16, border: '2px solid rgba(255,255,255,0.5)' }}>
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </div>
    )
  },
}
