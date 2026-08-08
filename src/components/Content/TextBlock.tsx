import type { ComponentConfig } from '@measured/puck'

export type TextBlockProps = {
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  color: string
}

export const TextBlock: ComponentConfig<TextBlockProps> = {
  label: 'Text Block',
  fields: {
    text:       { type: 'textarea', label: 'Text' },
    fontSize:   { type: 'number',  label: 'Font Size (px)' },
    fontWeight: { type: 'select',  label: 'Weight', options: [{ label: 'Normal', value: 'normal' }, { label: 'Bold', value: 'bold' }] },
    textAlign:  { type: 'select',  label: 'Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    color:      { type: 'text',    label: 'Text Colour (hex)' },
  },
  defaultProps: {
    text: 'Add your text here.',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    color: '#1a202c',
  },
  render({ text, fontSize, fontWeight, textAlign, color }) {
    return (
      <p style={{ margin: 0, fontSize, fontWeight, textAlign, color, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {text}
      </p>
    )
  },
}
