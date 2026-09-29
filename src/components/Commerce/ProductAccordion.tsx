import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { FieldSlugField } from '../shared/FieldSlugField'

type SectionSource = 'description' | 'short_description' | 'custom_field' | 'static'

type SectionDef = {
  label: string
  source: SectionSource
  fieldSlug: string
  staticContent: string
  openByDefault: boolean
}

type IconStyle = 'plus-circle' | 'plus' | 'chevron'

export type ProductAccordionProps = {
  sections: SectionDef[]
  allowMultipleOpen: boolean
  iconStyle: IconStyle
  backgroundColor: string
  textColor: string
  accentColor: string
  dividerColor: string
  labelFontSize: number
  maxWidth: number
  alignment: 'left' | 'center' | 'right'
}

const ALIGNMENT_MARGIN: Record<ProductAccordionProps['alignment'], string> = {
  left:   '0 auto 0 0',
  center: '0 auto',
  right:  '0 0 0 auto',
}

const SOURCE_PREVIEW: Record<Exclude<SectionSource, 'static' | 'custom_field'>, string> = {
  description:       "Shows each product's own full description here.",
  short_description: "Shows each product's own short description here.",
}

function AccordionIcon({ style, open, accentColor }: { style: IconStyle; open: boolean; accentColor: string }) {
  if (style === 'chevron') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'none' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    )
  }
  const circle = style === 'plus-circle'
  const stroke = circle ? '#ffffff' : accentColor
  return (
    <span style={{
      flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: circle ? accentColor : 'transparent',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        {!open && <line x1="12" y1="5" x2="12" y2="19" />}
      </svg>
    </span>
  )
}

// Collapsible "dropdown" sections for the product page (Description,
// Shipping information, Care Instructions...), the accordion sibling of
// Commerce/ProductTabs.tsx. Each section pulls from the product's own
// description / short description, a Warehouse item Custom Field (same
// cf_<slug> meta_data mechanism ProductTabs uses), or fixed text that's the
// same on every product (e.g. a store-wide shipping blurb).
//
// Editor-side, preview-only for product-sourced sections -- same limitation
// as Commerce/ProductDetail.tsx: there's no real product while authoring a
// shared template. Fixed-text sections preview their real content. The live
// counterpart (nuxt-storefront/components/storefront/ProductAccordion.vue)
// omits any product-sourced section that's empty for the product being viewed.
export const ProductAccordion: ComponentConfig<ProductAccordionProps> = {
  label: 'Product Info Accordion',
  fields: {
    sections: {
      type: 'array',
      label: 'Sections',
      arrayFields: {
        label: { type: 'text', label: 'Section Title (shown to shoppers)' },
        source: {
          type: 'select',
          label: 'Content Source',
          options: [
            { label: 'Product description',       value: 'description' },
            { label: 'Product short description', value: 'short_description' },
            { label: 'Custom Field',              value: 'custom_field' },
            { label: 'Fixed text (same for every product)', value: 'static' },
          ],
        },
        fieldSlug:     { type: 'custom', label: 'Custom Field (when Source = Custom Field)', render: ({ value, onChange }) => <FieldSlugField value={value as string} onChange={onChange as (v: string) => void} /> },
        staticContent: { type: 'textarea', label: 'Fixed Text (when Source = Fixed text)' },
        openByDefault: {
          type: 'radio',
          label: 'Open by default',
          options: [
            { label: 'Yes', value: true },
            { label: 'No',  value: false },
          ],
        },
      },
      defaultItemProps: { label: 'Care Instructions', source: 'custom_field', fieldSlug: '', staticContent: '', openByDefault: false },
      getItemSummary: (item: SectionDef) => item.label || 'Section',
    },
    allowMultipleOpen: {
      type: 'radio',
      label: 'Allow several sections open at once',
      options: [
        { label: 'Yes', value: true },
        { label: 'No (opening one closes the others)', value: false },
      ],
    },
    iconStyle: {
      type: 'select',
      label: 'Toggle Icon',
      options: [
        { label: 'Plus / minus in a circle', value: 'plus-circle' },
        { label: 'Plus / minus',             value: 'plus' },
        { label: 'Chevron',                  value: 'chevron' },
      ],
    },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:     { type: 'custom', label: 'Icon Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    dividerColor:    { type: 'custom', label: 'Divider Line Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    labelFontSize:   { type: 'number', label: 'Section Title Size (px)' },
    maxWidth:        { type: 'number', label: 'Content Max Width (px)' },
    alignment: {
      type: 'select',
      label: 'Alignment (when narrower than the screen)',
      options: [
        { label: 'Left',   value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right',  value: 'right' },
      ],
    },
  },
  defaultProps: {
    sections: [
      { label: 'Description', source: 'description', fieldSlug: '', staticContent: '', openByDefault: true },
      { label: 'Shipping information', source: 'static', fieldSlug: '', staticContent: 'Orders are dispatched within 1–2 business days. Delivery usually takes 2–5 business days.', openByDefault: false },
    ],
    allowMultipleOpen: true,
    iconStyle:       'plus-circle',
    backgroundColor: 'transparent',
    textColor:       '#1a202c',
    accentColor:     '#1e90c8',
    dividerColor:    '#cbd5e0',
    labelFontSize:   24,
    maxWidth:        1200,
    alignment:       'center',
  },
  render({ sections, allowMultipleOpen, iconStyle, backgroundColor, textColor, accentColor, dividerColor, labelFontSize, maxWidth, alignment }) {
    const [open, setOpen] = useState<number[]>(() => {
      const initial = sections.flatMap((s, i) => (s.openByDefault ? [i] : []))
      return allowMultipleOpen ? initial : initial.slice(0, 1)
    })

    const toggle = (i: number) => setOpen(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : allowMultipleOpen ? [...prev, i] : [i])

    if (sections.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: 'center', color: '#a0aec0', fontSize: 13, border: '2px dashed #cbd5e0', borderRadius: 8, margin: 24 }}>
          Product Info Accordion — add at least one section
        </div>
      )
    }

    return (
      <section style={{ backgroundColor, padding: '24px' }}>
        <div style={{ maxWidth, margin: ALIGNMENT_MARGIN[alignment] ?? ALIGNMENT_MARGIN.center }}>
          {sections.map((section, i) => {
            const isOpen = open.includes(i)
            const body = section.source === 'static'
              ? (section.staticContent || 'Type the fixed text for this section above.')
              : section.source === 'custom_field'
                ? (section.fieldSlug
                  ? `Shows each product's own "${section.fieldSlug}" field value here.`
                  : 'Pick a Custom Field above — this section has none selected yet.')
                : SOURCE_PREVIEW[section.source] ?? SOURCE_PREVIEW.description
            const isPlaceholder = section.source !== 'static' || !section.staticContent
            return (
              <div key={i} style={{ borderBottom: `1px solid ${dividerColor}` }}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: textColor }}
                >
                  <h3 style={{ margin: 0, fontSize: labelFontSize, fontWeight: 600, color: textColor }}>{section.label || 'Section'}</h3>
                  <AccordionIcon style={iconStyle} open={isOpen} accentColor={accentColor} />
                </button>
                {isOpen && (
                  <p style={{ color: textColor, opacity: isPlaceholder ? 0.55 : 0.85, fontSize: 15, lineHeight: 1.7, fontStyle: isPlaceholder ? 'italic' : 'normal', margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                    {body}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  },
}
