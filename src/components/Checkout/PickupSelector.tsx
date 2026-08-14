import { useState, useEffect, useRef, useCallback } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { stratumApi } from '../../lib/api'
import { ColorField } from '../shared/ColorField'

// ── Types ─────────────────────────────────────────────────────────────────────
//
// Provider-agnostic counterpart to BobgoPickupSelector.tsx. Two genuinely
// different pickup models exist across providers, and this widget only
// needs to act for one of them:
//   - The Courier Guy: a rate is generically "pickup type" and the real
//     location still needs to be looked up (shipping_checkout/pickup_points,
//     live/working). This widget opens and does that lookup.
//   - Bob Go: has no standalone pickup-points endpoint at all (confirmed
//     404 on Bob Go's real API) — each nearby Bob Box comes back as its
//     OWN separate, already-fully-resolved rate entry (pickup_point_id/
//     pickup_point_name on the rate itself, see Bobgo_provider::_normalize_rates()).
//     Selecting that rate in ShippingOptions IS the final choice; this
//     widget has nothing further to do and stays hidden.

export type PickupSelectorProps = {
  apiUrl:       string
  storeId:      string
  tenantId:     string
  mapProvider:  'osm' | 'googlemaps'
  googleMapsKey: string
  maxPoints:    number
  layout:       'list' | 'map' | 'split'
  showHours:    boolean
  accentColor:  string
  mapHeight:    number
}

interface PickupPoint {
  provider?:           string
  pickup_point_id:     string
  pickup_point_type?:  string
  name:                string
  address?:            string
  lat?:                number
  lng?:                number
  trading_hours?:      string
}

// ── Inner component ───────────────────────────────────────────────────────────

function PickupSelectorInner(props: PickupSelectorProps) {
  const { apiUrl, storeId, tenantId, layout, maxPoints, showHours, accentColor, mapHeight } = props

  const [visible,  setVisible]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [points,   setPoints]   = useState<PickupPoint[]>([])
  const [selected, setSelected] = useState<PickupPoint | null>(null)
  const [rateData, setRateData] = useState<unknown>(null)
  const sessionRef  = useRef<string>('')
  const storeIdRef  = useRef<string>('')
  const mapElRef    = useRef<HTMLDivElement | null>(null)
  const leafletRef  = useRef<{ map: unknown; markers: unknown[] } | null>(null)

  // ── Fetch pickup points near the shopper's postal code ─────────────────────
  const fetchPoints = useCallback(async (postalCode: string, token: string) => {
    if (!apiUrl || !storeId || !postalCode) { setPoints([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`${apiUrl.replace(/\/$/, '')}/shipping_checkout/pickup_points`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:      storeId,
          tenant_id:     tenantId,
          session_token: token,
          postal_code:   postalCode,
          max_results:   maxPoints,
        }),
      })
      const data = await res.json()
      setPoints(data.pickup_points ?? [])
    } catch {
      setPoints([])
    } finally {
      setLoading(false)
    }
  }, [apiUrl, storeId, tenantId, maxPoints])

  // ── Listen for rate-selected event ─────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {}
      const rate   = (detail.rate ?? null) as { pickup_point_id?: string } | null
      // Only open for a rate that needs a further location lookup. A rate
      // that already carries pickup_point_id (Bob Go) is already the final
      // choice — nothing for this widget to do.
      const needsLookup = !!detail.is_pickup_point && !rate?.pickup_point_id

      if (needsLookup) {
        setRateData(rate)
        setSelected(null)
        setVisible(true)
        sessionRef.current = detail.session_token ?? ''
        storeIdRef.current = detail.store_id ?? ''
        fetchPoints(detail.postal_code ?? '', sessionRef.current)
      } else {
        setVisible(false)
        setPoints([])
        setSelected(null)
        destroyMap()
      }
    }

    document.addEventListener('shipping:rate-selected', handler)
    return () => document.removeEventListener('shipping:rate-selected', handler)
  }, [fetchPoints])

  // ── Init Leaflet map when points + mapEl are ready ─────────────────────────
  useEffect(() => {
    if (!visible || !mapElRef.current) return
    if (layout !== 'map' && layout !== 'split') return
    if (!points.length) return

    loadLeaflet().then(() => drawMap())
  }, [visible, points, layout])

  function destroyMap() {
    if (typeof window === 'undefined') return
    const L = (window as unknown as Record<string, unknown>)['L'] as Record<string, unknown> | undefined
    if (leafletRef.current?.map && L) {
      (leafletRef.current.map as { remove: () => void }).remove()
    }
    leafletRef.current = null
  }

  function loadLeaflet(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    const w = window as Window & { L?: unknown }
    if (w.L) return Promise.resolve()

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.async = true; s.onload = () => resolve(); s.onerror = reject
      document.head.appendChild(s)
    })
  }

  function drawMap() {
    if (!mapElRef.current) return
    const w = window as Window & { L?: Record<string, unknown> }
    const L = w.L
    if (!L) return

    destroyMap()

    const valid = points.filter(p => p.lat && p.lng).slice(0, maxPoints)
    if (!valid.length) return

    const mapInstance = (L['map'] as Function)(mapElRef.current).setView(
      [valid[0].lat!, valid[0].lng!], 13
    )
    ;(L['tileLayer'] as Function)(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap', maxZoom: 18 }
    ).addTo(mapInstance)

    valid.forEach((p, idx) => {
      const icon = (L['divIcon'] as Function)({
        className: '',
        html: `<div style="width:28px;height:28px;background:${accentColor};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);"><span style="transform:rotate(45deg);font-size:11px;font-weight:700;">${idx + 1}</span></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28],
      })
      const marker = (L['marker'] as Function)([p.lat!, p.lng!], { icon }).addTo(mapInstance)
      marker.bindPopup(`<strong>${p.name}</strong><br>${p.address ?? ''}`)
      marker.on('click', () => handleSelectPoint(p))
    })

    // Fit bounds
    if (valid.length > 1) {
      mapInstance.fitBounds(valid.map(p => [p.lat!, p.lng!]), { padding: [30, 30] })
    }

    leafletRef.current = { map: mapInstance, markers: [] }
  }

  const handleSelectPoint = useCallback((point: PickupPoint) => {
    setSelected(point)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!selected || typeof document === 'undefined') return
    document.dispatchEvent(new CustomEvent('shipping:pickup-selected', {
      bubbles: true,
      detail: {
        pickup_point:  selected,
        rate:          rateData,
        session_token: sessionRef.current,
        store_id:      storeIdRef.current,
      },
    }))
  }, [selected, rateData])

  if (!visible) return null

  // ── Render helpers ──────────────────────────────────────────────────────────

  const listPane = (
    <div style={{ background: '#fff', borderRight: layout === 'split' ? '1px solid #e5e7eb' : 'none', display: 'flex', flexDirection: 'column', maxHeight: mapHeight, overflowY: 'auto' }}>
      <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {loading ? 'Loading nearby locations…' : `${points.length} nearby location${points.length !== 1 ? 's' : ''}`}
      </div>
      {points.slice(0, maxPoints).map((p, i) => {
        const isSelected = selected?.pickup_point_id === p.pickup_point_id
        const badge      = p.pickup_point_type === 'locker'
          ? { label: 'Locker',  bg: '#e0f7fa', color: '#0e7490' }
          : { label: 'Counter', bg: '#ede9fe', color: '#7c3aed' }

        return (
          <div
            key={p.pickup_point_id ?? i}
            role="button"
            tabIndex={0}
            onClick={() => handleSelectPoint(p)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSelectPoint(p)}
            style={{
              padding:     '12px 14px',
              borderBottom: '1px solid #e5e7eb',
              cursor:      'pointer',
              background:  isSelected ? `${accentColor}14` : '#fff',
              borderLeft:  isSelected ? `3px solid ${accentColor}` : '3px solid transparent',
              transition:  'background 0.12s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', flex: 1 }}>{p.name}</span>
              {p.pickup_point_type && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: badge.bg, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {badge.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {p.address}
            </div>
            {showHours && p.trading_hours && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{p.trading_hours}</div>
            )}
          </div>
        )
      })}
      {!loading && !points.length && (
        <div style={{ padding: '14px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          No pickup points found near this address.
        </div>
      )}
    </div>
  )

  const mapPane = (
    <div
      ref={el => { mapElRef.current = el }}
      style={{ height: mapHeight, minHeight: 200, background: '#e5e7eb', flex: 1 }}
    />
  )

  const confirmStrip = selected && (
    <div style={{ padding: '12px 16px', background: `${accentColor}14`, borderTop: `1.5px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
      <span><strong>Selected:</strong> {selected.name}{selected.address ? `, ${selected.address}` : ''}</span>
      <button
        onClick={handleConfirm}
        style={{ background: accentColor, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        Confirm pickup point
      </button>
    </div>
  )

  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginTop: 12 }}>
      {layout === 'list' && (
        <>{listPane}{confirmStrip}</>
      )}
      {layout === 'map' && (
        <>{mapPane}{confirmStrip}</>
      )}
      {layout === 'split' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
            {listPane}
            {mapPane}
          </div>
          {confirmStrip}
        </>
      )}
    </div>
  )
}

// ── ComponentConfig export ────────────────────────────────────────────────────

export const PickupSelector: ComponentConfig<PickupSelectorProps> = {
  label: 'Pickup Selector (Any Provider)',
  fields: {
    apiUrl:        { type: 'text',   label: 'Stratum API URL (auto-configured — must match Shipping Options widget)' },
    storeId:       { type: 'text',   label: 'Store ID (auto-configured — must match Shipping Options widget)' },
    tenantId:      { type: 'text',   label: 'Tenant ID (auto-configured — do not edit)' },
    mapProvider:   { type: 'select', label: 'Map provider', options: [{ label: 'OpenStreetMap (free, no key)', value: 'osm' }, { label: 'Google Maps', value: 'googlemaps' }] },
    googleMapsKey: { type: 'text',   label: 'Google Maps API key (required only for Google Maps provider)' },
    maxPoints:     { type: 'number', label: 'Max pickup points to show (3–15)' },
    layout:        { type: 'select', label: 'Layout', options: [{ label: 'List + Map (split)', value: 'split' }, { label: 'List only', value: 'list' }, { label: 'Map only', value: 'map' }] },
    showHours:     { type: 'radio',  label: 'Show operating hours', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    accentColor:   { type: 'custom', label: 'Accent colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    mapHeight:     { type: 'number', label: 'Map height (px)' },
  },
  defaultProps: {
    apiUrl:        '',
    storeId:       '',
    tenantId:      '',
    mapProvider:   'osm',
    googleMapsKey: '',
    maxPoints:     5,
    layout:        'split',
    showHours:     true,
    accentColor:   '#0e7490',
    mapHeight:     340,
  },
  // Same auto-fill as ShippingOptions.tsx's resolveData() — see that file's
  // comment. Kept independent (not reading the sibling ShippingOptions block's
  // saved props) since Puck blocks don't have visibility into each other's
  // config; both resolve to the same tenant-scoped values regardless.
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

  render(props) { return <PickupSelectorInner {...props} /> },
}
