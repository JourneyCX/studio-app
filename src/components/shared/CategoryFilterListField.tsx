import { useEffect, useState } from 'react'
import { stratumApi } from '../../lib/api'

export type FilterCategory = { label: string; slug: string; count: number }

// ProductFilter's "Categories" list editor. Puck's built-in `arrayFields` only
// binds one form control to one object key at a time, which can't set `label`
// and `slug` together when a merchant picks a real category — so this is a single
// self-managed `custom` field instead of an `array` field, mirroring
// CategorySelectField's fetch-on-mount pattern but driving a whole list. Falls
// back to free-text label entry (no slug) if the category fetch fails, same as
// CategorySelectField, rather than blocking the merchant from editing at all.
export function CategoryFilterListField({ value, onChange }: {
  value: FilterCategory[]
  onChange: (v: FilterCategory[]) => void
}) {
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }> | null>(null)
  const [failed, setFailed]         = useState(false)

  useEffect(() => {
    let cancelled = false
    stratumApi.getActiveCategories()
      .then(result => { if (!cancelled) setCategories(result.categories ?? []) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const items = value ?? []

  function updateItem(i: number, patch: Partial<FilterCategory>) {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function addItem() {
    const used = new Set(items.map(i => i.slug))
    const next = categories?.find(c => !used.has(c.slug))
    onChange([...items, next ? { label: next.name, slug: next.slug, count: 0 } : { label: 'Category', slug: '', count: 0 }])
  }

  const rowStyle: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }
  const selectStyle: React.CSSProperties = { flex: 1, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }
  const countStyle: React.CSSProperties = { width: 56, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={rowStyle}>
          {failed ? (
            <input
              type="text"
              value={item.label}
              onChange={e => updateItem(i, { label: e.target.value })}
              placeholder="Category name"
              style={selectStyle}
            />
          ) : !categories ? (
            <select disabled style={{ ...selectStyle, color: '#a0aec0' }}><option>Loading…</option></select>
          ) : (
            <select
              value={item.slug}
              onChange={e => {
                const chosen = categories.find(c => c.slug === e.target.value)
                updateItem(i, { slug: e.target.value, label: chosen?.name ?? item.label })
              }}
              style={selectStyle}
            >
              <option value="">{item.label || 'Select a category…'}</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={item.count}
            onChange={e => updateItem(i, { count: Number(e.target.value) })}
            title="Product Count (display only)"
            style={countStyle}
          />
          <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 16, padding: '0 4px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={{ fontSize: 12, padding: '5px 10px', border: '1px dashed #a0aec0', borderRadius: 4, background: 'none', cursor: 'pointer', color: '#4a5568' }}>
        + Add category
      </button>
      {failed && (
        <div style={{ fontSize: 11, color: '#dd6b20', marginTop: 4 }}>
          ⚠ Couldn't load category list — enter names manually (see Warehouse ▸ Categories).
        </div>
      )}
    </div>
  )
}
