import type { ComponentConfig } from '@measured/puck'

export type CartWidgetProps = {
  style: 'icon-only' | 'icon-label' | 'pill'
  placeholderCount: number
  iconColor: string
  backgroundColor: string
  badgeColor: string
  badgeTextColor: string
  size: number
  labelText: string
  checkoutUrl: string
  borderRadius: number
}

function CartIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export const CartWidget: ComponentConfig<CartWidgetProps> = {
  label: 'Cart Icon / Counter',
  fields: {
    style:            { type: 'select', label: 'Display Style', options: [{ label: 'Icon only', value: 'icon-only' }, { label: 'Icon + Label', value: 'icon-label' }, { label: 'Pill button', value: 'pill' }] },
    placeholderCount: { type: 'number', label: 'Preview Item Count (editor only)' },
    iconColor:        { type: 'text',   label: 'Icon Colour (hex)' },
    backgroundColor:  { type: 'text',  label: 'Background Colour (hex)' },
    badgeColor:       { type: 'text',   label: 'Badge Colour (hex)' },
    badgeTextColor:   { type: 'text',   label: 'Badge Text Colour (hex)' },
    size:             { type: 'number', label: 'Icon Size (px)' },
    labelText:        { type: 'text',   label: 'Label Text (icon-label / pill styles)' },
    checkoutUrl:      { type: 'text',   label: 'Cart / Checkout URL' },
    borderRadius:     { type: 'number', label: 'Border Radius (px)' },
  },
  defaultProps: {
    style:            'icon-label',
    placeholderCount: 3,
    iconColor:        '#1e293b',
    backgroundColor:  'transparent',
    badgeColor:       '#ef4444',
    badgeTextColor:   '#ffffff',
    size:             22,
    labelText:        'Cart',
    checkoutUrl:      '/cart',
    borderRadius:     8,
  },
  render({ style, placeholderCount, iconColor, backgroundColor, badgeColor, badgeTextColor, size, labelText, checkoutUrl, borderRadius }) {
    const count = Math.max(0, placeholderCount)
    const hasBg = backgroundColor !== 'transparent' && backgroundColor !== ''

    const badge = count > 0 ? (
      <span style={{
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: badgeColor,
        color: badgeTextColor,
        fontSize: 10,
        fontWeight: 700,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        lineHeight: 1,
      }}>
        {count > 99 ? '99+' : count}
      </span>
    ) : null

    if (style === 'icon-only') {
      return (
        <a
          href={checkoutUrl}
          style={{ display: 'inline-flex', position: 'relative', alignItems: 'center', justifyContent: 'center', width: size + 16, height: size + 16, backgroundColor: hasBg ? backgroundColor : undefined, borderRadius, textDecoration: 'none' }}
        >
          <CartIcon size={size} color={iconColor} />
          {badge}
        </a>
      )
    }

    if (style === 'icon-label') {
      return (
        <a
          href={checkoutUrl}
          style={{ display: 'inline-flex', position: 'relative', alignItems: 'center', gap: 8, padding: hasBg ? `8px 14px` : '4px 0', backgroundColor: hasBg ? backgroundColor : undefined, borderRadius, textDecoration: 'none' }}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <CartIcon size={size} color={iconColor} />
            {badge}
          </span>
          <span style={{ color: iconColor, fontSize: size * 0.68, fontWeight: 600 }}>{labelText}</span>
        </a>
      )
    }

    // pill
    return (
      <a
        href={checkoutUrl}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : iconColor, borderRadius: 40, textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}
      >
        <CartIcon size={size} color={backgroundColor !== 'transparent' ? iconColor : '#fff'} />
        <span style={{ color: backgroundColor !== 'transparent' ? iconColor : '#fff', fontSize: 14, fontWeight: 700 }}>{labelText}</span>
        {count > 0 && (
          <span style={{ backgroundColor: badgeColor, color: badgeTextColor, fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </a>
    )
  },
}
