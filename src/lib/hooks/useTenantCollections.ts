import { useEffect, useState } from 'react'
import { stratumApi, onWorkingThemeChange, type StoreCollection } from '../api'

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

  // Re-fetches when the designer changes "Working on theme" (api.ts), so the
  // canvas never keeps showing the previous theme's collections.
  const [themeTick, setThemeTick] = useState(0)
  useEffect(() => onWorkingThemeChange(() => setThemeTick(t => t + 1)), [])

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', collections: [] })
    stratumApi.getWorkingThemeCollections()
      .then(result => {
        if (cancelled) return
        const collections = result.collections ?? []
        setState(collections.length === 0 ? { status: 'empty', collections: [] } : { status: 'success', collections })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', collections: [] })
      })
    return () => { cancelled = true }
  }, [themeTick])

  return state
}
