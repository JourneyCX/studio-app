import { useEffect, useState } from 'react'
import { stratumApi, type StoreProduct } from '../../lib/api'

export type DiscountTier = { minQty: number; discountPercent: number }
export type PriceCalcLineItem = {
  label: string
  description: string
  unitPrice: number
  unitLabel: string
  min: number
  max: number
  defaultQty: number
  step: number
  tiers?: DiscountTier[]
}

const BLANK_ITEM: PriceCalcLineItem = { label: 'Product / Service', description: '', unitPrice: 0, unitLabel: 'item', min: 0, max: 100, defaultQty: 1, step: 1, tiers: [] }

// Price Calculator's line-item editor. Puck's built-in `arrayFields` only binds
// one form control to one object key at a time, which can't set `label` and
// `unitPrice` together when a merchant picks a real product — same problem
// CategoryFilterListField solves for category pickers, so this is a single
// self-managed `custom` field instead of an `array` field. Falls back to plain
// manual entry (no dropdown) if the product fetch fails, same as
// CategoryFilterListField/CategorySelectField.
export function ProductPickerListField({ value, onChange }: {
  value: PriceCalcLineItem[]
  onChange: (v: PriceCalcLineItem[]) => void
}) {
  const [search, setSearch]     = useState('')
  const [products, setProducts] = useState<StoreProduct[] | null>(null)
  const [failed, setFailed]     = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set((value ?? []).map((_, i) => i)))

  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(() => {
      stratumApi.getActiveProducts({ perPage: 100, search: search || undefined })
        .then(result => { if (!cancelled) setProducts(result.products ?? []) })
        .catch(() => { if (!cancelled) setFailed(true) })
    }, 300)
    return () => { cancelled = true; clearTimeout(handle) }
  }, [search])

  const items = value ?? []

  function updateItem(i: number, patch: Partial<PriceCalcLineItem>) {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
    setExpanded(prev => {
      const next = new Set<number>()
      prev.forEach(idx => { if (idx < i) next.add(idx); else if (idx > i) next.add(idx - 1) })
      return next
    })
  }

  function addItem() {
    setExpanded(prev => new Set(prev).add(items.length))
    onChange([...items, { ...BLANK_ITEM, tiers: [] }])
  }

  function toggleExpanded(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function selectProduct(i: number, productId: string) {
    const product = products?.find(p => String(p.id) === productId)
    if (!product) return
    updateItem(i, { label: product.name, unitPrice: parseFloat(product.price) || 0 })
  }

  function updateTier(i: number, tIdx: number, patch: Partial<DiscountTier>) {
    const tiers = items[i]?.tiers ?? []
    updateItem(i, { tiers: tiers.map((t, idx) => (idx === tIdx ? { ...t, ...patch } : t)) })
  }

  function removeTier(i: number, tIdx: number) {
    const tiers = items[i]?.tiers ?? []
    updateItem(i, { tiers: tiers.filter((_, idx) => idx !== tIdx) })
  }

  function addTier(i: number) {
    const tiers = items[i]?.tiers ?? []
    updateItem(i, { tiers: [...tiers, { minQty: 10, discountPercent: 5 }] })
  }

  const inputStyle: React.CSSProperties = { width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4, boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#718096', marginBottom: 2, display: 'block', fontWeight: 600 }
  const fieldWrap: React.CSSProperties  = { marginBottom: 8 }
  const rowStyle: React.CSSProperties   = { display: 'flex', gap: 8 }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
          <div
            onClick={() => toggleExpanded(i)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f7fafc', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2d3748' }}>
              {expanded.has(i) ? '▾' : '▸'} {item.label || 'Product / Service'} × {item.defaultQty}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(i) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 15, padding: '0 4px' }}
            >
              ×
            </button>
          </div>

          {expanded.has(i) && (
            <div style={{ padding: 10 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Product (optional — pick to auto-fill name &amp; price)</label>
                {failed ? (
                  <div style={{ fontSize: 11, color: '#dd6b20', marginBottom: 4 }}>
                    ⚠ Couldn't load your product catalog — enter details manually below.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search products…"
                      style={{ ...inputStyle, marginBottom: 4 }}
                    />
                    <select value="" disabled={!products} onChange={e => selectProduct(i, e.target.value)} style={inputStyle}>
                      <option value="">{products ? 'Select a product…' : 'Loading…'}</option>
                      {products?.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name} — {p.price}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Item Name</label>
                <input type="text" value={item.label} onChange={e => updateItem(i, { label: e.target.value })} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Description (optional)</label>
                <input type="text" value={item.description} onChange={e => updateItem(i, { description: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ ...rowStyle, ...fieldWrap }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Unit Price</label>
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Unit Label</label>
                  <input type="text" value={item.unitLabel} onChange={e => updateItem(i, { unitLabel: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ ...rowStyle, ...fieldWrap }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Minimum Qty</label>
                  <input type="number" value={item.min} onChange={e => updateItem(i, { min: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Maximum Qty</label>
                  <input type="number" value={item.max} onChange={e => updateItem(i, { max: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div style={{ ...rowStyle, ...fieldWrap }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Default Qty</label>
                  <input type="number" value={item.defaultQty} onChange={e => updateItem(i, { defaultQty: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Step Size</label>
                  <input type="number" value={item.step} onChange={e => updateItem(i, { step: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Volume Discount Tiers</label>
                {(item.tiers ?? []).map((tier, tIdx) => (
                  <div key={tIdx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <input
                      type="number"
                      value={tier.minQty}
                      onChange={e => updateTier(i, tIdx, { minQty: Number(e.target.value) })}
                      placeholder="Min qty"
                      style={{ ...inputStyle, width: 70 }}
                    />
                    <span style={{ fontSize: 11, color: '#718096' }}>units →</span>
                    <input
                      type="number"
                      value={tier.discountPercent}
                      onChange={e => updateTier(i, tIdx, { discountPercent: Number(e.target.value) })}
                      placeholder="%"
                      style={{ ...inputStyle, width: 60 }}
                    />
                    <span style={{ fontSize: 11, color: '#718096' }}>% off</span>
                    <button
                      type="button"
                      onClick={() => removeTier(i, tIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 14, padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTier(i)}
                  style={{ fontSize: 11, padding: '4px 8px', border: '1px dashed #a0aec0', borderRadius: 4, background: 'none', cursor: 'pointer', color: '#4a5568' }}
                >
                  + Add discount tier
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        style={{ fontSize: 12, padding: '6px 12px', border: '1px dashed #a0aec0', borderRadius: 4, background: 'none', cursor: 'pointer', color: '#4a5568' }}
      >
        + Add line item
      </button>
    </div>
  )
}
