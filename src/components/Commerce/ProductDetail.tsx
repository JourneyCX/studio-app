import type { ComponentConfig } from '@measured/puck'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'
import { usePreviewBuyer, previewPriceText, previewBuyOffered, previewBuyNote } from '../../lib/hooks/usePreviewBuyer'

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
  thumbnailPosition: 'below' | 'beside' | 'grid'
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
    thumbnailPosition: {
      type: 'radio',
      label: 'Additional images',
      options: [
        { label: 'Thumbnails below image', value: 'below' },
        { label: 'Thumbnails beside image', value: 'beside' },
        { label: 'Large grid below image', value: 'grid' },
      ],
    },
  },
  defaultProps: {
    layout: 'gallery-left',
    thumbnailPosition: 'below',
  },
  render({ layout, thumbnailPosition = 'below' }) {
    const { status, products } = useTenantProducts('', 1)
    const buyer = usePreviewBuyer() // "Preview as" in the editor header; never saved
    const sample = status === 'success' ? products[0] : undefined

    const name  = sample?.name ?? 'Sample Product'
    const price = previewPriceText(buyer, sample ? `${sample.currency_symbol ?? '$'} ${sample.price}` : '$0.00')
    const image = sample?.image_url ?? null

    const main = (
      <div style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(thumbnailPosition === 'beside' ? { flex: 1, minWidth: 0 } : {}) }}>
        {image
          ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#a0aec0', fontSize: 13 }}>📷 Product Gallery</span>
        }
      </div>
    )
    // Placeholder tiles: the editor only knows one sample image.
    const tile = (size: number | string, i: number) => (
      <div key={i} style={{ width: size, aspectRatio: '1/1', borderRadius: thumbnailPosition === 'grid' ? 12 : 6, background: '#edf0f4', border: '1px solid #e2e8f0' }} />
    )
    const gallery = thumbnailPosition === 'beside' ? (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {main}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2].map(i => tile(64, i))}</div>
      </div>
    ) : thumbnailPosition === 'grid' ? (
      <div>
        <div style={{ marginBottom: 12 }}>{main}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{[0, 1, 2, 3].map(i => tile('100%', i))}</div>
      </div>
    ) : (
      <div>
        <div style={{ marginBottom: 12 }}>{main}</div>
        <div style={{ display: 'flex', gap: 8 }}>{[0, 1, 2].map(i => tile(64, i))}</div>
      </div>
    )

    const info = (
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#1a202c' }}>{name}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#1a202c' }}>{price}</p>
        <div style={{ padding: '10px 0', marginBottom: 16, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#a0aec0' }}>
          Variant options (colour, size, etc.) render automatically here for real products
        </div>
        {previewBuyOffered(buyer) ? (
          <button style={{ width: '100%', background: '#2b6cb0', color: '#fff', border: 'none', padding: '12px 0', borderRadius: 6, cursor: 'default', fontWeight: 700, fontSize: 15 }}>
            Add to Cart
          </button>
        ) : (
          <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#2d3748' }}>{previewBuyNote(buyer)}</div>
        )}
      </div>
    )

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {layout === 'gallery-right' ? <>{info}{gallery}</> : <>{gallery}{info}</>}
      </div>
    )
  },
}
