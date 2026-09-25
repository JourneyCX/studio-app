import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type CircleItem = {
  imageUrl: string
  label: string
  linkUrl: string
}

export type CircleCategoryListProps = {
  headline: string
  items: CircleItem[]
  circleSize: number
  itemSpacing: number
  labelFontSize: number
  labelColor: string
  backgroundColor: string
  paddingVertical: number
  showBorder: boolean
  borderColor: string
  justify: 'start' | 'center' | 'end' | 'space-between'
}

export const CircleCategoryList: ComponentConfig<CircleCategoryListProps> = {
  label: 'Circle Category List',
  fields: {
    headline:        { type: 'text',   label: 'Heading (optional)' },
    circleSize:      { type: 'number', label: 'Circle Size (px)' },
    itemSpacing:      { type: 'number', label: 'Item Spacing (px)' },
    labelFontSize:   { type: 'number', label: 'Label Font Size (px)' },
    labelColor:      { type: 'custom', label: 'Label Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    paddingVertical: { type: 'number', label: 'Vertical Padding (px)' },
    showBorder:      { type: 'radio',  label: 'Circle Border', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    borderColor:     { type: 'custom', label: 'Border Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    justify: {
      type: 'select', label: 'Alignment',
      options: [
        { label: 'Left', value: 'start' },
        { label: 'Centre', value: 'center' },
        { label: 'Right', value: 'end' },
        { label: 'Space between', value: 'space-between' },
      ],
    },
    items: {
      type: 'array',
      label: 'Categories',
      arrayFields: {
        imageUrl: { type: 'custom', label: 'Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        label:    { type: 'text',   label: 'Label' },
        linkUrl:  { type: 'text',   label: 'Link URL (optional)' },
      },
      defaultItemProps: { imageUrl: '', label: 'Category', linkUrl: '' },
      getItemSummary: (item: CircleItem) => item.label || 'Category',
    },
  },
  defaultProps: {
    headline: '',
    circleSize: 100,
    itemSpacing: 32,
    labelFontSize: 14,
    labelColor: '#1e293b',
    backgroundColor: '#ffffff',
    paddingVertical: 40,
    showBorder: true,
    borderColor: '#e2e8f0',
    justify: 'center',
    items: [
      { imageUrl: '', label: 'Fat Burner',        linkUrl: '' },
      { imageUrl: '', label: 'Appetite Control',  linkUrl: '' },
      { imageUrl: '', label: 'Metabolism Boost',  linkUrl: '' },
      { imageUrl: '', label: 'Detox',             linkUrl: '' },
      { imageUrl: '', label: 'Cleanse',           linkUrl: '' },
    ],
  },
  render({ headline, items, circleSize, itemSpacing, labelFontSize, labelColor, backgroundColor, paddingVertical, showBorder, borderColor, justify }) {
    const justifyMap: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between',
    }

    return (
      <section style={{ backgroundColor, padding: `${paddingVertical}px 24px` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {headline && (
            <h3 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 32px' }}>
              {headline}
            </h3>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: justifyMap[justify] ?? 'center',
              gap: itemSpacing,
            }}
          >
            {items.map((item, i) => {
              const circle = (
                <div
                  style={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: showBorder ? `1px solid ${borderColor}` : 'none',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center', padding: '0 6px' }}>
                      {item.label}
                    </span>
                  )}
                </div>
              )

              return (
                <a
                  key={i}
                  href={item.linkUrl || undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: circleSize + 20,
                    textDecoration: 'none',
                    cursor: item.linkUrl ? 'pointer' : 'default',
                  }}
                >
                  {circle}
                  <span
                    style={{
                      marginTop: 12,
                      fontSize: labelFontSize,
                      fontWeight: 600,
                      color: labelColor,
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}
