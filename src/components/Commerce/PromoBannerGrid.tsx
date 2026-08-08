import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'

type PromoBanner = {
  image: string
  title: string
  subtitle: string
  buttonText: string
  buttonUrl: string
  buttonStyle: 'solid' | 'outline' | 'none'
  bannerClickable: boolean
  overlayOpacity: number
  textPosition: 'top-left' | 'top-center' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export type PromoBannerGridProps = {
  banners: PromoBanner[]
  columns: number
  gap: number
  aspectRatio: '21/9' | '16/9' | '4/3' | '3/2' | '1/1' | 'auto'
  bannerHeight: number
  backgroundColor: string
  paddingVertical: number
}

const positionStyles: Record<string, { alignItems: string; justifyContent: string; textAlign: 'left' | 'center' | 'right' }> = {
  'top-left':     { alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left' },
  'top-center':   { alignItems: 'flex-start', justifyContent: 'center',     textAlign: 'center' },
  'center':       { alignItems: 'center',     justifyContent: 'center',     textAlign: 'center' },
  'bottom-left':  { alignItems: 'flex-end',   justifyContent: 'flex-start', textAlign: 'left' },
  'bottom-center':{ alignItems: 'flex-end',   justifyContent: 'center',     textAlign: 'center' },
  'bottom-right': { alignItems: 'flex-end',   justifyContent: 'flex-end',   textAlign: 'right' },
}

export const PromoBannerGrid: ComponentConfig<PromoBannerGridProps> = {
  label: 'Promo Banner Grid',
  fields: {
    columns: {
      type: 'select', label: 'Columns',
      options: [{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }],
    },
    aspectRatio: {
      type: 'select', label: 'Aspect Ratio',
      options: [
        { label: 'Cinema (21:9)', value: '21/9' },
        { label: 'Widescreen (16:9)', value: '16/9' },
        { label: 'Standard (4:3)', value: '4/3' },
        { label: 'Photo (3:2)', value: '3/2' },
        { label: 'Square (1:1)', value: '1/1' },
        { label: 'Fixed height', value: 'auto' },
      ],
    },
    bannerHeight:      { type: 'number', label: 'Height when "Fixed height" (px)' },
    gap:               { type: 'number', label: 'Gap between banners (px)' },
    backgroundColor:   { type: 'text',   label: 'Section Background Colour (hex)' },
    paddingVertical:   { type: 'number', label: 'Section Vertical Padding (px)' },
    banners: {
      type: 'array',
      label: 'Banners',
      arrayFields: {
        image:          { type: 'custom',   label: 'Banner Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        title:          { type: 'text',     label: 'Title' },
        subtitle:       { type: 'text',     label: 'Subtitle' },
        buttonText:     { type: 'text',     label: 'Button Text' },
        buttonUrl:      { type: 'text',     label: 'Button URL' },
        buttonStyle:     { type: 'select', label: 'Button Style', options: [{ label: 'Solid white', value: 'solid' }, { label: 'Outline white', value: 'outline' }, { label: 'None', value: 'none' }] },
        bannerClickable: { type: 'radio',  label: 'Link type', options: [{ label: 'Whole banner is link', value: true }, { label: 'Button only', value: false }] },
        overlayOpacity:  { type: 'number', label: 'Overlay Darkness (0–100)' },
        textPosition:   { type: 'select',   label: 'Text Position', options: [
          { label: 'Top left', value: 'top-left' },
          { label: 'Top centre', value: 'top-center' },
          { label: 'Centre', value: 'center' },
          { label: 'Bottom left', value: 'bottom-left' },
          { label: 'Bottom centre', value: 'bottom-center' },
          { label: 'Bottom right', value: 'bottom-right' },
        ]},
      },
      defaultItemProps: {
        image: '',
        title: 'Shop Gents',
        subtitle: '',
        buttonText: 'Shop Now',
        buttonUrl: '/shop',
        buttonStyle: 'outline',
        bannerClickable: true,
        overlayOpacity: 25,
        textPosition: 'center',
      },
      getItemSummary: (item: PromoBanner) => item.title || 'Banner',
    },
  },
  defaultProps: {
    columns: 2,
    aspectRatio: '3/2',
    bannerHeight: 380,
    gap: 12,
    backgroundColor: '#f7f7f7',
    paddingVertical: 24,
    banners: [
      { image: '', title: 'Shop Gents', subtitle: 'Discover the collection', buttonText: 'Shop Now', buttonUrl: '/gents', buttonStyle: 'outline', bannerClickable: true, overlayOpacity: 30, textPosition: 'center' },
      { image: '', title: 'Shop Ladies', subtitle: 'Discover the collection', buttonText: 'Shop Now', buttonUrl: '/ladies', buttonStyle: 'outline', bannerClickable: true, overlayOpacity: 30, textPosition: 'center' },
    ],
  },
  render({ banners, columns, gap, aspectRatio, bannerHeight, backgroundColor, paddingVertical }) {
    return (
      <section style={{ backgroundColor, padding: `${paddingVertical}px 24px` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
            {banners.map((banner, i) => {
              const pos = positionStyles[banner.textPosition] ?? positionStyles['center']
              const dimness = (banner.overlayOpacity ?? 25) / 100
              const wholeLink = banner.bannerClickable !== false

              const containerStyle: React.CSSProperties = aspectRatio === 'auto'
                ? { height: bannerHeight, position: 'relative' }
                : { position: 'relative', aspectRatio }

              const btnBaseStyle: React.CSSProperties = {
                display: 'inline-block',
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 2,
                border: '2px solid #fff',
                backgroundColor: banner.buttonStyle === 'solid' ? '#fff' : 'transparent',
                color: banner.buttonStyle === 'solid' ? '#1a202c' : '#fff',
                textDecoration: 'none',
              }

              const inner = (
                <>
                  {/* Background layer */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: banner.image ? `url("${banner.image}")` : undefined,
                    backgroundColor: `hsl(${i * 45 + 200}, 20%, 70%)`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  {/* Overlay */}
                  {dimness > 0 && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${dimness})` }} />
                  )}
                  {/* Text content */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: pos.alignItems,
                    justifyContent: pos.justifyContent,
                    textAlign: pos.textAlign,
                    padding: 32,
                  }}>
                    {banner.title && (
                      <h3 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '0.03em', textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                        {banner.title}
                      </h3>
                    )}
                    {banner.subtitle && (
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, margin: '0 0 20px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.buttonText && banner.buttonStyle !== 'none' && (
                      wholeLink
                        ? <span style={btnBaseStyle}>{banner.buttonText}</span>
                        : <a href={banner.buttonUrl || '#'} style={btnBaseStyle}>{banner.buttonText}</a>
                    )}
                  </div>
                </>
              )

              const sharedStyle: React.CSSProperties = { display: 'block', overflow: 'hidden', borderRadius: 2, ...containerStyle }

              return wholeLink
                ? <a key={i} href={banner.buttonUrl || '#'} style={{ textDecoration: 'none', cursor: 'pointer', ...sharedStyle }}>{inner}</a>
                : <div key={i} style={sharedStyle}>{inner}</div>
            })}
          </div>
        </div>
      </section>
    )
  },
}
