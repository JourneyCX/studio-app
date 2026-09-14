import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { ImageUploadField } from '../shared/ImageUploadField'

export type IconBoxProps = {
  icon: string
  iconImage: string
  iconSize: number
  iconColor: string
  title: string
  titleFontSize: number
  titleColor: string
  description: string
  descriptionFontSize: number
  descriptionColor: string
  align: 'left' | 'center' | 'right'
  gap: number
  minHeight: number
}

export const IconBox: ComponentConfig<IconBoxProps> = {
  label: 'Icon Box',
  fields: {
    icon: { type: 'text', label: 'Icon (emoji or symbol, e.g. 📦)' },
    iconImage: {
      type: 'custom',
      label: 'Icon Image (optional — overrides the emoji above if set)',
      render: ({ value, onChange }) => (
        <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} />
      ),
    },
    iconSize:  { type: 'number', label: 'Icon Size (px)' },
    iconColor: { type: 'custom', label: 'Icon Colour (hex, emoji only)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    title:         { type: 'text',    label: 'Title' },
    titleFontSize: { type: 'number', label: 'Title Font Size (px)' },
    titleColor:    { type: 'custom', label: 'Title Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    description:         { type: 'textarea', label: 'Description' },
    descriptionFontSize: { type: 'number',   label: 'Description Font Size (px)' },
    descriptionColor:    { type: 'custom',   label: 'Description Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    align: { type: 'select', label: 'Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    gap:   { type: 'number', label: 'Spacing Between Elements (px)' },
    minHeight: { type: 'number', label: 'Box Min Height (px, 0 = auto — never clips content, just pads shorter boxes to match)' },
  },
  defaultProps: {
    icon: '📦',
    iconImage: '',
    iconSize: 40,
    iconColor: '#1a202c',
    title: 'Feature Title',
    titleFontSize: 18,
    titleColor: '#1a202c',
    description: 'Describe this feature or benefit in a short sentence.',
    descriptionFontSize: 14,
    descriptionColor: '#4a5568',
    align: 'center',
    gap: 10,
    minHeight: 0,
  },
  render({ icon, iconImage, iconSize, iconColor, title, titleFontSize, titleColor, description, descriptionFontSize, descriptionColor, align, gap, minHeight }) {
    const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems, justifyContent: 'center', textAlign: align, gap, minHeight: minHeight || undefined, boxSizing: 'border-box' }}>
        {iconImage ? (
          <img src={iconImage} alt="" style={{ width: iconSize, height: iconSize, objectFit: 'contain' }} />
        ) : icon ? (
          <div style={{ fontSize: iconSize, lineHeight: 1, color: iconColor }}>{icon}</div>
        ) : null}
        {title && <h3 style={{ margin: 0, fontSize: titleFontSize, fontWeight: 600, color: titleColor }}>{title}</h3>}
        {description && <p style={{ margin: 0, fontSize: descriptionFontSize, color: descriptionColor, lineHeight: 1.6 }}>{description}</p>}
      </div>
    )
  },
}
