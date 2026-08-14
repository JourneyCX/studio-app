import { useState, useEffect, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type TItem = { date: string; title: string; description: string; image: string; icon: string; color: string }
type Layout = 'alternating' | 'left' | 'cards'

export type AnimatedTimelineProps = {
  headline: string
  subheadline: string
  layout: Layout
  lineColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderRadius: number
  items: TItem[]
}

function TimelineItem({ item, index, layout, cardColor, textColor, borderRadius, lineColor }: { item: TItem; index: number; layout: Layout; cardColor: string; textColor: string; borderRadius: number; lineColor: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const isLeft  = layout === 'alternating' && index % 2 !== 0
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [layout, index])

  const isLeft = layout === 'alternating' && index % 2 !== 0
  const dotColor = item.color || lineColor

  const cardNode = (
    <div
      style={{
        backgroundColor: cardColor,
        borderRadius,
        padding: '22px 26px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${textColor}10`,
        flex: 1,
        maxWidth: layout === 'alternating' ? 'calc(50% - 48px)' : undefined,
      }}
    >
      {item.image && (
        <img src={item.image} alt={item.title} style={{ width: '100%', borderRadius: borderRadius / 2, marginBottom: 16, objectFit: 'cover', maxHeight: 180, display: 'block' }} />
      )}
      {item.date && (
        <span style={{ fontSize: 12, fontWeight: 700, color: dotColor, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{item.date}</span>
      )}
      <h3 style={{ color: textColor, fontSize: 18, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.35 }}>{item.title}</h3>
      {item.description && <p style={{ color: textColor, opacity: 0.65, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.description}</p>}
    </div>
  )

  if (layout === 'cards') {
    return (
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(32px)',
          transition: `opacity 0.7s ease ${index * 0.1}s, transform 0.7s ease ${index * 0.1}s`,
          display: 'flex', gap: 20, alignItems: 'flex-start',
        }}
      >
        <div style={{ flexShrink: 0, marginTop: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: dotColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {item.icon || '◆'}
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: cardColor, borderRadius, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${textColor}10` }}>
          {item.date && <span style={{ fontSize: 12, fontWeight: 700, color: dotColor, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{item.date}</span>}
          <h3 style={{ color: textColor, fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{item.title}</h3>
          {item.description && <p style={{ color: textColor, opacity: 0.65, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.description}</p>}
        </div>
      </div>
    )
  }

  if (layout === 'left') {
    return (
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-28px)',
          transition: `opacity 0.65s ease ${index * 0.12}s, transform 0.65s ease ${index * 0.12}s`,
          display: 'flex', gap: 0, alignItems: 'flex-start', paddingLeft: 52, position: 'relative',
        }}
      >
        {/* Dot on the line */}
        <div style={{ position: 'absolute', left: 15, top: 20, width: 16, height: 16, borderRadius: '50%', backgroundColor: dotColor, border: `3px solid ${cardColor}`, boxShadow: `0 0 0 2px ${dotColor}40`, zIndex: 1 }} />
        {item.icon && <div style={{ position: 'absolute', left: 4, top: 9, width: 38, height: 38, borderRadius: '50%', backgroundColor: dotColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{item.icon}</div>}
        {cardNode}
      </div>
    )
  }

  // alternating
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${isLeft ? '28px' : '-28px'})`,
        transition: `opacity 0.65s ease ${index * 0.12}s, transform 0.65s ease ${index * 0.12}s`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: isLeft ? 'flex-end' : 'flex-start',
        gap: 48,
        position: 'relative',
      }}
    >
      {isLeft ? (
        <>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{cardNode}</div>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 22, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: dotColor, border: `3px solid white`, boxShadow: `0 0 0 2px ${dotColor}40` }} />
          </div>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 22, zIndex: 1 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: dotColor, border: `3px solid white`, boxShadow: `0 0 0 2px ${dotColor}40` }} />
          </div>
          <div style={{ flex: 1 }}>{cardNode}</div>
        </>
      )}
    </div>
  )
}

export const AnimatedTimeline: ComponentConfig<AnimatedTimelineProps> = {
  label: 'Animated Timeline',
  fields: {
    headline:     { type: 'text',     label: 'Section Headline' },
    subheadline:  { type: 'textarea', label: 'Section Subheadline' },
    layout:       { type: 'select',   label: 'Layout', options: [{ label: 'Alternating (two-sided)', value: 'alternating' }, { label: 'Left-aligned (single column)', value: 'left' }, { label: 'Cards (icon + card)', value: 'cards' }] },
    lineColor:    { type: 'custom',   label: 'Timeline Line / Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardColor:    { type: 'custom',   label: 'Card Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:    { type: 'custom',   label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius: { type: 'number',   label: 'Card Border Radius (px)' },
    items: {
      type: 'array', label: 'Timeline Items',
      arrayFields: {
        date:        { type: 'text',     label: 'Date / Period' },
        title:       { type: 'text',     label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        image:       { type: 'custom',   label: 'Image (optional)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        icon:        { type: 'text',     label: 'Icon (emoji, optional)' },
        color:       { type: 'custom',   label: 'Dot / Accent Colour (hex, optional)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
      },
      defaultItemProps: { date: '2025', title: 'Milestone Title', description: 'Describe what happened at this point in the journey.', image: '', icon: '🚀', color: '' },
      getItemSummary: (item: TItem) => `${item.date ? item.date + ' — ' : ''}${item.title || 'Item'}`,
    },
  },
  defaultProps: {
    headline:        'Our Journey',
    subheadline:     'Key moments that shaped who we are today.',
    layout:          'alternating',
    lineColor:       '#2563eb',
    backgroundColor: '#f8fafc',
    cardColor:       '#ffffff',
    textColor:       '#1e293b',
    borderRadius:    12,
    items: [
      { date: '2019', title: 'The Beginning', description: 'Founded in a small garage with a big dream — to bring quality products directly to customers without the markup.', image: '', icon: '🌱', color: '#10b981' },
      { date: '2020', title: 'First 1 000 Orders', description: 'Despite a challenging year globally, we hit our first major milestone. Proof that our community believed in what we were building.', image: '', icon: '📦', color: '#f59e0b' },
      { date: '2022', title: 'Online Store Launch', description: 'Launched our fully branded e-commerce store and expanded our product range to over 200 SKUs.', image: '', icon: '🛍', color: '#2563eb' },
      { date: '2024', title: 'South Africa\'s Best', description: 'Recognised as one of South Africa\'s fastest-growing independent retailers by the SA Retail Association.', image: '', icon: '🏆', color: '#8b5cf6' },
      { date: '2025', title: 'Going National', description: 'Opened two physical flagship stores in Cape Town and Johannesburg, bridging the online and in-store experience.', image: '', icon: '📍', color: '#ef4444' },
    ],
  },
  render({ headline, subheadline, layout, lineColor, backgroundColor, cardColor, textColor, borderRadius, items }) {
    const isAlternating = layout === 'alternating'
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: isAlternating ? 1100 : 760, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              {headline    && <h2 style={{ color: textColor, fontSize: 36, fontWeight: 800, margin: '0 0 14px' }}>{headline}</h2>}
              {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 18, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {/* Spine line */}
            {layout !== 'cards' && (
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: isAlternating ? '50%' : 22,
                transform: isAlternating ? 'translateX(-50%)' : 'none',
                width: 2,
                backgroundColor: lineColor + '30',
              }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {items.map((item, i) => (
                <TimelineItem key={i} item={item} index={i} layout={layout} cardColor={cardColor} textColor={textColor} borderRadius={borderRadius} lineColor={lineColor} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  },
}
