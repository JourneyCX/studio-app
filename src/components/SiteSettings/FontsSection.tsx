import { useEffect, useState } from 'react'
import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

// Fixed list, not free-text — no dynamic webfont-loading infrastructure exists
// yet (see docs/studio_site_settings_panel_spec.md). Every family here is
// pre-loaded via a single combined Google Fonts <link> in index.html, the same
// static-link pattern the header nav's pre-existing hardcoded Montserrat
// already used. Values are the literal CSS font-family string stored as-is in
// sb_site_settings (same convention as the raw hex strings ColorsSection
// stores) — kept in sync with nuxt-storefront's SiteHeader.vue/SiteFooter.vue
// copy of this same list.
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Montserrat (default)', value: "'Montserrat', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
]

const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }
const hint: React.CSSProperties  = { fontSize: 12, color: '#94a3b8', marginTop: 6 }
const group: React.CSSProperties = { marginBottom: 32 }
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 }
const row: React.CSSProperties = { display: 'flex', gap: 20 }
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', backgroundColor: '#fff',
}
const sizeInputStyle: React.CSSProperties = {
  width: '100%', maxWidth: 100, padding: '8px 10px', fontSize: 13,
  border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a',
}

// Same free-typing-then-clamp-on-blur pattern as BrandingSection's LogoSizeInput
// — a controlled number input that clamps every keystroke fights backspacing
// a two-digit value down to type a new one.
function ClampedNumberInput({ value, fallback, min, max, onCommit }: {
  value: number
  fallback: number
  min: number
  max: number
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])

  return (
    <input
      type="number"
      min={min}
      max={max}
      style={sizeInputStyle}
      value={text}
      onChange={e => {
        const raw = e.target.value
        setText(raw)
        if (raw !== '' && !Number.isNaN(Number(raw))) {
          onCommit(Number(raw))
        }
      }}
      onBlur={() => {
        const clamped = Math.min(max, Math.max(min, Number(text) || fallback))
        setText(String(clamped))
        onCommit(clamped)
      }}
    />
  )
}

function FontSizeInput({ value, fallback, onCommit }: {
  value: number
  fallback: number
  onCommit: (n: number) => void
}) {
  return <ClampedNumberInput value={value} fallback={fallback} min={10} max={32} onCommit={onCommit} />
}

function FontFields({
  familyValue, sizeValue, sizeFallback, onFamilyChange, onSizeChange,
}: {
  familyValue: string | null
  sizeValue: number
  sizeFallback: number
  onFamilyChange: (v: string | null) => void
  onSizeChange: (n: number) => void
}) {
  return (
    <div style={row}>
      <div style={{ flex: 1 }}>
        <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Typeface</label>
        <select
          style={selectStyle}
          value={familyValue ?? FONT_OPTIONS[0].value}
          onChange={e => onFamilyChange(e.target.value)}
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Size (px)</label>
        <FontSizeInput value={sizeValue} fallback={sizeFallback} onCommit={onSizeChange} />
      </div>
    </div>
  )
}

// First real Fonts fields — previously a "coming soon" placeholder (no data,
// no backend). Scoped to just the Main Menu (header nav, top-level + dropdown
// children, desktop + mobile) and Footer Menus (footer column links), rather
// than the full headings/body typeface picker the placeholder copy promised —
// that's a larger follow-up, this covers what was actually asked for.
export function FontsSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <div style={group}>
        <div style={sectionTitle}>Main Menu</div>
        <FontFields
          familyValue={settings.headerNavFontFamily}
          sizeValue={settings.headerNavFontSize}
          sizeFallback={15}
          onFamilyChange={v => onChange({ headerNavFontFamily: v })}
          onSizeChange={n => onChange({ headerNavFontSize: n })}
        />
        <p style={hint}>The header navigation links, including dropdown sub-items.</p>

        <div style={{ marginTop: 16, maxWidth: 100 }}>
          <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Item Spacing (px)</label>
          <ClampedNumberInput
            value={settings.headerNavItemSpacing}
            fallback={28}
            min={8}
            max={80}
            onCommit={n => onChange({ headerNavItemSpacing: n })}
          />
          <p style={hint}>Space between top-level menu items (desktop only).</p>
        </div>
      </div>

      <div style={group}>
        <div style={sectionTitle}>Footer Menus</div>
        <FontFields
          familyValue={settings.footerNavFontFamily}
          sizeValue={settings.footerNavFontSize}
          sizeFallback={13}
          onFamilyChange={v => onChange({ footerNavFontFamily: v })}
          onSizeChange={n => onChange({ footerNavFontSize: n })}
        />
        <p style={hint}>The link columns in your footer.</p>
      </div>
    </div>
  )
}
