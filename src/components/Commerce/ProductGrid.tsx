import { useEffect, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CategorySelectField } from '../shared/CategorySelectField'
import { ColorField } from '../shared/ColorField'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'
import type { StoreProduct } from '../../lib/api'
import { PRODUCT_FILTER_EVENT, type ProductFilterEventDetail } from './ProductFilter'

// Listens for a Product Filter block's selection broadcast on the shared Puck
// iframe window (see ProductFilter.tsx for why this is an event, not a prop).
// Any category/price selection there takes precedence over this grid's own
// design-time categorySlug; with nothing selected, falls back to it unchanged.
function useProductFilterOverride() {
  const [override, setOverride] = useState<ProductFilterEventDetail>({ categorySlugs: [] })
  useEffect(() => {
    function handler(e: Event) {
      setOverride((e as CustomEvent<ProductFilterEventDetail>).detail)
    }
    window.addEventListener(PRODUCT_FILTER_EVENT, handler)
    return () => window.removeEventListener(PRODUCT_FILTER_EVENT, handler)
  }, [])
  return override
}

export type ProductGridProps = {
  headline:        string
  columns:         number
  rows:            number
  // productCount is an older/alternate name found in some stored puck_json, used in
  // place of the rows×columns computation of "how many to show". Treated as an override
  // when present so existing merchant-configured values aren't discarded.
  productCount?:   number
  // showAddToCart/showPrices were part of an earlier richer schema some live themes were
  // authored against; restored as additive optional fields (both default to true, i.e.
  // the previously-unconditional behaviour, so existing pages render unchanged).
  showAddToCart?:  boolean
  showPrices?:     boolean
  categorySlug:    string
  showPlaceholder: boolean
  backgroundColor: string
  gap:             number
}

// Real synced products (Phase 2) alongside the original fake grid (Phase 1, kept as
// a permanent manual "preview layout before I have products" override). `product`
// set → real name/price/image; omitted → the original synthetic placeholder content,
// byte-for-byte unchanged from before.
const Card = ({ index, product, showAddToCart, showPrices }: { index: number; product?: StoreProduct; showAddToCart: boolean; showPrices: boolean }) => {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = product ? (product.image_url && !imgFailed) : false
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {showImage ? (
        <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: '#f7f8fa' }}>
          <img
            src={product!.image_url!}
            alt={product!.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ aspectRatio: '1/1', background: `hsl(${index * 37}, 30%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: 13 }}>
          {product ? '📷' : 'Product Image'}
        </div>
      )}
      <div style={{ padding: 16 }}>
        <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 15, color: '#2d3748' }}>{product ? product.name : `Product ${index + 1}`}</p>
        {!product && <p style={{ margin: '0 0 12px', color: '#718096', fontSize: 13 }}>Short product description</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {showPrices && <span style={{ fontWeight: 700, fontSize: 16, color: '#2d3748' }}>{product ? `${product.currency_symbol ?? '$'} ${product.price}` : 'R 299.00'}</span>}
          {showAddToCart && (
            <button style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const ProductGrid: ComponentConfig<ProductGridProps> = {
  label: 'Product Grid',
  fields: {
    headline:        { type: 'text',   label: 'Section Headline' },
    columns:         { type: 'number', label: 'Columns (1–6)' },
    rows:            { type: 'number', label: 'Rows (1–10)' },
    categorySlug: {
      type: 'custom',
      label: 'Product Category (leave blank for all)',
      render: ({ value, onChange }) => (
        <CategorySelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="All Categories" />
      ),
    },
    showPlaceholder: { type: 'radio',  label: 'Show Placeholder', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    gap:             { type: 'number', label: 'Gap (px)' },
  },
  defaultProps: {
    headline:        'Our Products',
    columns:         3,
    rows:            2,
    categorySlug:    '',
    showPlaceholder: false,
    backgroundColor: '#f7f8fa',
    gap:             24,
  },
  render({ headline, columns, rows, productCount, showAddToCart, showPrices, categorySlug, showPlaceholder, backgroundColor, gap }) {
    const count     = productCount ?? (columns * rows)
    const showCart  = showAddToCart ?? true
    const showPrice = showPrices ?? true
    // ?? not || : a page saved before this field existed has no showPlaceholder key
    // at all and must keep rendering exactly as it did before (fake grid).
    const useFake = showPlaceholder ?? true
    const filterOverride = useProductFilterOverride()
    const effectiveCategorySlug = filterOverride.categorySlugs.length > 0
      ? filterOverride.categorySlugs.join(',')
      : categorySlug
    const { status, products } = useTenantProducts(effectiveCategorySlug, count, !useFake, filterOverride.maxPrice)

    let body: React.ReactNode
    if (useFake || status === 'loading' || status === 'error') {
      body = Array.from({ length: count }).map((_, i) => <Card key={i} index={i} showAddToCart={showCart} showPrices={showPrice} />)
    } else if (status === 'empty') {
      body = (
        <div style={{ gridColumn: '1 / -1', color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>
          No products found — add products in Warehouse, or switch "Show Placeholder" on to preview the layout.
        </div>
      )
    } else {
      body = products.slice(0, count).map(p => <Card key={p.id} index={0} product={p} showAddToCart={showCart} showPrices={showPrice} />)
    }

    return (
      <section style={{ backgroundColor, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && (
            <h2 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 700, color: '#1a202c' }}>{headline}</h2>
          )}
          {!useFake && status === 'error' && (
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load live products — showing placeholder layout instead.</p>
          )}
          {/* sb-grid (styles/responsive.css) collapses this to 1 column on mobile
              and 2 on tablet regardless of the merchant's chosen column count —
              desktop keeps whatever `columns` picks. */}
          <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
            {body}
          </div>
        </div>
      </section>
    )
  },
}
