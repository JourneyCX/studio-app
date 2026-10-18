import { useEffect, useState } from 'react'
import { stratumApi, type StoreProduct } from '../../lib/api'

// One chosen product. The name is stored so the field can always show what was picked; the id loads
// the card in the editor, and the slug is what the live storefront looks the product up by.
export type ProductRef = { id: number; slug: string; name: string } | null

const inputStyle: React.CSSProperties = { width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, boxSizing: 'border-box' }

// Single-product picker for blocks that show one specific product. Searches the tenant's real
// products (same source as ProductPickerListField); a failed load keeps the current pick and says so.
export function ProductSelectField({ value, onChange }: { value: ProductRef; onChange: (v: ProductRef) => void }) {
  const [search, setSearch]     = useState('')
  const [products, setProducts] = useState<StoreProduct[] | null>(null)
  const [failed, setFailed]     = useState(false)

  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(() => {
      stratumApi.getActiveProducts({ perPage: 50, search: search || undefined })
        .then(result => { if (!cancelled) { setProducts(result.products ?? []); setFailed(false) } })
        .catch(() => { if (!cancelled) setFailed(true) })
    }, 300)
    return () => { cancelled = true; clearTimeout(handle) }
  }, [search])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: value ? '#2d3748' : '#a0aec0' }}>{value ? value.name : 'No product picked'}</span>
        {value && (
          <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 12 }}>
            Clear
          </button>
        )}
      </div>
      {failed && <div style={{ fontSize: 11, color: '#dd6b20', marginBottom: 4 }}>⚠ Couldn't load your products.</div>}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ ...inputStyle, marginBottom: 4 }} />
      <select
        value=""
        disabled={!products}
        onChange={e => {
          const p = products?.find(x => String(x.id) === e.target.value)
          if (p) onChange({ id: p.id, slug: p.slug, name: p.name })
        }}
        style={inputStyle}
      >
        <option value="">{products ? 'Pick a product…' : 'Loading…'}</option>
        {products?.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
      </select>
    </div>
  )
}
