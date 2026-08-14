import { useState, useCallback } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type GalleryImage = { src: string; alt: string; caption: string }
type GalleryLayout = 'grid' | 'masonry'
type AspectRatio  = '1/1' | '4/3' | '16/9' | '3/4'

export type ImageGalleryProps = {
  headline: string
  layout: GalleryLayout
  columns: 2 | 3 | 4
  gap: number
  imageAspectRatio: AspectRatio
  borderRadius: number
  showCaptions: boolean
  overlayColor: string
  backgroundColor: string
  textColor: string
  images: GalleryImage[]
}

const PLACEHOLDER_COLORS = ['#bfdbfe','#fde68a','#bbf7d0','#fecdd3','#ddd6fe','#fed7aa','#a5f3fc','#fbcfe8','#d9f99d','#fef08a','#e9d5ff','#99f6e4']

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

function Lightbox({ images, index, onClose, onNav }: { images: GalleryImage[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  const img = images[index]
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CloseIcon />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 50, height: 50, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronIcon dir="left" />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {img.src ? (
          <img src={img.src} alt={img.alt} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8 }} />
        ) : (
          <div style={{ width: '60vw', height: '45vh', backgroundColor: PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length], borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 16 }}>
            {img.alt || `Image ${index + 1}`}
          </div>
        )}
        {img.caption && (
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, textAlign: 'center', margin: 0, maxWidth: 560 }}>{img.caption}</p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>{index + 1} / {images.length}</p>
      </div>

      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 50, height: 50, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronIcon dir="right" />
        </button>
      )}
    </div>
  )
}

function GalleryInner(props: ImageGalleryProps) {
  // `layout` (grid/masonry) is accepted for schema parity with stored puck_json but not
  // yet wired to an actual masonry rendering path — always renders as a uniform grid,
  // matching the storefront Vue renderer's current behaviour.
  const { headline, columns, gap, imageAspectRatio, borderRadius, showCaptions, overlayColor, backgroundColor, textColor, images } = props
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const open  = useCallback((i: number) => setLightboxIndex(i), [])
  const close = useCallback(() => setLightboxIndex(null), [])
  const nav   = useCallback((i: number) => setLightboxIndex(i), [])

  const displayImages = images.length > 0 ? images : Array.from({ length: 6 }, (_, i) => ({ src: '', alt: `Photo ${i + 1}`, caption: '' }))

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <style>{`
        .gal-item { overflow: hidden; cursor: zoom-in; position: relative; }
        .gal-item img, .gal-placeholder { transition: transform 0.35s ease; display: block; width: 100%; }
        .gal-item:hover img, .gal-item:hover .gal-placeholder { transform: scale(1.05); }
        .gal-overlay { position: absolute; inset: 0; opacity: 0; transition: opacity 0.25s; display: flex; align-items: center; justify-content: center; }
        .gal-item:hover .gal-overlay { opacity: 1; }
      `}</style>

      {lightboxIndex !== null && (
        <Lightbox images={displayImages} index={lightboxIndex} onClose={close} onNav={nav} />
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {headline && <h2 style={{ color: textColor, fontSize: 32, fontWeight: 800, margin: '0 0 36px' }}>{headline}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
          {displayImages.map((img, i) => (
            <div key={i}>
              <div className="gal-item" style={{ borderRadius, aspectRatio: imageAspectRatio }} onClick={() => open(i)}>
                {img.src ? (
                  <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
                ) : (
                  <div className="gal-placeholder" style={{ width: '100%', height: '100%', backgroundColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length], borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                    📷 {img.alt}
                  </div>
                )}
                <div className="gal-overlay" style={{ backgroundColor: overlayColor, borderRadius }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </div>
              </div>
              {showCaptions && img.caption && (
                <p style={{ color: textColor, opacity: 0.6, fontSize: 13, textAlign: 'center', margin: '8px 0 0' }}>{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const ImageGallery: ComponentConfig<ImageGalleryProps> = {
  label: 'Image Gallery',
  fields: {
    headline:         { type: 'text',    label: 'Section Headline' },
    layout:           { type: 'select',  label: 'Layout', options: [{ label: 'Grid (uniform)', value: 'grid' }, { label: 'Masonry (varied)', value: 'masonry' }] },
    columns:          { type: 'select',  label: 'Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }] },
    gap:              { type: 'number',  label: 'Gap (px)' },
    imageAspectRatio: { type: 'select',  label: 'Image Aspect Ratio', options: [{ label: 'Square 1:1', value: '1/1' }, { label: 'Landscape 4:3', value: '4/3' }, { label: 'Widescreen 16:9', value: '16/9' }, { label: 'Portrait 3:4', value: '3/4' }] },
    borderRadius:     { type: 'number',  label: 'Image Border Radius (px)' },
    showCaptions:     { type: 'radio',   label: 'Show Captions', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    overlayColor:     { type: 'custom',  label: 'Hover Overlay Colour (rgba)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor:  { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:        { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    images: {
      type: 'array',
      label: 'Images',
      arrayFields: {
        src:     { type: 'custom', label: 'Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        alt:     { type: 'text',    label: 'Alt Text' },
        caption: { type: 'textarea', label: 'Caption (optional)' },
      },
      defaultItemProps: { src: '', alt: 'Gallery image', caption: '' },
      getItemSummary: (item: GalleryImage) => item.alt || 'Image',
    },
  },
  defaultProps: {
    headline:         'Our Gallery',
    layout:           'grid',
    columns:          3,
    gap:              12,
    imageAspectRatio: '1/1',
    borderRadius:     10,
    showCaptions:     false,
    overlayColor:     'rgba(0,0,0,0.4)',
    backgroundColor:  '#ffffff',
    textColor:        '#1e293b',
    images: Array.from({ length: 6 }, (_, i) => ({ src: '', alt: `Photo ${i + 1}`, caption: `Caption for photo ${i + 1}` })),
  },
  render(props) {
    return <GalleryInner {...props} />
  },
}
