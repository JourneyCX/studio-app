import { useEffect, useRef, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'
import { ProductSelectField, type ProductRef } from '../shared/ProductSelectField'
import { stratumApi, type StoreProduct } from '../../lib/api'

// A tall scroll section pinned to the screen (position: sticky). At the top a hero image fills the
// whole screen; as the visitor scrolls it shrinks into the middle while a product card slides in on
// each side. Pure scroll-driven styles, no re-renders per frame. Mirrored in nuxt-storefront's
// ScrollShowcase.vue: keep the numbers and the update() maths identical.
export type ScrollShowcaseProps = {
  image: string
  headline: string
  body: string
  textColor: string
  overlayOpacity: number
  leftProduct: ProductRef
  rightProduct: ProductRef
  // How many screen-heights the pinned effect lasts (taller = slower).
  scrollLength: number
  // The image's final width as a % of the page, and its final height as a % of the screen.
  endImageWidth: number
  endImageHeight: number
  cardRadius: number
  backgroundColor: string
  showNames: boolean
  showPrices: boolean
}

const MOBILE_MAX_PX = 768
// The shrink finishes at this share of the scroll; the rest holds the finished layout on screen.
const SHRINK_SHARE = 0.8
// Side cards start appearing once the image is this far through its shrink.
const CARD_START = 0.3

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

function ShowcaseCard({ product, slot, radius, showName, showPrice }: { product?: StoreProduct; slot: 'left' | 'right'; radius: number; showName: boolean; showPrice: boolean }) {
  return (
    <div data-sc-card={slot} style={{ width: '100%', maxWidth: 380, opacity: 0, willChange: 'transform, opacity' }}>
      <div style={{ aspectRatio: '4/5', borderRadius: radius, overflow: 'hidden', background: '#f1f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product?.image_url
          ? <img src={product.image_url} alt={product.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          : <span style={{ fontSize: 13, color: '#a0aec0', textAlign: 'center', padding: 12 }}>{product ? '📷' : 'Pick a product in the panel'}</span>}
      </div>
      {product && (showName || showPrice) && (
        <div style={{ padding: '14px 4px 0' }}>
          {showName && <p style={{ margin: '0 0 4px', fontSize: 14, color: '#1a202c' }}>{product.name}</p>}
          {showPrice && <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a202c' }}>{`${product.currency_symbol ?? '$'}${product.price}`}</p>}
        </div>
      )}
    </div>
  )
}

function ShowcaseView({ image, headline, body, textColor, overlayOpacity, leftProduct, rightProduct, scrollLength, endImageWidth, endImageHeight, cardRadius, backgroundColor, showNames, showPrices }: ScrollShowcaseProps) {
  const outerRef  = useRef<HTMLDivElement>(null)
  const leftRef   = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef  = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<Record<number, StoreProduct>>({})

  const leftId = leftProduct?.id
  const rightId = rightProduct?.id
  useEffect(() => {
    const ids = [leftId, rightId].filter((x): x is number => typeof x === 'number')
    if (ids.length === 0) { setProducts({}); return }
    let cancelled = false
    stratumApi.getActiveProducts({ include: ids })
      .then(r => { if (!cancelled) setProducts(Object.fromEntries((r.products ?? []).map(p => [p.id, p]))) })
      .catch(() => { if (!cancelled) setProducts({}) })
    return () => { cancelled = true }
  }, [leftId, rightId])

  // Resolves the window from the element's own document: Puck's canvas is an iframe while React runs
  // in the parent realm (see ParallaxSection.tsx), and the live page is a plain top-level window.
  useEffect(() => {
    const outer = outerRef.current
    const win = outer?.ownerDocument.defaultView
    if (!outer || !win) return
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) outer.style.height = '100vh' // no scroll effect: show the finished layout

    function apply(e: number, narrow: boolean) {
      const centerPct = lerp(100, narrow ? 88 : endImageWidth, e)
      const sidePct   = narrow ? 0 : (100 - centerPct) / 2
      const reveal    = narrow ? 0 : clamp((e - CARD_START) / (1 - CARD_START), 0, 1)
      const c = centerRef.current, l = leftRef.current, r = rightRef.current
      if (c) {
        c.style.width = `${centerPct}%`
        c.style.height = `${lerp(100, narrow ? 70 : endImageHeight, e)}vh`
        c.style.borderRadius = `${lerp(0, cardRadius, e)}px`
      }
      for (const [slot, side] of [[l, -1], [r, 1]] as const) {
        if (!slot) continue
        slot.style.display = narrow ? 'none' : 'flex'
        slot.style.width = `${sidePct}%`
        const card = slot.firstElementChild as HTMLElement | null
        if (card) {
          card.style.opacity = String(reveal)
          card.style.transform = `translateX(${(1 - reveal) * 70 * side}px)`
        }
      }
    }

    let ticking = false
    function update() {
      ticking = false
      const rect = outer!.getBoundingClientRect()
      const total = Math.max(1, rect.height - win!.innerHeight)
      const p = reduced ? 1 : clamp(-rect.top / total, 0, 1)
      apply(ease(clamp(p / SHRINK_SHARE, 0, 1)), win!.innerWidth < MOBILE_MAX_PX)
    }
    function onScroll() {
      if (!ticking) { ticking = true; win!.requestAnimationFrame(update) }
    }
    update()
    win.addEventListener('scroll', onScroll, { passive: true })
    win.addEventListener('resize', onScroll)
    return () => {
      win.removeEventListener('scroll', onScroll)
      win.removeEventListener('resize', onScroll)
    }
  }, [endImageWidth, endImageHeight, cardRadius, scrollLength])

  const slot: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '0%', padding: '0 clamp(8px, 2vw, 32px)', boxSizing: 'border-box', overflow: 'hidden' }
  return (
    <div ref={outerRef} style={{ position: 'relative', height: `${Math.max(150, scrollLength || 250)}vh`, backgroundColor }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={leftRef} style={slot}>
          <ShowcaseCard product={leftId ? products[leftId] : undefined} slot="left" radius={cardRadius} showName={showNames} showPrice={showPrices} />
        </div>
        <div ref={centerRef} style={{ position: 'relative', flex: '0 0 auto', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#1e293b', backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${clamp(overlayOpacity ?? 0, 0, 100) / 100})` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', padding: '0 5%', textAlign: 'center', color: textColor }}>
            {headline && <h2 style={{ margin: '0 auto 14px', maxWidth: 640, fontSize: 'clamp(26px, 3.6vw, 52px)', fontWeight: 600, lineHeight: 1.15, whiteSpace: 'pre-line' }}>{headline}</h2>}
            {body && <p style={{ margin: '0 auto', maxWidth: 520, fontSize: 'clamp(13px, 1.2vw, 16px)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{body}</p>}
          </div>
        </div>
        <div ref={rightRef} style={slot}>
          <ShowcaseCard product={rightId ? products[rightId] : undefined} slot="right" radius={cardRadius} showName={showNames} showPrice={showPrices} />
        </div>
      </div>
    </div>
  )
}

export const ScrollShowcase: ComponentConfig<ScrollShowcaseProps> = {
  label: 'Scroll Reveal Showcase',
  fields: {
    image:          { type: 'custom', label: 'Hero Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    headline:       { type: 'textarea', label: 'Headline (a new line starts a new line)' },
    body:           { type: 'textarea', label: 'Text under the headline' },
    textColor:      { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity: { type: 'number', label: 'Darken the image (0–100, helps the text stand out)', min: 0, max: 100 },
    leftProduct:    { type: 'custom', label: 'Left Product', render: ({ value, onChange }) => <ProductSelectField value={(value as ProductRef) ?? null} onChange={onChange as (v: ProductRef) => void} /> },
    rightProduct:   { type: 'custom', label: 'Right Product', render: ({ value, onChange }) => <ProductSelectField value={(value as ProductRef) ?? null} onChange={onChange as (v: ProductRef) => void} /> },
    scrollLength:   { type: 'number', label: 'Scroll Length (screen heights the effect lasts; 250 is a good start)', min: 150 },
    endImageWidth:  { type: 'number', label: 'Final Image Width (% of the page, e.g. 36)', min: 20, max: 80 },
    endImageHeight: { type: 'number', label: 'Final Image Height (% of the screen, e.g. 82)', min: 40, max: 100 },
    cardRadius:     { type: 'number', label: 'Corner Radius at the end (px)', min: 0 },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    showNames:      { type: 'radio', label: 'Show Product Names', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showPrices:     { type: 'radio', label: 'Show Prices', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
  },
  defaultProps: {
    image:          '',
    headline:       'Stay Warm\nStep out strong.',
    body:           'We set out to create fashion that blends bold design with uncompromising comfort.',
    textColor:      '#ffffff',
    overlayOpacity: 15,
    leftProduct:    null,
    rightProduct:   null,
    scrollLength:   250,
    endImageWidth:  36,
    endImageHeight: 82,
    cardRadius:     24,
    backgroundColor: '#ffffff',
    showNames:      true,
    showPrices:     true,
  },
  render: (props) => <ShowcaseView {...props} />,
}
