import { useState, useRef, useCallback } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

export type BeforeAfterSliderProps = {
  beforeImage: string
  afterImage: string
  beforeLabel: string
  afterLabel: string
  initialPosition: number
  sliderColor: string
  labelColor: string
  labelBg: string
  borderRadius: number
  minHeight: number
  headline: string
  subheadline: string
  backgroundColor: string
  textColor: string
}

function SliderInner(props: BeforeAfterSliderProps) {
  const { beforeImage, afterImage, beforeLabel, afterLabel, initialPosition, sliderColor, labelColor, labelBg, borderRadius, minHeight, headline, subheadline, backgroundColor, textColor } = props

  const [position, setPosition] = useState(initialPosition)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging     = useRef(false)

  const calc = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const onMove = (ev: MouseEvent) => { if (dragging.current) calc(ev.clientX) }
    const onUp   = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [calc])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    calc(e.touches[0].clientX)
  }, [calc])

  const placeholderBefore = (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #93c5fd, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontSize: 18, fontWeight: 700 }}>
      Before
    </div>
  )
  const placeholderAfter = (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6ee7b7, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46', fontSize: 18, fontWeight: 700 }}>
      After
    </div>
  )

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* sb-text-fluid-md (styles/responsive.css) scales this down on
                narrow screens instead of staying fixed at 32px. */}
            {headline && <h2 className="sb-text-fluid-md" style={{ color: textColor, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>}
            {subheadline && <p style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0, lineHeight: 1.6 }}>{subheadline}</p>}
          </div>
        )}

        {/* Slider container */}
        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onTouchMove={onTouchMove}
          onTouchStart={(e) => calc(e.touches[0].clientX)}
          style={{ position: 'relative', borderRadius, overflow: 'hidden', minHeight, userSelect: 'none', cursor: 'ew-resize', touchAction: 'none', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}
        >
          {/* Before (full) */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {beforeImage
              ? <img src={beforeImage} alt={beforeLabel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
              : placeholderBefore}
          </div>

          {/* After (clipped by position%) */}
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            {afterImage
              ? <img src={afterImage} alt={afterLabel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
              : placeholderAfter}
          </div>

          {/* Divider line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${position}%`, transform: 'translateX(-50%)', width: 3, backgroundColor: sliderColor, zIndex: 3, pointerEvents: 'none' }}>
            {/* Handle */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 44, height: 44, borderRadius: '50%', backgroundColor: sliderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', cursor: 'ew-resize' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="12" x2="2" y2="12" />
                <polyline points="5 9 2 12 5 15" />
                <line x1="16" y1="12" x2="22" y2="12" />
                <polyline points="19 9 22 12 19 15" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          {beforeLabel && (
            <div style={{ position: 'absolute', top: 16, left: 16, backgroundColor: labelBg, color: labelColor, fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 20, letterSpacing: '0.04em', pointerEvents: 'none', zIndex: 2, backdropFilter: 'blur(4px)' }}>
              {beforeLabel}
            </div>
          )}
          {afterLabel && (
            <div style={{ position: 'absolute', top: 16, right: 16, backgroundColor: labelBg, color: labelColor, fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 20, letterSpacing: '0.04em', pointerEvents: 'none', zIndex: 2, backdropFilter: 'blur(4px)' }}>
              {afterLabel}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: textColor, opacity: 0.4, fontSize: 13, marginTop: 14 }}>← Drag to compare →</p>
      </div>
    </section>
  )
}

export const BeforeAfterSlider: ComponentConfig<BeforeAfterSliderProps> = {
  label: 'Before / After Slider',
  fields: {
    headline:         { type: 'text',    label: 'Section Headline' },
    subheadline:      { type: 'textarea', label: 'Section Subheadline' },
    beforeImage:      { type: 'custom', label: 'Before Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    afterImage:       { type: 'custom', label: 'After Image',  render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    beforeLabel:      { type: 'text',    label: 'Before Label' },
    afterLabel:       { type: 'text',    label: 'After Label' },
    initialPosition:  { type: 'number',  label: 'Initial Slider Position (0–100)' },
    sliderColor:      { type: 'custom',  label: 'Slider Handle Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    labelColor:       { type: 'custom',  label: 'Label Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    labelBg:          { type: 'custom',  label: 'Label Background (rgba or hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius:     { type: 'number',  label: 'Border Radius (px)' },
    minHeight:        { type: 'number',  label: 'Min Height (px)' },
    backgroundColor:  { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:        { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    headline:         'See the Transformation',
    subheadline:      'Drag the slider to compare before and after.',
    beforeImage:      '',
    afterImage:       '',
    beforeLabel:      'BEFORE',
    afterLabel:       'AFTER',
    initialPosition:  50,
    sliderColor:      '#ffffff',
    labelColor:       '#ffffff',
    labelBg:          'rgba(0,0,0,0.5)',
    borderRadius:     14,
    minHeight:        440,
    backgroundColor:  '#f8fafc',
    textColor:        '#1e293b',
  },
  render(props) {
    return <SliderInner {...props} />
  },
}
