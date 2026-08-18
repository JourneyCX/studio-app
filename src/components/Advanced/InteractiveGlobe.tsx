import { useRef, useEffect, useState, useCallback } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { WORLD_LAND } from './worldLand'

type GLocation = { name: string; lat: number; lng: number; description: string; color: string }

export type InteractiveGlobeProps = {
  headline: string
  subheadline: string
  theme: 'ocean' | 'dark' | 'green'
  autoRotate: boolean
  rotateSpeed: number
  globeSize: number
  locations: GLocation[]
  backgroundColor: string
  textColor: string
}

function project(lat: number, lng: number, rotation: number, cx: number, cy: number, r: number) {
  const phi    = (lat * Math.PI) / 180
  const lambda = ((lng - rotation) * Math.PI) / 180
  const x3 = Math.cos(phi) * Math.sin(lambda)
  const y3 = Math.sin(phi)
  const z3 = Math.cos(phi) * Math.cos(lambda)
  return { x: cx + x3 * r, y: cy - y3 * r, z: z3, visible: z3 > 0.05 }
}

const THEMES = {
  ocean: { base0: '#1e3a5f', base1: '#0a1628', grid: '99,179,237', glow: '59,130,246', land: '52,178,112', landAlpha: 0.6 },
  dark:  { base0: '#1a1a2e', base1: '#0d0d1a', grid: '148,163,184', glow: '148,163,184', land: '203,213,225', landAlpha: 0.16 },
  green: { base0: '#0d3320', base1: '#051a10', grid: '52,211,153', glow: '16,185,129', land: '134,239,172', landAlpha: 0.4 },
}

function drawLand(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  rotation: number,
  theme: keyof typeof THEMES
) {
  const T = THEMES[theme]
  ctx.fillStyle = `rgba(${T.land},${T.landAlpha})`
  for (const ring of WORLD_LAND) {
    ctx.beginPath()
    let started = false
    for (const [lng, lat] of ring) {
      const p = project(lat, lng, rotation, cx, cy, r)
      if (p.visible) {
        if (!started) { ctx.moveTo(p.x, p.y); started = true }
        else ctx.lineTo(p.x, p.y)
      } else {
        started = false
      }
    }
    ctx.fill()
  }
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  rotation: number,
  theme: keyof typeof THEMES,
  locations: GLocation[],
  selectedIdx: number,
  pulseAnim: number
) {
  const T = THEMES[theme]
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Ambient glow
  const ambient = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.45)
  ambient.addColorStop(0, `rgba(${T.glow},0.12)`)
  ambient.addColorStop(1, `rgba(${T.glow},0)`)
  ctx.fillStyle = ambient
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2); ctx.fill()

  // Sphere
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r)
  grad.addColorStop(0, T.base0)
  grad.addColorStop(1, T.base1)
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

  // Clip to sphere
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.clip()

  drawLand(ctx, cx, cy, r, rotation, theme)

  const drawParallel = (lat: number, opacity: number, width: number) => {
    ctx.strokeStyle = `rgba(${T.grid},${opacity})`
    ctx.lineWidth = width
    ctx.beginPath()
    let first = true, lastVis = false
    for (let lng2 = 0; lng2 <= 362; lng2 += 2) {
      const p = project(lat, lng2, rotation, cx, cy, r)
      if (p.visible) { if (first || !lastVis) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); first = false }
      lastVis = p.visible
    }
    ctx.stroke()
  }

  const drawMeridian = (lng2: number) => {
    ctx.strokeStyle = `rgba(${T.grid},0.12)`;  ctx.lineWidth = 0.5
    ctx.beginPath()
    let first = true, lastVis = false
    for (let lat2 = -90; lat2 <= 92; lat2 += 3) {
      const p = project(lat2, lng2, rotation, cx, cy, r)
      if (p.visible) { if (first || !lastVis) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); first = false }
      lastVis = p.visible
    }
    ctx.stroke()
  }

  for (let lat = -60; lat <= 60; lat += 30) drawParallel(lat, lat === 0 ? 0.38 : 0.14, lat === 0 ? 1 : 0.5)
  for (let lng2 = 0; lng2 < 360; lng2 += 30) drawMeridian(lng2)

  ctx.restore()

  // Highlight
  const hl = ctx.createRadialGradient(cx - r * 0.37, cy - r * 0.4, 0, cx - r * 0.18, cy - r * 0.18, r * 0.7)
  hl.addColorStop(0, 'rgba(255,255,255,0.13)'); hl.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

  // Border ring
  ctx.strokeStyle = `rgba(${T.grid},0.22)`; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()

  // Location markers
  locations.forEach((loc, i) => {
    const p = project(loc.lat, loc.lng, rotation, cx, cy, r)
    if (!p.visible) return

    const isSel   = i === selectedIdx
    const dotCol  = loc.color || `rgba(${T.glow},1)`
    const pulse   = isSel ? Math.abs(Math.sin(pulseAnim * 0.06)) : 0

    if (isSel) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 14 + pulse * 4, 0, Math.PI * 2)
      ctx.fillStyle = dotCol + '20'; ctx.fill()
      ctx.beginPath(); ctx.arc(p.x, p.y, 8 + pulse * 2, 0, Math.PI * 2)
      ctx.fillStyle = dotCol + '40'; ctx.fill()
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = dotCol + '28'; ctx.fill()
    }
    ctx.beginPath(); ctx.arc(p.x, p.y, isSel ? 6 : 4, 0, Math.PI * 2)
    ctx.fillStyle = dotCol; ctx.fill()
    ctx.beginPath(); ctx.arc(p.x, p.y - (isSel ? 1.5 : 1), isSel ? 2 : 1.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill()

    ctx.font = `${isSel ? 'bold ' : ''}11px system-ui, -apple-system, sans-serif`
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(15,23,42,0.85)'
    ctx.strokeText(loc.name, p.x + (isSel ? 12 : 9), p.y)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(loc.name, p.x + (isSel ? 12 : 9), p.y)
  })
}

interface GlobeProps extends InteractiveGlobeProps {}

function GlobeCanvas({ theme, autoRotate, rotateSpeed, globeSize, locations, backgroundColor, textColor }: GlobeProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const rotRef         = useRef(20)
  const draggingRef    = useRef(false)
  const lastXRef       = useRef(0)
  const dragDeltaRef   = useRef(0)
  const animRef        = useRef(0)
  const pulseRef       = useRef(0)
  const [selected, setSelected]   = useState(-1)
  const [popup, setPopup]         = useState<{ x: number; y: number; loc: GLocation } | null>(null)

  const getCanvasCoords = useCallback((e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      mx: (e.clientX - rect.left) * (canvas.width / rect.width),
      my: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = globeSize
    canvas.width  = size
    canvas.height = size
    const cx = size / 2, cy = size / 2, r = size / 2 - 20

    const loop = () => {
      pulseRef.current++
      if (!draggingRef.current && autoRotate) rotRef.current += rotateSpeed * 0.1
      drawGlobe(ctx, cx, cy, r, rotRef.current, theme, locations, selected, pulseRef.current)
      animRef.current = requestAnimationFrame(loop)
    }
    loop()

    const onMouseDown = (e: MouseEvent) => {
      draggingRef.current = true
      dragDeltaRef.current = 0
      lastXRef.current = e.clientX
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastXRef.current
      dragDeltaRef.current += Math.abs(dx)
      rotRef.current -= dx * 0.4
      lastXRef.current = e.clientX
    }
    const onMouseUp = (e: MouseEvent) => {
      draggingRef.current = false
      if (dragDeltaRef.current < 5) {
        // It's a click — hit test
        const { mx, my } = getCanvasCoords(e, canvas)
        let hit = -1, minD = 18
        locations.forEach((loc, i) => {
          const p = project(loc.lat, loc.lng, rotRef.current, cx, cy, r)
          if (!p.visible) return
          const d = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2)
          if (d < minD) { minD = d; hit = i }
        })
        if (hit >= 0) {
          setSelected(hit)
          const p = project(locations[hit].lat, locations[hit].lng, rotRef.current, cx, cy, r)
          const rect = canvas.getBoundingClientRect()
          setPopup({ x: rect.left + p.x * (rect.width / canvas.width), y: rect.top + p.y * (rect.height / canvas.height), loc: locations[hit] })
        } else {
          setSelected(-1); setPopup(null)
        }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.style.cursor = 'grab'

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [theme, autoRotate, rotateSpeed, globeSize, locations, selected, getCanvasCoords])

  return (
    <div style={{ position: 'relative', width: globeSize, height: globeSize, margin: '0 auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      {popup && (
        <div
          style={{
            position: 'fixed',
            left: popup.x + 14,
            top: popup.y - 60,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 100,
            maxWidth: 220,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: popup.loc.color || '#2563eb', flexShrink: 0 }} />
            <strong style={{ color: '#1e293b', fontSize: 14 }}>{popup.loc.name}</strong>
          </div>
          {popup.loc.description && <p style={{ color: '#64748b', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{popup.loc.description}</p>}
          <button onClick={() => { setPopup(null); setSelected(-1) }} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, pointerEvents: 'all' }}>×</button>
        </div>
      )}
    </div>
  )
}

export const InteractiveGlobe: ComponentConfig<InteractiveGlobeProps> = {
  label: 'Interactive Globe',
  fields: {
    headline:        { type: 'text',     label: 'Section Headline' },
    subheadline:     { type: 'textarea', label: 'Section Subheadline' },
    theme:           { type: 'select',   label: 'Globe Theme', options: [{ label: 'Ocean (blue)', value: 'ocean' }, { label: 'Dark (space)', value: 'dark' }, { label: 'Green (earth)', value: 'green' }] },
    autoRotate:      { type: 'radio',    label: 'Auto-Rotate', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    rotateSpeed:     { type: 'number',   label: 'Rotation Speed (0.1–5)' },
    globeSize:       { type: 'number',   label: 'Globe Diameter (px)' },
    backgroundColor: { type: 'custom',  label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom',   label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    locations: {
      type: 'array', label: 'Locations',
      arrayFields: {
        name:        { type: 'text',     label: 'Location Name' },
        lat:         { type: 'number',   label: 'Latitude (-90 to 90)' },
        lng:         { type: 'number',   label: 'Longitude (-180 to 180)' },
        description: { type: 'textarea', label: 'Popup Description' },
        color:       { type: 'custom',   label: 'Marker Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
      },
      defaultItemProps: { name: 'New Location', lat: 0, lng: 0, description: '', color: '#60a5fa' },
      getItemSummary: (loc: GLocation) => loc.name || 'Location',
    },
  },
  defaultProps: {
    headline:        'Where We Ship',
    subheadline:     'Click a marker to learn more about our presence in each region.',
    theme:           'ocean',
    autoRotate:      true,
    rotateSpeed:     1,
    globeSize:       520,
    backgroundColor: '#0f172a',
    textColor:       '#ffffff',
    locations: [
      { name: 'Cape Town', lat: -33.9, lng: 18.4, description: 'Our headquarters and main fulfilment centre.', color: '#34d399' },
      { name: 'Johannesburg', lat: -26.2, lng: 28.0, description: 'Northern distribution hub serving Gauteng.', color: '#60a5fa' },
      { name: 'Nairobi', lat: -1.3, lng: 36.8, description: 'East Africa regional partner.', color: '#fbbf24' },
      { name: 'London', lat: 51.5, lng: -0.1, description: 'International wholesale partner — United Kingdom.', color: '#f472b6' },
      { name: 'Dubai', lat: 25.2, lng: 55.3, description: 'Middle East distribution partner.', color: '#a78bfa' },
      { name: 'Sydney', lat: -33.9, lng: 151.2, description: 'Australasia reseller.', color: '#fb923c' },
    ],
  },
  render(props) {
    const { headline, subheadline, backgroundColor, textColor } = props
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        {(headline || subheadline) && (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 36, fontWeight: 800, margin: '0 0 14px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}
        <GlobeCanvas {...props} />
        <p style={{ textAlign: 'center', color: textColor, opacity: 0.35, fontSize: 12, marginTop: 20 }}>
          Drag to rotate · Click a marker to explore
        </p>
      </section>
    )
  },
}
