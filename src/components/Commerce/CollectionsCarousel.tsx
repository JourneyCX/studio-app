import { useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { useTenantCollections } from '../../lib/hooks/useTenantCollections'
import type { StoreCollection } from '../../lib/api'

// Distinct from CollectionCarousel.tsx (singular — a carousel of PRODUCTS
// within one merchant-picked collection). This carousel's cards ARE the
// collections themselves — same data source/card content as CollectionList.tsx's
// 'live' mode, just in the polished ProductCarousel-style scroll-track chrome
// instead of a plain grid or bare overflow-x 'strip'.
export type CollectionsCarouselProps = {
  headline: string
  subheadline: string
  viewAllText: string
  viewAllUrl: string
  count: number
  cardWidth: number
  showArrows: boolean
  showDots: boolean
  accentColor: string
  backgroundColor: string
  textColor: string
  cardRadius: number
  showPlaceholder: boolean
}

const PALETTE = ['#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#ede9fe', '#ffedd5', '#e0f2fe', '#f0fdf4']
const NAMES   = ['New Arrivals', 'Best Sellers', 'Summer Edit', 'Staff Picks', 'Gift Guide', 'Essentials', 'Limited Run', 'Everyday']

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

function CollectionCard({ index, collection, cardWidth, cardRadius, textColor }: {
  index: number
  collection?: StoreCollection
  cardWidth: number
  cardRadius: number
  textColor: string
}) {
  const href = collection?.page_slug ? `/${collection.page_slug}` : undefined
  const name = collection ? collection.name : NAMES[index % NAMES.length]
  const itemCount = collection?.item_count ?? 0
  const Tag = href ? 'a' : 'div'
  return (
    <Tag
      className="clsc-card"
      href={href}
      style={{ width: cardWidth, textDecoration: 'none', cursor: href ? 'pointer' : 'default', flexShrink: 0 }}
    >
      <div style={{ borderRadius: cardRadius, overflow: 'hidden', position: 'relative', width: cardWidth, aspectRatio: '4/3', backgroundColor: PALETTE[index % PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {collection?.image_url && (
          <img src={collection.image_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.4)', padding: '10px 12px', textAlign: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          {collection && (
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              {itemCount} item{itemCount === 1 ? '' : 's'}{!href && ' · not yet published'}
            </span>
          )}
        </div>
      </div>
    </Tag>
  )
}

interface InnerProps extends CollectionsCarouselProps {}

function CarouselInner({ headline, subheadline, viewAllText, viewAllUrl, count, cardWidth, showArrows, showDots, showPlaceholder, accentColor, backgroundColor, textColor, cardRadius }: InnerProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' })
  }

  const clamp = Math.max(2, Math.min(count, 20))
  const useFake = showPlaceholder ?? true
  const live = useTenantCollections()

  return (
    <section style={{ backgroundColor, padding: '56px 0' }}>
      <style>{`
        .clsc-track::-webkit-scrollbar { display: none; }
        .clsc-track { -ms-overflow-style: none; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .clsc-card { scroll-snap-align: start; transition: transform 0.2s, box-shadow 0.2s; display: block; }
        .clsc-card:hover { transform: translateY(-4px); }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            {headline && <h2 style={{ color: textColor, fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>{headline}</h2>}
            {subheadline && <p style={{ color: textColor, opacity: 0.6, fontSize: 15, margin: 0 }}>{subheadline}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {viewAllText && (
              <a href={viewAllUrl} style={{ color: accentColor, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {viewAllText} →
              </a>
            )}
            {showArrows && (
              <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                {(['left', 'right'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => scroll(dir)}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${textColor}22`, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                  >
                    <ChevronIcon dir={dir} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ paddingLeft: 24 }}>
        {!useFake && live.status === 'error' && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load collections — showing placeholder layout instead.</p>
        )}
        {!useFake && live.status === 'empty' ? (
          <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>
            No collections yet — create one in the Collections panel, or switch "Show Placeholder" on to preview the layout.
          </div>
        ) : (
          <div
            ref={trackRef}
            className="clsc-track"
            style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingRight: 24, paddingBottom: 4 }}
          >
            {(useFake || live.status === 'loading' || live.status === 'error'
              ? Array.from({ length: clamp })
              : live.collections.slice(0, clamp)
            ).map((item, i) => (
              <CollectionCard
                key={useFake || live.status === 'loading' || live.status === 'error' ? i : (item as StoreCollection).id}
                index={i}
                collection={useFake || live.status === 'loading' || live.status === 'error' ? undefined : (item as StoreCollection)}
                cardWidth={cardWidth}
                cardRadius={cardRadius}
                textColor={textColor}
              />
            ))}
          </div>
        )}
        {showDots && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {Array.from({ length: clamp }).map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i === 0 ? accentColor : `${textColor}33` }} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export const CollectionsCarousel: ComponentConfig<CollectionsCarouselProps> = {
  label: 'Collections Carousel',
  fields: {
    headline:        { type: 'text',   label: 'Section Headline' },
    subheadline:     { type: 'textarea', label: 'Section Subheadline' },
    viewAllText:     { type: 'text',   label: '"View All" Link Text' },
    viewAllUrl:      { type: 'text',   label: '"View All" Link URL' },
    count:           { type: 'number', label: 'Preview Card Count' },
    cardWidth:       { type: 'number', label: 'Card Width (px)' },
    showArrows:      { type: 'radio',  label: 'Show Arrow Buttons', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showDots:        { type: 'radio',  label: 'Show Pagination Dots', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:     { type: 'custom', label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardRadius:      { type: 'number', label: 'Card Border Radius (px)' },
    showPlaceholder: { type: 'radio', label: 'Show Placeholder', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    headline:        'Shop by Collections',
    subheadline:     '',
    viewAllText:     '',
    viewAllUrl:      '/collections',
    count:           8,
    cardWidth:       260,
    showArrows:      true,
    showDots:        false,
    accentColor:     '#2563eb',
    backgroundColor: '#ffffff',
    textColor:       '#1e293b',
    cardRadius:      12,
    showPlaceholder: false,
  },
  render(props) {
    return <CarouselInner {...props} />
  },
}
