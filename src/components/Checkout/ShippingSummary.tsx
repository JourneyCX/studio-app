import { useState, useEffect } from 'react'
import type { ComponentConfig } from '@measured/puck'

// ── Types ─────────────────────────────────────────────────────────────────────
//
// Provider-agnostic counterpart to BobgoShippingSummary.tsx — renders
// whatever rate/pickup point the generic ShippingOptions / PickupSelector
// widgets dispatched, regardless of which provider produced it.

export type ShippingSummaryProps = {
  showCourier:     boolean
  showEta:         boolean
  accentColor:     string
  borderRadius:    number
  backgroundColor: string
}

interface ShippingRate {
  service_name?:    string
  price?:           number
  currency?:        string
  eta_days?:        number | null
  is_pickup_point?: boolean
  courier_name?:    string | null
  // Present when this rate already resolves to one specific pickup
  // location (Bob Go). See ShippingOptions.tsx / Shipping_provider_interface.php.
  pickup_point_id?:          string
  pickup_point_name?:        string
  pickup_point_distance_km?: number | null
}

interface PickupPoint {
  name:            string
  address?:        string
  trading_hours?:  string
}

// ── Inner component ───────────────────────────────────────────────────────────

function ShippingSummaryInner({ showCourier, showEta, accentColor, borderRadius, backgroundColor }: ShippingSummaryProps) {
  const [rate,        setRate]        = useState<ShippingRate | null>(null)
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

    document.addEventListener('shipping:rate-selected',   onRate)
    document.addEventListener('shipping:pickup-selected', onPickup)

    return () => {
      document.removeEventListener('shipping:rate-selected',   onRate)
      document.removeEventListener('shipping:pickup-selected', onPickup)
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
  const cost      = rate.price ?? 0
  const currency  = rate.currency || 'ZAR'
  const isFree    = cost === 0
  const isPickup  = !!rate.is_pickup_point
  // Bob Go's rate already names its own location; The Courier Guy's
  // generic pickup rate gets its location from the separate pickupPoint
  // event once PickupSelector's live lookup resolves it.
  const resolvedPickupName = rate.pickup_point_name || pickupPoint?.name
  const icon      = isPickup ? '📦' : isFree ? '🎁' : '🚚'
  const name      = resolvedPickupName || rate.service_name || 'Delivery'
  const courier   = showCourier && rate.courier_name ? ` · ${rate.courier_name}` : ''
  const eta       = showEta && rate.eta_days ? `${rate.eta_days} day${rate.eta_days !== 1 ? 's' : ''}` : ''

  const priceEl = isFree
    ? <span style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
    : <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{currency === 'ZAR' ? 'R' : currency} {cost.toFixed(2)}</span>

  const hasResolvedPickup = isPickup && !!(pickupPoint || rate.pickup_point_id)

  const blockStyle: React.CSSProperties = {
    padding:     '14px 16px',
    border:      hasResolvedPickup ? `1.5px solid ${accentColor}` : '1.5px solid #e5e7eb',
    borderRadius,
    background:  hasResolvedPickup ? `${accentColor}14` : '#fff',
    marginTop:   8,
  }

  return (
    <div style={{ backgroundColor, padding: 16 }}>
      <div style={blockStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <span style={{ fontWeight: 600, color: '#1f2937' }}>{icon} {name}{courier}</span>
          {priceEl}
        </div>

        {pickupPoint ? (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {pickupPoint.name}{pickupPoint.address ? `, ${pickupPoint.address}` : ''}
            {pickupPoint.trading_hours && (
              <span style={{ color: '#9ca3af' }}> · {pickupPoint.trading_hours}</span>
            )}
          </div>
        ) : rate.pickup_point_id ? (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {rate.pickup_point_distance_km != null && `${rate.pickup_point_distance_km.toFixed(1)} km away`}
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

export const ShippingSummary: ComponentConfig<ShippingSummaryProps> = {
  label: 'Shipping Summary (Any Provider)',
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
