import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'
import { useTenantCollections } from '../../lib/hooks/useTenantCollections'
import type { StoreCollection } from '../../lib/api'

type Collection = { name: string; imageUrl: string; url: string }

export type CollectionListProps = {
  headline: string
  // 'manual' (default, absent === manual — see defaultProps) is the original
  // hand-typed-tiles behaviour, unchanged. 'live' resolves real, published
  // collections from the tenant's own Collections manager instead — added
  // additively so every already-published page using this widget (which has
  // no `mode` key at all in its stored puck_json) keeps rendering exactly as
  // it did before this field existed.
  mode?: 'manual' | 'live'
  collections: Collection[]
  columns: number
  backgroundColor: string
  // `layout` was part of an earlier schema some live themes were authored against.
  // 'grid' matches the existing (default) CSS-grid rendering; 'strip' is a new
  // horizontally-scrolling row, added additively so stored 'strip' values render
  // meaningfully instead of silently falling back to grid.
  layout?: 'grid' | 'strip'
}

function liveCard(c: StoreCollection, i: number, isStrip: boolean) {
  const href = c.page_slug ? `/${c.page_slug}` : undefined
  const content = (
    <div style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', height: 200, background: `hsl(${i * 60}, 25%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {c.image_url && <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.35)', width: '100%', textAlign: 'center', padding: '10px 0' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, display: 'block' }}>{c.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>
          {c.item_count ?? 0} item{(c.item_count ?? 0) === 1 ? '' : 's'}{!href && ' · not yet published'}
        </span>
      </div>
    </div>
  )
  const style: React.CSSProperties = { textDecoration: 'none', ...(isStrip ? { flex: '0 0 220px' } : {}) }
  return href
    ? <a key={c.id} href={href} style={style}>{content}</a>
    : <div key={c.id} style={{ ...style, cursor: 'default' }}>{content}</div>
}

export const CollectionList: ComponentConfig<CollectionListProps> = {
  label: 'Collection List',
  fields: {
    headline:        { type: 'text',   label: 'Section Headline' },
    mode: {
      type: 'radio',
      label: 'Collections Source',
      options: [
        { label: 'Manual tiles', value: 'manual' },
        { label: 'Live (from Collections manager)', value: 'live' },
      ],
    },
    columns:         { type: 'number', label: 'Columns' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    layout:          { type: 'select', label: 'Layout', options: [{ label: 'Grid', value: 'grid' }, { label: 'Scrolling Strip', value: 'strip' }] },
    collections: {
      type: 'array',
      label: 'Collections (Manual mode only)',
      arrayFields: {
        name:     { type: 'text', label: 'Name' },
        imageUrl: { type: 'custom', label: 'Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        url:      { type: 'text', label: 'Link URL' },
      },
    },
  },
  defaultProps: {
    headline:        'Shop by Category',
    mode:            'manual',
    columns:         3,
    backgroundColor: '#ffffff',
    layout:          'grid',
    collections: [
      { name: 'New Arrivals',   imageUrl: '', url: '/category/new' },
      { name: 'Best Sellers',   imageUrl: '', url: '/category/best' },
      { name: 'Sale',           imageUrl: '', url: '/category/sale' },
    ],
  },
  render({ headline, mode, collections, columns, backgroundColor, layout }) {
    const isStrip = layout === 'strip'
    // ?? not || : a page saved before `mode` existed has no key at all and
    // must keep rendering the manual tiles exactly as it did before.
    const isLive = (mode ?? 'manual') === 'live'
    const live = useTenantCollections()

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

    let body: React.ReactNode
    if (!isLive) {
      body = collections.map(card)
    } else if (live.status === 'loading') {
      body = Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{ borderRadius: 8, height: 200, background: `hsl(${i * 60}, 25%, 92%)` }} />
      ))
    } else if (live.status === 'error') {
      body = <p style={{ gridColumn: '1 / -1', fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load collections.</p>
    } else if (live.status === 'empty') {
      body = <p style={{ gridColumn: '1 / -1', color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>No collections yet — create one in the Collections panel.</p>
    } else {
      body = live.collections.map((c, i) => liveCard(c, i, isStrip))
    }

    return (
      <section style={{ backgroundColor, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && <h2 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 700, color: '#1a202c' }}>{headline}</h2>}
          {isStrip
            ? <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>{body}</div>
            // sb-grid (styles/responsive.css) collapses this to 1 column on mobile
            // and 2 on tablet regardless of the merchant's chosen column count —
            // desktop keeps whatever `columns` picks.
            : <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 20 }}>{body}</div>
          }
        </div>
      </section>
    )
  },
}
