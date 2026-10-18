import { useEffect, useState, type ReactNode } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { stratumApi, getActiveTenantId, getActiveToken } from '../../lib/api'

// A card listing the store's contact details (address, phone, email, optional opening hours), each with an
// icon. The values come from the merchant's Site Settings (Store Info), so they are typed once and stay right
// everywhere; each can be overridden here for this card only. Mirrored in nuxt-storefront's ContactDetails.vue.
export type ContactDetailsProps = {
  heading: string
  intro: string
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  addressLabel: string
  phoneLabel: string
  emailLabel: string
  hoursLabel: string
  // Opening hours have no home in Site Settings, so they are typed here; empty = no hours row.
  hours: string
  // Empty = use the store's Site Settings value.
  addressOverride: string
  phoneOverride: string
  emailOverride: string
  backgroundColor: string
  textColor: string
  iconBackground: string
  dividerColor: string
  cardRadius: number
}

type Contact = { phone: string | null; email: string | null; address: string | null }

function useStoreContact(): Contact | null {
  const [contact, setContact] = useState<Contact | null>(null)
  useEffect(() => {
    let cancelled = false
    stratumApi.getSiteSettings(getActiveTenantId(), getActiveToken())
      .then(r => { if (!cancelled) setContact({ phone: r.settings?.contactPhone ?? null, email: r.settings?.contactEmail ?? null, address: r.settings?.contactAddress ?? null }) })
      .catch(() => { if (!cancelled) setContact({ phone: null, email: null, address: null }) })
    return () => { cancelled = true }
  }, [])
  return contact
}

const svg = (children: ReactNode) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const ICONS = {
  address: svg(<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></>),
  phone:   svg(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  email:   svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  hours:   svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
}

function Row({ icon, label, value, muted, iconBg, divider }: { icon: ReactNode; label: string; value: string; muted?: boolean; iconBg: string; divider: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '28px 0', borderTop: divider ? `1px solid ${divider}` : undefined }}>
      <div style={{ flex: '0 0 auto', width: 68, height: 68, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ minWidth: 0, opacity: muted ? 0.45 : 1 }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 'clamp(17px, 1.7vw, 22px)', lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  )
}

export const ContactDetails: ComponentConfig<ContactDetailsProps> = {
  label: 'Contact Details',
  fields: {
    heading:      { type: 'text', label: 'Heading' },
    intro:        { type: 'textarea', label: 'Text under the heading' },
    showAddress:  { type: 'radio', label: 'Show Address', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showPhone:    { type: 'radio', label: 'Show Phone', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showEmail:    { type: 'radio', label: 'Show Email', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    addressLabel: { type: 'text', label: 'Address Label' },
    phoneLabel:   { type: 'text', label: 'Phone Label' },
    emailLabel:   { type: 'text', label: 'Email Label' },
    hoursLabel:   { type: 'text', label: 'Opening Hours Label' },
    hours:        { type: 'textarea', label: 'Opening Hours (leave empty for no hours row; a new line starts a new line)' },
    addressOverride: { type: 'textarea', label: 'Address — only to override Site Settings (leave empty to use it)' },
    phoneOverride:   { type: 'text', label: 'Phone — only to override Site Settings' },
    emailOverride:   { type: 'text', label: 'Email — only to override Site Settings' },
    backgroundColor: { type: 'custom', label: 'Card Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    iconBackground:  { type: 'custom', label: 'Icon Circle Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    dividerColor:    { type: 'custom', label: 'Divider Line Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardRadius:      { type: 'number', label: 'Card Corner Radius (px)', min: 0 },
  },
  defaultProps: {
    heading: 'Need Help?',
    intro: 'Get in touch with us. We would love to hear from you.',
    showAddress: true,
    showPhone: true,
    showEmail: true,
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    hoursLabel: 'Opening Hours',
    hours: '',
    addressOverride: '',
    phoneOverride: '',
    emailOverride: '',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    iconBackground: '#f1f2f5',
    dividerColor: '#e5e7eb',
    cardRadius: 20,
  },
  render(p) {
    const contact = useStoreContact()
    const address = p.addressOverride?.trim() || contact?.address || ''
    const phone   = p.phoneOverride?.trim()   || contact?.phone   || ''
    const email   = p.emailOverride?.trim()   || contact?.email   || ''
    const hint    = contact ? 'Not set: add it in Site Settings → Store Info' : 'Loading…'

    const rows: Array<{ key: string; icon: ReactNode; label: string; value: string; muted: boolean }> = []
    if (p.showAddress) rows.push({ key: 'a', icon: ICONS.address, label: p.addressLabel, value: address || hint, muted: !address })
    if (p.showPhone)   rows.push({ key: 'p', icon: ICONS.phone,   label: p.phoneLabel,   value: phone   || hint, muted: !phone })
    if (p.showEmail)   rows.push({ key: 'e', icon: ICONS.email,   label: p.emailLabel,   value: email   || hint, muted: !email })
    if (p.hours?.trim()) rows.push({ key: 'h', icon: ICONS.hours, label: p.hoursLabel,   value: p.hours.trim(),  muted: false })

    return (
      <div style={{ background: p.backgroundColor, color: p.textColor, borderRadius: p.cardRadius, padding: 'clamp(24px, 4vw, 56px)' }}>
        {p.heading && <h2 style={{ margin: '0 0 18px', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600, lineHeight: 1.15 }}>{p.heading}</h2>}
        {p.intro && <p style={{ margin: '0 0 12px', fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.intro}</p>}
        <div style={{ marginTop: 24 }}>
          {rows.map((r, i) => <Row key={r.key} icon={r.icon} label={r.label} value={r.value} muted={r.muted} iconBg={p.iconBackground} divider={i === 0 ? null : p.dividerColor} />)}
        </div>
      </div>
    )
  },
}
