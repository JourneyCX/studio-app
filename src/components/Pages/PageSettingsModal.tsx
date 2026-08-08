import { useState } from 'react'
import { stratumApi, STRATUM_ORIGIN } from '../../lib/api'
import type { StorePage, PageType, PageTypeConfig } from '../../lib/pages'
import { ImageUploadField } from '../shared/ImageUploadField'

interface PageSettingsModalProps {
  tenantId: number
  token: string
  page: StorePage
  onClose: () => void
  onSaved: (page: StorePage) => void
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 10000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const panel: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '86vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
}
const label: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }
const input: React.CSSProperties = { width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }
const field: React.CSSProperties = { marginBottom: 16 }
const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px', paddingTop: 18, borderTop: '1px solid #f1f5f9' }

// Studio's own SEO fields — separate from, and possibly later overwritten by,
// the seo_ai module's Rankmath sync (see CLAUDE.md's AI SEO Manager section).
// This modal doesn't integrate with seo_ai; it just says so.
function CharCounter({ value, max }: { value: string; max: number }) {
  return <span style={{ fontSize: 11, color: value.length > max ? '#dc2626' : '#94a3b8' }}>({value.length}/{max})</span>
}

export function PageSettingsModal({ tenantId, token, page, onClose, onSaved }: PageSettingsModalProps) {
  const [pageName, setPageName]   = useState(page.page_name)
  const [pageType, setPageType]   = useState<PageType>(page.page_type)
  const [config, setConfig]       = useState<PageTypeConfig>(page.page_type_config ?? {})
  const [seoTitle, setSeoTitle]   = useState(page.seo_title ?? '')
  const [seoDesc, setSeoDesc]     = useState(page.seo_description ?? '')
  const [ogImage, setOgImage]     = useState(page.og_image_url ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await stratumApi.updatePageSettings(tenantId, page.id, {
        pageName,
        pageType,
        pageTypeConfig: Object.keys(config).length ? config : null,
        seoTitle: seoTitle || null,
        seoDescription: seoDesc || null,
        ogImageUrl: ogImage || null,
      }, token)
      onSaved({
        ...page,
        page_name: pageName,
        page_type: pageType,
        page_type_config: Object.keys(config).length ? config : null,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
        og_image_url: ogImage || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={panel}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Page Settings</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
            <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : '✓ Save'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={field}>
            <label style={label}>Page Name</label>
            <input style={input} value={pageName} onChange={e => setPageName(e.target.value)} />
          </div>

          <div style={sectionTitle}>Page Type</div>
          <div style={field}>
            <label style={label}>What type of page is this?</label>
            <select style={input} value={pageType} onChange={e => { setPageType(e.target.value as PageType); setConfig({}) }}>
              <optgroup label="Content">
                <option value="static_content">Static content</option>
                <option value="blog_list" disabled>Blog list (no blog module)</option>
              </optgroup>
              <optgroup label="Shop">
                <option value="all_products">All products</option>
                <option value="product_category_list">Product category list</option>
                <option value="single_product_category">Single product category</option>
              </optgroup>
              <optgroup label="Other">
                <option value="anchor_link">Anchor link</option>
                <option value="external_url">External URL</option>
              </optgroup>
            </select>
          </div>

          {pageType === 'single_product_category' && (
            <div style={field}>
              <label style={label}>Category ID</label>
              <input
                style={input}
                type="number"
                placeholder="WooCommerce category ID"
                value={config.categoryId ?? ''}
                onChange={e => setConfig({ categoryId: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}
          {pageType === 'anchor_link' && (
            <div style={field}>
              <label style={label}>Anchor target</label>
              <input style={input} placeholder="#section-id" value={config.anchor ?? ''} onChange={e => setConfig({ anchor: e.target.value })} />
            </div>
          )}
          {pageType === 'external_url' && (
            <div style={field}>
              <label style={label}>URL</label>
              <input style={input} placeholder="https://…" value={config.url ?? ''} onChange={e => setConfig({ url: e.target.value })} />
            </div>
          )}

          <div style={sectionTitle}>SEO Settings</div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 15, color: '#1a0dab', marginBottom: 2 }}>{seoTitle || pageName}</div>
            <div style={{ fontSize: 12, color: '#006621', marginBottom: 4 }}>{STRATUM_ORIGIN}/{page.page_slug}</div>
            <div style={{ fontSize: 12.5, color: '#545454' }}>{seoDesc || 'Add a description to help search engines understand your page content.'}</div>
          </div>

          <div style={field}>
            <label style={label}>SEO Title <CharCounter value={seoTitle} max={60} /></label>
            <input style={input} value={seoTitle} onChange={e => setSeoTitle(e.target.value)} maxLength={60} />
          </div>
          <div style={field}>
            <label style={label}>SEO Description <CharCounter value={seoDesc} max={160} /></label>
            <textarea style={{ ...input, minHeight: 64, resize: 'vertical' }} value={seoDesc} onChange={e => setSeoDesc(e.target.value)} maxLength={160} />
          </div>
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '-8px 0 16px' }}>
            These may be automatically updated later by the AI SEO Manager.
          </p>

          <div style={field}>
            <label style={label}>Social Sharing Image</label>
            <ImageUploadField value={ogImage} onChange={setOgImage} />
          </div>
        </div>
      </div>
    </div>
  )
}
