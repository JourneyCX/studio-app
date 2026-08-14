import { useState, useEffect, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

// ── Types ─────────────────────────────────────────────────────────────────────
//
// Companion to ShippingOptions.tsx / PickupSelector.tsx — neither of those
// widgets collects an address itself, they only *listen* for a
// 'shipping:address-changed' document event. Before this widget existed,
// nothing in the Puck component library ever dispatched that event, so
// dropping ShippingOptions onto a standalone page (outside the native
// /cart flow, which has its own separate hand-built address form) left it
// permanently stuck on "Enter your delivery address…" with no way to type
// one in. This widget is that missing piece — plain address fields that
// debounce-dispatch the event ShippingOptions/PickupSelector already expect.
//
// cartItems is sent as an empty array here — the Puck editor's preview has
// no real shopper cart to read from. The live storefront twin
// (DeliveryAddressForm.vue) pulls real cart contents via useCart() instead.

export type DeliveryAddressFormProps = {
  headline:        string
  accentColor:     string
  backgroundColor: string
}

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'ZA', label: 'South Africa' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'ZW', label: 'Zimbabwe' },
  { code: 'ZM', label: 'Zambia' },
]

interface Address {
  street:   string
  suburb:   string
  city:     string
  province: string
  postal_code: string
  country:  string
}

const EMPTY_ADDRESS: Address = { street: '', suburb: '', city: '', province: '', postal_code: '', country: 'ZA' }

function DeliveryAddressFormInner({ headline, accentColor, backgroundColor }: DeliveryAddressFormProps) {
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('shipping:address-changed', {
        bubbles: true,
        detail: { address, cartItems: [] },
      }))
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.street, address.city, address.province, address.postal_code, address.country])

  function set<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress(prev => ({ ...prev, [key]: value }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
    fontSize: 13, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6,
  }

  return (
    <div style={{ backgroundColor, padding: 16, border: '1px solid #e2e8f0', borderRadius: 10 }}>
      {headline && <h3 style={{ fontSize: 15, fontWeight: 700, color: accentColor || '#1a202c', margin: '0 0 16px' }}>{headline}</h3>}

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Street Address</label>
        <input style={inputStyle} type="text" placeholder="29 Poplar Rd"
          value={address.street} onChange={e => set('street', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>City</label>
          <input style={inputStyle} type="text" placeholder="Cape Town" value={address.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Postal Code</label>
          <input style={inputStyle} type="text" placeholder="8001" value={address.postal_code} onChange={e => set('postal_code', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Country</label>
          <select style={{ ...inputStyle, background: '#fff' }} value={address.country} onChange={e => set('country', e.target.value)}>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Province / State (optional)</label>
        <input style={{ ...inputStyle, maxWidth: 280 }} type="text" placeholder="Western Cape" value={address.province} onChange={e => set('province', e.target.value)} />
      </div>
    </div>
  )
}

// ── ComponentConfig export ────────────────────────────────────────────────────

export const DeliveryAddressForm: ComponentConfig<DeliveryAddressFormProps> = {
  label: 'Delivery Address Form',
  fields: {
    headline:        { type: 'text', label: 'Headline (optional)' },
    accentColor:     { type: 'custom', label: 'Accent colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Section background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    headline:        'Delivery Address',
    accentColor:     '#0e7490',
    backgroundColor: '#ffffff',
  },
  render(props) { return <DeliveryAddressFormInner {...props} /> },
}
