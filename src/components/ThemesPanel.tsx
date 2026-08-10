import { useEffect, useState } from 'react'
import { stratumApi, STRATUM_ORIGIN } from '../lib/api'
import type { StoreTheme } from '../lib/api'

// preview_image comes back as a path relative to the PHP admin's own site root
// (e.g. "uploads/store_theme_manager/theme_15_preview.jpg") — fine for the
// same-origin admin Theme Manager list, but Studio is cross-origin and needs
// the absolute URL.
function resolvePreviewUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${STRATUM_ORIGIN}/${path.replace(/^\/+/, '')}`
}

interface ThemesPanelProps {
  tenantId: number
  token: string
  onClose: () => void
  // Applying a theme rewrites every page slot + site_settings chrome at once —
  // simplest and safest is a full reload of the editor rather than trying to
  // patch every affected surface in place (mirrors the PHP wizard's own
  // window.location.reload() after apply_theme_to_tenant()).
  onApplied: () => void
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const panel: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 980, maxHeight: '90vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
}

export function ThemesPanel({ tenantId, token, onClose, onApplied }: ThemesPanelProps) {
  const [themes, setThemes]   = useState<StoreTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [applying, setApplying]   = useState<string | null>(null)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    stratumApi.getThemes(tenantId, token)
      .then(r => setThemes(r.themes))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load themes'))
      .finally(() => setLoading(false))
  }, [tenantId, token])

  const handleApplyClick = (theme: StoreTheme) => {
    if (confirmId !== theme.id) {
      setConfirmId(theme.id)
      setApplyError('')
      return
    }
    setApplying(theme.id)
    setApplyError('')
    stratumApi.applyTheme(tenantId, theme.id, token).then(result => {
      if (result.success) {
        onApplied()
      } else {
        setApplying(null)
        setApplyError(result.message || 'Failed to apply theme.')
      }
    })
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#0f172a' }}>Themes</h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Apply a whole-site theme — header, footer, and every page layout at once. Designed
              in admin Theme Manager.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', backgroundColor: '#f1f5f9',
              cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
          {loadError ? (
            <div style={{ textAlign: 'center', padding: '52px 24px', color: '#dc2626', fontSize: 13 }}>
              {loadError}
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '52px 24px', color: '#94a3b8', fontSize: 13 }}>
              Loading themes…
            </div>
          ) : themes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 24px', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
              <p style={{ fontSize: 15, margin: 0 }}>No published themes yet.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18,
            }}>
              {themes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isApplying={applying === theme.id}
                  isConfirming={confirmId === theme.id}
                  confirmError={confirmId === theme.id ? applyError : ''}
                  onApplyClick={() => handleApplyClick(theme)}
                  onCancelConfirm={() => { setConfirmId(null); setApplyError('') }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ThemeCardProps {
  theme: StoreTheme
  isApplying: boolean
  isConfirming: boolean
  confirmError: string
  onApplyClick: () => void
  onCancelConfirm: () => void
}

function ThemeCard({ theme, isApplying, isConfirming, confirmError, onApplyClick, onCancelConfirm }: ThemeCardProps) {
  return (
    <div style={{
      border: `1px solid ${isConfirming ? '#2563eb' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden',
      backgroundColor: '#fff', display: 'flex', flexDirection: 'column',
      boxShadow: isConfirming ? '0 0 0 3px rgba(37,99,235,0.18)' : 'none',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      {/* Preview */}
      <div style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        {theme.preview_image ? (
          <img
            src={resolvePreviewUrl(theme.preview_image)}
            alt={theme.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 36, color: '#cbd5e1',
          }}>
            🎨
          </div>
        )}
        {theme.is_active && (
          <span style={{
            position: 'absolute', top: 8, right: 8, backgroundColor: '#16a34a', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Active
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '13px 15px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, flex: 1 }}>
            {theme.name}
          </h3>
          <span style={{
            backgroundColor: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 600,
            padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', marginTop: 2,
            textTransform: 'capitalize', flexShrink: 0,
          }}>
            {theme.category}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>{theme.description}</p>
        {theme.tags.filter(Boolean).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 4 }}>
            {theme.tags.filter(Boolean).map(tag => (
              <span key={tag} style={{
                fontSize: 10, color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 6px',
                borderRadius: 4, border: '1px solid #f1f5f9',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ padding: '10px 15px 15px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {isConfirming && (
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', lineHeight: 1.5 }}>
            This replaces your site's header, footer, and every page's layout — continue?
          </p>
        )}
        {confirmError && (
          <p style={{ margin: 0, fontSize: 11, color: '#dc2626', lineHeight: 1.5 }}>{confirmError}</p>
        )}
        <div style={{ display: 'flex', gap: 7 }}>
          {isConfirming ? (
            <>
              <button
                onClick={onApplyClick}
                disabled={isApplying}
                style={{
                  flex: 1, padding: '9px', backgroundColor: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: isApplying ? 'default' : 'pointer', opacity: isApplying ? 0.75 : 1,
                }}
              >
                {isApplying ? 'Applying…' : '✓ Yes, Apply Theme'}
              </button>
              {!isApplying && (
                <button
                  onClick={onCancelConfirm}
                  style={{
                    padding: '9px 11px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none',
                    borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onApplyClick}
              disabled={theme.is_active}
              style={{
                flex: 1, padding: '9px',
                backgroundColor: theme.is_active ? '#f1f5f9' : '#f8fafc',
                color: theme.is_active ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: theme.is_active ? 'default' : 'pointer',
              }}
            >
              {theme.is_active ? 'Currently Active' : 'Apply Theme'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
