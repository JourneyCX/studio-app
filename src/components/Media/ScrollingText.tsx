import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'
import { FONT_OPTIONS } from '../SiteSettings/FontsSection'

// Heavy display faces for big marquee headlines (the "YOUR WELLNESS" /
// "BEAUTIFY" look). Loaded, together with 700–900 weights of every
// FONT_OPTIONS family, by the second "display fonts" Google Fonts <link> in
// index.html — kept in sync with nuxt-storefront's nuxt.config.ts and
// ScrollingText.vue (which only consumes the stored CSS string, no list).
export const DISPLAY_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Anton (condensed, heavy)', value: "'Anton', sans-serif" },
  { label: 'Bebas Neue (condensed caps)', value: "'Bebas Neue', sans-serif" },
  { label: 'Archivo Black', value: "'Archivo Black', sans-serif" },
  { label: 'Unbounded (wide)', value: "'Unbounded', sans-serif" },
  { label: 'Syncopate (extra wide)', value: "'Syncopate', sans-serif" },
  { label: 'Jost (geometric)', value: "'Jost', sans-serif" },
]

export type ScrollingTextProps = {
  items: { text: string }[]
  separator: string
  // Optional uploaded icon/image used instead of the text separator. Sized in
  // em (percent of the text height) so it scales with the responsive font.
  separatorImage: string
  separatorImageSize: number
  fontFamily: string
  fontSize: number
  fontWeight: string
  uppercase: boolean
  letterSpacing: number
  textStyle: 'fill' | 'outline'
  textColor: string
  direction: 'left' | 'right'
  speed: number
  pauseOnHover: boolean
  // Legacy — no longer shown or read. The image now shows whenever one is
  // uploaded (an "Image mode" radio defaulting to colour hid freshly
  // uploaded images). Kept so pages saved with it still type-check.
  backgroundType?: 'color' | 'image'
  backgroundColor: string
  backgroundImage: string
  backgroundPosition: string
  overlayColor: string
  overlayOpacity: number
  minHeight: number
  paddingY: number
  verticalAlign: 'top' | 'center' | 'bottom'
  buttonText: string
  buttonUrl: string
  buttonBgColor: string
  buttonTextColor: string
}

function hexToRgb(hex: string): string {
  const r = parseInt((hex || '#000000').slice(1, 3), 16)
  const g = parseInt((hex || '#000000').slice(3, 5), 16)
  const b = parseInt((hex || '#000000').slice(5, 7), 16)
  return isNaN(r) ? '0,0,0' : `${r},${g},${b}`
}

// Font size scales down on narrower screens: full size at >=1440px wide,
// proportionally smaller below that, never under 28px. Mirrored in
// ScrollingText.vue.
function responsiveFontSize(px: number): string {
  const size = px > 0 ? px : 120
  return `max(28px, min(${size}px, ${(size / 14.4).toFixed(3)}vw))`
}

// Keyframes shift the track left by exactly one sequence width (a CSS var
// set from measurement), so the duplicated copy behind it lands exactly
// where the first started — a seamless loop. 'right' just plays it in
// reverse. Plain <style> in the component: it renders into whichever
// document the component lives in (Puck's canvas iframe or the live page).
const MARQUEE_CSS = `
@keyframes sb-marquee-scroll { from { transform: translate3d(0,0,0) } to { transform: translate3d(calc(-1 * var(--sb-mq-shift, 0px)),0,0) } }
.sb-marquee-track { display: flex; width: max-content; will-change: transform; animation: sb-marquee-scroll var(--sb-mq-duration, 30s) linear infinite; }
.sb-marquee[data-dir="right"] .sb-marquee-track { animation-direction: reverse; }
.sb-marquee[data-pause="1"]:hover .sb-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sb-marquee-track { animation: none; } }
`

export function ScrollingTextView(props: ScrollingTextProps) {
  const {
    items, separator, separatorImage, separatorImageSize, fontFamily, fontSize, fontWeight, uppercase, letterSpacing, textStyle, textColor,
    direction, speed, pauseOnHover, backgroundColor, backgroundImage, backgroundPosition,
    overlayColor, overlayOpacity, minHeight, paddingY, verticalAlign,
    buttonText, buttonUrl, buttonBgColor, buttonTextColor,
  } = props

  const outerRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef<HTMLDivElement>(null)
  const [seqWidth, setSeqWidth] = useState(0)
  const [copies, setCopies] = useState(2)

  const phrases = (items ?? []).map(i => i.text).filter(t => t && t.trim() !== '')
  const list = phrases.length ? phrases : ['Your text here']

  // Measure one sequence and the visible width; repeat enough copies that the
  // track always covers the screen with a full copy to spare. Uses the
  // element's own window (Puck canvas is an iframe — see ParallaxSection.tsx)
  // and re-measures on resize + when the webfont finishes loading.
  useEffect(() => {
    const outer = outerRef.current
    const seq = seqRef.current
    const win = outer?.ownerDocument.defaultView
    if (!outer || !seq || !win) return
    const measure = () => {
      const w = seq.getBoundingClientRect().width
      const vw = outer.getBoundingClientRect().width
      if (w > 0) {
        setSeqWidth(w)
        setCopies(Math.max(2, Math.ceil(vw / w) + 1))
      }
    }
    measure()
    const RO = (win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
    const ro = RO ? new RO(measure) : null
    ro?.observe(seq)
    ro?.observe(outer)
    outer.ownerDocument.fonts?.ready.then(measure).catch(() => {})
    return () => ro?.disconnect()
  }, [list.join('\u0000'), separator, separatorImage, separatorImageSize, fontFamily, fontSize, fontWeight, uppercase, letterSpacing])

  const pxPerSec = speed > 0 ? speed : 80
  const duration = seqWidth > 0 ? seqWidth / pxPerSec : 30

  const textCss: CSSProperties = {
    fontFamily: fontFamily || undefined,
    fontSize: responsiveFontSize(fontSize),
    fontWeight: (fontWeight || '800') as CSSProperties['fontWeight'],
    textTransform: uppercase ? 'uppercase' : 'none',
    letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
    lineHeight: 1.05,
    whiteSpace: 'nowrap',
    ...(textStyle === 'outline'
      ? { color: 'transparent', WebkitTextStroke: `2px ${textColor || '#000000'}` }
      : { color: textColor || '#000000' }),
  }

  const gap = '0.4em'
  const sequence = (key: number) => (
    <div key={key} ref={key === 0 ? seqRef : undefined} aria-hidden={key === 0 ? undefined : true} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {list.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ paddingRight: gap }}>{t}</span>
          {separatorImage
            ? <img src={separatorImage} alt="" style={{ height: `${(separatorImageSize > 0 ? separatorImageSize : 70) / 100}em`, width: 'auto', marginRight: gap, display: 'block', flexShrink: 0 }} />
            : separator ? <span style={{ paddingRight: gap }}>{separator}</span> : null}
        </span>
      ))}
    </div>
  )

  const isImage = !!backgroundImage

  return (
    <div
      ref={outerRef}
      className="sb-marquee"
      data-dir={direction === 'right' ? 'right' : 'left'}
      data-pause={pauseOnHover ? '1' : '0'}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: minHeight > 0 ? minHeight : undefined,
        padding: `${paddingY ?? 24}px 0`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
        backgroundColor: backgroundColor || (isImage ? '#1e293b' : 'transparent'),
      }}
    >
      <style>{MARQUEE_CSS}</style>
      {isImage && (
        <>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: backgroundPosition || 'center' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(${hexToRgb(overlayColor)},${(overlayOpacity ?? 0) / 100})` }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="sb-marquee-track"
          style={{
            ...textCss,
            ['--sb-mq-shift' as string]: `${seqWidth}px`,
            ['--sb-mq-duration' as string]: `${duration}s`,
          } as CSSProperties}
        >
          {Array.from({ length: copies }, (_, i) => sequence(i))}
        </div>
      </div>
      {buttonText && (
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 24 }}>
          <a
            href={buttonUrl || '#'}
            style={{ display: 'inline-block', padding: '14px 28px', borderRadius: 6, backgroundColor: buttonBgColor || '#ffffff', color: buttonTextColor || '#000000', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}
          >
            {buttonText}
          </a>
        </div>
      )}
    </div>
  )
}

export const ScrollingText: ComponentConfig<ScrollingTextProps> = {
  label: 'Scrolling Text Banner',
  fields: {
    items: {
      type: 'array',
      label: 'Phrases (repeat in a continuous loop)',
      arrayFields: { text: { type: 'text', label: 'Text' } },
      getItemSummary: (item) => item.text || 'Phrase',
    },
    separator:       { type: 'text', label: 'Separator between phrases (e.g. ✦ • — or leave blank)' },
    separatorImage:  { type: 'custom', label: 'Separator Image / Icon (optional — replaces the text separator; a transparent PNG or SVG works best)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    separatorImageSize: { type: 'number', label: 'Separator Image Size (% of text height, e.g. 70)' },
    fontFamily:      { type: 'select', label: 'Font', options: [{ label: 'Theme default', value: '' }, ...DISPLAY_FONT_OPTIONS, ...FONT_OPTIONS] },
    fontSize:        { type: 'number', label: 'Font Size (px, desktop — scales down on smaller screens; try 80–200)' },
    fontWeight:      { type: 'select', label: 'Font Weight', options: [{ label: 'Regular', value: '400' }, { label: 'Semi-bold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Extra bold', value: '800' }, { label: 'Black', value: '900' }] },
    uppercase:       { type: 'radio', label: 'All Caps', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    letterSpacing:   { type: 'number', label: 'Letter Spacing (px, can be negative)' },
    textStyle:       { type: 'radio', label: 'Text Style', options: [{ label: 'Solid', value: 'fill' }, { label: 'Outline only', value: 'outline' }] },
    textColor:       { type: 'custom', label: 'Text Colour', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    direction:       { type: 'radio', label: 'Scroll Direction', options: [{ label: 'Right to left', value: 'left' }, { label: 'Left to right', value: 'right' }] },
    speed:           { type: 'number', label: 'Speed (pixels per second — 40 slow, 80 medium, 150 fast)' },
    pauseOnHover:    { type: 'radio', label: 'Pause on Hover', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor: { type: 'custom', label: 'Background Colour (used when no image is set)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundImage: { type: 'custom', label: 'Background Image (optional — text scrolls in front of it; remove it to use the colour)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundPosition: { type: 'select', label: 'Image Focus', options: [{ label: 'Centre', value: 'center' }, { label: 'Top', value: 'top center' }, { label: 'Bottom', value: 'bottom center' }, { label: 'Left', value: 'center left' }, { label: 'Right', value: 'center right' }] },
    overlayColor:    { type: 'custom', label: 'Image Overlay Colour', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:  { type: 'number', label: 'Image Overlay Opacity (0–100 — darken the image so text stands out)' },
    minHeight:       { type: 'number', label: 'Section Height (px — 0 = fit the text; try 600+ with an image)' },
    paddingY:        { type: 'number', label: 'Top/Bottom Padding (px)' },
    verticalAlign:   { type: 'select', label: 'Text Vertical Position', options: [{ label: 'Top', value: 'top' }, { label: 'Centre', value: 'center' }, { label: 'Bottom', value: 'bottom' }] },
    buttonText:      { type: 'text', label: 'Button Text (optional — leave blank for no button)' },
    buttonUrl:       { type: 'text', label: 'Button Link' },
    buttonBgColor:   { type: 'custom', label: 'Button Colour', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    buttonTextColor: { type: 'custom', label: 'Button Text Colour', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    items: [{ text: 'Your wellness, our priority!' }],
    separator: '',
    separatorImage: '',
    separatorImageSize: 70,
    fontFamily: "'Unbounded', sans-serif",
    fontSize: 140,
    fontWeight: '800',
    uppercase: true,
    letterSpacing: 0,
    textStyle: 'fill',
    textColor: '#111111',
    direction: 'left',
    speed: 80,
    pauseOnHover: false,
    backgroundColor: '#f5f5f5',
    backgroundImage: '',
    backgroundPosition: 'center',
    overlayColor: '#000000',
    overlayOpacity: 0,
    minHeight: 0,
    paddingY: 24,
    verticalAlign: 'center',
    buttonText: '',
    buttonUrl: '',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#000000',
  },
  render: (props) => <ScrollingTextView {...props} />,
}
