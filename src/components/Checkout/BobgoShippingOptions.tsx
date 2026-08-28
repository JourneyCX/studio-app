import { useState, useEffect, useCallback, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BobgoShippingOptionsProps = {
  apiUrl:           string
  storeId:          string
  showCourierNames: boolean
  showEstDelivery:  boolean
  loadingStyle:     'skeleton' | 'spinner'
  fallbackMessage:  string
  accentColor:      string
  cardRadius:       number
  backgroundColor:  string
}

interface BobgoRate {
  display_name?:          string
  service_level?:         { code: string; name: string }
  courier?:               { name: string }
  rate_including_vat?:    number
  rate_excluding_vat?:    number
  estimated_delivery_date?: string
  delivery_days?:         number
  is_pickup_point?:       boolean
  is_free_shipping?:      boolean
  type?:                  'door' | 'pickup'
  level_id?:              number
  pickup_points?:         unknown[]
}

type State = 'idle' | 'loading' | 'loaded' | 'error' | 'no_rates'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSessionToken(): string {
  if (typeof window === 'undefined') return ''
  const key   = 'bobgo_session_token'
  let   token = localStorage.getItem(key) ?? ''
  if (!/^[0-9a-f]{32}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(key, token)
  }
  return token
}

function formatZAR(amount: number): string {
  return amount === 0 ? 'FREE' : `R ${amount.toFixed(2)}`
}

// ── Inner component (uses hooks) ──────────────────────────────────────────────

function ShippingOptionsInner(props: BobgoShippingOptionsProps) {
  const {
    apiUrl, storeId, showCourierNames, showEstDelivery,
    loadingStyle, fallbackMessage, accentColor, cardRadius, backgroundColor,
  } = props

  const [state,    setState]    = useState<State>('idle')
  const [rates,    setRates]    = useState<BobgoRate[]>([])
  const [selected, setSelected] = useState<BobgoRate | null>(null)
  const [error,    setError]    = useState('')
  const sessionRef = useRef<string>('')

  // Fetch rates when address changes
  const fetchRates = useCallback(async (detail: Record<string, unknown>) => {
    if (!apiUrl || !storeId) return
    const address = detail.address as Record<string, string> | undefined
    if (!address?.postal_code) return

    setState('loading')
    setSelected(null)
    try {
      const token = sessionRef.current || getSessionToken()
      sessionRef.current = token

      const res  = await fetch(`${apiUrl.replace(/\/$/, '')}/bobgo_checkout/rates`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:         storeId,
          session_token:    token,
          delivery_address: address,
          cart_items:       (detail.cartItems as unknown[]) ?? [],
        }),
      })
      const data = await res.json()

      if (res.status === 429) { setState('error'); setError('Too many requests — please wait a moment.'); return }
      if (!res.ok || data.error) { setState('error'); setError(data.error || 'Could not load shipping options.'); return }

      if (data.session_token) {
        sessionRef.current = data.session_token
        localStorage.setItem('bobgo_session_token', data.session_token)
      }

      const list: BobgoRate[] = data.rates ?? []
      setRates(list)
      setState(list.length ? 'loaded' : 'no_rates')
    } catch {
      setState('error')
      setError('Could not connect to shipping service.')
    }
  }, [apiUrl, storeId])

  // Listens for the same provider-agnostic 'shipping:*' events
  // ShippingOptions.tsx does, NOT a 'bobgo:*'-prefixed pair — the only widget
  // that ever collects an address (DeliveryAddressForm.tsx) only dispatches
  // 'shipping:address-changed', and nothing anywhere dispatches a
  // 'bobgo:address-changed'/'bobgo:cart-changed' event. This component
  // previously listened for those non-existent events, meaning it could
  // never receive a live address update and Bob Go rates never loaded via
  // the standard Puck widget flow, in either renderer. Only the *outbound*
  // events (bobgo:rate-selected / bobgo:pickup-selected) stay Bob-Go-
  // prefixed, since BobgoPickupSelector/BobgoShippingSummary need to know
  // which provider's rate shape to expect.
  useEffect(() => {
    if (typeof document === 'undefined') return
    sessionRef.current = getSessionToken()

    const handler = (e: Event) => fetchRates((e as CustomEvent).detail ?? {})
    document.addEventListener('shipping:address-changed', handler)
    document.addEventListener('shipping:cart-changed',   handler)

    return () => {
      document.removeEventListener('shipping:address-changed', handler)
      document.removeEventListener('shipping:cart-changed',   handler)
    }
  }, [fetchRates])

  // Persist selection and notify other widgets
  const selectRate = useCallback((rate: BobgoRate) => {
    setSelected(rate)
    if (typeof document === 'undefined') return

    document.dispatchEvent(new CustomEvent('bobgo:rate-selected', {
      bubbles: true,
      detail: {
        rate,
        pickup_points:   rate.pickup_points ?? [],
        is_pickup_point: !!(rate.is_pickup_point || rate.type === 'pickup'),
        session_token:   sessionRef.current,
        store_id:        storeId,
      },
    }))

    // Persist to server (non-blocking)
    if (apiUrl) {
      fetch(`${apiUrl.replace(/\/$/, '')}/bobgo_checkout/select_rate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:      storeId,
          session_token: sessionRef.current,
          rate,
          pickup_point:  null,
        }),
      }).catch(() => {})
    }
  }, [apiUrl, storeId])

  // ── Render states ─────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 16px',
    border:         `1.5px solid #e5e7eb`,
    borderRadius:   cardRadius,
    marginBottom:   8,
    cursor:         'pointer',
    background:     '#fff',
    transition:     'border-color 0.15s, background 0.15s',
    userSelect:     'none',
  }

  if (state === 'idle') {
    return (
      <div style={{ backgroundColor, padding: '16px', borderRadius: cardRadius }}>
        {!apiUrl ? (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, textAlign: 'center', padding: '24px 0' }}>
            🚚 Configure API URL in widget settings to enable live shipping rates.
          </p>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, textAlign: 'center', padding: '16px 0' }}>
            🚚 Enter your delivery address to see shipping options.
          </p>
        )}
      </div>
    )
  }

  if (state === 'loading') {
    if (loadingStyle === 'spinner') {
      return (
        <div style={{ backgroundColor, padding: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontSize: 13 }}>
          <span style={{ width: 20, height: 20, border: '2.5px solid #e5e7eb', borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0, display: 'inline-block' }} />
          Loading shipping options…
        </div>
      )
    }
    // Skeleton
    return (
      <div style={{ backgroundColor, padding: 16 }}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        {[60, 45, 50].map((w, i) => (
          <div key={i} style={{ ...cardStyle, cursor: 'default', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 13, borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: `${w}%`, marginBottom: 6 }} />
              <div style={{ height: 10, borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '35%' }} />
            </div>
            <div style={{ height: 13, borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: 60 }} />
          </div>
        ))}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ backgroundColor, padding: 16 }}>
        <div style={{ padding: '14px 16px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: cardRadius, color: '#78350f', fontSize: 13 }}>
          {error || fallbackMessage}
        </div>
      </div>
    )
  }

  if (state === 'no_rates') {
    return (
      <div style={{ backgroundColor, padding: 16 }}>
        <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: cardRadius, color: '#991b1b', fontSize: 13 }}>
          We don't currently ship to your area.
        </div>
      </div>
    )
  }

  // state === 'loaded'
  return (
    <div style={{ backgroundColor, padding: 16 }}>
      {rates.map((rate, i) => {
        const cost      = rate.rate_including_vat ?? 0
        const isFree    = cost === 0 || rate.is_free_shipping
        const isPickup  = !!(rate.is_pickup_point || rate.type === 'pickup')
        const isSelected = selected === rate
        const icon      = isFree ? '🎁' : isPickup ? '📦' : rate.delivery_days === 1 ? '⚡' : '🚚'
        const name      = rate.display_name || rate.service_level?.name || 'Delivery'
        const courier   = showCourierNames ? (rate.courier?.name ?? '') : ''
        const eta       = showEstDelivery && rate.estimated_delivery_date
          ? ` · Est. ${rate.estimated_delivery_date}`
          : (showEstDelivery && rate.delivery_days
              ? ` · ${rate.delivery_days} day${rate.delivery_days !== 1 ? 's' : ''}`
              : '')
        const meta      = [courier, eta].filter(Boolean).join('')

        return (
          <div
            key={i}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => selectRate(rate)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && selectRate(rate)}
            style={{
              ...cardStyle,
              borderColor:    isSelected ? accentColor : '#e5e7eb',
              background:     isSelected ? `${accentColor}14` : '#fff',
              boxShadow:      isSelected ? `0 0 0 3px ${accentColor}22` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              {/* Radio dot */}
              <span style={{
                flexShrink: 0, width: 18, height: 18,
                borderRadius: '50%',
                border:    `2px solid ${isSelected ? accentColor : '#d1d5db'}`,
                background: isSelected ? accentColor : '#fff',
                boxShadow:  isSelected ? `inset 0 0 0 3px #fff` : 'none',
                transition: 'all 0.15s',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {icon} {name}
                </span>
                {meta && (
                  <span style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {meta}
                    {isPickup && <span style={{ color: accentColor, fontWeight: 500 }}> › Select pickup point</span>}
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 12, whiteSpace: 'nowrap' }}>
              {isFree
                ? <span style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
                : <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{formatZAR(cost)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ComponentConfig export ────────────────────────────────────────────────────

export const BobgoShippingOptions: ComponentConfig<BobgoShippingOptionsProps> = {
  label: 'Shipping Options (Bob Go)',
  fields: {
    apiUrl:           { type: 'text',    label: 'Stratum API URL (e.g. https://your-stratum.com)' },
    storeId:          { type: 'text',    label: 'Store ID (WooCommerce store numeric ID)' },
    showCourierNames: { type: 'radio',   label: 'Show courier names', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showEstDelivery:  { type: 'radio',   label: 'Show estimated delivery', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    loadingStyle:     { type: 'select',  label: 'Loading animation', options: [{ label: 'Skeleton cards', value: 'skeleton' }, { label: 'Spinner', value: 'spinner' }] },
    fallbackMessage:  { type: 'text',    label: 'Error / fallback message' },
    accentColor:      { type: 'custom',  label: 'Accent colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardRadius:       { type: 'number',  label: 'Card border radius (px)' },
    backgroundColor:  { type: 'custom', label: 'Section background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    apiUrl:           '',
    storeId:          '',
    showCourierNames: true,
    showEstDelivery:  true,
    loadingStyle:     'skeleton',
    fallbackMessage:  'Shipping calculated at order completion.',
    accentColor:      '#0e7490',
    cardRadius:       10,
    backgroundColor:  'transparent',
  },
  render(props) { return <ShippingOptionsInner {...props} /> },
}
