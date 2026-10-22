import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { FONT_OPTIONS } from '../SiteSettings/FontsSection'

export type TextBlockProps = {
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  color: string
  // CSS font-family string; empty = inherit the theme font (same convention as HeroBanner).
  fontFamily: string
}

export const TextBlock: ComponentConfig<TextBlockProps> = {
  label: 'Text Block',
  fields: {
    text:       { type: 'textarea', label: 'Text' },
    fontFamily: { type: 'select',  label: 'Font', options: [{ label: 'Theme default', value: '' }, ...FONT_OPTIONS] },
    fontSize:   { type: 'number',  label: 'Font Size (px)' },
    fontWeight: { type: 'select',  label: 'Weight', options: [{ label: 'Normal', value: 'normal' }, { label: 'Bold', value: 'bold' }] },
    textAlign:  { type: 'select',  label: 'Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    color:      { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    text: 'Add your text here.',
    fontFamily: '',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    color: '#1a202c',
  },
  render({ text, fontFamily, fontSize, fontWeight, textAlign, color }) {
    return (
      <p style={{ margin: 0, fontSize, fontWeight, textAlign, color, lineHeight: 1.7, whiteSpace: 'pre-wrap', ...(fontFamily ? { fontFamily } : {}) }}>
        {text}
      </p>
    )
  },
}
