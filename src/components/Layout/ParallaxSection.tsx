import { useEffect, useRef, type CSSProperties } from 'react'
import { DropZone, type ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type MidgroundPosition = 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
type ScrollMode = 'drift' | 'sticky'

export type ParallaxSectionProps = {
  // 'drift' (default): both layers sit in a normal-height section and get a
  // small extra scroll-linked offset — subtle multi-layer depth.
  // 'sticky': the Background/content layer pins in place (position: sticky)
  // for a tall scroll range while the Midground image scrolls past it at
  // ordinary page speed — the "product image travels the full screen while
  // the backdrop stays put" effect seen on many Shopify hero sections. This
  // needs no scroll-linked JS at all (pure CSS position: sticky), so unlike
  // 'drift' it is NOT gated behind prefers-reduced-motion — the same way a
  // sticky header isn't, since nothing is animated beyond ordinary scrolling.
  scrollMode: ScrollMode
  // Sticky mode only: height of the outer section in vh (viewport-heights) —
  // how long the pin lasts before the section ends and the page continues.
  stickyScrollLength: number
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
  // Drift mode only — opt-in escape hatch from the prefers-reduced-motion
  // guard. Off by default so the accessibility behaviour is what every
  // visitor gets unless a merchant deliberately decides visual flair matters
  // more for a given page. Real-world reduced-motion adoption among
  // storefront shoppers is a small minority; this exists for merchants who've
  // made that trade-off consciously, not as a silent way to defeat the guard.
  forceAnimation: boolean
}

// Max px the Background layer is allowed to drift, and the extra height
// buffered above/below it (via negative top/bottom insets) so drift never
// reveals the layer's edge. Only applies to drift-mode Background — Midground
// is a sized/positioned element, not a full-bleed layer, so it has no edge to
// hide. Mirrored exactly in nuxt-storefront's ParallaxSection.vue.
const MAX_SHIFT_PX = 80
const MIDGROUND_MAX_SHIFT_PX = 150

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? '0,0,0' : `${r},${g},${b}`
}

function backgroundFillStyle(image: string): CSSProperties {
  return {
    backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

// Anchors the midground element at a real size (set by midgroundWidth,
// height auto so a small transparent PNG keeps its own aspect ratio instead
// of being stretched to fill the section like a background-image would be).
// Drift mode only — Sticky mode always centres its travelling image.
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
function DriftInner(props: ParallaxSectionProps) {
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
      <div ref={bgLayerRef} style={{ position: 'absolute', top: -MAX_SHIFT_PX, bottom: -MAX_SHIFT_PX, left: 0, right: 0, willChange: 'transform', ...backgroundFillStyle(backgroundImage) }} />
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

// No scroll-linked JS at all: a tall outer section (stickyScrollLength vh)
// contains a position:sticky inner layer that pins itself to the top of the
// viewport and stays there for the section's whole height, while the
// midground image sits at the outer (non-sticky) section's own vertical
// midpoint — as the tall section scrolls by normally, that fixed point
// sweeps up through the viewport from bottom to top, purely as a side effect
// of ordinary page scrolling. This is the same technique behind a sticky
// header, so browsers/accessibility tooling don't treat it as animation —
// it plays for every visitor regardless of prefers-reduced-motion.
function StickyRevealInner(props: ParallaxSectionProps) {
  const { backgroundImage, midgroundImage, midgroundWidth, overlayColor, overlayOpacity, contentAlign, contentMaxWidth, stickyScrollLength } = props
  return (
    <div style={{ position: 'relative', height: `${stickyScrollLength}vh` }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: contentAlign === 'top' ? 'flex-start' : contentAlign === 'bottom' ? 'flex-end' : 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, ...backgroundFillStyle(backgroundImage) }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(${hexToRgb(overlayColor)},${overlayOpacity / 100})` }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: contentMaxWidth, margin: '0 auto', padding: '64px 24px' }}>
          <DropZone zone="content" />
        </div>
      </div>
      {midgroundImage && (
        <img
          src={midgroundImage}
          alt=""
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: midgroundWidth, height: 'auto', zIndex: 3, pointerEvents: 'none' }}
        />
      )}
    </div>
  )
}

export const ParallaxSection: ComponentConfig<ParallaxSectionProps> = {
  label: 'Parallax Section',
  fields: {
    scrollMode: {
      type: 'radio',
      label: 'Scroll Behaviour',
      options: [
        { label: 'Depth Drift — subtle multi-layer movement', value: 'drift' },
        { label: 'Sticky Reveal — background pins in place while a foreground image scrolls past (like many Shopify hero sections)', value: 'sticky' },
      ],
    },
    stickyScrollLength: { type: 'number', label: 'Scroll Length in vh — Sticky Reveal mode only (how many screen-heights the background stays pinned; try 200–300)' },
    backgroundImage:   { type: 'custom', label: 'Background Image (fills the section)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundSpeed:   { type: 'number', label: 'Background Speed — Depth Drift mode only (0 = none, 100 = strongest)' },
    midgroundImage:    { type: 'custom', label: 'Midground Image (optional — a decorative element or product shot shown at its own size/aspect ratio; use a transparent PNG in Depth Drift mode so the Background layer stays visible around it)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    midgroundSpeed:    { type: 'number', label: 'Midground Speed — Depth Drift mode only (0 = none, 100 = strongest)' },
    midgroundWidth:    { type: 'number', label: 'Midground Width (px — height scales automatically)' },
    midgroundPosition: { type: 'select', label: 'Midground Position — Depth Drift mode only (Sticky Reveal always centres it)', options: [{ label: 'Centre', value: 'center' }, { label: 'Top Left', value: 'top-left' }, { label: 'Top Centre', value: 'top-center' }, { label: 'Top Right', value: 'top-right' }, { label: 'Bottom Left', value: 'bottom-left' }, { label: 'Bottom Centre', value: 'bottom-center' }, { label: 'Bottom Right', value: 'bottom-right' }] },
    overlayColor:      { type: 'custom', label: 'Overlay Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:    { type: 'number', label: 'Overlay Opacity (0–100)' },
    minHeight:         { type: 'number', label: 'Min Height (px) — Depth Drift mode only' },
    contentAlign:      { type: 'select', label: 'Content Vertical Align', options: [{ label: 'Top', value: 'top' }, { label: 'Centre', value: 'center' }, { label: 'Bottom', value: 'bottom' }] },
    contentMaxWidth:   { type: 'number', label: 'Content Max Width (px)' },
    forceAnimation:    { type: 'radio', label: 'Force Scroll Effect — Depth Drift mode only (ignores visitors’ "reduce motion" accessibility setting; Sticky Reveal always plays since it isn’t JS-driven animation)', options: [{ label: 'No (recommended — respect visitor preference)', value: false }, { label: 'Yes — always animate', value: true }] },
  },
  defaultProps: {
    scrollMode: 'drift',
    stickyScrollLength: 200,
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
  render(props) {
    return props.scrollMode === 'sticky' ? <StickyRevealInner {...props} /> : <DriftInner {...props} />
  },
}
