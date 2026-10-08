import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { VideoUploadField } from '../shared/VideoUploadField'

export type VideoTextMaskProps = {
  videoType: 'mp4' | 'youtube'
  videoUrl: string
  fallbackImage: string
  text: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  textTransform: 'none' | 'uppercase'
  textAlign: 'left' | 'center' | 'right'
  minHeight: number
  surround: 'light' | 'dark'
  linkUrl: string
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]+)/)
  return match ? match[1] : ''
}

// Knockout text: the video (or image) is only visible through the letters, the area around
// them is solid white (or black). Done with blend modes, not background-clip, so the video
// keeps playing: a white layer with black text and mix-blend-mode:screen shows the video
// wherever the text is black and stays white everywhere else; a black layer with white text
// and mix-blend-mode:multiply does the same on a dark surround.
// Keep in sync with nuxt-storefront/components/storefront/VideoTextMask.vue.
export const VideoTextMask: ComponentConfig<VideoTextMaskProps> = {
  label: 'Video Text (Knockout)',
  fields: {
    videoType:     { type: 'select', label: 'Video Source', options: [{ label: 'Direct MP4 URL', value: 'mp4' }, { label: 'YouTube', value: 'youtube' }] },
    videoUrl:      { type: 'custom', label: 'Video URL (paste an MP4/YouTube link, or upload an MP4 below)', render: ({ value, onChange }) => <VideoUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    fallbackImage: { type: 'custom', label: 'Fallback Image (shown when no video)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    text:          { type: 'text',   label: 'Text (short and bold works best)' },
    fontSize:      { type: 'number', label: 'Font Size (px, desktop — shrinks on narrow screens)' },
    fontWeight:    { type: 'select', label: 'Font Weight', options: [{ label: 'Bold (700)', value: 700 }, { label: 'Extra Bold (800)', value: 800 }, { label: 'Black (900)', value: 900 }] },
    letterSpacing: { type: 'number', label: 'Letter Spacing (px)' },
    textTransform: { type: 'radio',  label: 'Capitalisation', options: [{ label: 'As typed', value: 'none' }, { label: 'UPPERCASE', value: 'uppercase' }] },
    textAlign:     { type: 'select', label: 'Alignment', options: [{ label: 'Centre', value: 'center' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
    minHeight:     { type: 'number', label: 'Min Height (px)' },
    surround:      { type: 'radio',  label: 'Area around the letters', options: [{ label: 'White', value: 'light' }, { label: 'Black', value: 'dark' }] },
    linkUrl:       { type: 'text',   label: 'Link URL (optional)' },
  },
  defaultProps: {
    videoType:     'mp4',
    videoUrl:      '',
    fallbackImage: '',
    text:          'DROP',
    fontSize:      240,
    fontWeight:    900,
    letterSpacing: 0,
    textTransform: 'uppercase',
    textAlign:     'center',
    minHeight:     320,
    surround:      'light',
    linkUrl:       '',
  },
  render({ videoType, videoUrl, fallbackImage, text, fontSize, fontWeight, letterSpacing, textTransform, textAlign, minHeight, surround, linkUrl }) {
    const ytId   = videoType === 'youtube' ? getYouTubeId(videoUrl) : ''
    const hasYt  = videoType === 'youtube' && !!ytId
    const hasMp4 = videoType === 'mp4' && !!videoUrl
    const light  = surround !== 'dark'
    const size   = fontSize || 240
    // min(): the px size on desktop, scaled by viewport width below ~1280px so it fits a phone.
    const fontSizeCss = `min(${size}px, ${(size / 12.8).toFixed(2)}vw)`
    const justify = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'

    const inner = (
      <div style={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', minHeight: minHeight || 320, backgroundColor: light ? '#fff' : '#000' }}>
        {hasMp4 && (
          <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        {hasYt && (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3`}
            allow="autoplay; fullscreen"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', transform: 'scale(1.5)', pointerEvents: 'none' }}
          />
        )}
        {!hasMp4 && !hasYt && fallbackImage && (
          <img src={fallbackImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {!hasMp4 && !hasYt && !fallbackImage && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f97316 0%, #be123c 50%, #1e1b4b 100%)' }} />
        )}

        {/* The mask: solid surround + text in the opposite tone, blended onto the video. */}
        <div
          role="img"
          aria-label={text}
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: justify,
            backgroundColor: light ? '#fff' : '#000',
            color: light ? '#000' : '#fff',
            mixBlendMode: light ? 'screen' : 'multiply',
            fontSize: fontSizeCss, fontWeight, letterSpacing: `${letterSpacing || 0}px`, textTransform,
            lineHeight: 1, textAlign, padding: '0 2%', overflow: 'hidden',
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        </div>

        {!hasMp4 && !hasYt && !fallbackImage && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, padding: '4px 10px', borderRadius: 6, zIndex: 2 }}>
            📹 Add a Video URL in the panel
          </div>
        )}
      </div>
    )

    return linkUrl ? <a href={linkUrl} style={{ display: 'block', textDecoration: 'none' }}>{inner}</a> : inner
  },
}
