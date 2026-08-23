import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

type SocialPair = { platform: string; url: string }

const label: React.CSSProperties      = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }
const input: React.CSSProperties      = { width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }
const field: React.CSSProperties      = { marginBottom: 16 }
const row: React.CSSProperties        = { display: 'flex', gap: 14 }
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 14px', paddingTop: 20, borderTop: '1px solid #f1f5f9' }
const smallBtn: React.CSSProperties   = { fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' }
const removeBtn: React.CSSProperties  = { fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }

function Field({ children }: { children: React.ReactNode }) {
  return <div style={field}>{children}</div>
}

function TextInput({ text, value, onChange, placeholder, type = 'text' }: {
  text: string
  value: string | null
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <Field>
      <label style={label}>{text}</label>
      <input
        type={type}
        style={input}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}

// Generic two-column repeatable row list (label+url pairs) — covers both Navigation
// Links and Social Links, a direct port of site_settings.php's repeatable-row jQuery
// behavior into React state instead of parallel form-field arrays.
function PairRepeater<T extends Record<string, string>>({
  title, items, keyA, keyB, placeholderA, placeholderB, addLabel, onChange,
}: {
  title: string
  items: T[]
  keyA: keyof T
  keyB: keyof T
  placeholderA: string
  placeholderB: string
  addLabel: string
  onChange: (items: T[]) => void
}) {
  const update = (i: number, key: keyof T, value: string) => {
    const next = items.slice()
    next[i] = { ...next[i], [key]: value }
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, { [keyA]: '', [keyB]: '' } as T])

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={label}>{title}</label>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input style={input} placeholder={placeholderA} value={item[keyA]} onChange={e => update(i, keyA, e.target.value)} />
          <input style={input} placeholder={placeholderB} value={item[keyB]} onChange={e => update(i, keyB, e.target.value)} />
          <button style={removeBtn} onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button style={smallBtn} onClick={add}>+ {addLabel}</button>
    </div>
  )
}

// The rest of what the old admin page's "Site Settings" panel had, minus Header/
// Footer colors (now their own Colors tab) — business identity, contact info, the
// header CTA/sticky toggle, and every repeatable field (nav, social, footer columns).
export function StoreSettingsSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="Business Name" value={settings.businessName} onChange={v => onChange({ businessName: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Tagline" value={settings.tagline} onChange={v => onChange({ tagline: v })} />
        </div>
      </div>
      <Field>
        <label style={label}>Description</label>
        <textarea
          style={{ ...input, minHeight: 64, resize: 'vertical' }}
          value={settings.description ?? ''}
          onChange={e => onChange({ description: e.target.value })}
        />
      </Field>
      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="Logo Alt Text" value={settings.logoAlt} onChange={v => onChange({ logoAlt: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Logo Text (shown if no logo image is set)" value={settings.logoText} onChange={v => onChange({ logoText: v })} />
        </div>
      </div>

      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="Contact Phone" value={settings.contactPhone} onChange={v => onChange({ contactPhone: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Contact Email" type="email" value={settings.contactEmail} onChange={v => onChange({ contactEmail: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="Contact Address" value={settings.contactAddress} onChange={v => onChange({ contactAddress: v })} />
        </div>
      </div>

      <div style={sectionTitle}>Header</div>
      <Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.headerSticky}
            onChange={e => onChange({ headerSticky: e.target.checked })}
          />
          Sticky header
        </label>
      </Field>
      <div style={row}>
        <div style={{ flex: 1 }}>
          <TextInput text="CTA Button Text" value={settings.headerCtaText} onChange={v => onChange({ headerCtaText: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput text="CTA Button URL" value={settings.headerCtaUrl} onChange={v => onChange({ headerCtaUrl: v })} />
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 4px' }}>
        Navigation Links are now managed from the 📄 Pages panel — assign a page to
        the Main Menu there, drag to reorder, or nest it under another page for a
        dropdown submenu.
      </p>

      <div style={sectionTitle}>Footer</div>
      <TextInput text="Copyright Text" value={settings.footerCopyrightText} onChange={v => onChange({ footerCopyrightText: v })} />
      <Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.footerShowBrandColumn}
            onChange={e => onChange({ footerShowBrandColumn: e.target.checked })}
          />
          Show logo &amp; description as a footer column
        </label>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 26px' }}>
          Uses the Logo, Business Name, Tagline and Description above. Counts as one
          of the footer's 4 columns — the Pages panel's Footer Menu section can hold
          3 more when this is on, or 4 when it's off.
        </p>
      </Field>
      <PairRepeater<SocialPair>
        title="Social Links"
        items={settings.socialLinks}
        keyA="platform" keyB="url"
        placeholderA="instagram" placeholderB="https://..."
        addLabel="Add"
        onChange={socialLinks => onChange({ socialLinks })}
      />
      <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
        Footer Link Columns are managed from the 📄 Pages panel — each top-level page
        assigned to the Footer Menu becomes a column heading, and any pages nested
        under it become that column's links.
      </p>
    </div>
  )
}
