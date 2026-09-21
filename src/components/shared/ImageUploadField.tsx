import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { stratumApi, type PixabayPhoto } from '../../lib/api'

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    background: active ? '#ebf4ff' : 'transparent',
    color: active ? '#2b6cb0' : '#718096',
    border: '1px solid ' + (active ? '#bee3f8' : '#e2e8f0'),
  }
}

export function ImageUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'upload' | 'pixabay'>('upload')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery]           = useState('')
  const [photos, setPhotos]         = useState<PixabayPhoto[]>([])
  const [searching, setSearching]   = useState(false)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [pixabayError, setPixabayError] = useState('')
  const [galleryOpen, setGalleryOpen] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await stratumApi.uploadActiveImage(file)
      if (result.url) {
        onChange(result.url)
      } else {
        setError(result.error ?? 'Upload failed')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setPixabayError('')
    try {
      const result = await stratumApi.searchActiveStockPhotos(query.trim())
      if (result.photos) {
        setPhotos(result.photos)
        setGalleryOpen(result.photos.length > 0)
      } else {
        setPixabayError(result.error ?? 'Search failed')
      }
    } catch (err: unknown) {
      setPixabayError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  // Shows the already-loaded preview thumbnail immediately (no wait — it's
  // already in the browser from the search response), then swaps to the
  // real stored WebP once the server-side download/convert (typically
  // sub-second to a couple of seconds — see
  // docs/specs/Stratum_Pixabay_Stock_Photo_Integration_Spec_v1.0.md §8)
  // finishes. The server never receives a URL from this call — only the
  // Pixabay photo ID.
  async function handleApply(photo: PixabayPhoto) {
    setApplyingId(photo.id)
    setPixabayError('')
    if (photo.webformatURL) onChange(photo.webformatURL)
    try {
      const result = await stratumApi.applyActiveStockPhoto(photo.id)
      if (result.url) {
        onChange(result.url)
        setGalleryOpen(false)
      } else {
        setPixabayError(result.error ?? 'Could not apply this photo')
      }
    } catch (err: unknown) {
      setPixabayError(err instanceof Error ? err.message : 'Could not apply this photo')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or use a source below"
          style={{ flex: 1, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" onClick={() => setTab('upload')} style={tabButtonStyle(tab === 'upload')}>
          Upload
        </button>
        <button type="button" onClick={() => setTab('pixabay')} style={tabButtonStyle(tab === 'pixabay')}>
          🔍 Search Pixabay
        </button>
      </div>

      {tab === 'upload' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: uploading ? 'default' : 'pointer',
            fontSize: 12, padding: '5px 12px', borderRadius: 4,
            background: uploading ? '#e2e8f0' : '#ebf4ff', color: uploading ? '#a0aec0' : '#2b6cb0',
            border: '1px solid ' + (uploading ? '#e2e8f0' : '#bee3f8'),
          }}>
            {uploading ? '⏳ Uploading…' : '📁 Upload image'}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={handleFile}
            />
          </label>
          {value && (
            <img src={value} alt="" style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' }} />
          )}
        </div>
      )}

      {tab === 'pixabay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Deliberately NOT a <form> — Puck's own Fields sidebar (DefaultFields,
              @measured/puck) already wraps every custom field in its own <form>,
              and HTML doesn't support nested forms: the browser silently drops a
              nested <form> open tag, so a type="submit" button here would submit
              Puck's outer form instead, causing a real page navigation and
              stripping the JWT session token the editor was opened with
              ("No session token found" — confirmed live 2026-09-10). Enter-to-
              search is wired via onKeyDown instead of relying on form submit. */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
              placeholder="Search free stock photos…"
              style={{ flex: 1, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 4,
                background: searching ? '#e2e8f0' : '#ebf4ff', color: searching ? '#a0aec0' : '#2b6cb0',
                border: '1px solid ' + (searching ? '#e2e8f0' : '#bee3f8'),
              }}
            >
              {searching ? '⏳' : 'Search'}
            </button>
          </div>

          {photos.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 4,
                  background: '#ebf4ff', color: '#2b6cb0', border: '1px solid #bee3f8', cursor: 'pointer',
                }}
              >
                🖼️ Browse {photos.length} result{photos.length === 1 ? '' : 's'}
              </button>
              <span style={{ fontSize: 11, color: '#a0aec0' }}>Opens a bigger, scrollable view</span>
            </div>
          )}

          {pixabayError && <span style={{ fontSize: 11, color: '#e53e3e' }}>{pixabayError}</span>}
          <span style={{ fontSize: 11, color: '#a0aec0' }}>Free stock photos via Pixabay — no attribution required</span>
        </div>
      )}

      {error && <span style={{ fontSize: 11, color: '#e53e3e' }}>{error}</span>}
      {tab === 'upload' && <span style={{ fontSize: 11, color: '#a0aec0' }}>Max 10 MB · jpg, png, webp, gif</span>}

      {galleryOpen && (
        <PixabayGalleryModal
          photos={photos}
          query={query}
          selectedUrl={value}
          applyingId={applyingId}
          error={pixabayError}
          onSelect={handleApply}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}

// Full-screen lightbox for browsing Pixabay results at a readable size — the
// inline sidebar grid is too narrow (~260px) to tell similar thumbnails
// apart. Rendered via a portal so it escapes Puck's sidebar overflow/scroll
// container instead of being clipped inside it.
function PixabayGalleryModal({
  photos,
  query,
  selectedUrl,
  applyingId,
  error,
  onSelect,
  onClose,
}: {
  photos: PixabayPhoto[]
  query: string
  selectedUrl: string
  applyingId: number | null
  error: string
  onSelect: (photo: PixabayPhoto) => void
  onClose: () => void
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8, width: '100%', maxWidth: 900, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
            Pixabay results{query ? ` for "${query}"` : ''}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              fontSize: 14, width: 28, height: 28, borderRadius: 4, cursor: 'pointer',
              background: 'transparent', color: '#718096', border: '1px solid #e2e8f0',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto' }}>
          {error && <div style={{ fontSize: 12, color: '#e53e3e', marginBottom: 10 }}>{error}</div>}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12,
          }}>
            {photos.map(photo => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onSelect(photo)}
                disabled={applyingId !== null}
                title={photo.tags}
                style={{
                  padding: 0, position: 'relative', overflow: 'hidden', aspectRatio: '1', borderRadius: 6,
                  background: '#f7fafc', cursor: applyingId !== null ? 'default' : 'pointer',
                  border: selectedUrl === photo.webformatURL ? '3px solid #2b6cb0' : '1px solid #e2e8f0',
                }}
              >
                {(photo.webformatURL || photo.previewURL) && (
                  <img
                    src={photo.webformatURL ?? photo.previewURL ?? undefined}
                    alt={photo.tags}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: applyingId === photo.id ? 0.5 : 1 }}
                  />
                )}
                {photo.tags && (
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    padding: '4px 6px', fontSize: 11, color: '#fff', textAlign: 'left',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {photo.tags}
                  </span>
                )}
                {applyingId === photo.id && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    ⏳
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#a0aec0' }}>
          Click a photo to use it · Free stock photos via Pixabay — no attribution required
        </div>
      </div>
    </div>,
    document.body,
  )
}
