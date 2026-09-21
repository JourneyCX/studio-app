import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const label: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }
const input: React.CSSProperties = { width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }
const textarea: React.CSSProperties = { ...input, resize: 'vertical', fontFamily: 'inherit' }
const field: React.CSSProperties = { marginBottom: 16 }
const row: React.CSSProperties   = { display: 'flex', gap: 14 }
const toggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }

const HEX_RE = /^#[0-9a-fA-F]{6}$/
function toColorInputValue(v: string | null): string {
  return v && HEX_RE.test(v) ? v : '#2563eb'
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

function TextArea({ text, value, onChange, placeholder, rows = 3 }: {
  text: string
  value: string | null
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <Field>
      <label style={label}>{text}</label>
      <textarea style={textarea} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

// Site-wide floating "Shop Assistant" chat bubble — fixed to the bottom of every
// screen (rendered here by Navigation/ShopAssistantBubble.tsx for the editor
// preview, and by nuxt-storefront's components/storefront/ShopAssistantBubble.vue
// for the live site), sourced from these same sb_site_settings columns. Distinct
// from the per-page "AI-Powered Tool" block (AITool.tsx) a merchant can still drag
// onto individual pages — this section makes the same Shop Assistant persistently
// reachable everywhere without needing to place a block on every page. The AI
// proxy endpoint/key are resolved and stored automatically server-side the moment
// this section is saved (same never-rotates key the AITool block already gets via
// resolveData()) — nothing to configure here.
export function ShopAssistantSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <Field>
        <label style={toggleRow}>
          <input type="checkbox" checked={settings.aiBubbleEnabled} onChange={e => onChange({ aiBubbleEnabled: e.target.checked })} />
          Show floating AI Shop Assistant on every page
        </label>
      </Field>

      <Field>
        <label style={label}>Position</label>
        <select
          style={input}
          value={settings.aiBubblePosition}
          onChange={e => onChange({ aiBubblePosition: e.target.value as SiteSettings['aiBubblePosition'] })}
        >
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
        </select>
      </Field>

      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="Assistant Name" value={settings.aiBubbleAssistantName} placeholder="Shop Assistant" onChange={v => onChange({ aiBubbleAssistantName: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Greeting Message" value={settings.aiBubbleGreeting} placeholder="Hi! How can I help you today?" onChange={v => onChange({ aiBubbleGreeting: v })} />
        </div>
      </div>

      <TextArea
        text="Starter Prompts (one per line, shown as clickable chips)"
        value={settings.aiBubbleStarterPrompts}
        placeholder={"I'm looking for a gift under R500\nWhat's your best seller this season?"}
        onChange={v => onChange({ aiBubbleStarterPrompts: v })}
      />

      <TextArea
        text="System Prompt (optional override — leave blank for default)"
        value={settings.aiBubbleSystemPrompt}
        rows={2}
        onChange={v => onChange({ aiBubbleSystemPrompt: v })}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <label
          htmlFor="ai-bubble-color"
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
            border: '1px solid #e2e8f0', backgroundColor: toColorInputValue(settings.aiBubbleAccentColor),
            position: 'relative', overflow: 'hidden',
          }}
        >
          <input
            id="ai-bubble-color"
            type="color"
            value={toColorInputValue(settings.aiBubbleAccentColor)}
            onChange={e => onChange({ aiBubbleAccentColor: e.target.value })}
            style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', padding: 0, cursor: 'pointer' }}
          />
        </label>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Accent Colour</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{settings.aiBubbleAccentColor || '#2563eb'}</div>
        </div>
      </div>

      {settings.aiBubbleEnabled && settings.whatsappEnabled && settings.aiBubblePosition === 'bottom-right' && settings.whatsappPhone && (
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          ℹ️ Your WhatsApp button is also set to Bottom Right — the assistant bubble will stack above it automatically.
        </p>
      )}
    </div>
  )
}
