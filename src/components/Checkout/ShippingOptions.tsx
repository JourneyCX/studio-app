import { useState, useEffect, useCallback, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { stratumApi } from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
//
// Provider-agnostic counterpart to BobgoShippingOptions.tsx — talks to
// Shipping_checkout.php (modules/logistic/controllers/Shipping_checkout.php)
// instead of Bobgo_checkout.php, which resolves whichever provider (Bob Go,
// The Courier Guy, or the WooCommerce-native fallback) is active for the
// store via Shipping_provider_factory and returns a single normalized rate
// shape regardless. One set of widgets works for any provider a merchant
// activates — no per-provider widget needed. See
// docs/shipping_provider_architecture_investigation.md §3.

export type ShippingOptionsProps = {
  apiUrl:           string
  storeId:          string
  // storeId (woo_store_id) is only unique within one tenant's own table --
  // tenantId disambiguates it server-side instead of an unscoped cross-tenant
  // scan. See Shipping_provider_factory::resolve_store_prefix().
  tenantId:         string
  showCourierNames: boolean
  showEstDelivery:  boolean
  loadingStyle:     'skeleton' | 'spinner'
  fallbackMessage:  string
  accentColor:      string
  cardRadius:       number
  backgroundColor:  string
}

interface ShippingRate {
  provider?:        string
  service_code?:    string
  service_name?:    string
  price?:           number
  currency?:        string
  eta_days?:        number | null
  is_pickup_point?: boolean
  courier_name?:    string | null
  // Present only when this rate already resolves to one specific pickup
  // location (e.g. Bob Go — a separate rate entry per nearby Bob Box).
  // Absent when is_pickup_point is true but the location still needs to
  // be looked up separately (e.g. The Courier Guy's PUDO network) — see
  // Shipping_provider_interface.php.
  pickup_point_id?:          string
  pickup_point_name?:        string
  pickup_point_distance_km?: number | null
}

type State = 'idle' | 'loading' | 'loaded' | 'error' | 'no_rates'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSessionToken(): string {
  if (typeof window === 'undefined') return ''
  const key   = 'shipping_session_token'
  let   token = localStorage.getItem(key) ?? ''
  if (!/^[0-9a-f]{32}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(key, token)
  }
  return token
}

function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return 'FREE'
  return currency === 'ZAR' ? `R ${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`
}

// ── Inner component (uses hooks) ──────────────────────────────────────────────

function ShippingOptionsInner(props: ShippingOptionsProps) {
  const {
    apiUrl, storeId, tenantId, showCourierNames, showEstDelivery,
    loadingStyle, fallbackMessage, accentColor, cardRadius, backgroundColor,
  } = props

  const [state,    setState]    = useState<State>('idle')
  const [rates,    setRates]    = useState<ShippingRate[]>([])
  const [selected, setSelected] = useState<ShippingRate | null>(null)
  const [error,    setError]    = useState('')
  const sessionRef   = useRef<string>('')
  const postalRef    = useRef<string>('')

  // Fetch rates when address changes
  const fetchRates = useCallback(async (detail: Record<string, unknown>) => {
    if (!apiUrl || !storeId) return
    const address = detail.address as Record<string, string> | undefined
    if (!address?.postal_code) return
    postalRef.current = address.postal_code

    setState('loading')
    setSelected(null)
    try {
      const token = sessionRef.current || getSessionToken()
      sessionRef.current = token

      const res  = await fetch(`${apiUrl.replace(/\/$/, '')}/shipping_checkout/rates`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:         storeId,
          tenant_id:        tenantId,
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
        localStorage.setItem('shipping_session_token', data.session_token)
      }

      const list: ShippingRate[] = data.rates ?? []
      setRates(list)
      setState(list.length ? 'loaded' : 'no_rates')
    } catch {
      setState('error')
      setError('Could not connect to shipping service.')
    }
  }, [apiUrl, storeId, tenantId])

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
  const selectRate = useCallback((rate: ShippingRate) => {
    setSelected(rate)
    if (typeof document === 'undefined') return

    document.dispatchEvent(new CustomEvent('shipping:rate-selected', {
      bubbles: true,
      detail: {
        rate,
        is_pickup_point: !!rate.is_pickup_point,
        session_token:   sessionRef.current,
        store_id:        storeId,
        tenant_id:       tenantId,
        postal_code:     postalRef.current,
      },
    }))

    // Persist to server (non-blocking)
    if (apiUrl) {
      fetch(`${apiUrl.replace(/\/$/, '')}/shipping_checkout/select_rate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:      storeId,
          tenant_id:     tenantId,
          session_token: sessionRef.current,
          rate,
        }),
      }).catch(() => {})
    }
  }, [apiUrl, storeId, tenantId])

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
        const cost      = rate.price ?? 0
        const currency  = rate.currency || 'ZAR'
        const isFree    = cost === 0
        const isPickup  = !!rate.is_pickup_point
        // A pickup rate that already names its own location (Bob Go: one
        // rate entry per nearby Bob Box) needs no further drill-down step.
        // One without a resolved location (The Courier Guy: a generic PUDO
        // rate) still needs the PickupSelector widget's live lookup.
        const isResolvedPickup = isPickup && !!rate.pickup_point_id
        const needsPickupPick  = isPickup && !rate.pickup_point_id
        const isSelected = selected === rate
        const icon      = isFree ? '🎁' : isPickup ? '📦' : rate.eta_days === 1 ? '⚡' : '🚚'
        const name      = (isResolvedPickup ? rate.pickup_point_name : rate.service_name) || 'Delivery'
        const courier   = showCourierNames ? (rate.courier_name ?? '') : ''
        const eta       = showEstDelivery && rate.eta_days
          ? ` · ${rate.eta_days} day${rate.eta_days !== 1 ? 's' : ''}`
          : ''
        const distance  = isResolvedPickup && rate.pickup_point_distance_km != null
          ? ` · ${rate.pickup_point_distance_km.toFixed(1)} km`
          : ''
        const meta      = [courier, eta, distance].filter(Boolean).join('')

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
                {(meta || needsPickupPick) && (
                  <span style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {meta}
                    {needsPickupPick && <span style={{ color: accentColor, fontWeight: 500 }}> › Select pickup point</span>}
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 12, whiteSpace: 'nowrap' }}>
              {isFree
                ? <span style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
                : <span style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{formatPrice(cost, currency)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ComponentConfig export ────────────────────────────────────────────────────

export const ShippingOptions: ComponentConfig<ShippingOptionsProps> = {
  label: 'Shipping Options (Any Provider)',
  fields: {
    apiUrl:           { type: 'text',    label: 'Stratum API URL (auto-configured — override only for a custom backend)' },
    storeId:          { type: 'text',    label: 'Store ID (auto-configured — override only for a custom backend)' },
    tenantId:         { type: 'text',    label: 'Tenant ID (auto-configured — do not edit)' },
    showCourierNames: { type: 'radio',   label: 'Show courier names', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showEstDelivery:  { type: 'radio',   label: 'Show estimated delivery', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    loadingStyle:     { type: 'select',  label: 'Loading animation', options: [{ label: 'Skeleton cards', value: 'skeleton' }, { label: 'Spinner', value: 'spinner' }] },
    fallbackMessage:  { type: 'text',    label: 'Error / fallback message' },
    accentColor:      { type: 'text',    label: 'Accent colour (hex)' },
    cardRadius:       { type: 'number',  label: 'Card border radius (px)' },
    backgroundColor:  { type: 'text',   label: 'Section background (hex)' },
  },
  defaultProps: {
    apiUrl:           '',
    storeId:          '',
    tenantId:         '',
    showCourierNames: true,
    showEstDelivery:  true,
    loadingStyle:     'skeleton',
    fallbackMessage:  'Shipping calculated at order completion.',
    accentColor:      '#0e7490',
    cardRadius:       10,
    backgroundColor:  'transparent',
  },
  // Fills apiUrl/storeId/tenantId the first time this block is dropped onto a
  // page, so a merchant never has to look up the Stratum URL, WooCommerce
  // store ID, or tenant ID and paste them in by hand. Only fires when apiUrl
  // and storeId are still blank — an existing published block (or one whose
  // fields were deliberately overridden) is never touched. See
  // Store_builder_api::shipping_widget_config() for what this resolves to.
  // Same pattern as AITool.tsx's resolveData().
  async resolveData(data) {
    if (data.props.apiUrl || data.props.storeId) {
      return { props: {} }
    }
    try {
      const { apiUrl, storeId, tenantId } = await stratumApi.getActiveShippingWidgetConfig()
      return { props: { apiUrl, storeId, tenantId } }
    } catch {
      return { props: {} }
    }
  },

  render(props) { return <ShippingOptionsInner {...props} /> },
}
