import type { CSSProperties } from 'react'
import { DropZone, type ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

export type ContainerProps = {
  paddingY: number
  paddingX: number
  maxWidth: number
  backgroundColor: string
}

export const Container: ComponentConfig<ContainerProps> = {
  label: 'Container',
  fields: {
    paddingY:        { type: 'number', label: 'Vertical Padding (px)' },
    paddingX:        { type: 'number', label: 'Horizontal Padding (px)' },
    maxWidth:        { type: 'number', label: 'Max Width (px)' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    paddingY: 40,
    paddingX: 24,
    maxWidth: 1200,
    backgroundColor: '#ffffff',
  },
  render({ paddingY, paddingX, maxWidth, backgroundColor }) {
    return (
      // sb-container (styles/responsive.css) caps horizontal padding at 24px
      // on mobile via --sb-container-px, so a large desktop paddingX doesn't
      // eat most of a 375px screen's width.
      <section
        className="sb-container"
        style={{ backgroundColor, padding: `${paddingY}px ${paddingX}px`, '--sb-container-px': `${paddingX}px` } as CSSProperties}
      >
        <div style={{ maxWidth, margin: '0 auto' }}>
          <DropZone zone="content" />
        </div>
      </section>
    )
  },
}
