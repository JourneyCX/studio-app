import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { FieldSlugField } from '../shared/FieldSlugField'

type TabDef = {
  label: string
  fieldSlug: string
}

export type ProductTabsProps = {
  tabs: TabDef[]
  backgroundColor: string
  textColor: string
  accentColor: string
  maxWidth: number
}

// Editor-side, preview-only — same limitation as Commerce/ProductDetail.tsx:
// there is no real product being viewed while authoring a shared template
// (see that file's own comment), so real per-tab content can't be shown
// here. This just previews the tab STRIP (the labels the designer typed),
// with placeholder body text standing in for whatever each product's own
// Custom Field value will actually be on the live storefront. The live
// counterpart (nuxt-storefront/components/storefront/ProductTabs.vue) reads
// the real product and resolves each tab's fieldSlug against its WooCommerce
// meta_data — a product with nothing entered for a given field simply omits
// that tab there, which this preview can't represent either (no real data).
export const ProductTabs: ComponentConfig<ProductTabsProps> = {
  label: 'Product Tabs',
  fields: {
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:     { type: 'custom', label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    maxWidth:        { type: 'number', label: 'Content Max Width (px)' },
    tabs: {
      type: 'array',
      label: 'Tabs',
      arrayFields: {
        label:     { type: 'text', label: 'Tab Label (shown to shoppers)' },
        fieldSlug: { type: 'custom', label: 'Content Field', render: ({ value, onChange }) => <FieldSlugField value={value as string} onChange={onChange as (v: string) => void} /> },
      },
      defaultItemProps: { label: 'Care Instructions', fieldSlug: '' },
      getItemSummary: (item: TabDef) => item.label || 'Tab',
    },
  },
  defaultProps: {
    backgroundColor: '#ffffff',
    textColor:       '#1a202c',
    accentColor:     '#2b6cb0',
    maxWidth:        1200,
    tabs: [
      { label: 'Care Instructions', fieldSlug: '' },
      { label: 'Materials & Craft', fieldSlug: '' },
    ],
  },
  render({ tabs, backgroundColor, textColor, accentColor, maxWidth }) {
    const [active, setActive] = useState(0)
    const current = tabs[active]

    if (tabs.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: 'center', color: '#a0aec0', fontSize: 13, border: '2px dashed #cbd5e0', borderRadius: 8, margin: 24 }}>
          Product Tabs — add at least one tab
        </div>
      )
    }

    return (
      <section style={{ backgroundColor, padding: '24px' }}>
        <div style={{ maxWidth, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${textColor}1a`, marginBottom: 24, flexWrap: 'wrap' }}>
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  color: i === active ? accentColor : textColor,
                  opacity: i === active ? 1 : 0.6,
                  borderBottom: i === active ? `2px solid ${accentColor}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.label || 'Tab'}
              </button>
            ))}
          </div>
          <p style={{ color: textColor, opacity: 0.55, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
            {current?.fieldSlug
              ? `Shows each product's own "${current.fieldSlug}" field value here.`
              : 'Pick a Content Field above — this tab has none selected yet.'}
          </p>
        </div>
      </section>
    )
  },
}
