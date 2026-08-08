import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

// <input type="color"> only accepts strict #rrggbb — falls back to a neutral grey
// swatch rather than silently ignoring an out-of-format stored value (e.g. empty,
// a CSS name, or 3-digit shorthand, none of which the input will render correctly).
function toColorInputValue(v: string | null): string {
  return v && HEX_RE.test(v) ? v : '#cccccc'
}

function ColorSwatchField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string | null
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <label
        htmlFor={`swatch-${label}`}
        style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          border: '1px solid #e2e8f0', backgroundColor: toColorInputValue(value),
          backgroundImage: value ? 'none' : 'linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)',
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <input
          id={`swatch-${label}`}
          type="color"
          value={toColorInputValue(value)}
          onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)',
            border: 'none', padding: 0, cursor: 'pointer',
          }}
        />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{value || placeholder}</div>
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 }
const sectionBlock: React.CSSProperties = { marginBottom: 32 }

// Swatch pickers, not hex text fields — confirmed easier for merchants than typing
// hex. Uses the native <input type="color"> (zero new npm dependency — this project's
// frontend build is already fragile with no committed lockfile, not worth adding a
// third-party color-picker library for what the native input already covers). The
// underlying stored value is still a plain hex string, unchanged from the admin page.
export function ColorsSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <div style={sectionBlock}>
        <div style={sectionTitle}>Header</div>
        <ColorSwatchField label="Background" placeholder="#ffffff" value={settings.headerBackgroundColor} onChange={v => onChange({ headerBackgroundColor: v })} />
        <ColorSwatchField label="Text" placeholder="#1a202c" value={settings.headerTextColor} onChange={v => onChange({ headerTextColor: v })} />
        <ColorSwatchField label="Accent" placeholder="#1a202c" value={settings.headerAccentColor} onChange={v => onChange({ headerAccentColor: v })} />
      </div>

      <div style={sectionBlock}>
        <div style={sectionTitle}>Footer</div>
        <ColorSwatchField label="Background" placeholder="#1a202c" value={settings.footerBackgroundColor} onChange={v => onChange({ footerBackgroundColor: v })} />
        <ColorSwatchField label="Text" placeholder="#a0aec0" value={settings.footerTextColor} onChange={v => onChange({ footerTextColor: v })} />
        <ColorSwatchField label="Accent" placeholder="#ffffff" value={settings.footerAccentColor} onChange={v => onChange({ footerAccentColor: v })} />
      </div>
    </div>
  )
}
