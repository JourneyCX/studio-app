import { useEffect, useState } from 'react'
import { stratumApi, type StoreCollection, type StoreProduct } from '../../lib/api'
import { ImageUploadField } from '../shared/ImageUploadField'

interface CollectionEditModalProps {
  collection: StoreCollection | null // null = creating a new collection
  onClose: () => void
  onSaved: (collection: StoreCollection) => void
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 10000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const panel: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, height: '86vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
}
const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }
const input: React.CSSProperties = { width: '100%', fontSize: 13.5, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }

// Member selection is kept as an ordered array of {id, name, image_url} —
// enough to render chips without re-fetching, but the API only ever wants
// the plain id list (see stratumApi.saveCollection's product_ids: number[]).
type PickedProduct = Pick<StoreProduct, 'id' | 'name' | 'image_url'>

export function CollectionEditModal({ collection, onClose, onSaved }: CollectionEditModalProps) {
  const [name, setName]               = useState(collection?.name ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [imageUrl, setImageUrl]       = useState(collection?.image_url ?? '')
  const [picked, setPicked]           = useState<PickedProduct[]>([])
  const [loadingMembers, setLoadingMembers] = useState(!!collection)
  const [search, setSearch]           = useState('')
  const [results, setResults]         = useState<StoreProduct[]>([])
  const [searching, setSearching]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // Existing collection: resolve its saved product_ids into real product data
  // (for the chip list) via the same products() endpoint the picker uses.
  useEffect(() => {
    if (!collection) return
    let cancelled = false
    stratumApi.getActiveCollection(collection.slug)
      .then(async ({ collection: full }) => {
        const ids = full.product_ids ?? []
        if (ids.length === 0) {
          if (!cancelled) setPicked([])
          return
        }
        const { products } = await stratumApi.getActiveProducts({ include: ids })
        // Preserve the saved order — getActiveProducts already returns WC's
        // orderby=include result, but re-sort defensively in case WC ever
        // drops that ordering guarantee for a partial/stale id.
        const byId = new Map(products.map(p => [p.id, p]))
        if (!cancelled) {
          setPicked(ids.map(id => byId.get(id)).filter((p): p is StoreProduct => !!p))
          setLoadingMembers(false)
        }
      })
      .catch(() => { if (!cancelled) setLoadingMembers(false) })
    return () => { cancelled = true }
  }, [collection])

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(() => {
      stratumApi.getActiveProducts({ search: search.trim(), perPage: 20 })
        .then(r => { if (!cancelled) setResults(r.products ?? []) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search])

  const addProduct = (p: StoreProduct) => {
    if (picked.some(x => x.id === p.id)) return
    setPicked(prev => [...prev, { id: p.id, name: p.name, image_url: p.image_url }])
  }
  const removeProduct = (id: number) => setPicked(prev => prev.filter(p => p.id !== id))

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await stratumApi.saveActiveCollection({
        id: collection?.id,
        name: trimmed,
        description: description.trim() || null,
        image_url: imageUrl || null,
        product_ids: picked.map(p => p.id),
      })
      onSaved(result.collection)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={{ ...input, borderColor: !name.trim() ? '#fca5a5' : '#e2e8f0' }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Golden Essentials" />
          </div>

          <div>
            <label style={label}>Description (optional)</label>
            <textarea style={{ ...input, minHeight: 64, resize: 'vertical', fontFamily: 'inherit' }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label style={label}>Image (optional)</label>
            <ImageUploadField value={imageUrl} onChange={setImageUrl} />
          </div>

          <div>
            <label style={label}>Products {picked.length > 0 && `(${picked.length})`}</label>
            {loadingMembers ? (
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '4px 0' }}>Loading current products…</p>
            ) : (
              <>
                {picked.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {picked.map(p => (
                      <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 6px 4px 4px', border: '1px solid #e2e8f0', borderRadius: 999, backgroundColor: '#f8fafc' }}>
                        {p.image_url
                          ? <img src={p.image_url} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#e2e8f0', display: 'inline-block' }} />}
                        {p.name}
                        <button onClick={() => removeProduct(p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 13, lineHeight: 1, padding: 0 }} title="Remove">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  style={input}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products to add…"
                />
                {searching && <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>Searching…</p>}
                {!searching && results.length > 0 && (
                  <div style={{ marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {results.map(p => {
                      const already = picked.some(x => x.id === p.id)
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                          {p.image_url
                            ? <img src={p.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                            : <span style={{ width: 28, height: 28, borderRadius: 4, background: '#f1f5f9', display: 'inline-block' }} />}
                          <span style={{ flex: 1, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <button
                            onClick={() => addProduct(p)}
                            disabled={already}
                            style={{ fontSize: 12, padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: already ? '#f1f5f9' : '#fff', color: already ? '#94a3b8' : '#2563eb', cursor: already ? 'default' : 'pointer', fontWeight: 600 }}
                          >
                            {already ? 'Added' : '+ Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
          {/* Lives in the footer (not the scrollable body above) so it's visible
              regardless of scroll position — the body's Name field can be scrolled
              out of view once Image/Products are showing, which is exactly how a
              real merchant reported "clicking Save does nothing": the button was
              silently HTML-disabled (empty Name), giving zero visible feedback. */}
          {!name.trim() && !error && (
            <span style={{ fontSize: 12, color: '#dc2626' }}>Name is required — scroll up to fill it in.</span>
          )}
          {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              backgroundColor: saving ? '#93c5fd' : !name.trim() ? '#cbd5e1' : '#2563eb',
              color: !name.trim() && !saving ? '#64748b' : '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}
