import { useEffect, useRef, type CSSProperties } from 'react'
import { DropZone, type ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

export type ParallaxSectionProps = {
  backgroundImage: string
  backgroundSpeed: number
  midgroundImage: string
  midgroundSpeed: number
  overlayColor: string
  overlayOpacity: number
  minHeight: number
  contentAlign: 'top' | 'center' | 'bottom'
  contentMaxWidth: number
}

// Max px a layer is allowed to drift, and the extra height buffered above/below
// it (via negative top/bottom insets) so drift never reveals the layer's edge.
// Mirrored exactly in nuxt-storefront's ParallaxSection.vue — keep both in sync.
const MAX_SHIFT_PX = 80

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? '0,0,0' : `${r},${g},${b}`
}

function layerStyle(image: string): CSSProperties {
  return {
    position: 'absolute',
    top: -MAX_SHIFT_PX,
    bottom: -MAX_SHIFT_PX,
    left: 0,
    right: 0,
    backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    willChange: 'transform',
  }
}

// Reads getBoundingClientRect() on scroll (already viewport-relative, so no
// separate scrollY bookkeeping needed) and drives each layer's transform
// directly via ref — not React state — so a 60fps scroll doesn't trigger a
// re-render per frame. Listens on the rendering element's own
// ownerDocument.defaultView rather than the bare `window` global: Puck's
// editor canvas renders this component's DOM into a real, same-origin
// iframe while React itself keeps running in the parent JS realm, so a
// bare `window.addEventListener('scroll', ...)` would attach to the
// parent page and never fire while scrolling the iframe's own canvas.
// Resolving the window via the DOM node's own document works correctly in
// both that iframe context and the live storefront's plain top-level page.
function ParallaxSectionInner(props: ParallaxSectionProps) {
  const { backgroundImage, backgroundSpeed, midgroundImage, midgroundSpeed, overlayColor, overlayOpacity, minHeight, contentAlign, contentMaxWidth } = props
  const hasMidground = !!midgroundImage
  const containerRef = useRef<HTMLDivElement>(null)
  const bgLayerRef = useRef<HTMLDivElement | null>(null)
  const midLayerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const win = container?.ownerDocument.defaultView
    if (!container || !win) return
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function apply(layer: HTMLDivElement | null, speed: number, top: number) {
      if (!layer) return
      const factor = (speed / 100) * 0.5
      const clamped = Math.max(-MAX_SHIFT_PX, Math.min(MAX_SHIFT_PX, top * factor))
      layer.style.transform = `translate3d(0, ${clamped}px, 0)`
    }
    function update() {
      ticking = false
      const rect = container!.getBoundingClientRect()
      apply(bgLayerRef.current, backgroundSpeed, rect.top)
      apply(midLayerRef.current, midgroundSpeed, rect.top)
    }
    function onScroll() {
      if (!ticking) {
        ticking = true
        win!.requestAnimationFrame(update)
      }
    }
    update()
    win.addEventListener('scroll', onScroll, { passive: true })
    win.addEventListener('resize', onScroll)
    return () => {
      win.removeEventListener('scroll', onScroll)
      win.removeEventListener('resize', onScroll)
    }
  }, [backgroundSpeed, midgroundSpeed])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight,
        overflow: 'hidden',
        display: 'flex',
        alignItems: contentAlign === 'top' ? 'flex-start' : contentAlign === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}
    >
      <div ref={bgLayerRef} style={layerStyle(backgroundImage)} />
      {hasMidground && <div ref={midLayerRef} style={layerStyle(midgroundImage)} />}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(${hexToRgb(overlayColor)},${overlayOpacity / 100})` }} />
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: contentMaxWidth, margin: '0 auto', padding: '64px 24px' }}>
        <DropZone zone="content" />
      </div>
    </div>
  )
}

export const ParallaxSection: ComponentConfig<ParallaxSectionProps> = {
  label: 'Parallax Section',
  fields: {
    backgroundImage: { type: 'custom', label: 'Background Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundSpeed: { type: 'number', label: 'Background Speed (0 = none, 100 = strongest)' },
    midgroundImage:  { type: 'custom', label: 'Midground Image (optional — adds a second depth layer)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    midgroundSpeed:  { type: 'number', label: 'Midground Speed (0 = none, 100 = strongest)' },
    overlayColor:    { type: 'custom', label: 'Overlay Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:  { type: 'number', label: 'Overlay Opacity (0–100)' },
    minHeight:       { type: 'number', label: 'Min Height (px)' },
    contentAlign:    { type: 'select', label: 'Content Vertical Align', options: [{ label: 'Top', value: 'top' }, { label: 'Centre', value: 'center' }, { label: 'Bottom', value: 'bottom' }] },
    contentMaxWidth: { type: 'number', label: 'Content Max Width (px)' },
  },
  defaultProps: {
    backgroundImage: '',
    backgroundSpeed: 30,
    midgroundImage: '',
    midgroundSpeed: 60,
    overlayColor: '#000000',
    overlayOpacity: 30,
    minHeight: 480,
    contentAlign: 'center',
    contentMaxWidth: 800,
  },
  render(props) { return <ParallaxSectionInner {...props} /> },
}
