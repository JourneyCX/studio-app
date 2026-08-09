import { useEffect, useState } from 'react'
import { stratumApi, type StoreProduct } from '../api'

// Shared by ProductGrid/ProductCarousel/ProductShowcase's live-preview render —
// fetches the tenant's real synced products so the Puck editor shows what the
// live storefront already shows, instead of only ever rendering fake placeholder
// cards. Modeled on CategorySelectField's fetch-on-mount + cancelled-flag pattern.
export type UseTenantProductsResult =
  | { status: 'loading'; products: StoreProduct[] }
  | { status: 'error'; products: StoreProduct[] }
  | { status: 'empty'; products: StoreProduct[] }
  | { status: 'success'; products: StoreProduct[] }

// enabled=false skips the fetch entirely — used when a widget's "Show Placeholder"
// is on, so previewing fake layout doesn't also poll WooCommerce in the background.
export function useTenantProducts(categorySlug: string, count: number, enabled: boolean = true): UseTenantProductsResult {
  const [state, setState] = useState<UseTenantProductsResult>({ status: 'loading', products: [] })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState({ status: 'loading', products: [] })
    stratumApi.getActiveProducts({ categorySlug: categorySlug || undefined, perPage: count })
      .then(result => {
        if (cancelled) return
        const products = result.products ?? []
        setState(products.length === 0 ? { status: 'empty', products: [] } : { status: 'success', products })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', products: [] })
      })
    return () => { cancelled = true }
  }, [categorySlug, count, enabled])

  return state
}
