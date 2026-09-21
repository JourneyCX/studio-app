import type { ComponentConfig } from '@measured/puck'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'

// Renders the tenant's actual product detail page when assigned to a theme's
// "product" slot (Store_theme_manager) — the live storefront (nuxt-storefront's
// ProductDetail.vue) reads the real product from the page's own URL slug and
// ports the existing, already-working gallery/variant/cart logic from the
// previous hardcoded pages/product/[slug].vue wholesale. This editor-side
// component is preview-only: there is no "real" product being viewed while
// authoring a shared template, so it shows one representative sample product
// (the tenant's first available one) purely for WYSIWYG purposes.
export type ProductDetailProps = {
  layout: 'gallery-left' | 'gallery-right'
  showRelated?: boolean
  relatedHeading?: string
}

export const ProductDetail: ComponentConfig<ProductDetailProps> = {
  label: 'Product Detail',
  fields: {
    layout: {
      type: 'radio',
      label: 'Layout',
      options: [
        { label: 'Gallery Left', value: 'gallery-left' },
        { label: 'Gallery Right', value: 'gallery-right' },
      ],
    },
    showRelated: {
      type: 'radio',
      label: 'Show "You May Also Like"',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    relatedHeading: { type: 'text', label: 'Related Products Heading' },
  },
  defaultProps: {
    layout: 'gallery-left',
    showRelated: true,
    relatedHeading: 'You May Also Like',
  },
  render({ layout, showRelated, relatedHeading }) {
    // Fetches a handful extra so the preview row below has something to show
    // that isn't just the one sample product used as the "current" item.
    const { status, products } = useTenantProducts('', 5)
    const sample = status === 'success' ? products[0] : undefined
    const related = status === 'success' ? products.slice(1, 5) : []

    const name  = sample?.name ?? 'Sample Product'
    const price = sample ? `${sample.currency_symbol ?? '$'} ${sample.price}` : '$0.00'
    const image = sample?.image_url ?? null

    const gallery = (
      <div style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image
          ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#a0aec0', fontSize: 13 }}>📷 Product Gallery</span>
        }
      </div>
    )

    const info = (
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#1a202c' }}>{name}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#1a202c' }}>{price}</p>
        <div style={{ padding: '10px 0', marginBottom: 16, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#a0aec0' }}>
          Variant options (colour, size, etc.) render automatically here for real products
        </div>
        <button style={{ width: '100%', background: '#2b6cb0', color: '#fff', border: 'none', padding: '12px 0', borderRadius: 6, cursor: 'default', fontWeight: 700, fontSize: 15 }}>
          Add to Cart
        </button>
      </div>
    )

    const showRelatedResolved = showRelated ?? true

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {layout === 'gallery-right' ? <>{info}{gallery}</> : <>{gallery}{info}</>}
        </div>

        {showRelatedResolved && (
          <div style={{ marginTop: 48, borderTop: '1px solid #e2e8f0', paddingTop: 32 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1a202c' }}>{relatedHeading || 'You May Also Like'}</h3>
            {related.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {related.map(p => (
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
        )}
      </div>
    )
  },
}
