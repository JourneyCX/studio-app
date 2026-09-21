import type { ComponentConfig } from '@measured/puck'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'

// Editor-side counterpart of nuxt-storefront's storefront/RelatedProducts.vue
// -- a standalone widget (not baked into ProductDetail) so merchants can drag
// it anywhere on the "product" template, same as ProductTabs is already a
// separate block from ProductDetail. Preview-only, same limitation as
// Commerce/ProductDetail.tsx: there's no real "current product" while
// authoring a shared template, so this just shows a handful of the tenant's
// real products for WYSIWYG purposes rather than actual same-category picks.
export type RelatedProductsProps = {
  heading: string
  count:   number
}

export const RelatedProducts: ComponentConfig<RelatedProductsProps> = {
  label: 'Related Products',
  fields: {
    heading: { type: 'text',   label: 'Heading' },
    count:   { type: 'number', label: 'Number of Products' },
  },
  defaultProps: {
    heading: 'You May Also Like',
    count:   4,
  },
  render({ heading, count }) {
    const { status, products } = useTenantProducts('', count)

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700, color: '#1a202c' }}>{heading}</h2>
        {status === 'success' && products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16 }}>
            {products.slice(0, count).map(p => (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <div style={{ aspectRatio: '1/1', background: '#f7f8fa' }}>
                  {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#1a202c' }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{p.currency_symbol ?? '$'} {p.price}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: '#a0aec0', fontSize: 12, border: '1px dashed #cbd5e0', borderRadius: 8 }}>
            Products related to the one being viewed render here automatically — picked from the same category, live on the storefront.
          </div>
        )}
      </div>
    )
  },
}
