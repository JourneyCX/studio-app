import { DropZone, type ComponentConfig } from '@measured/puck'

export type ColumnsProps = {
  // `columns` predates `distribution` (named layout templates below) and is no longer
  // read anywhere in render() — column count is fully determined by `distribution`.
  // Some stored puck_json still carries a leftover `columns` value from before that
  // change; harmless to ignore since it was never wired to anything.
  distribution: string
  gap: number
  backgroundColor: string
}

const DISTRIBUTIONS: Record<string, { label: string; template: string; cols: number }> = {
  equal2:      { label: '2 Equal',                 template: '1fr 1fr',     cols: 2 },
  sidebar13:   { label: 'Sidebar Left (1:3)',       template: '1fr 3fr',     cols: 2 },
  sidebar31:   { label: 'Sidebar Right (3:1)',      template: '3fr 1fr',     cols: 2 },
  wide21:      { label: 'Wide Left (2:1)',          template: '2fr 1fr',     cols: 2 },
  wide12:      { label: 'Wide Right (1:2)',         template: '1fr 2fr',     cols: 2 },
  equal3:      { label: '3 Equal',                 template: '1fr 1fr 1fr', cols: 3 },
  equal4:      { label: '4 Equal',                 template: '1fr 1fr 1fr 1fr', cols: 4 },
}

export const Columns: ComponentConfig<ColumnsProps> = {
  label: 'Columns',
  fields: {
    distribution: {
      type: 'select',
      label: 'Layout',
      options: Object.entries(DISTRIBUTIONS).map(([value, { label }]) => ({ label, value })),
    },
    gap:             { type: 'number', label: 'Gap (px)' },
    backgroundColor: { type: 'text',   label: 'Background Colour (hex)' },
  },
  defaultProps: { distribution: 'equal2', gap: 24, backgroundColor: 'transparent' },
  render({ distribution, gap, backgroundColor }) {
    const dist = DISTRIBUTIONS[distribution] ?? DISTRIBUTIONS.equal2
    return (
      <div style={{ backgroundColor, display: 'grid', gridTemplateColumns: dist.template, gap }}>
        {Array.from({ length: dist.cols }).map((_, i) => (
          <DropZone key={i} zone={`col-${i}`} />
        ))}
      </div>
    )
  },
}
