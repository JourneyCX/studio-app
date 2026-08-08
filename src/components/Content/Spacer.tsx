import type { ComponentConfig } from '@measured/puck'

export type SpacerProps = { height: number }

export const Spacer: ComponentConfig<SpacerProps> = {
  label: 'Spacer',
  fields: {
    height: { type: 'number', label: 'Height (px)' },
  },
  defaultProps: { height: 40 },
  render({ height }) {
    return <div style={{ height, display: 'block' }} />
  },
}
