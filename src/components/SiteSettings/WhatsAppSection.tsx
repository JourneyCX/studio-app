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
function toColorInputValue(v: string | null): string {
  return v && HEX_RE.test(v) ? v : '#25D366'
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={field}>{children}</div>
}

function TextInput({ text, value, onChange, placeholder }: {
  text: string
  value: string | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <Field>
      <label style={label}>{text}</label>
      <input style={input} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

// "WhatsApp Button" chrome — a fixed bottom-right button rendered by both renderers
// (studio-app's Navigation/WhatsAppWidget.tsx for the editor preview, nuxt-storefront's
// components/storefront/WhatsAppWidget.vue for the live site), sourced from these same
// sb_site_settings columns. Field set mirrors a reference competitor shop builder's
// WhatsApp Button settings screen. whatsappPhone is digits-only international format
// (e.g. 27821234567) — no country-code picker, matching Contact Phone's plain-text
// convention on the Store Settings tab.
export function WhatsAppSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <Field>
        <label style={toggleRow}>
          <input type="checkbox" checked={settings.whatsappEnabled} onChange={e => onChange({ whatsappEnabled: e.target.checked })} />
          Show WhatsApp button on storefront
        </label>
      </Field>
      <Field>
        <label style={toggleRow}>
          <input type="checkbox" checked={settings.whatsappPopupEnabled} onChange={e => onChange({ whatsappPopupEnabled: e.target.checked })} />
          Show popup chat window before opening WhatsApp
        </label>
      </Field>

      <TextInput
        text="WhatsApp Phone Number (international format, digits only)"
        value={settings.whatsappPhone}
        placeholder="27821234567"
        onChange={v => onChange({ whatsappPhone: v })}
      />

      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="Message Box Title" value={settings.whatsappMessageTitle} placeholder="Chat with us on WhatsApp!" onChange={v => onChange({ whatsappMessageTitle: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Message Box Body" value={settings.whatsappMessageBody} placeholder="Hello, how can we help you?" onChange={v => onChange({ whatsappMessageBody: v })} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <label
          htmlFor="whatsapp-button-color"
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
            border: '1px solid #e2e8f0', backgroundColor: toColorInputValue(settings.whatsappButtonColor),
            position: 'relative', overflow: 'hidden',
          }}
        >
          <input
            id="whatsapp-button-color"
            type="color"
            value={toColorInputValue(settings.whatsappButtonColor)}
            onChange={e => onChange({ whatsappButtonColor: e.target.value })}
            style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', padding: 0, cursor: 'pointer' }}
          />
        </label>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Button Color</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{settings.whatsappButtonColor || '#25D366'}</div>
        </div>
      </div>
    </div>
  )
}
