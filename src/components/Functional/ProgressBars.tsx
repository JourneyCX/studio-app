import { useEffect, useRef, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'

type BarItem = { label: string; value: number; color: string; suffix: string; icon: string }
type BarStyle = 'rounded' | 'flat' | 'segmented' | 'stepped'

export type ProgressBarsProps = {
  headline: string
  subheadline: string
  barStyle: BarStyle
  barHeight: number
  showValues: boolean
  showIcons: boolean
  animateOnView: boolean
  backgroundColor: string
  trackColor: string
  textColor: string
  borderRadius: number
  items: BarItem[]
}

function BarsInner(props: ProgressBarsProps) {
  const { headline, subheadline, barStyle, barHeight, showValues, showIcons, backgroundColor, trackColor, textColor, borderRadius, items } = props
  const [animated, setAnimated] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setAnimated(true) }, { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const radius = barStyle === 'flat' ? 0 : barStyle === 'segmented' ? 2 : barHeight / 2

  return (
    <section ref={sectionRef} style={{ backgroundColor, padding: '64px 24px' }}>
      <style>{`
        .pb-bar { transition: width 1.1s cubic-bezier(0.4, 0, 0.2, 1); }
        .pb-seg { transition: opacity 0.8s ease; }
      `}</style>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ marginBottom: 44 }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {items.map((item, i) => {
            const pct    = Math.min(100, Math.max(0, item.value))
            const filled = animated ? pct : 0

            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {showIcons && item.icon && <span style={{ fontSize: 20 }}>{item.icon}</span>}
                    <span style={{ color: textColor, fontSize: 15, fontWeight: 600 }}>{item.label}</span>
                  </div>
                  {showValues && (
                    <span style={{ color: item.color, fontSize: 14, fontWeight: 700 }}>{pct}{item.suffix}</span>
                  )}
                </div>

                {barStyle === 'segmented' ? (
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: 10 }).map((_, seg) => {
                      const threshold = (seg + 1) * 10
                      const isFilled  = filled >= threshold
                      return (
                        <div
                          key={seg}
                          className="pb-seg"
                          style={{
                            flex: 1,
                            height: barHeight,
                            borderRadius: radius,
                            backgroundColor: isFilled ? item.color : trackColor,
                            opacity: isFilled ? 1 : 0.35,
                            transitionDelay: `${seg * 0.07}s`,
                          }}
                        />
                      )
                    })}
                  </div>
                ) : barStyle === 'stepped' ? (
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    {Array.from({ length: 10 }).map((_, step) => {
                      const threshold = (step + 1) * 10
                      const isFilled  = pct >= threshold
                      return (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            height: barHeight * (0.4 + step * 0.07),
                            borderRadius: `${radius}px ${radius}px 0 0`,
                            backgroundColor: isFilled ? item.color : trackColor,
                            opacity: isFilled ? (animated ? 1 : 0.3) : 0.25,
                            transition: `opacity 0.5s ${step * 0.07}s, background-color 0.5s ${step * 0.07}s`,
                          }}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ height: barHeight, backgroundColor: trackColor, borderRadius: radius, overflow: 'hidden', position: 'relative' }}>
                    <div
                      className="pb-bar"
                      style={{
                        height: '100%',
                        width: `${filled}%`,
                        backgroundColor: item.color,
                        borderRadius: radius,
                        backgroundImage: barStyle === 'flat'
                          ? undefined
                          : `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                        transitionDelay: `${i * 0.12}s`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {barStyle === 'rounded' && barHeight >= 12 && (
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 100%)' }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const ProgressBars: ComponentConfig<ProgressBarsProps> = {
  label: 'Progress Bars',
  fields: {
    headline:       { type: 'text',    label: 'Section Headline' },
    subheadline:    { type: 'textarea', label: 'Section Subheadline' },
    barStyle:       { type: 'select',  label: 'Bar Style', options: [{ label: 'Rounded (smooth pill)', value: 'rounded' }, { label: 'Flat (no radius)', value: 'flat' }, { label: 'Segmented (10 blocks)', value: 'segmented' }, { label: 'Stepped (rising columns)', value: 'stepped' }] },
    barHeight:      { type: 'number',  label: 'Bar Height (px)' },
    showValues:     { type: 'radio',   label: 'Show Values', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showIcons:      { type: 'radio',   label: 'Show Icons',  options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    animateOnView:  { type: 'radio',   label: 'Animate on Scroll', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    backgroundColor: { type: 'text',  label: 'Background Colour (hex)' },
    trackColor:     { type: 'text',    label: 'Track Colour (hex)' },
    textColor:      { type: 'text',    label: 'Text Colour (hex)' },
    borderRadius:   { type: 'number',  label: 'Border Radius (px)' },
    items: {
      type: 'array', label: 'Bars',
      arrayFields: {
        label:  { type: 'text',   label: 'Label' },
        value:  { type: 'number', label: 'Value (0–100)' },
        color:  { type: 'text',   label: 'Fill Colour (hex)' },
        suffix: { type: 'text',   label: 'Suffix (e.g. % or /10)' },
        icon:   { type: 'text',   label: 'Icon (emoji, optional)' },
      },
      defaultItemProps: { label: 'Skill', value: 75, color: '#2563eb', suffix: '%', icon: '' },
      getItemSummary: (item: BarItem) => `${item.label} — ${item.value}${item.suffix}`,
    },
  },
  defaultProps: {
    headline:       'Our Capabilities',
    subheadline:    'A snapshot of the expertise behind every product we make.',
    barStyle:       'rounded',
    barHeight:      14,
    showValues:     true,
    showIcons:      true,
    animateOnView:  true,
    backgroundColor: '#f8fafc',
    trackColor:     '#e2e8f0',
    textColor:      '#1e293b',
    borderRadius:   12,
    items: [
      { label: 'Product Design',    value: 92, color: '#2563eb', suffix: '%', icon: '✏️' },
      { label: 'Customer Service',  value: 98, color: '#10b981', suffix: '%', icon: '🤝' },
      { label: 'Delivery Speed',    value: 87, color: '#f59e0b', suffix: '%', icon: '🚀' },
      { label: 'Quality Control',   value: 95, color: '#8b5cf6', suffix: '%', icon: '✅' },
      { label: 'Sustainability',    value: 78, color: '#06b6d4', suffix: '%', icon: '🌿' },
    ],
  },
  render(props) { return <BarsInner {...props} /> },
}
