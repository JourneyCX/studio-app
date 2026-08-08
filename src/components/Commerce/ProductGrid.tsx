import type { ComponentConfig } from '@measured/puck'

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

// Phase 1: renders a placeholder grid.
// Phase 2: replace placeholder cards with live WooCommerce data (via Nuxt server-side proxy).
const PlaceholderCard = ({ index, showAddToCart, showPrices }: { index: number; showAddToCart: boolean; showPrices: boolean }) => (
  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
    <div style={{ height: 200, background: `hsl(${index * 37}, 30%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: 13 }}>
      Product Image
    </div>
    <div style={{ padding: 16 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 15, color: '#2d3748' }}>Product {index + 1}</p>
      <p style={{ margin: '0 0 12px', color: '#718096', fontSize: 13 }}>Short product description</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {showPrices && <span style={{ fontWeight: 700, fontSize: 16, color: '#2d3748' }}>R 299.00</span>}
        {showAddToCart && (
          <button style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  </div>
)

export const ProductGrid: ComponentConfig<ProductGridProps> = {
  label: 'Product Grid',
  fields: {
    headline:        { type: 'text',   label: 'Section Headline' },
    columns:         { type: 'number', label: 'Columns (1–6)' },
    rows:            { type: 'number', label: 'Rows (1–10)' },
    categorySlug:    { type: 'text',   label: 'WooCommerce Category Slug (leave blank for all)' },
    showPlaceholder: { type: 'radio',  label: 'Show Placeholder (Phase 1)', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor: { type: 'text',   label: 'Background Colour (hex)' },
    gap:             { type: 'number', label: 'Gap (px)' },
  },
  defaultProps: {
    headline:        'Our Products',
    columns:         3,
    rows:            2,
    categorySlug:    '',
    showPlaceholder: true,
    backgroundColor: '#f7f8fa',
    gap:             24,
  },
  render({ headline, columns, rows, productCount, showAddToCart, showPrices, showPlaceholder, backgroundColor, gap }) {
    const count = productCount ?? (columns * rows)
    const showCart  = showAddToCart ?? true
    const showPrice = showPrices ?? true
    return (
      <section style={{ backgroundColor, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && (
            <h2 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 700, color: '#1a202c' }}>{headline}</h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
            {showPlaceholder
              ? Array.from({ length: count }).map((_, i) => <PlaceholderCard key={i} index={i} showAddToCart={showCart} showPrices={showPrice} />)
              : <div style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>Products will load from WooCommerce on the live storefront.</div>
            }
          </div>
        </div>
      </section>
    )
  },
}
