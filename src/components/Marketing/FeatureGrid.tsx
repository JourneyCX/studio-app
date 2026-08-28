import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

type FeatureItem = {
  icon: string
  title: string
  description: string
}

export type FeatureGridProps = {
  headline: string
  subheadline: string
  columns: 2 | 3 | 4
  cardStyle: 'boxed' | 'minimal' | 'icon-top'
  accentColor: string
  backgroundColor: string
  textColor: string
  items: FeatureItem[]
}

export const FeatureGrid: ComponentConfig<FeatureGridProps> = {
  label: 'Feature Grid',
  fields: {
    headline:       { type: 'text',    label: 'Section Headline' },
    subheadline:    { type: 'textarea', label: 'Section Subheadline' },
    columns:        { type: 'select',  label: 'Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }] },
    cardStyle:      { type: 'select',  label: 'Card Style', options: [{ label: 'Boxed (card with border)', value: 'boxed' }, { label: 'Minimal (no border)', value: 'minimal' }, { label: 'Icon Top (centred icon)', value: 'icon-top' }] },
    accentColor:    { type: 'custom',  label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:      { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    items: {
      type: 'array',
      label: 'Features',
      arrayFields: {
        icon:        { type: 'text',    label: 'Icon (emoji or symbol, e.g. 🚀)' },
        title:       { type: 'text',    label: 'Feature Title' },
        description: { type: 'textarea', label: 'Feature Description' },
      },
      defaultItemProps: {
        icon: '✦',
        title: 'Feature Title',
        description: 'Describe the benefit or capability of this feature in a few clear sentences.',
      },
      getItemSummary: (item: FeatureItem) => item.title || 'Feature',
    },
  },
  defaultProps: {
    headline:        'Why Choose Us',
    subheadline:     'Everything you need to grow your store, in one platform.',
    columns:         3,
    cardStyle:       'boxed',
    accentColor:     '#2563eb',
    backgroundColor: '#ffffff',
    textColor:       '#1e293b',
    items: [
      { icon: '⚡', title: 'Lightning Fast', description: 'Optimised for speed so your customers never wait.' },
      { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security baked in from day one.' },
      { icon: '📦', title: 'Easy to Manage', description: 'Intuitive tools that your whole team can use.' },
    ],
  },
  render({ headline, subheadline, columns, cardStyle, accentColor, backgroundColor, textColor, items }) {
    const isBoxed  = cardStyle === 'boxed'
    const isCentre = cardStyle === 'icon-top'

    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              {headline && <h2 className="sb-text-fluid-md" style={{ color: textColor, fontWeight: 800, margin: '0 0 16px' }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: 18, margin: 0, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          {/* sb-grid collapses this to 1 column on mobile / 2 on tablet regardless of the merchant's chosen column count */}
          <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 24 }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 32,
                  borderRadius: 12,
                  textAlign: isCentre ? 'center' : 'left',
                  border: isBoxed ? `1px solid ${textColor}22` : 'none',
                  backgroundColor: isBoxed ? '#fff' : 'transparent',
                  boxShadow: isBoxed ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {item.icon && (
                  <div style={{ fontSize: 36, marginBottom: 16, color: accentColor }}>{item.icon}</div>
                )}
                <h3 style={{ color: textColor, fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>{item.title}</h3>
                <p style={{ color: textColor, opacity: 0.7, fontSize: 15, margin: 0, lineHeight: 1.65 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
