import { useEffect, useState } from 'react'
import { stratumApi } from '../../lib/api'

// Product Category dropdown used by ProductGrid/ProductCarousel/ProductShowcase's
// categorySlug field. Fetches the tenant's real, live WooCommerce categories so a
// merchant picks a category by name instead of having to know/type a slug — falls
// back to a plain text input (rather than blocking the merchant) if the fetch fails,
// e.g. WooCommerce temporarily unreachable or no credentials configured yet.
export function CategorySelectField({ value, onChange, blankLabel }: {
  value: string
  onChange: (v: string) => void
  blankLabel: string
}) {
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }> | null>(null)
  const [failed, setFailed]         = useState(false)

  useEffect(() => {
    let cancelled = false
    stratumApi.getActiveCategories()
      .then(result => {
        if (!cancelled) setCategories(result.categories ?? [])
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => { cancelled = true }
  }, [])

  if (failed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="category-slug"
          style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
        />
        <span style={{ fontSize: 11, color: '#dd6b20' }}>
          ⚠ Couldn't load category list — enter the slug manually (see Warehouse ▸ Categories).
        </span>
      </div>
    )
  }

  if (!categories) {
    return (
      <select disabled style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, color: '#a0aec0' }}>
        <option>Loading categories…</option>
      </select>
    )
  }

  // A previously-saved slug that no longer matches any live category (deleted,
  // renamed, or set before WC was connected) — kept selectable rather than
  // silently discarded, so opening the panel doesn't quietly change the value.
  const hasStaleValue = value && !categories.some(c => c.slug === value)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, width: '100%' }}
    >
      <option value="">{blankLabel}</option>
      {hasStaleValue && <option value={value}>{value} (not found — may be deleted)</option>}
      {categories.map(c => (
        <option key={c.slug} value={c.slug}>{c.name}</option>
      ))}
    </select>
  )
}
