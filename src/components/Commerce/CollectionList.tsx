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
  // Live mode only. Ids of the collections to show, in the order picked; empty
  // or absent = every collection (what a page saved before this field existed
  // did). maxItems then caps the list; 0 or absent = no cap.
  collectionIds?: number[]
  maxItems?: number
}

// Picks which live collections the list shows. The order they are ticked in is
// the order they display in.
function CollectionPickerField({ value, onChange }: { value: number[] | undefined; onChange: (v: number[]) => void }) {
  const live = useTenantCollections()
  const picked = Array.isArray(value) ? value : []

  if (live.status === 'loading') return <p style={{ fontSize: 12, color: '#718096' }}>Loading collections…</p>
  if (live.status === 'error') return <p style={{ fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load collections.</p>
  if (live.status === 'empty') return <p style={{ fontSize: 12, color: '#718096' }}>No collections yet — create one in the Collections panel.</p>

  const toggle = (id: number) => onChange(picked.includes(id) ? picked.filter(p => p !== id) : [...picked, id])

  return (
    <div>
      <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px' }}>
        {picked.length === 0 ? 'None picked: every collection is shown.' : `${picked.length} picked, shown in the order ticked.`}
      </p>
      {live.collections.map(c => {
        const pos = picked.indexOf(c.id)
        return (
          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={pos !== -1} onChange={() => toggle(c.id)} />
            <span style={{ flex: 1 }}>{c.name}{!c.page_slug && ' (not yet published)'}</span>
            {pos !== -1 && <span style={{ fontSize: 11, color: '#718096' }}>#{pos + 1}</span>}
          </label>
        )
      })}
      {picked.length > 0 && (
        <button type="button" onClick={() => onChange([])} style={{ marginTop: 6, fontSize: 12, background: 'none', border: 'none', color: '#2b6cb0', cursor: 'pointer', padding: 0 }}>
          Clear picks (show all)
        </button>
      )}
    </div>
  )
}

// Same rule the storefront applies, so the canvas matches the live page.
function pickLive(all: StoreCollection[], ids: number[] | undefined, maxItems: number | undefined): StoreCollection[] {
  const picked = Array.isArray(ids) ? ids : []
  let list = picked.length === 0
    ? all
    : picked.map(id => all.find(c => c.id === id)).filter((c): c is StoreCollection => !!c)
  const max = Number(maxItems) || 0
  if (max > 0) list = list.slice(0, max)
  return list
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
    collectionIds:   { type: 'custom', label: 'Collections to show (Live mode)', render: ({ value, onChange }) => <CollectionPickerField value={value as number[] | undefined} onChange={onChange as (v: number[]) => void} /> },
    maxItems:        { type: 'number', label: 'Max collections to show (0 = no limit, Live mode)', min: 0 },
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
    collectionIds:   [],
    maxItems:        0,
    columns:         3,
    backgroundColor: '#ffffff',
    layout:          'grid',
    collections: [
      { name: 'New Arrivals',   imageUrl: '', url: '/category/new' },
      { name: 'Best Sellers',   imageUrl: '', url: '/category/best' },
      { name: 'Sale',           imageUrl: '', url: '/category/sale' },
    ],
  },
  render({ headline, mode, collections, columns, backgroundColor, layout, collectionIds, maxItems }) {
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
      body = pickLive(live.collections, collectionIds, maxItems).map((c, i) => liveCard(c, i, isStrip))
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
