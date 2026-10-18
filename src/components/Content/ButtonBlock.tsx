import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

// A stand-alone button: label + link, placed left / centre / right in its column.
// Mirrored prop-for-prop in nuxt-storefront's ButtonBlock.vue (keep SIZES identical).
export type ButtonBlockProps = {
  label: string
  url: string
  openInNewTab: boolean
  align: 'left' | 'center' | 'right'
  variant: 'solid' | 'outline'
  size: 'small' | 'medium' | 'large'
  // Solid: the button's fill. Outline: its border and text.
  buttonColor: string
  // Solid only: the label colour.
  textColor: string
  borderRadius: number
}

const SIZES = {
  small:  { padding: '8px 18px',  fontSize: 13 },
  medium: { padding: '12px 28px', fontSize: 15 },
  large:  { padding: '16px 40px', fontSize: 17 },
} as const

export const ButtonBlock: ComponentConfig<ButtonBlockProps> = {
  label: 'Button',
  fields: {
    label:        { type: 'text',  label: 'Button Text' },
    url:          { type: 'text',  label: 'Link URL (e.g. /shop or https://…)' },
    openInNewTab: { type: 'radio', label: 'Open Link', options: [{ label: 'Same tab', value: false }, { label: 'New tab', value: true }] },
    align:        { type: 'radio', label: 'Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    variant:      { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }] },
    size:         { type: 'radio', label: 'Size', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] },
    buttonColor:  { type: 'custom', label: 'Button Colour (hex) — fill, or border and text for Outline', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:    { type: 'custom', label: 'Text Colour (hex) — Solid style only', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius: { type: 'number', label: 'Corner Radius (px)', min: 0 },
  },
  defaultProps: {
    label:        'Shop Now',
    url:          '/shop',
    openInNewTab: false,
    align:        'left',
    variant:      'solid',
    size:         'medium',
    buttonColor:  '#2563eb',
    textColor:    '#ffffff',
    borderRadius: 8,
  },
  render({ label, align, variant, size, buttonColor, textColor, borderRadius }) {
    const s = SIZES[size] ?? SIZES.medium
    const outline = variant === 'outline'
    return (
      <div style={{ textAlign: align ?? 'left' }}>
        <style>{`.btnblk { transition: opacity 0.15s; } .btnblk:hover { opacity: 0.88; }`}</style>
        {/* Not a live link in the editor: a click must select the block, not navigate the canvas. */}
        <a
          className="btnblk"
          href="#"
          onClick={e => e.preventDefault()}
          style={{
            display: 'inline-block',
            padding: s.padding,
            fontSize: s.fontSize,
            fontWeight: 700,
            lineHeight: 1.2,
            textDecoration: 'none',
            cursor: 'pointer',
            borderRadius: borderRadius ?? 8,
            backgroundColor: outline ? 'transparent' : buttonColor,
            color: outline ? buttonColor : textColor,
            border: `2px solid ${buttonColor}`,
          }}
        >
          {label || 'Button'}
        </a>
      </div>
    )
  },
}
