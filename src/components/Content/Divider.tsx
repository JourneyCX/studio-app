import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

export type DividerProps = {
  color: string
  thickness: number
  marginY: number
}

export const Divider: ComponentConfig<DividerProps> = {
  label: 'Divider',
  fields: {
    color:     { type: 'custom', label: 'Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    thickness: { type: 'number', label: 'Thickness (px)' },
    marginY:   { type: 'number', label: 'Vertical Spacing (px)' },
  },
  defaultProps: { color: '#e2e8f0', thickness: 1, marginY: 16 },
  render({ color, thickness, marginY }) {
    return <hr style={{ border: 'none', borderTop: `${thickness}px solid ${color}`, margin: `${marginY}px 0` }} />
  },
}
