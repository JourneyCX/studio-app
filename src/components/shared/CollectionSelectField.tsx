import { useEffect, useState } from 'react'
import { stratumApi } from '../../lib/api'

// Collection dropdown used by CollectionDetail's collectionSlug field — copy-
// modified from CategorySelectField.tsx (same fetch/fallback/stale-value
// behavior), swapping in getActiveCollections(). Only published collections
// are meaningfully linkable (an unpublished one has no page_slug yet), but
// every collection is listed so a merchant can pick one before publishing it.
export function CollectionSelectField({ value, onChange, blankLabel }: {
  value: string
  onChange: (v: string) => void
  blankLabel: string
}) {
  const [collections, setCollections] = useState<Array<{ name: string; slug: string; is_published: boolean }> | null>(null)
  const [failed, setFailed]           = useState(false)

  useEffect(() => {
    let cancelled = false
    stratumApi.getActiveCollections()
      .then(result => {
        if (!cancelled) setCollections(result.collections ?? [])
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
          placeholder="collection-slug"
          style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
        />
        <span style={{ fontSize: 11, color: '#dd6b20' }}>
          ⚠ Couldn't load collection list — enter the slug manually (see the Collections panel).
        </span>
      </div>
    )
  }

  if (!collections) {
    return (
      <select disabled style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, color: '#a0aec0' }}>
        <option>Loading collections…</option>
      </select>
    )
  }

  const hasStaleValue = value && !collections.some(c => c.slug === value)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, width: '100%' }}
    >
      <option value="">{blankLabel}</option>
      {hasStaleValue && <option value={value}>{value} (not found — may be deleted)</option>}
      {collections.map(c => (
        <option key={c.slug} value={c.slug}>{c.name}{c.is_published ? '' : ' (unpublished)'}</option>
      ))}
    </select>
  )
}
