import { useEffect, useState } from 'react'
import { stratumApi, type StoreCollection } from '../api'

// Modeled directly on useTenantProducts.ts — fetch-on-mount + cancelled-flag
// pattern, used by CollectionList's 'live' mode to show real, published
// collections instead of hand-typed tiles.
export type UseTenantCollectionsResult =
  | { status: 'loading'; collections: StoreCollection[] }
  | { status: 'error'; collections: StoreCollection[] }
  | { status: 'empty'; collections: StoreCollection[] }
  | { status: 'success'; collections: StoreCollection[] }

export function useTenantCollections(): UseTenantCollectionsResult {
  const [state, setState] = useState<UseTenantCollectionsResult>({ status: 'loading', collections: [] })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', collections: [] })
    stratumApi.getActiveCollections()
      .then(result => {
        if (cancelled) return
        const collections = result.collections ?? []
        setState(collections.length === 0 ? { status: 'empty', collections: [] } : { status: 'success', collections })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', collections: [] })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
