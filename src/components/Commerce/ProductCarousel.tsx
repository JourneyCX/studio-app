import { useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CategorySelectField } from '../shared/CategorySelectField'

export type ProductCarouselProps = {
  headline: string
  subheadline: string
  viewAllText: string
  viewAllUrl: string
  count: number
  // productCount is an older/alternate name for `count` found in some stored puck_json
  // (pre-dates a schema simplification). Treated as an override of `count` when present
  // so existing merchant-configured values aren't discarded.
  productCount?: number
  cardWidth: number
  showArrows: boolean
  // showDots/showAddToCart/showPrices were part of an earlier richer schema that some
  // live themes were authored against; restored as additive optional fields.
  showDots?: boolean
  showAddToCart?: boolean
  showPrices?: boolean
  // autoplay was part of an earlier schema; the carousel has no auto-advance timer in
  // either renderer today, and stored data always has it set to false, so it's accepted
  // here purely to stop the attribute leak — not wired to real behaviour.
  autoplay?: boolean
  showBadge: boolean
  badgeText: string
  // badgeLabel is an older/alternate name for `badgeText` found in some stored
  // puck_json; treated as an override when present.
  badgeLabel?: string
  badgeColor: string
  showRating: boolean
  accentColor: string
  backgroundColor: string
  textColor: string
  cardRadius: number
  categorySlug: string
}

const PALETTE = ['#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#ede9fe', '#ffedd5', '#e0f2fe', '#f0fdf4']
const NAMES   = ['Artisan Mug', 'Linen Tote', 'Bamboo Set', 'Glass Jar', 'Cotton Wrap', 'Ceramic Bowl', 'Woven Basket', 'Stone Vase', 'Oak Tray', 'Felt Pouch']
const PRICES  = ['R 249', 'R 399', 'R 189', 'R 329', 'R 159', 'R 449', 'R 299', 'R 219', 'R 369', 'R 179']

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

function Stars({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= 4 ? color : '#d1d5db', fontSize: 11 }}>★</span>
      ))}
    </div>
  )
}

interface InnerProps extends ProductCarouselProps {}

function CarouselInner({ headline, subheadline, viewAllText, viewAllUrl, count, productCount, cardWidth, showArrows, showDots, showAddToCart, showPrices, showBadge, badgeText, badgeLabel, badgeColor, showRating, accentColor, backgroundColor, textColor, cardRadius }: InnerProps) {
  const badge = badgeLabel ?? badgeText
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' })
  }

  const clamp = Math.max(2, Math.min(productCount ?? count, 20))
  const showCart   = showAddToCart ?? true
  const showPrice  = showPrices ?? true

  return (
    <section style={{ backgroundColor, padding: '56px 0' }}>
      <style>{`
        .pcr-track::-webkit-scrollbar { display: none; }
        .pcr-track { -ms-overflow-style: none; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .pcr-card { scroll-snap-align: start; transition: transform 0.2s, box-shadow 0.2s; flex-shrink: 0; }
        .pcr-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
        .pcr-atc { transition: opacity 0.15s; }
        .pcr-atc:hover { opacity: 0.85; }
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
        <div
          ref={trackRef}
          className="pcr-track"
          style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingRight: 24, paddingBottom: 4 }}
        >
          {Array.from({ length: clamp }).map((_, i) => (
            <div
              key={i}
              className="pcr-card"
              style={{ width: cardWidth, backgroundColor: '#fff', borderRadius: cardRadius, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}
            >
              <div style={{ position: 'relative', width: cardWidth, aspectRatio: '1/1', backgroundColor: PALETTE[i % PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36, opacity: 0.45 }}>🛍</span>
                {showBadge && (
                  <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {badge}
                  </span>
                )}
              </div>
              <div style={{ padding: '12px 14px 16px' }}>
                {showRating && <Stars color={accentColor} />}
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {NAMES[i % NAMES.length]}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  {showPrice && <span style={{ fontWeight: 800, fontSize: 16, color: textColor }}>{PRICES[i % PRICES.length]}</span>}
                  {showCart && (
                    <button className="pcr-atc" style={{ backgroundColor: accentColor, color: '#fff', border: 'none', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      + Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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

export const ProductCarousel: ComponentConfig<ProductCarouselProps> = {
  label: 'Product Carousel',
  fields: {
    headline:      { type: 'text',   label: 'Section Headline' },
    subheadline:   { type: 'textarea', label: 'Section Subheadline' },
    viewAllText:   { type: 'text',   label: '"View All" Link Text' },
    viewAllUrl:    { type: 'text',   label: '"View All" Link URL' },
    count:         { type: 'number', label: 'Preview Card Count' },
    cardWidth:     { type: 'number', label: 'Card Width (px)' },
    showArrows:    { type: 'radio',  label: 'Show Arrow Buttons', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showDots:      { type: 'radio',  label: 'Show Pagination Dots', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showAddToCart: { type: 'radio',  label: 'Show Add to Cart Button', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showPrices:    { type: 'radio',  label: 'Show Prices', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showBadge:     { type: 'radio',  label: 'Show Badge', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    badgeText:     { type: 'text',   label: 'Badge Text' },
    badgeColor:    { type: 'text',   label: 'Badge Colour (hex)' },
    showRating:    { type: 'radio',  label: 'Show Star Rating', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:   { type: 'text',   label: 'Accent / Button Colour (hex)' },
    backgroundColor: { type: 'text', label: 'Section Background (hex)' },
    textColor:     { type: 'text',   label: 'Text Colour (hex)' },
    cardRadius:    { type: 'number', label: 'Card Border Radius (px)' },
    categorySlug: {
      type: 'custom',
      label: 'Product Category (live storefront)',
      render: ({ value, onChange }) => (
        <CategorySelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="All Categories" />
      ),
    },
  },
  defaultProps: {
    headline:        'Trending Now',
    subheadline:     'Our most-loved pieces this season.',
    viewAllText:     'View All',
    viewAllUrl:      '/shop',
    count:           8,
    cardWidth:       220,
    showArrows:      true,
    showDots:        false,
    showAddToCart:   true,
    showPrices:      true,
    showBadge:       true,
    badgeText:       'HOT',
    badgeColor:      '#ef4444',
    showRating:      true,
    accentColor:     '#2563eb',
    backgroundColor: '#ffffff',
    textColor:       '#1e293b',
    cardRadius:      12,
    categorySlug:    '',
  },
  render(props) {
    return <CarouselInner {...props} />
  },
}
