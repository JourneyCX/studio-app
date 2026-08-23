import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const label: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }
const input: React.CSSProperties = { width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }
const field: React.CSSProperties = { marginBottom: 16 }
const row: React.CSSProperties   = { display: 'flex', gap: 14 }
const toggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }

const HEX_RE = /^#[0-9a-fA-F]{6}$/
function toColorInputValue(v: string | null, fallback: string): string {
  return v && HEX_RE.test(v) ? v : fallback
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={field}>{children}</div>
}

function ColorPicker({ text, value, fallback, onChange }: {
  text: string
  value: string | null
  fallback: string
  onChange: (v: string) => void
}) {
  const id = `announcement-${text.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <label
        htmlFor={id}
        style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          border: '1px solid #e2e8f0', backgroundColor: toColorInputValue(value, fallback),
          position: 'relative', overflow: 'hidden',
        }}
      >
        <input
          id={id}
          type="color"
          value={toColorInputValue(value, fallback)}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', padding: 0, cursor: 'pointer' }}
        />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{text}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{value || fallback}</div>
      </div>
    </div>
  )
}

// Site-wide notice bar rendered above SiteHeader (studio-app's Navigation/AnnouncementBar.tsx
// for the editor preview, nuxt-storefront's components/storefront/AnnouncementBar.vue for the
// live site) — same sb_site_settings-backed chrome pattern as WhatsAppSection. Static mode
// shows the message once; scroll mode runs it as a continuous marquee at announcementSpeed
// seconds per loop (lower = faster). The link, if set, is optional — a plain notice needs no URL.
export function AnnouncementBarSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <Field>
        <label style={toggleRow}>
          <input type="checkbox" checked={settings.announcementEnabled} onChange={e => onChange({ announcementEnabled: e.target.checked })} />
          Show announcement bar on storefront
        </label>
      </Field>

      <Field>
        <label style={label}>Message</label>
        <input
          style={input}
          value={settings.announcementMessage ?? ''}
          placeholder="Orders processed in 3–5 business days · Free shipping over R800"
          onChange={e => onChange({ announcementMessage: e.target.value })}
        />
      </Field>

      <Field>
        <label style={label}>Display Style</label>
        <div style={row}>
          <label style={{ ...toggleRow, flex: 1 }}>
            <input
              type="radio"
              name="announcement-mode"
              checked={settings.announcementMode === 'static'}
              onChange={() => onChange({ announcementMode: 'static' })}
            />
            Static (fixed text)
          </label>
          <label style={{ ...toggleRow, flex: 1 }}>
            <input
              type="radio"
              name="announcement-mode"
              checked={settings.announcementMode === 'scroll'}
              onChange={() => onChange({ announcementMode: 'scroll' })}
            />
            Scrolling ticker
          </label>
        </div>
      </Field>

      {settings.announcementMode === 'scroll' && (
        <Field>
          <label style={label}>Scroll Speed (seconds per loop — lower is faster)</label>
          <input
            type="number"
            min={5}
            max={60}
            style={{ ...input, maxWidth: 120 }}
            value={settings.announcementSpeed}
            onChange={e => onChange({ announcementSpeed: Math.max(5, Number(e.target.value) || 20) })}
          />
        </Field>
      )}

      <Field>
        <label style={label}>Link URL (optional — leave blank for plain text)</label>
        <input
          style={input}
          value={settings.announcementLinkUrl ?? ''}
          placeholder="/contact"
          onChange={e => onChange({ announcementLinkUrl: e.target.value })}
        />
      </Field>

      <div style={row}>
        <div style={{ flex: 1 }}>
          <ColorPicker text="Background Color" value={settings.announcementBgColor} fallback="#dc2626" onChange={v => onChange({ announcementBgColor: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <ColorPicker text="Text Color" value={settings.announcementTextColor} fallback="#ffffff" onChange={v => onChange({ announcementTextColor: v })} />
        </div>
      </div>
    </div>
  )
}
