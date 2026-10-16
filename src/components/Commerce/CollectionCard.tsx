import { useEffect, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CollectionSelectField } from '../shared/CollectionSelectField'
import { stratumApi, type StoreCollection } from '../../lib/api'

export type CollectionCardProps = {
  collectionSlug: string
  height: number
  showItemCount: 'yes' | 'no'
}

// One live collection as a single image card, for dropping into a column or
// any other single slot. Pinned-prop shape like CollectionDetail (the slug is
// picked with the same CollectionSelectField); the card look matches
// CollectionList's live tile. No section padding or max-width: the parent
// column decides the width.
export const CollectionCard: ComponentConfig<CollectionCardProps> = {
  label: 'Collection Card',
  fields: {
    collectionSlug: {
      type: 'custom',
      label: 'Collection',
      render: ({ value, onChange }) => (
        <CollectionSelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="Select a collection…" />
      ),
    },
    height: { type: 'number', label: 'Card Height (px)' },
    showItemCount: {
      type: 'radio',
      label: 'Show item count',
      options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
    },
  },
  defaultProps: {
    collectionSlug: '',
    height:         280,
    showItemCount:  'yes',
  },
  render({ collectionSlug, height, showItemCount }) {
    const [state, setState] = useState<
      { status: 'idle' } | { status: 'loading' } | { status: 'error' } |
      { status: 'success'; collection: StoreCollection }
    >({ status: 'idle' })

    useEffect(() => {
      if (!collectionSlug) {
        setState({ status: 'idle' })
        return
      }
      let cancelled = false
      setState({ status: 'loading' })
      stratumApi.getActiveCollection(collectionSlug)
        .then(({ collection }) => { if (!cancelled) setState({ status: 'success', collection }) })
        .catch(() => { if (!cancelled) setState({ status: 'error' }) })
      return () => { cancelled = true }
    }, [collectionSlug])

    const box: React.CSSProperties = { borderRadius: 8, overflow: 'hidden', position: 'relative', height: height || 280 }

    if (state.status === 'idle') {
      return (
        <div style={{ ...box, border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: 14, textAlign: 'center', padding: 16 }}>
          Pick a collection from the field panel.
        </div>
      )
    }
    if (state.status === 'loading') return <div style={{ ...box, background: 'hsl(0, 25%, 92%)' }} />
    if (state.status === 'error') return <p style={{ fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load this collection.</p>

    const c = state.collection
    const count = c.item_count ?? c.product_ids?.length ?? 0
    const href = c.page_slug ? `/${c.page_slug}` : undefined
    const content = (
      <div style={{ ...box, background: 'hsl(0, 25%, 88%)', display: 'flex', alignItems: 'flex-end' }}>
        {c.image_url && <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.35)', width: '100%', textAlign: 'center', padding: '10px 0' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, display: 'block' }}>{c.name}</span>
          {showItemCount !== 'no' && (
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>
              {count} item{count === 1 ? '' : 's'}{!href && ' · not yet published'}
            </span>
          )}
        </div>
      </div>
    )
    return href
      ? <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{content}</a>
      : <div style={{ cursor: 'default' }}>{content}</div>
  },
}
