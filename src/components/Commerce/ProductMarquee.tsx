import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CategorySelectField } from '../shared/CategorySelectField'
import { ColorField } from '../shared/ColorField'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'
import type { StoreProduct } from '../../lib/api'

// A row of tall product cards that scrolls by itself and loops without a visible
// jump (pure CSS, no scroll listeners). Mirrored prop-for-prop in nuxt-storefront's
// ProductMarquee.vue; the repeat/duration maths below must stay identical there.
export type ProductMarqueeProps = {
  headline: string
  subheadline: string
  categorySlug: string
  count: number
  // The direction the cards MOVE: 'left' = right to left, 'right' = left to right.
  direction: 'left' | 'right'
  // Scroll speed in px per second, so it feels the same however many cards there are.
  speed: number
  pauseOnHover: boolean
  cardWidth: number
  imageFit: 'cover' | 'contain'
  cardRadius: number
  gap: number
  showNames: boolean
  showPrices: boolean
  backgroundColor: string
  textColor: string
  showPlaceholder: boolean
}

// Each half of the track must be wider than any screen, or the loop would show a gap.
const MIN_HALF_WIDTH_PX = 2400
const NAMES  = ['Linen Shirt', 'Wide-Leg Trousers', 'Knit Jumper', 'Utility Jacket', 'Cotton Tee', 'Pleated Skirt', 'Denim Jacket', 'Wrap Dress']
const PRICES = ['R 349', 'R 599', 'R 499', 'R 879', 'R 249', 'R 449', 'R 799', 'R 699']

function MarqueeCard({ index, product, width, radius, gap, fit, showName, showPrice, textColor }: {
  index: number
  product?: StoreProduct
  width: number
  radius: number
  gap: number
  fit: 'cover' | 'contain'
  showName: boolean
  showPrice: boolean
  textColor: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!(product?.image_url && !imgFailed)
  return (
    <div style={{ flex: '0 0 auto', width, marginRight: gap }}>
      <div style={{ aspectRatio: '3/4', borderRadius: radius, overflow: 'hidden', background: `hsl(${(index * 47) % 360}, 28%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showImage
          ? <img src={product!.image_url!} alt={product!.name} draggable={false} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
          : <span style={{ fontSize: 34, opacity: 0.4 }}>{product ? '📷' : '🛍'}</span>}
      </div>
      {(showName || showPrice) && (
        <div style={{ padding: '10px 2px 0' }}>
          {showName && <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product ? product.name : NAMES[index % NAMES.length]}</p>}
          {showPrice && <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: textColor, opacity: 0.8 }}>{product ? `${product.currency_symbol ?? '$'} ${product.price}` : PRICES[index % PRICES.length]}</p>}
        </div>
      )}
    </div>
  )
}

export const ProductMarquee: ComponentConfig<ProductMarqueeProps> = {
  label: 'Scrolling Product Strip',
  fields: {
    headline:    { type: 'text',     label: 'Section Headline' },
    subheadline: { type: 'textarea', label: 'Section Subheadline' },
    categorySlug: {
      type: 'custom',
      label: 'Product Category (leave blank for all)',
      render: ({ value, onChange }) => (
        <CategorySelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="All Categories" />
      ),
    },
    count:       { type: 'number', label: 'Number of products (3–30)', min: 3, max: 30 },
    direction:   { type: 'radio',  label: 'Scroll Direction', options: [{ label: 'Right to left', value: 'left' }, { label: 'Left to right', value: 'right' }] },
    speed:       { type: 'number', label: 'Scroll Speed (px per second; try 40–100)', min: 5 },
    pauseOnHover: { type: 'radio', label: 'Pause when hovered or touched', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    cardWidth:   { type: 'number', label: 'Card Width (px) — cards are tall (3:4)', min: 120 },
    imageFit:    { type: 'radio',  label: 'Product Image', options: [{ label: 'Fill the card (may crop)', value: 'cover' }, { label: 'Show whole image', value: 'contain' }] },
    cardRadius:  { type: 'number', label: 'Card Corner Radius (px)', min: 0 },
    gap:         { type: 'number', label: 'Space Between Cards (px)', min: 0 },
    showNames:   { type: 'radio',  label: 'Show Product Names', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showPrices:  { type: 'radio',  label: 'Show Prices', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor: { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:   { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    showPlaceholder: { type: 'radio', label: 'Show Placeholder Cards', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    headline:        'Trending Now',
    subheadline:     '',
    categorySlug:    '',
    count:           12,
    direction:       'left',
    speed:           60,
    pauseOnHover:    true,
    cardWidth:       260,
    imageFit:        'cover',
    cardRadius:      12,
    gap:             16,
    showNames:       true,
    showPrices:      true,
    backgroundColor: '#ffffff',
    textColor:       '#1e293b',
    showPlaceholder: false,
  },
  render({ headline, subheadline, categorySlug, count, direction, speed, pauseOnHover, cardWidth, imageFit, cardRadius, gap, showNames, showPrices, backgroundColor, textColor, showPlaceholder }) {
    const n      = Math.max(3, Math.min(Number(count) || 12, 30))
    const width  = Math.max(120, Number(cardWidth) || 260)
    const space  = gap == null ? 16 : Math.max(0, Number(gap) || 0)
    const pxPerS = Math.max(5, Number(speed) || 60)
    const useFake = showPlaceholder ?? false
    const { status, products } = useTenantProducts(categorySlug, n, !useFake)

    const real = !useFake && status === 'success' ? products.slice(0, n) : []
    const sourceLen = real.length > 0 ? real.length : n
    // Repeat the products until one half of the track is wider than any screen; the
    // track is two identical halves, so sliding it by exactly 50% loops seamlessly.
    const step    = width + space
    const perHalf = Math.max(sourceLen, Math.ceil(MIN_HALF_WIDTH_PX / step))
    const half    = Array.from({ length: perHalf }, (_, i) => (real.length > 0 ? real[i % real.length] : undefined))
    const seconds = (perHalf * step) / pxPerS
    const moving  = status === 'success' || useFake || status === 'loading' || status === 'error'

    return (
      <section style={{ backgroundColor, padding: '56px 0' }}>
        <style>{`
          @keyframes psm-move-left  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
          @keyframes psm-move-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
          .psm-track { display: flex; width: max-content; animation-timing-function: linear; animation-iteration-count: infinite; }
          .psm-track.psm-pause:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .psm-track { animation: none !important; }
            .psm-viewport { overflow-x: auto !important; }
          }
        `}</style>
        {(headline || subheadline) && (
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 28px' }}>
            {headline && <h2 style={{ color: textColor, fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>{headline}</h2>}
            {subheadline && <p style={{ color: textColor, opacity: 0.6, fontSize: 15, margin: 0 }}>{subheadline}</p>}
          </div>
        )}
        {!useFake && status === 'error' && (
          <p style={{ margin: '0 24px 12px', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load live products — showing placeholder cards instead.</p>
        )}
        {!useFake && status === 'empty' ? (
          <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>
            No products found — add products in Warehouse, or switch "Show Placeholder Cards" on to preview the layout.
          </div>
        ) : moving && (
          <div className="psm-viewport" style={{ overflow: 'hidden', width: '100%' }}>
            <div
              className={`psm-track${pauseOnHover ?? true ? ' psm-pause' : ''}`}
              style={{ animationName: direction === 'right' ? 'psm-move-right' : 'psm-move-left', animationDuration: `${seconds}s` }}
            >
              {[0, 1].map(copy => half.map((p, i) => (
                <MarqueeCard
                  key={`${copy}-${i}`}
                  index={i}
                  product={p}
                  width={width}
                  radius={cardRadius}
                  gap={space}
                  fit={imageFit ?? 'cover'}
                  showName={showNames ?? true}
                  showPrice={showPrices ?? true}
                  textColor={textColor}
                />
              )))}
            </div>
          </div>
        )}
      </section>
    )
  },
}
