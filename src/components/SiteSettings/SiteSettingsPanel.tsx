import { useState } from 'react'
import { stratumApi } from '../../lib/api'
import type { SiteSettings } from '../../lib/siteSettings'
import { BrandingSection } from './BrandingSection'
import { ColorsSection } from './ColorsSection'
import { FontsSection } from './FontsSection'
import { StoreSettingsSection } from './StoreSettingsSection'
import { WhatsAppSection } from './WhatsAppSection'
import { AnnouncementBarSection } from './AnnouncementBarSection'

type SectionKey = 'branding' | 'colors' | 'fonts' | 'store' | 'whatsapp' | 'announcement'

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'branding', label: 'Branding', icon: '🖼️' },
  { key: 'colors', label: 'Colors', icon: '🎨' },
  { key: 'fonts', label: 'Fonts', icon: '🔤' },
  { key: 'store', label: 'Store Settings', icon: '⚙️' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'announcement', label: 'Announcement Bar', icon: '📢' },
]

interface SiteSettingsPanelProps {
  tenantId: number
  token: string
  initialSettings: SiteSettings
  onClose: () => void
  onSaved: (settings: SiteSettings) => void
}

// Modal shell for the gear-icon Site Settings panel — same backdrop/panel pattern
// as TemplateSelector.tsx, but with its own left nav (Branding/Colors/Fonts/Store
// Settings) instead of category tabs, matching the reviewed mockup. Independent of
// Puck's own dirty/draft/publish cycle: this writes straight to sb_site_settings on
// Save, the same one-form-one-submit behavior the old admin page already had.
export function SiteSettingsPanel({ tenantId, token, initialSettings, onClose, onSaved }: SiteSettingsPanelProps) {
  const [active,   setActive]   = useState<SectionKey>('branding')
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const patch = (p: Partial<SiteSettings>) => setSettings(s => ({ ...s, ...p }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await stratumApi.saveSiteSettings(tenantId, settings, token)
      onSaved(settings)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 1040,
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Site Settings</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                backgroundColor: '#fff', color: '#334155', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                backgroundColor: saving ? '#93c5fd' : '#2563eb', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saving ? 'Saving…' : (<><span>✓</span> Save</>)}
            </button>
          </div>
        </div>

        {/* Nav + content */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div
            style={{
              width: 200, flexShrink: 0, borderRight: '1px solid #f1f5f9',
              padding: '16px 10px', overflowY: 'auto',
            }}
          >
            {SECTIONS.map(s => {
              const isActive = active === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', marginBottom: 2, borderRadius: 8, border: 'none',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#334155',
                    fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{s.icon}</span>
                  {s.label}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {active === 'branding' && <BrandingSection settings={settings} onChange={patch} />}
            {active === 'colors'   && <ColorsSection settings={settings} onChange={patch} />}
            {active === 'fonts'    && <FontsSection />}
            {active === 'store'    && <StoreSettingsSection settings={settings} onChange={patch} />}
            {active === 'whatsapp' && <WhatsAppSection settings={settings} onChange={patch} />}
            {active === 'announcement' && <AnnouncementBarSection settings={settings} onChange={patch} />}
          </div>
        </div>
      </div>
    </div>
  )
}
