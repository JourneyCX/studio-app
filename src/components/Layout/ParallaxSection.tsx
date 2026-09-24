import { useEffect, useRef, type CSSProperties } from 'react'
import { DropZone, type ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type MidgroundPosition = 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type ParallaxSectionProps = {
  backgroundImage: string
  backgroundSpeed: number
  midgroundImage: string
  midgroundSpeed: number
  midgroundWidth: number
  midgroundPosition: MidgroundPosition
  overlayColor: string
  overlayOpacity: number
  minHeight: number
  contentAlign: 'top' | 'center' | 'bottom'
  contentMaxWidth: number
  // Opt-in escape hatch from the prefers-reduced-motion guard below — off by
  // default so the accessibility behaviour is the one every visitor gets
  // unless a merchant deliberately decides visual flair matters more for a
  // given page. Real-world reduced-motion adoption among storefront shoppers
  // is a small minority (most default installs ship with it off); this
  // exists for merchants who've made that trade-off consciously, not as a
  // silent way to defeat the guard.
  forceAnimation: boolean
}

// Max px the Background layer is allowed to drift, and the extra height
// buffered above/below it (via negative top/bottom insets) so drift never
// reveals the layer's edge. Only applies to Background — Midground is a
// sized/positioned element, not a full-bleed layer, so it has no edge to hide.
// Mirrored exactly in nuxt-storefront's ParallaxSection.vue — keep both in sync.
const MAX_SHIFT_PX = 80
const MIDGROUND_MAX_SHIFT_PX = 150

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? '0,0,0' : `${r},${g},${b}`
}

function backgroundLayerStyle(image: string): CSSProperties {
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

// Anchors the midground element at a real size (set by midgroundWidth,
// height auto so a small transparent PNG keeps its own aspect ratio instead
// of being stretched to fill the section like a background-image would be).
function midgroundAnchorStyle(position: MidgroundPosition): CSSProperties {
  const base: CSSProperties = { position: 'absolute', willChange: 'transform', pointerEvents: 'none' }
  switch (position) {
    case 'top-left':      return { ...base, top: 24, left: 24 }
    case 'top-center':    return { ...base, top: 24, left: '50%' }
    case 'top-right':     return { ...base, top: 24, right: 24 }
    case 'bottom-left':   return { ...base, bottom: 24, left: 24 }
    case 'bottom-center': return { ...base, bottom: 24, left: '50%' }
    case 'bottom-right':  return { ...base, bottom: 24, right: 24 }
    case 'center':
    default:               return { ...base, top: '50%', left: '50%' }
  }
}

// Anchors placed at left:50% (center, top-center, bottom-center) need their
// own horizontal-centring transform composed with the scroll-driven
// translateY rather than overwritten by it — translateX/Y() after
// translate(-50%, ...) simply adds to its own axis, so this composes
// correctly with no extra math needed.
function midgroundBaseTransform(position: MidgroundPosition): string {
  switch (position) {
    case 'center':        return 'translate(-50%, -50%) '
    case 'top-center':
    case 'bottom-center': return 'translateX(-50%) '
    default:               return ''
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
  const { backgroundImage, backgroundSpeed, midgroundImage, midgroundSpeed, midgroundWidth, midgroundPosition, overlayColor, overlayOpacity, minHeight, contentAlign, contentMaxWidth, forceAnimation } = props
  const hasMidground = !!midgroundImage
  const containerRef = useRef<HTMLDivElement>(null)
  const bgLayerRef = useRef<HTMLDivElement | null>(null)
  const midLayerRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const win = container?.ownerDocument.defaultView
    if (!container || !win) return
    if (!forceAnimation && win.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function update() {
      ticking = false
      const rect = container!.getBoundingClientRect()

      const bg = bgLayerRef.current
      if (bg) {
        const factor = (backgroundSpeed / 100) * 0.5
        const clamped = Math.max(-MAX_SHIFT_PX, Math.min(MAX_SHIFT_PX, rect.top * factor))
        bg.style.transform = `translate3d(0, ${clamped}px, 0)`
      }

      const mid = midLayerRef.current
      if (mid) {
        const factor = (midgroundSpeed / 100) * 0.5
        const clamped = Math.max(-MIDGROUND_MAX_SHIFT_PX, Math.min(MIDGROUND_MAX_SHIFT_PX, rect.top * factor))
        mid.style.transform = `${midgroundBaseTransform(midgroundPosition)}translateY(${clamped}px)`
      }
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
  }, [backgroundSpeed, midgroundSpeed, midgroundPosition, forceAnimation])

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
      <div ref={bgLayerRef} style={backgroundLayerStyle(backgroundImage)} />
      {hasMidground && (
        <img
          ref={midLayerRef}
          src={midgroundImage}
          alt=""
          style={{ ...midgroundAnchorStyle(midgroundPosition), width: midgroundWidth, height: 'auto', display: 'block' }}
        />
      )}
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
    backgroundImage:   { type: 'custom', label: 'Background Image (fills the whole section, scroll-drifts subtly)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundSpeed:   { type: 'number', label: 'Background Speed (0 = none, 100 = strongest)' },
    midgroundImage:    { type: 'custom', label: 'Midground Image (optional — a decorative element shown at its own size/aspect ratio, e.g. a logo or graphic; use a transparent PNG so the Background layer stays visible around it)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    midgroundSpeed:    { type: 'number', label: 'Midground Speed (0 = none, 100 = strongest)' },
    midgroundWidth:    { type: 'number', label: 'Midground Width (px — height scales automatically)' },
    midgroundPosition: { type: 'select', label: 'Midground Position', options: [{ label: 'Centre', value: 'center' }, { label: 'Top Left', value: 'top-left' }, { label: 'Top Centre', value: 'top-center' }, { label: 'Top Right', value: 'top-right' }, { label: 'Bottom Left', value: 'bottom-left' }, { label: 'Bottom Centre', value: 'bottom-center' }, { label: 'Bottom Right', value: 'bottom-right' }] },
    overlayColor:      { type: 'custom', label: 'Overlay Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:    { type: 'number', label: 'Overlay Opacity (0–100)' },
    minHeight:         { type: 'number', label: 'Min Height (px)' },
    contentAlign:      { type: 'select', label: 'Content Vertical Align', options: [{ label: 'Top', value: 'top' }, { label: 'Centre', value: 'center' }, { label: 'Bottom', value: 'bottom' }] },
    contentMaxWidth:   { type: 'number', label: 'Content Max Width (px)' },
    forceAnimation:    { type: 'radio', label: 'Force Scroll Effect (ignores visitors’ "reduce motion" accessibility setting — leave off unless you specifically want to override it)', options: [{ label: 'No (recommended — respect visitor preference)', value: false }, { label: 'Yes — always animate', value: true }] },
  },
  defaultProps: {
    backgroundImage: '',
    backgroundSpeed: 30,
    midgroundImage: '',
    midgroundSpeed: 60,
    midgroundWidth: 300,
    midgroundPosition: 'center',
    overlayColor: '#000000',
    overlayOpacity: 30,
    minHeight: 480,
    contentAlign: 'center',
    contentMaxWidth: 800,
    forceAnimation: false,
  },
  render(props) { return <ParallaxSectionInner {...props} /> },
}
