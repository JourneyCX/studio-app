import { useEffect, useRef, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CollectionSelectField } from '../shared/CollectionSelectField'
import { ColorField } from '../shared/ColorField'
import { stratumApi, type StoreProduct } from '../../lib/api'

export type CollectionCarouselProps = {
  headline: string
  subheadline: string
  viewAllText: string
  viewAllUrl: string
  count: number
  cardWidth: number
  showArrows: boolean
  showDots: boolean
  showAddToCart: boolean
  showPrices: boolean
  showBadge: boolean
  badgeText: string
  badgeColor: string
  showRating: boolean
  accentColor: string
  backgroundColor: string
  textColor: string
  cardRadius: number
  collectionSlug: string
  showPlaceholder: boolean
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

// Same card markup as ProductCarousel.tsx's CarouselCard, kept in sync deliberately.
function CarouselCard({ index, product, cardWidth, cardRadius, showBadge, badge, badgeColor, showRating, accentColor, textColor, showPrice, showCart }: {
  index: number
  product?: StoreProduct
  cardWidth: number
  cardRadius: number
  showBadge: boolean
  badge: string
  badgeColor: string
  showRating: boolean
  accentColor: string
  textColor: string
  showPrice: boolean
  showCart: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!(product?.image_url && !imgFailed)
  return (
    <div
      className="clcr-card"
      style={{ width: cardWidth, backgroundColor: '#fff', borderRadius: cardRadius, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}
    >
      <div style={{ position: 'relative', width: cardWidth, aspectRatio: '1/1', backgroundColor: PALETTE[index % PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {showImage ? (
          <img src={product!.image_url!} alt={product!.name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.45 }}>{product ? '📷' : '🛍'}</span>
        )}
        {showBadge && (
          <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px 16px' }}>
        {showRating && <Stars color={accentColor} />}
        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product ? product.name : NAMES[index % NAMES.length]}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          {showPrice && <span style={{ fontWeight: 800, fontSize: 16, color: textColor }}>{product ? `${product.currency_symbol ?? '$'} ${product.price}` : PRICES[index % PRICES.length]}</span>}
          {showCart && (
            <button className="clcr-atc" style={{ backgroundColor: accentColor, color: '#fff', border: 'none', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              + Cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Same fetch shape as CollectionDetail.tsx's useCollectionDetail: resolve the
// collection by slug, then resolve its product_ids to full product objects via
// getActiveProducts({ include }) — not useTenantProducts (category-based), since a
// collection's membership is an explicit product-id list, not a category filter.
function useCollectionCarousel(slug: string, limit: number, enabled: boolean) {
  const [state, setState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'error' } |
    { status: 'empty' } | { status: 'success'; products: StoreProduct[] }
  >({ status: 'idle' })

  useEffect(() => {
    if (!enabled || !slug) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    stratumApi.getActiveCollection(slug)
      .then(async ({ collection }) => {
        const ids = (collection.product_ids ?? []).slice(0, limit)
        if (ids.length === 0) {
          if (!cancelled) setState({ status: 'empty' })
          return
        }
        const { products } = await stratumApi.getActiveProducts({ include: ids })
        if (!cancelled) setState(products.length === 0 ? { status: 'empty' } : { status: 'success', products })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => { cancelled = true }
  }, [slug, limit, enabled])

  return state
}

interface InnerProps extends CollectionCarouselProps {}

function CarouselInner({ headline, subheadline, viewAllText, viewAllUrl, count, cardWidth, showArrows, showDots, showAddToCart, showPrices, collectionSlug, showPlaceholder, showBadge, badgeText, badgeColor, showRating, accentColor, backgroundColor, textColor, cardRadius }: InnerProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' })
  }

  const clamp = Math.max(2, Math.min(count, 20))
  const showCart  = showAddToCart ?? true
  const showPrice = showPrices ?? true
  const useFake = showPlaceholder ?? true
  const state = useCollectionCarousel(collectionSlug, clamp, !useFake)
  const products = state.status === 'success' ? state.products : []
  const isLoadingLike = useFake || state.status === 'idle' || state.status === 'loading' || state.status === 'error'

  return (
    <section style={{ backgroundColor, padding: '56px 0' }}>
      <style>{`
        .clcr-track::-webkit-scrollbar { display: none; }
        .clcr-track { -ms-overflow-style: none; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .clcr-card { scroll-snap-align: start; transition: transform 0.2s, box-shadow 0.2s; flex-shrink: 0; }
        .clcr-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
        .clcr-atc { transition: opacity 0.15s; }
        .clcr-atc:hover { opacity: 0.85; }
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
        {!useFake && !collectionSlug && (
          <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 8, marginRight: 24 }}>
            Pick a collection from the field panel to preview it here.
          </div>
        )}
        {!useFake && collectionSlug && state.status === 'error' && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load this collection — showing placeholder layout instead.</p>
        )}
        {!useFake && collectionSlug && state.status === 'empty' ? (
          <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>
            This collection has no products yet.
          </div>
        ) : (useFake || collectionSlug) && (
          <div
            ref={trackRef}
            className="clcr-track"
            style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingRight: 24, paddingBottom: 4 }}
          >
            {(isLoadingLike ? Array.from({ length: clamp }) : products.slice(0, clamp)).map((item, i) => (
              <CarouselCard
                key={isLoadingLike ? i : (item as StoreProduct).id}
                index={i}
                product={isLoadingLike ? undefined : (item as StoreProduct)}
                cardWidth={cardWidth}
                cardRadius={cardRadius}
                showBadge={showBadge}
                badge={badgeText}
                badgeColor={badgeColor}
                showRating={showRating}
                accentColor={accentColor}
                textColor={textColor}
                showPrice={showPrice}
                showCart={showCart}
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

export const CollectionCarousel: ComponentConfig<CollectionCarouselProps> = {
  label: 'Collection Carousel',
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
    badgeColor:    { type: 'custom', label: 'Badge Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    showRating:    { type: 'radio',  label: 'Show Star Rating', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:   { type: 'custom', label: 'Accent / Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:     { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardRadius:    { type: 'number', label: 'Card Border Radius (px)' },
    collectionSlug: {
      type: 'custom',
      label: 'Collection',
      render: ({ value, onChange }) => (
        <CollectionSelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="Select a collection…" />
      ),
    },
    showPlaceholder: { type: 'radio', label: 'Show Placeholder', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    headline:        'Featured Collection',
    subheadline:     'Hand-picked picks from this collection.',
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
    collectionSlug:  '',
    showPlaceholder: false,
  },
  render(props) {
    return <CarouselInner {...props} />
  },
}
