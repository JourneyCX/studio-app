import { useState } from 'react'
import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const HEX_ALPHA_RE = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/
const HEX_SHORT_RE = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])?$/
const RGBA_RE = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*(\d*\.?\d+)(%?)\s*)?\)$/i

interface ParsedColor { hex: string; alpha: number } // hex = #rrggbb, alpha 0..1

const toHex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

// Accepts #rgb, #rgba, #rrggbb, #rrggbbaa and rgb()/rgba(). Returns null for anything else.
function parseColor(input: string | null): ParsedColor | null {
  const v = (input ?? '').trim()
  let m = v.match(HEX_ALPHA_RE)
  if (m) return { hex: `#${m[1].toLowerCase()}`, alpha: m[2] ? parseInt(m[2], 16) / 255 : 1 }
  m = v.match(HEX_SHORT_RE)
  if (m) {
    const [r, g, b, a] = [m[1], m[2], m[3], m[4]]
    return { hex: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(), alpha: a ? parseInt(a + a, 16) / 255 : 1 }
  }
  m = v.match(RGBA_RE)
  if (m) {
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (r > 255 || g > 255 || b > 255) return null
    let alpha = m[4] === undefined ? 1 : parseFloat(m[4])
    if (m[5] === '%') alpha /= 100
    if (!(alpha >= 0 && alpha <= 1)) return null
    return { hex: `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`, alpha }
  }
  return null
}

// Stored as #rrggbb when opaque, #rrggbbaa otherwise. 8-digit hex (9 chars) rather than
// rgba() because the settings columns are VARCHAR(20) and "rgba(255, 255, 255, 0.5)" is 24.
function formatColor(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha))
  return a >= 0.995 ? hex : `${hex}${toHex2(a * 255)}`
}

// <input type="color"> only accepts strict #rrggbb — falls back to a neutral grey
// swatch rather than silently ignoring an out-of-format stored value (e.g. empty
// or a CSS name, which the input will not render correctly).
function toColorInputValue(v: string | null): string {
  const p = parseColor(v)
  return p && HEX_RE.test(p.hex) ? p.hex : '#cccccc'
}

const CHECKER = 'linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)'

function ColorSwatchField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string | null
  onChange: (v: string) => void
  placeholder: string
}) {
  const parsed = parseColor(value)
  const hex = toColorInputValue(value)
  const alpha = parsed ? parsed.alpha : 1
  // Local draft so partially typed values (e.g. "rgba(255, 2") don't get rewritten mid-keystroke.
  const [draft, setDraft] = useState<string | null>(null)

  const commitText = (text: string) => {
    setDraft(text)
    const p = parseColor(text)
    if (p) onChange(formatColor(p.hex, p.alpha))
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label
          htmlFor={`swatch-${label}`}
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
            border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden',
            backgroundImage: CHECKER, backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
          }}
        >
          {/* colour layer over the checkerboard so transparency is visible */}
          <span style={{ position: 'absolute', inset: 0, backgroundColor: value ? hex : 'transparent', opacity: value ? alpha : 0 }} />
          <input
            id={`swatch-${label}`}
            type="color"
            value={hex}
            onChange={e => { setDraft(null); onChange(formatColor(e.target.value, alpha)) }}
            style={{
              position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)',
              border: 'none', padding: 0, cursor: 'pointer', opacity: 0,
            }}
          />
        </label>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label}</div>
          <input
            type="text"
            value={draft ?? value ?? ''}
            placeholder={placeholder}
            spellCheck={false}
            onChange={e => commitText(e.target.value)}
            onBlur={() => setDraft(null)}
            title="Hex (#RRGGBB or #RRGGBBAA) or rgba(r, g, b, a)"
            style={{
              width: '100%', fontSize: 12, color: '#475569', padding: '3px 6px', marginTop: 2,
              border: '1px solid #e2e8f0', borderRadius: 4, fontFamily: 'ui-monospace, monospace',
              background: '#fff',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 52 }}>
        <span style={{ fontSize: 11, color: '#64748b', width: 48 }}>Opacity</span>
        <input
          type="range" min={0} max={100} step={1}
          value={Math.round(alpha * 100)}
          onChange={e => { setDraft(null); onChange(formatColor(hex, Number(e.target.value) / 100)) }}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 11, color: '#64748b', width: 34, textAlign: 'right' }}>{Math.round(alpha * 100)}%</span>
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
