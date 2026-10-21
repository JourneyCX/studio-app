import type { CSSProperties } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'
import { FONT_OPTIONS } from '../SiteSettings/FontsSection'
import { DISPLAY_FONT_OPTIONS } from '../Media/ScrollingText'

type LogoItem = {
  imageUrl: string
  altText: string
  linkUrl: string
}

export type LogoStripProps = {
  headline: string
  headlineFont: string
  headlineColor: string
  headlineSize: number
  headlineAlign: 'left' | 'center' | 'right'
  logos: LogoItem[]
  logoHeight: number
  logoSpacing: number
  backgroundColor: string
  borderTop: boolean
  borderBottom: boolean
  borderColor: string
  paddingVertical: number
  grayscale: boolean
  justify: 'start' | 'center' | 'end' | 'space-between'
  scroll: boolean
  scrollDirection: 'left' | 'right'
  scrollDuration: number
  scrollPauseOnHover: boolean
}

// Seamless loop: the track holds two identical halves and slides by exactly
// one half (-50%). Each logo carries its own right margin (not flex gap) so
// both halves are the same width. Plain <style>: renders into whichever
// document the component lives in (Puck's canvas iframe or the live page).
const SCROLL_CSS = `
@keyframes sb-logo-scroll { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
.sb-logo-track { display: flex; width: max-content; will-change: transform; animation: sb-logo-scroll var(--sb-logo-duration, 30s) linear infinite; }
.sb-logo-scroll[data-dir="right"] .sb-logo-track { animation-direction: reverse; }
.sb-logo-scroll[data-pause="1"]:hover .sb-logo-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sb-logo-track { animation: none; } }
`

export const LogoStrip: ComponentConfig<LogoStripProps> = {
  label: 'Logo Strip',
  fields: {
    headline:        { type: 'text',   label: 'Heading (optional)' },
    headlineFont:    { type: 'select', label: 'Heading Font', options: [{ label: 'Theme default', value: '' }, ...DISPLAY_FONT_OPTIONS, ...FONT_OPTIONS] },
    headlineColor:   { type: 'custom', label: 'Heading Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    headlineSize:    { type: 'number', label: 'Heading Size (px)' },
    headlineAlign:   { type: 'radio',  label: 'Heading Position', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    logoHeight:      { type: 'number', label: 'Logo Height (px)' },
    logoSpacing:     { type: 'number', label: 'Logo Spacing (px)' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    paddingVertical: { type: 'number', label: 'Vertical Padding (px)' },
    borderTop:       { type: 'radio',  label: 'Top Border', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    borderBottom:    { type: 'radio',  label: 'Bottom Border', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    borderColor:     { type: 'custom', label: 'Border Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    grayscale:       { type: 'radio',  label: 'Greyscale logos', options: [{ label: 'Yes (colour on hover)', value: true }, { label: 'No (full colour)', value: false }] },
    justify: {
      type: 'select', label: 'Logo Alignment',
      options: [
        { label: 'Left', value: 'start' },
        { label: 'Centre', value: 'center' },
        { label: 'Right', value: 'end' },
        { label: 'Space between', value: 'space-between' },
      ],
    },
    scroll:             { type: 'radio',  label: 'Scrolling logos', options: [{ label: 'On', value: true }, { label: 'Off', value: false }] },
    scrollDirection:    { type: 'radio',  label: 'Scroll direction', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
    scrollDuration:     { type: 'number', label: 'Scroll time per loop (seconds, higher = slower)', min: 5 },
    scrollPauseOnHover: { type: 'radio',  label: 'Pause on hover', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    logos: {
      type: 'array',
      label: 'Logos',
      arrayFields: {
        imageUrl: { type: 'custom', label: 'Logo Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        altText:  { type: 'text',   label: 'Alt Text' },
        linkUrl:  { type: 'text',   label: 'Link URL (optional)' },
      },
      defaultItemProps: { imageUrl: '', altText: 'Partner logo', linkUrl: '' },
      getItemSummary: (item: LogoItem) => item.altText || 'Logo',
    },
  },
  defaultProps: {
    headline: '',
    headlineFont: '',
    headlineColor: '#94a3b8',
    headlineSize: 13,
    headlineAlign: 'center',
    logoHeight: 120,
    logoSpacing: 32,
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    borderTop: true,
    borderBottom: true,
    borderColor: '#e2e8f0',
    grayscale: true,
    justify: 'center',
    scroll: false,
    scrollDirection: 'left',
    scrollDuration: 30,
    scrollPauseOnHover: true,
    logos: [
      { imageUrl: '', altText: 'Visa',       linkUrl: '' },
      { imageUrl: '', altText: 'Mastercard', linkUrl: '' },
      { imageUrl: '', altText: 'PayFast',    linkUrl: '' },
      { imageUrl: '', altText: 'PayFlex',    linkUrl: '' },
      { imageUrl: '', altText: 'Payjustnow', linkUrl: '' },
    ],
  },
  render({ headline, headlineFont, headlineColor, headlineSize, headlineAlign, logos, logoHeight, logoSpacing, backgroundColor, borderTop, borderBottom, borderColor, paddingVertical, grayscale, justify, scroll, scrollDirection, scrollDuration, scrollPauseOnHover }) {
    const justifyMap: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between',
    }

    const renderLogo = (logo: LogoItem, key: string, extra: CSSProperties = {}) => {
      const img = (
        <img
          src={logo.imageUrl || undefined}
          alt={logo.altText}
          style={{
            height: logoHeight,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: grayscale ? 'grayscale(100%) opacity(0.6)' : 'none',
            transition: 'filter 0.2s ease',
          }}
          onMouseEnter={e => { if (grayscale) (e.currentTarget as HTMLImageElement).style.filter = 'none' }}
          onMouseLeave={e => { if (grayscale) (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) opacity(0.6)' }}
        />
      )
      if (!logo.imageUrl) {
        return (
          <div
            key={key}
            style={{
              height: logoHeight, width: logoHeight * 2,
              backgroundColor: '#e2e8f0', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...extra,
            }}
          >
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{logo.altText}</span>
          </div>
        )
      }
      return logo.linkUrl ? (
        <a key={key} href={logo.linkUrl} style={{ display: 'block', lineHeight: 0, ...extra }}>{img}</a>
      ) : (
        <div key={key} style={extra}>{img}</div>
      )
    }

    if (scroll && logos.length > 0) {
      const reps = Math.max(1, Math.ceil(10 / logos.length))
      const half = (h: string) => (
        <div key={h} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden={h === 'b' ? true : undefined}>
          {Array.from({ length: reps }).flatMap((_, r) =>
            logos.map((logo, i) => renderLogo(logo, `${h}${r}-${i}`, { marginRight: logoSpacing, flexShrink: 0 })),
          )}
        </div>
      )
      return (
        <section
          style={{
            backgroundColor,
            padding: `${paddingVertical}px 0`,
            borderTop:    borderTop    ? `1px solid ${borderColor}` : 'none',
            borderBottom: borderBottom ? `1px solid ${borderColor}` : 'none',
          }}
        >
          <style>{SCROLL_CSS}</style>
          {headline && (
            <p style={{ textAlign: headlineAlign || 'center', fontFamily: headlineFont || undefined, fontSize: headlineSize || 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: headlineColor || '#94a3b8', margin: '0 24px 24px' }}>
              {headline}
            </p>
          )}
          <div
            className="sb-logo-scroll"
            data-dir={scrollDirection === 'right' ? 'right' : 'left'}
            data-pause={scrollPauseOnHover ? '1' : '0'}
            style={{ overflow: 'hidden' }}
          >
            <div className="sb-logo-track" style={{ ['--sb-logo-duration' as string]: `${scrollDuration || 30}s` }}>
              {half('a')}
              {half('b')}
            </div>
          </div>
        </section>
      )
    }

    return (
      <section
        style={{
          backgroundColor,
          padding: `${paddingVertical}px 24px`,
          borderTop:    borderTop    ? `1px solid ${borderColor}` : 'none',
          borderBottom: borderBottom ? `1px solid ${borderColor}` : 'none',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && (
            <p style={{ textAlign: headlineAlign || 'center', fontFamily: headlineFont || undefined, fontSize: headlineSize || 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: headlineColor || '#94a3b8', margin: '0 0 24px' }}>
              {headline}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: justifyMap[justify] ?? 'center',
              gap: logoSpacing,
            }}
          >
            {logos.map((logo, i) => {
              const img = (
                <img
                  src={logo.imageUrl || undefined}
                  alt={logo.altText}
                  style={{
                    height: logoHeight,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    filter: grayscale ? 'grayscale(100%) opacity(0.6)' : 'none',
                    transition: 'filter 0.2s ease',
                  }}
                  onMouseEnter={e => { if (grayscale) (e.currentTarget as HTMLImageElement).style.filter = 'none' }}
                  onMouseLeave={e => { if (grayscale) (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) opacity(0.6)' }}
                />
              )

              if (!logo.imageUrl) {
                return (
                  <div
                    key={i}
                    style={{
                      height: logoHeight, width: logoHeight * 2,
                      backgroundColor: '#e2e8f0', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{logo.altText}</span>
                  </div>
                )
              }

              return logo.linkUrl ? (
                <a key={i} href={logo.linkUrl} style={{ display: 'block', lineHeight: 0 }}>
                  {img}
                </a>
              ) : (
                <div key={i}>{img}</div>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}
