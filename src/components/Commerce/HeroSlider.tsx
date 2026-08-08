import { useState, useEffect, useCallback } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'

type ButtonPosition = 'inline' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right'
type ButtonStyle = 'solid' | 'outline'

type Slide = {
  image: string
  headline: string
  subheadline: string
  buttonText: string
  buttonUrl: string
  buttonColor: string
  buttonStyle: ButtonStyle
  buttonPosition: ButtonPosition
  slideClickable: boolean
  textAlign: 'left' | 'center' | 'right'
  overlayOpacity: number
  backgroundSize: 'cover' | 'contain' | '100% 100%' | '100% auto'
  backgroundPosition: string
}

export type HeroSliderProps = {
  slides: Slide[]
  minHeight: number
  autoPlay: boolean
  autoPlayInterval: number
  showDots: boolean
  showArrows: boolean
}

const btnPositionStyle: Record<ButtonPosition, React.CSSProperties> = {
  'inline':        {},
  'bottom-left':   { position: 'absolute', bottom: 40, left: 48, zIndex: 3 },
  'bottom-center': { position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3 },
  'bottom-right':  { position: 'absolute', bottom: 40, right: 48, zIndex: 3 },
  'top-left':      { position: 'absolute', top: 40, left: 48, zIndex: 3 },
  'top-center':    { position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3 },
  'top-right':     { position: 'absolute', top: 40, right: 48, zIndex: 3 },
}

function SliderButton({ slide }: { slide: Slide }) {
  if (!slide.buttonText || slide.slideClickable) return null
  const isOutline = slide.buttonStyle === 'outline'
  const col = slide.buttonColor || '#ffffff'
  return (
    <a
      href={slide.buttonUrl || '#'}
      style={{
        display: 'inline-block',
        backgroundColor: isOutline ? 'transparent' : col,
        color: isOutline ? col : '#1a202c',
        border: `2px solid ${col}`,
        padding: '13px 32px',
        borderRadius: 2,
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...btnPositionStyle[slide.buttonPosition || 'inline'],
      }}
    >
      {slide.buttonText}
    </a>
  )
}

function SliderInner({ slides, minHeight, autoPlay, autoPlayInterval, showDots, showArrows }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = slides.length || 1

  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total])
  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total])

  useEffect(() => {
    if (!autoPlay || total <= 1) return
    const id = setInterval(next, autoPlayInterval)
    return () => clearInterval(id)
  }, [autoPlay, autoPlayInterval, total, next])

  const slide = slides[current] ?? slides[0]
  if (!slide) return null

  const align = slide.textAlign ?? 'left'
  const overlay = (slide.overlayOpacity ?? 40) / 100
  const isPositioned = (slide.buttonPosition || 'inline') !== 'inline'

  const inner = (
    <div style={{ position: 'relative', minHeight, overflow: 'hidden', userSelect: 'none', cursor: slide.slideClickable ? 'pointer' : 'default' }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: slide.image ? `url(${slide.image})` : undefined,
        backgroundColor: slide.image ? undefined : '#1a202c',
        backgroundSize: slide.backgroundSize || 'cover',
          backgroundPosition: slide.backgroundPosition || 'center',
          backgroundRepeat: 'no-repeat',
      }} />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlay})` }} />

      {/* Text content */}
      <div style={{
        position: 'relative', zIndex: 2, minHeight,
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        padding: '60px 48px',
        textAlign: align,
      }}>
        <div style={{ maxWidth: 700 }}>
          {slide.headline && (
            <h1 style={{ color: '#fff', fontSize: 52, fontWeight: 800, margin: '0 0 18px', lineHeight: 1.12, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {slide.headline}
            </h1>
          )}
          {slide.subheadline && (
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 20, margin: isPositioned ? 0 : '0 0 36px', lineHeight: 1.6, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {slide.subheadline}
            </p>
          )}
          {/* Inline button — only rendered here when position = inline */}
          {!isPositioned && <SliderButton slide={slide} />}
        </div>
      </div>

      {/* Absolutely positioned button */}
      {isPositioned && <SliderButton slide={slide} />}

      {/* Arrows */}
      {showArrows && total > 1 && (
        <>
          <button onClick={e => { e.preventDefault(); prev() }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 4, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button onClick={e => { e.preventDefault(); next() }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 4, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </>
      )}

      {/* Dots */}
      {showDots && total > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 4, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={e => { e.preventDefault(); setCurrent(i) }} style={{ width: i === current ? 28 : 10, height: 10, borderRadius: 5, border: 'none', cursor: 'pointer', backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.5)', padding: 0, transition: 'width 0.25s ease' }} />
          ))}
        </div>
      )}
    </div>
  )

  return slide.slideClickable
    ? <a href={slide.buttonUrl || '#'} style={{ display: 'block', textDecoration: 'none' }}>{inner}</a>
    : inner
}

export const HeroSlider: ComponentConfig<HeroSliderProps> = {
  label: 'Hero Slider',
  fields: {
    minHeight:        { type: 'number', label: 'Min Height (px)' },
    autoPlay:         { type: 'radio',  label: 'Auto-play', options: [{ label: 'On', value: true }, { label: 'Off', value: false }] },
    autoPlayInterval: { type: 'number', label: 'Auto-play Interval (ms)' },
    showDots:         { type: 'radio',  label: 'Show Dots',   options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showArrows:       { type: 'radio',  label: 'Show Arrows', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    slides: {
      type: 'array',
      label: 'Slides',
      arrayFields: {
        image:           { type: 'custom',   label: 'Background Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        headline:        { type: 'text',     label: 'Headline' },
        subheadline:     { type: 'textarea', label: 'Subheadline' },
        textAlign:       { type: 'select',   label: 'Text Align', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
        overlayOpacity:  { type: 'number',   label: 'Overlay Darkness (0–100)' },
        slideClickable:  { type: 'radio',    label: 'Whole slide is link', options: [{ label: 'Yes', value: true }, { label: 'No — use button', value: false }] },
        buttonText:      { type: 'text',     label: 'Button Text' },
        buttonUrl:       { type: 'text',     label: 'Button / Slide URL' },
        buttonStyle:     { type: 'select',   label: 'Button Style', options: [{ label: 'Outline', value: 'outline' }, { label: 'Solid', value: 'solid' }] },
        buttonColor:     { type: 'text',     label: 'Button Colour (hex)' },
        backgroundSize: { type: 'select', label: 'Image Fit', options: [
          { label: 'Cover (fill & crop)',    value: 'cover' },
          { label: 'Contain (show full)',    value: 'contain' },
          { label: 'Full width (stretch h)', value: '100% auto' },
          { label: 'Stretch to fill',        value: '100% 100%' },
        ]},
        backgroundPosition: { type: 'select', label: 'Image Position', options: [
          { label: 'Centre',        value: 'center' },
          { label: 'Top centre',    value: 'top center' },
          { label: 'Bottom centre', value: 'bottom center' },
          { label: 'Left centre',   value: 'left center' },
          { label: 'Right centre',  value: 'right center' },
          { label: 'Top left',      value: 'top left' },
          { label: 'Top right',     value: 'top right' },
        ]},
        buttonPosition:  { type: 'select',   label: 'Button Position', options: [
          { label: 'Inline (below text)', value: 'inline' },
          { label: 'Bottom left',         value: 'bottom-left' },
          { label: 'Bottom centre',       value: 'bottom-center' },
          { label: 'Bottom right',        value: 'bottom-right' },
          { label: 'Top left',            value: 'top-left' },
          { label: 'Top centre',          value: 'top-center' },
          { label: 'Top right',           value: 'top-right' },
        ]},
      },
      defaultItemProps: {
        image: '', headline: 'New Collection', subheadline: 'Discover the latest arrivals.',
        textAlign: 'left', overlayOpacity: 40,
        slideClickable: false,
        backgroundSize: 'cover', backgroundPosition: 'center',
        buttonText: 'Shop Now', buttonUrl: '/shop',
        buttonStyle: 'outline', buttonColor: '#ffffff', buttonPosition: 'bottom-left',
      },
      getItemSummary: (item: Slide) => item.headline || 'Slide',
    },
  },
  defaultProps: {
    minHeight: 520, autoPlay: true, autoPlayInterval: 5000, showDots: true, showArrows: true,
    slides: [
      { image: '', headline: 'Discover Our Collection', subheadline: 'Timeless pieces for every occasion.', textAlign: 'left', overlayOpacity: 45, slideClickable: false, backgroundSize: 'cover', backgroundPosition: 'center', buttonText: 'Shop Now', buttonUrl: '/shop', buttonStyle: 'outline', buttonColor: '#ffffff', buttonPosition: 'bottom-left' },
      { image: '', headline: 'New Arrivals', subheadline: 'Fresh styles just landed.', textAlign: 'left', overlayOpacity: 45, slideClickable: false, backgroundSize: 'cover', backgroundPosition: 'center', buttonText: 'View New In', buttonUrl: '/shop/new', buttonStyle: 'outline', buttonColor: '#ffffff', buttonPosition: 'bottom-left' },
    ],
  },
  render(props) { return <SliderInner {...props} /> },
}
