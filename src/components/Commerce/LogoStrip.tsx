import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type LogoItem = {
  imageUrl: string
  altText: string
  linkUrl: string
}

export type LogoStripProps = {
  headline: string
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
}

export const LogoStrip: ComponentConfig<LogoStripProps> = {
  label: 'Logo Strip',
  fields: {
    headline:        { type: 'text',   label: 'Heading (optional)' },
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
    logoHeight: 120,
    logoSpacing: 32,
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    borderTop: true,
    borderBottom: true,
    borderColor: '#e2e8f0',
    grayscale: true,
    justify: 'center',
    logos: [
      { imageUrl: '', altText: 'Visa',       linkUrl: '' },
      { imageUrl: '', altText: 'Mastercard', linkUrl: '' },
      { imageUrl: '', altText: 'PayFast',    linkUrl: '' },
      { imageUrl: '', altText: 'PayFlex',    linkUrl: '' },
      { imageUrl: '', altText: 'Payjustnow', linkUrl: '' },
    ],
  },
  render({ headline, logos, logoHeight, logoSpacing, backgroundColor, borderTop, borderBottom, borderColor, paddingVertical, grayscale, justify }) {
    const justifyMap: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between',
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
            <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 24, margin: '0 0 24px' }}>
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
