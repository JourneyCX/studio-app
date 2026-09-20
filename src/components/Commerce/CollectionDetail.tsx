import { useEffect, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CollectionSelectField } from '../shared/CollectionSelectField'
import { ColorField } from '../shared/ColorField'
import { stratumApi, type StoreCollection, type StoreProduct } from '../../lib/api'
import { Card } from './ProductGrid'

export type CollectionDetailProps = {
  collectionSlug: string
  columns: number
  backgroundColor: string
}

// Pinned-prop shape, like ProductGrid's categorySlug — NOT a route-slug self-
// fetch like ProductDetail.tsx. This is what _sb_provision_collection_page()
// drops onto a collection's auto-provisioned page (see
// store_builder_sync_helper.php), and it can also be dragged onto any other
// page and pointed at any collection by hand via the picker below.
function useCollectionDetail(slug: string) {
  const [state, setState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'error' } |
    { status: 'success'; collection: StoreCollection; products: StoreProduct[] }
  >({ status: 'idle' })

  useEffect(() => {
    if (!slug) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    stratumApi.getActiveCollection(slug)
      .then(async ({ collection }) => {
        const ids = collection.product_ids ?? []
        const { products } = ids.length > 0
          ? await stratumApi.getActiveProducts({ include: ids })
          : { products: [] }
        if (!cancelled) setState({ status: 'success', collection, products })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => { cancelled = true }
  }, [slug])

  return state
}

export const CollectionDetail: ComponentConfig<CollectionDetailProps> = {
  label: 'Collection Detail',
  fields: {
    collectionSlug: {
      type: 'custom',
      label: 'Collection',
      render: ({ value, onChange }) => (
        <CollectionSelectField value={value as string} onChange={onChange as (v: string) => void} blankLabel="Select a collection…" />
      ),
    },
    columns:         { type: 'number', label: 'Columns (1–6)' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    collectionSlug:  '',
    columns:         3,
    backgroundColor: '#ffffff',
  },
  render({ collectionSlug, columns, backgroundColor }) {
    const state = useCollectionDetail(collectionSlug)

    if (state.status === 'idle') {
      return (
        <section style={{ backgroundColor, padding: '48px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', border: '2px dashed #e2e8f0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>
            Pick a collection from the field panel to preview it here.
          </div>
        </section>
      )
    }

    return (
      <section style={{ backgroundColor, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {state.status === 'loading' && <p style={{ fontSize: 13, color: '#718096' }}>Loading collection…</p>}
          {state.status === 'error' && <p style={{ fontSize: 12, color: '#dd6b20' }}>⚠ Couldn't load this collection.</p>}
          {state.status === 'success' && (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#1a202c' }}>{state.collection.name}</h2>
              {state.collection.description && (
                <p style={{ margin: '0 0 32px', fontSize: 15, color: '#4a5568', maxWidth: 700 }}>{state.collection.description}</p>
              )}
              {state.products.length === 0 ? (
                <p style={{ color: '#a0aec0', fontSize: 14, padding: 32, textAlign: 'center' }}>This collection has no products yet.</p>
              ) : (
                <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 24 }}>
                  {state.products.map((p, i) => <Card key={p.id} index={i} product={p} showAddToCart showPrices />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    )
  },
}
