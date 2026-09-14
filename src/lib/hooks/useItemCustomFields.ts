import { useEffect, useState } from 'react'
import { stratumApi } from '../api'

export type ItemCustomField = { id: number; name: string; slug: string }

// Backs ProductTabs' field picker — fetches the tenant's real Warehouse item
// Custom Fields (Setup > Custom Fields, "belongs to" = Items) each time the
// picker opens, same fetch-on-mount pattern as useTenantProducts, so a theme
// designer always sees the current, real field list rather than a stale or
// hardcoded one.
export type UseItemCustomFieldsResult =
  | { status: 'loading'; fields: ItemCustomField[] }
  | { status: 'error'; fields: ItemCustomField[] }
  | { status: 'success'; fields: ItemCustomField[] }

export function useItemCustomFields(): UseItemCustomFieldsResult {
  const [state, setState] = useState<UseItemCustomFieldsResult>({ status: 'loading', fields: [] })

  useEffect(() => {
    let cancelled = false
    stratumApi.getActiveItemCustomFields()
      .then(result => {
        if (cancelled) return
        setState({ status: 'success', fields: result.fields ?? [] })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', fields: [] })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
