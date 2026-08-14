import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type Collection = { name: string; imageUrl: string; url: string }

export type CollectionListProps = {
  headline: string
  collections: Collection[]
  columns: number
  backgroundColor: string
  // `layout` was part of an earlier schema some live themes were authored against.
  // 'grid' matches the existing (default) CSS-grid rendering; 'strip' is a new
  // horizontally-scrolling row, added additively so stored 'strip' values render
  // meaningfully instead of silently falling back to grid.
  layout?: 'grid' | 'strip'
}

export const CollectionList: ComponentConfig<CollectionListProps> = {
  label: 'Collection List',
  fields: {
    headline:        { type: 'text',   label: 'Section Headline' },
    columns:         { type: 'number', label: 'Columns' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    layout:          { type: 'select', label: 'Layout', options: [{ label: 'Grid', value: 'grid' }, { label: 'Scrolling Strip', value: 'strip' }] },
    collections: {
      type: 'array',
      label: 'Collections',
      arrayFields: {
        name:     { type: 'text', label: 'Name' },
        imageUrl: { type: 'custom', label: 'Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        url:      { type: 'text', label: 'Link URL' },
      },
    },
  },
  defaultProps: {
    headline:        'Shop by Category',
    columns:         3,
    backgroundColor: '#ffffff',
    layout:          'grid',
    collections: [
      { name: 'New Arrivals',   imageUrl: '', url: '/category/new' },
      { name: 'Best Sellers',   imageUrl: '', url: '/category/best' },
      { name: 'Sale',           imageUrl: '', url: '/category/sale' },
    ],
  },
  render({ headline, collections, columns, backgroundColor, layout }) {
    const isStrip = layout === 'strip'
    const card = (col: Collection, i: number) => (
      <a key={i} href={col.url} style={{ textDecoration: 'none', ...(isStrip ? { flex: '0 0 220px' } : {}) }}>
        <div style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', height: 200, background: `hsl(${i * 60}, 25%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {col.imageUrl && <img src={col.imageUrl} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.35)', width: '100%', textAlign: 'center', padding: '10px 0' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{col.name}</span>
          </div>
        </div>
      </a>
    )
    return (
      <section style={{ backgroundColor, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && <h2 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 700, color: '#1a202c' }}>{headline}</h2>}
          {isStrip
            ? <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>{collections.map(card)}</div>
            : <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 20 }}>{collections.map(card)}</div>
          }
        </div>
      </section>
    )
  },
}
