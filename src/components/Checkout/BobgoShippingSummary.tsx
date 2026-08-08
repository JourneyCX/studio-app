import { useState, useEffect } from 'react'
import type { ComponentConfig } from '@measured/puck'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BobgoShippingSummaryProps = {
  showCourier:     boolean
  showEta:         boolean
  accentColor:     string
  borderRadius:    number
  backgroundColor: string
}

interface BobgoRate {
  display_name?:          string
  service_level?:         { name: string }
  courier?:               { name: string }
  rate_including_vat?:    number
  estimated_delivery_date?: string
  is_free_shipping?:      boolean
  is_pickup_point?:       boolean
  type?:                  'door' | 'pickup'
}

interface PickupPoint {
  name:             string
  address?:         string
  operating_hours?: string
}

// ── Inner component ───────────────────────────────────────────────────────────

function ShippingSummaryInner({ showCourier, showEta, accentColor, borderRadius, backgroundColor }: BobgoShippingSummaryProps) {
  const [rate,        setRate]        = useState<BobgoRate | null>(null)
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const onRate = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {}
      setRate(detail.rate ?? null)
      setPickupPoint(null)
    }

    const onPickup = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {}
      setPickupPoint(detail.pickup_point ?? null)
    }

    document.addEventListener('bobgo:rate-selected',   onRate)
    document.addEventListener('bobgo:pickup-selected', onPickup)

    return () => {
      document.removeEventListener('bobgo:rate-selected',   onRate)
      document.removeEventListener('bobgo:pickup-selected', onPickup)
    }
  }, [])

  // ── Editor placeholder ──────────────────────────────────────────────────────
  if (!rate) {
    return (
      <div style={{ backgroundColor, padding: 16 }}>
        <div style={{ padding: '14px 16px', border: '1.5px dashed #d1d5db', borderRadius, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
          📦 Shipping summary will appear here after shopper selects a shipping option.
        </div>
      </div>
    )
  }

  // ── Live rendering ──────────────────────────────────────────────────────────
  const cost      = rate.rate_including_vat ?? 0
  const isFree    = cost === 0 || rate.is_free_shipping
  const isPickup  = !!(rate.is_pickup_point || rate.type === 'pickup')
  const icon      = isPickup ? '📦' : isFree ? '🎁' : '🚚'
  const name      = rate.display_name || rate.service_level?.name || 'Delivery'
  const courier   = showCourier && rate.courier?.name ? ` · ${rate.courier.name}` : ''
  const eta       = showEta && rate.estimated_delivery_date ? rate.estimated_delivery_date : ''

  const priceEl = isFree
    ? <span style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
    : <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>R {cost.toFixed(2)}</span>

  const blockStyle: React.CSSProperties = {
    padding:     '14px 16px',
    border:      isPickup && pickupPoint ? `1.5px solid ${accentColor}` : '1.5px solid #e5e7eb',
    borderRadius,
    background:  isPickup && pickupPoint ? `${accentColor}14` : '#fff',
    marginTop:   8,
  }

  return (
    <div style={{ backgroundColor, padding: 16 }}>
      <div style={blockStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <span style={{ fontWeight: 600, color: '#1f2937' }}>{icon} {name}{courier}</span>
          {priceEl}
        </div>

        {isPickup && pickupPoint ? (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {pickupPoint.name}{pickupPoint.address ? `, ${pickupPoint.address}` : ''}
            {pickupPoint.operating_hours && (
              <span style={{ color: '#9ca3af' }}> · {pickupPoint.operating_hours}</span>
            )}
          </div>
        ) : eta ? (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            Estimated: {eta}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── ComponentConfig export ────────────────────────────────────────────────────

export const BobgoShippingSummary: ComponentConfig<BobgoShippingSummaryProps> = {
  label: 'Shipping Summary (Bob Go)',
  fields: {
    showCourier:     { type: 'radio',   label: 'Show courier name',   options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showEta:         { type: 'radio',   label: 'Show estimated delivery', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:     { type: 'text',    label: 'Accent colour (hex)' },
    borderRadius:    { type: 'number',  label: 'Border radius (px)' },
    backgroundColor: { type: 'text',   label: 'Section background (hex)' },
  },
  defaultProps: {
    showCourier:     true,
    showEta:         true,
    accentColor:     '#0e7490',
    borderRadius:    10,
    backgroundColor: 'transparent',
  },
  render(props) { return <ShippingSummaryInner {...props} /> },
}
