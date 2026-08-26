import { useEffect, useState } from 'react'
import { ImageUploadField } from '../shared/ImageUploadField'
import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }
const hint: React.CSSProperties  = { fontSize: 12, color: '#94a3b8', marginTop: 6 }
const group: React.CSSProperties = { marginBottom: 32 }
const sizeInput: React.CSSProperties = {
  width: '100%', maxWidth: 120, padding: '8px 10px', fontSize: 13,
  border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a',
}
const sizeRow: React.CSSProperties = { display: 'flex', gap: 20, marginTop: 12 }
const toggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }

// Local text state, separate from the committed number — a plain controlled
// <input type="number"> that clamps/defaults on every keystroke fights the
// user the moment the field is empty mid-edit (e.g. backspacing "40" to type
// "62": the empty string reads as 0, `0 || 40` snaps it straight back to 40
// before the next digit lands). Free typing is allowed here; clamping to
// [16, 120] only happens once the user leaves the field.
function LogoSizeInput({ value, fallback, onCommit, disabled }: {
  value: number
  fallback: number
  onCommit: (n: number) => void
  disabled?: boolean
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])

  return (
    <input
      type="number"
      min={16}
      max={120}
      style={sizeInput}
      disabled={disabled}
      value={text}
      onChange={e => {
        const raw = e.target.value
        setText(raw)
        if (raw !== '' && !Number.isNaN(Number(raw))) {
          onCommit(Number(raw))
        }
      }}
      onBlur={() => {
        const clamped = Math.min(120, Math.max(16, Number(text) || fallback))
        setText(String(clamped))
        onCommit(clamped)
      }}
    />
  )
}

// Deliberately just logo + favicon — matches exactly what the old admin page's
// "Store Branding" panel had. Dark/light logo variants were scoped out on review;
// this is a single-logo upload like the admin page always had.
export function BrandingSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <div style={group}>
        <label style={label}>Logo</label>
        <ImageUploadField value={settings.logoUrl ?? ''} onChange={v => onChange({ logoUrl: v || null })} />
        <p style={hint}>Shown in the header of your store. Recommended: transparent PNG or SVG.</p>

        <div style={sizeRow}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Header logo height (px)</label>
            <LogoSizeInput
              value={settings.headerLogoHeight}
              fallback={40}
              onCommit={n => onChange({ headerLogoHeight: n })}
            />
          </div>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Footer logo height (px)</label>
            <LogoSizeInput
              value={settings.footerLogoHeight}
              fallback={32}
              onCommit={n => onChange({ footerLogoHeight: n })}
              disabled={!settings.footerShowLogo}
            />
          </div>
        </div>

        <label style={{ ...toggleRow, marginTop: 16 }}>
          <input
            type="checkbox"
            checked={settings.footerShowLogo}
            onChange={e => onChange({ footerShowLogo: e.target.checked })}
          />
          Show logo in footer
        </label>
        <p style={{ ...hint, marginLeft: 26, marginTop: 4 }}>
          Only affects the logo image — business name and tagline (if the footer's
          brand column is on) still show.
        </p>
      </div>

      <div style={group}>
        <label style={label}>Favicon</label>
        <ImageUploadField value={settings.faviconUrl ?? ''} onChange={v => onChange({ faviconUrl: v || null })} />
        <p style={hint}>Shown in the browser tab. Square, at least 32×32px. PNG works in every modern browser.</p>
      </div>
    </div>
  )
}
