import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CategorySelectField } from '../shared/CategorySelectField'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'
import type { StoreProduct } from '../../lib/api'

type CardStyle = 'classic' | 'minimal' | 'overlay'
type AspectRatio = '1/1' | '4/3' | '3/4'

export type ProductShowcaseProps = {
  headline: string
  subheadline: string
  columns: 2 | 3 | 4 | 5
  count: number
  // productCount is an older/alternate name for `count` found in some stored puck_json;
  // treated as an override when present so existing merchant-configured values aren't
  // discarded.
  productCount?: number
  // ctaText/ctaUrl add an optional "view all" link, matching the pattern already used by
  // ProductCarousel's viewAllText/viewAllUrl.
  ctaText?: string
  ctaUrl?: string
  // `layout` (e.g. 'editorial') was part of an earlier schema. There's no current visual
  // implementation for non-standard layout values — accepted here only to stop it
  // leaking as a raw DOM attribute on the storefront; it does not change rendering.
  // Flagged in the schema-drift audit as needing a design decision, not guessed here.
  layout?: string
  cardStyle: CardStyle
  imageAspectRatio: AspectRatio
  showBadge: boolean
  badgeText: string
  badgeColor: string
  showRating: boolean
  showWishlist: boolean
  showSalePrice: boolean
  accentColor: string
  backgroundColor: string
  textColor: string
  cardRadius: number
  gap: number
  categorySlug: string
  showPlaceholder: boolean
}

const PALETTE = ['#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#ede9fe', '#ffedd5', '#e0f2fe', '#f0fdf4']

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function Stars({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= 4 ? color : '#d1d5db', fontSize: 12 }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: '#9ca3af' }}>(24)</span>
    </div>
  )
}

interface CardProps {
  index: number
  product?: StoreProduct
  cardStyle: CardStyle
  imageAspectRatio: AspectRatio
  showBadge: boolean
  badgeText: string
  badgeColor: string
  showRating: boolean
  showWishlist: boolean
  showSalePrice: boolean
  accentColor: string
  textColor: string
  cardRadius: number
}

// Real synced product (when `product` is set) alongside the original fake card
// (index-cycled name/price/origPrice arrays) — omitted keeps the exact prior visuals.
function PlaceholderCard({ index, product, cardStyle, imageAspectRatio, showBadge, badgeText, badgeColor, showRating, showWishlist, showSalePrice, accentColor, textColor, cardRadius }: CardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const bg = PALETTE[index % PALETTE.length]
  const name = product ? product.name : ['Artisan Mug', 'Linen Tote', 'Bamboo Set', 'Glass Jar', 'Cotton Wrap', 'Ceramic Bowl', 'Woven Basket', 'Stone Vase'][index % 8]
  const price = product ? `R ${product.on_sale && showSalePrice ? product.sale_price : product.price}` : ['R 249', 'R 399', 'R 189', 'R 329', 'R 159', 'R 449', 'R 299', 'R 219'][index % 8]
  const origPrice = product ? `R ${product.regular_price}` : ['R 349', 'R 499', 'R 249', 'R 429', 'R 219', 'R 599', 'R 399', 'R 299'][index % 8]
  const showImage = !!(product?.image_url && !imgFailed)
  // Real, non-sale products have price === regular_price — no strikethrough to show,
  // unlike the fake data, which always implies a discount when showSalePrice is on.
  const showStrike = showSalePrice && (!product || product.on_sale)

  const imageNode = (
    <div style={{ position: 'relative', aspectRatio: imageAspectRatio, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {showImage ? (
        <img src={product!.image_url!} alt={product!.name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 40, opacity: 0.5 }}>{product ? '📷' : '🛍'}</span>
      )}
      {showBadge && (
        <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {badgeText}
        </span>
      )}
      {showWishlist && (
        <button style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
          <HeartIcon />
        </button>
      )}
      {cardStyle === 'overlay' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
      )}
    </div>
  )

  if (cardStyle === 'overlay') {
    return (
      <div className="psc-card" style={{ borderRadius: cardRadius, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        {imageNode}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 16px 20px' }}>
          {showRating && <Stars color="#fbbf24" />}
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#fff' }}>{name}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>{price}</span>
              {showStrike && <span style={{ marginLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>{origPrice}</span>}
            </div>
            <button className="psc-btn" style={{ backgroundColor: accentColor, color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cardStyle === 'minimal') {
    return (
      <div className="psc-card" style={{ cursor: 'pointer' }}>
        <div style={{ borderRadius: cardRadius, overflow: 'hidden', marginBottom: 12 }}>
          {imageNode}
        </div>
        {showRating && <Stars color={accentColor} />}
        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 15, color: textColor }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: accentColor }}>{price}</span>
          {showStrike && <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>{origPrice}</span>}
        </div>
        <button className="psc-btn" style={{ marginTop: 10, background: 'none', border: `1.5px solid ${accentColor}`, color: accentColor, padding: '7px 0', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, width: '100%' }}>
          Add to Cart
        </button>
      </div>
    )
  }

  // classic
  return (
    <div className="psc-card" style={{ borderRadius: cardRadius, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
      {imageNode}
      <div style={{ padding: '14px 16px 18px' }}>
        {showRating && <Stars color={accentColor} />}
        <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 15, color: textColor, lineHeight: 1.35 }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: textColor }}>{price}</span>
          {showStrike && <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>{origPrice}</span>}
          {showStrike && <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>SAVE</span>}
        </div>
        <button className="psc-btn" style={{ width: '100%', backgroundColor: accentColor, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export const ProductShowcase: ComponentConfig<ProductShowcaseProps> = {
  label: 'Product Showcase',
  fields: {
    headline:         { type: 'text',    label: 'Section Headline' },
    subheadline:      { type: 'textarea', label: 'Section Subheadline' },
    columns:          { type: 'select',  label: 'Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 }] },
    count:            { type: 'number',  label: 'Preview Card Count' },
    ctaText:          { type: 'text',    label: '"View All" Link Text (leave blank to hide)' },
    ctaUrl:           { type: 'text',    label: '"View All" Link URL' },
    cardStyle:        { type: 'select',  label: 'Card Style', options: [{ label: 'Classic (white card)', value: 'classic' }, { label: 'Minimal (no border)', value: 'minimal' }, { label: 'Overlay (text on image)', value: 'overlay' }] },
    imageAspectRatio: { type: 'select',  label: 'Image Ratio', options: [{ label: 'Square (1:1)', value: '1/1' }, { label: 'Landscape (4:3)', value: '4/3' }, { label: 'Portrait (3:4)', value: '3/4' }] },
    showBadge:        { type: 'radio',   label: 'Show Badge', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    badgeText:        { type: 'text',    label: 'Badge Text (e.g. NEW, SALE, HOT)' },
    badgeColor:       { type: 'text',    label: 'Badge Colour (hex)' },
    showRating:       { type: 'radio',   label: 'Show Star Rating', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showWishlist:     { type: 'radio',   label: 'Show Wishlist Button', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showSalePrice:    { type: 'radio',   label: 'Show Sale / Original Price', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:      { type: 'text',    label: 'Accent / Button Colour (hex)' },
    backgroundColor:  { type: 'text',   label: 'Section Background (hex)' },
    textColor:        { type: 'text',    label: 'Text Colour (hex)' },
    cardRadius:       { type: 'number',  label: 'Card Border Radius (px)' },
    gap:              { type: 'number',  label: 'Gap Between Cards (px)' },
    categorySlug: {
      type: 'custom',
      label: 'Product Category (leave blank for all)',
      render: ({ value, onChange }) => (
        <CategorySelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="All Categories" />
      ),
    },
    showPlaceholder: { type: 'radio', label: 'Show Placeholder', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    headline: 'Featured Products',
    subheadline: 'Hand-picked favourites for you.',
    columns: 4,
    count: 8,
    ctaText: '',
    ctaUrl: '',
    cardStyle: 'classic',
    imageAspectRatio: '1/1',
    showBadge: true,
    badgeText: 'NEW',
    badgeColor: '#2563eb',
    showRating: true,
    showWishlist: true,
    showSalePrice: true,
    accentColor: '#2563eb',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    cardRadius: 12,
    gap: 20,
    categorySlug: '',
    showPlaceholder: true,
  },
  render(props) {
    const { headline, subheadline, columns, count, productCount, ctaText, ctaUrl, layout: _layout, backgroundColor, textColor, accentColor, gap, categorySlug, showPlaceholder, ...rest } = props
    const clamp = Math.max(1, Math.min(productCount ?? count, 20))
    // ?? not || : a page saved before this field existed has no showPlaceholder key
    // at all and must keep rendering exactly as it did before (fake cards).
    const useFake = showPlaceholder ?? true
    const { status, products } = useTenantProducts(categorySlug, clamp, !useFake)
    return (
      <section style={{ backgroundColor, padding: '64px 24px' }}>
        <style>{`
          .psc-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
          .psc-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.13); }
          .psc-btn { transition: opacity 0.15s; }
          .psc-btn:hover { opacity: 0.85; }
        `}</style>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {(headline || subheadline || ctaText) && (
            <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                {headline && <h2 style={{ color: textColor, fontSize: 32, fontWeight: 800, margin: '0 0 10px' }}>{headline}</h2>}
                {subheadline && <p style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0 }}>{subheadline}</p>}
              </div>
              {ctaText && (
                <a href={ctaUrl || '#'} style={{ color: accentColor, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {ctaText} →
                </a>
              )}
            </div>
          )}
          {!useFake && status === 'error' && (
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load live products — showing placeholder layout instead.</p>
          )}
          {!useFake && status === 'empty' ? (
            <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>
              No products found — add products in Warehouse, or switch "Show Placeholder" on to preview the layout.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
              {(useFake || status === 'loading' || status === 'error'
                ? Array.from({ length: clamp })
                : products.slice(0, clamp)
              ).map((item, i) => {
                const product = useFake || status === 'loading' || status === 'error' ? undefined : (item as StoreProduct)
                return (
                  <PlaceholderCard key={product ? product.id : i} index={i} product={product} textColor={textColor} accentColor={accentColor} {...rest} />
                )
              })}
            </div>
          )}
        </div>
      </section>
    )
  },
}
