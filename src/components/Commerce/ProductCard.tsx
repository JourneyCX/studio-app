import type { ComponentConfig } from '@measured/puck'
import { FieldLabel } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'
import { CategorySelectField } from '../shared/CategorySelectField'
import { useTenantProducts } from '../../lib/hooks/useTenantProducts'

export type ProductCardProps = {
  productName:  string
  productPrice: string
  productImage: string
  productSlug:  string
  categorySlug: string
  buttonText:   string
  buttonColor:  string
  showPrice:    boolean
}

export const ProductCard: ComponentConfig<ProductCardProps> = {
  label: 'Product Card',
  fields: {
    productName:  { type: 'text',  label: 'Product Name (manual fallback)' },
    productPrice: { type: 'text',  label: 'Price (manual fallback)' },
    productImage: { type: 'custom', label: 'Image (manual fallback)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    productSlug:  { type: 'text',  label: 'Product Slug (overrides everything below when set)' },
    categorySlug: {
      type: 'custom',
      label: "Product Category (shows that category's first product; ignored when a Slug above is set)",
      render: ({ value, onChange }) => (
        <FieldLabel label="Category">
          <CategorySelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="None (use manual fields)" />
        </FieldLabel>
      ),
    },
    buttonText:   { type: 'text',  label: 'Button Text' },
    buttonColor:  { type: 'custom', label: 'Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    showPrice:    { type: 'radio', label: 'Show Price', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    productName:  'Product Name',
    productPrice: 'R 299.00',
    productImage: '',
    productSlug:  '',
    categorySlug: '',
    buttonText:   'Add to Cart',
    buttonColor:  '#3182ce',
    showPrice:    true,
  },
  render({ productName, productPrice, productImage, productSlug, categorySlug, buttonText, buttonColor, showPrice }) {
    // Category picks the category's first product (by the store's default
    // ordering) and falls back to the manual fields below if the category is
    // empty or fails to load — an explicit Slug above always wins outright.
    const categoryEnabled = !productSlug && !!categorySlug
    const { status, products } = useTenantProducts(categorySlug, 1, categoryEnabled)
    const liveProduct = categoryEnabled && status === 'success' ? products[0] : undefined

    const name  = liveProduct?.name ?? productName
    const price = liveProduct ? `${liveProduct.currency_symbol ?? '$'} ${liveProduct.price}` : productPrice
    const image = liveProduct?.image_url ?? productImage

    return (
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', maxWidth: 320 }}>
        <div style={{ height: 220, overflow: 'hidden', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {image
            ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ color: '#a0aec0', fontSize: 13 }}>📷 Product Image</span>
          }
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 15, color: '#2d3748' }}>{name}</p>
          {showPrice && <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 17, color: '#2d3748' }}>{price}</p>}
          <button style={{ width: '100%', background: buttonColor, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {buttonText}
          </button>
        </div>
      </div>
    )
  },
}
