import { FieldLabel } from '@measured/puck'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

// <input type="color"> only accepts strict #rrggbb — falls back to a neutral grey
// swatch rather than silently ignoring an out-of-format stored value (empty, a CSS
// name, 3-digit shorthand, or rgba() — several fields in this project accept rgba
// for overlay/alpha use cases, and those keep working via the text input below;
// only the swatch's own preview falls back for them).
function toColorInputValue(v: string): string {
  return HEX_RE.test(v) ? v : '#cccccc'
}

// Puck's `type: 'custom'` fields render with zero label wrapper (unlike text/
// select/etc, which get one automatically) — without this, every colour swatch
// in a panel with several of them looks identical and unlabelled. `label` is
// optional so the ~100 existing call sites that don't pass one keep rendering
// exactly as before.
export function ColorField({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  const swatch = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label
        style={{
          width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
          border: '1px solid #e2e8f0', backgroundColor: toColorInputValue(value),
          position: 'relative', overflow: 'hidden',
        }}
      >
        <input
          type="color"
          value={toColorInputValue(value)}
          onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)',
            border: 'none', padding: 0, cursor: 'pointer',
          }}
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '#000000'}
        style={{ flex: 1, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
      />
    </div>
  )

  // el="div" — FieldLabel defaults to wrapping in a <label>, which would nest
  // inside the swatch's own <label> above and produce invalid, flaky-to-click HTML.
  return label ? <FieldLabel label={label} el="div">{swatch}</FieldLabel> : swatch
}
