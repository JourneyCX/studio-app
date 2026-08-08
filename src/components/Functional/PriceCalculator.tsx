import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'

type LineItem = { label: string; description: string; unitPrice: number; unitLabel: string; min: number; max: number; defaultQty: number; step: number }

export type PriceCalculatorProps = {
  headline: string
  subheadline: string
  currencySymbol: string
  taxRate: number
  showTax: boolean
  discountPercent: number
  showDiscount: boolean
  ctaText: string
  ctaUrl: string
  noteText: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderRadius: number
  items: LineItem[]
}

function CalcInner(props: PriceCalculatorProps) {
  const { headline, subheadline, currencySymbol, taxRate, showTax, discountPercent, showDiscount, ctaText, ctaUrl, noteText, accentColor, backgroundColor, cardColor, textColor, borderRadius, items } = props

  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(items.map((item, i) => [i, item.defaultQty]))
  )

  const setQty = (i: number, val: number) => {
    const item = items[i]
    if (!item) return
    setQuantities((prev) => ({ ...prev, [i]: Math.min(item.max, Math.max(item.min, val)) }))
  }

  const subtotal      = items.reduce((sum, item, i) => sum + item.unitPrice * (quantities[i] ?? item.defaultQty), 0)
  const discountAmt   = subtotal * (discountPercent / 100)
  const taxableAmount = subtotal - discountAmt
  const taxAmt        = taxableAmount * (taxRate / 100)
  const total         = taxableAmount + taxAmt

  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  const inputStyle: React.CSSProperties = { width: 80, padding: '8px 10px', border: `1px solid #e2e8f0`, borderRadius: 8, fontSize: 15, textAlign: 'center', color: textColor, fontWeight: 700, outline: 'none', backgroundColor: '#fff' }

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <style>{`.calc-inp:focus { border-color: ${accentColor} !important; box-shadow: 0 0 0 3px ${accentColor}22; }`}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}

        <div style={{ backgroundColor: cardColor, borderRadius, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          {/* Line items */}
          <div style={{ padding: '0 0 0' }}>
            {items.map((item, i) => {
              const qty      = quantities[i] ?? item.defaultQty
              const lineTotal = item.unitPrice * qty
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 28px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: textColor, fontWeight: 600, fontSize: 15, margin: '0 0 3px' }}>{item.label}</p>
                    {item.description && <p style={{ color: textColor, opacity: 0.55, fontSize: 13, margin: 0 }}>{item.description}</p>}
                    <p style={{ color: accentColor, fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>{fmt(item.unitPrice)} / {item.unitLabel}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setQty(i, qty - item.step)}
                      disabled={qty <= item.min}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid #e2e8f0`, backgroundColor: '#fff', cursor: qty <= item.min ? 'not-allowed' : 'pointer', fontSize: 18, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty <= item.min ? 0.4 : 1 }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="calc-inp"
                      value={qty}
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => setQty(i, qty + item.step)}
                      disabled={qty >= item.max}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid #e2e8f0`, backgroundColor: '#fff', cursor: qty >= item.max ? 'not-allowed' : 'pointer', fontSize: 18, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty >= item.max ? 0.4 : 1 }}
                    >
                      +
                    </button>
                    <span style={{ minWidth: 80, textAlign: 'right', color: textColor, fontWeight: 700, fontSize: 15 }}>{fmt(lineTotal)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div style={{ padding: '20px 28px', backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textColor, opacity: 0.65, fontSize: 14 }}>Subtotal</span>
                <span style={{ color: textColor, fontSize: 14 }}>{fmt(subtotal)}</span>
              </div>
              {showDiscount && discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>Discount ({discountPercent}%)</span>
                  <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>−{fmt(discountAmt)}</span>
                </div>
              )}
              {showTax && taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textColor, opacity: 0.65, fontSize: 14 }}>Tax ({taxRate}%)</span>
                  <span style={{ color: textColor, fontSize: 14 }}>{fmt(taxAmt)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid #e2e8f0` }}>
                <span style={{ color: textColor, fontSize: 18, fontWeight: 800 }}>Estimated Total</span>
                <span style={{ color: accentColor, fontSize: 22, fontWeight: 800 }}>{fmt(total)}</span>
              </div>
            </div>

            {ctaText && (
              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <a href={ctaUrl} style={{ display: 'inline-block', backgroundColor: accentColor, color: '#fff', padding: '13px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                  {ctaText}
                </a>
              </div>
            )}
            {noteText && (
              <p style={{ color: textColor, opacity: 0.45, fontSize: 12, margin: '14px 0 0', textAlign: 'right' }}>{noteText}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const PriceCalculator: ComponentConfig<PriceCalculatorProps> = {
  label: 'Price Calculator',
  fields: {
    headline:        { type: 'text',    label: 'Headline' },
    subheadline:     { type: 'textarea', label: 'Subheadline' },
    currencySymbol:  { type: 'text',    label: 'Currency Symbol' },
    taxRate:         { type: 'number',  label: 'Tax Rate (%)' },
    showTax:         { type: 'radio',   label: 'Show Tax Row', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    discountPercent: { type: 'number',  label: 'Discount (%)' },
    showDiscount:    { type: 'radio',   label: 'Show Discount Row', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    ctaText:         { type: 'text',    label: 'CTA Button Text' },
    ctaUrl:          { type: 'text',    label: 'CTA Button URL' },
    noteText:        { type: 'text',    label: 'Footer Note (e.g. "Final pricing confirmed at checkout")' },
    accentColor:     { type: 'text',    label: 'Accent Colour (hex)' },
    backgroundColor: { type: 'text',   label: 'Section Background (hex)' },
    cardColor:       { type: 'text',    label: 'Card Background (hex)' },
    textColor:       { type: 'text',    label: 'Text Colour (hex)' },
    borderRadius:    { type: 'number',  label: 'Card Border Radius (px)' },
    items: {
      type: 'array', label: 'Line Items',
      arrayFields: {
        label:      { type: 'text',    label: 'Item Name' },
        description: { type: 'text',   label: 'Description (optional)' },
        unitPrice:  { type: 'number',  label: 'Unit Price' },
        unitLabel:  { type: 'text',    label: 'Unit Label (e.g. month, item, seat)' },
        min:        { type: 'number',  label: 'Minimum Qty' },
        max:        { type: 'number',  label: 'Maximum Qty' },
        defaultQty: { type: 'number',  label: 'Default Qty' },
        step:       { type: 'number',  label: 'Step Size' },
      },
      defaultItemProps: { label: 'Product / Service', description: '', unitPrice: 199, unitLabel: 'item', min: 0, max: 100, defaultQty: 1, step: 1 },
      getItemSummary: (item: LineItem) => `${item.label} × ${item.defaultQty}`,
    },
  },
  defaultProps: {
    headline:        'Get an Instant Quote',
    subheadline:     'Adjust quantities to estimate your total cost. Final pricing confirmed at checkout.',
    currencySymbol:  'R ',
    taxRate:         15,
    showTax:         true,
    discountPercent: 0,
    showDiscount:    false,
    ctaText:         'Proceed to Checkout',
    ctaUrl:          '/checkout',
    noteText:        'Prices exclude delivery. Final amount confirmed at checkout.',
    accentColor:     '#2563eb',
    backgroundColor: '#f8fafc',
    cardColor:       '#ffffff',
    textColor:       '#1e293b',
    borderRadius:    16,
    items: [
      { label: 'Custom Branded Tote Bag',  description: 'Full-colour print, 38×42cm cotton canvas', unitPrice: 89,  unitLabel: 'unit', min: 0, max: 500, defaultQty: 25,  step: 5  },
      { label: 'Printed T-Shirt',          description: 'Unisex fit, 100% cotton, front & back print', unitPrice: 149, unitLabel: 'unit', min: 0, max: 500, defaultQty: 10,  step: 5  },
      { label: 'Branded Packaging Box',    description: 'Custom print, 200×150×80mm, kraft board',  unitPrice: 35,  unitLabel: 'unit', min: 0, max: 1000, defaultQty: 50, step: 10 },
    ],
  },
  render(props) { return <CalcInner {...props} /> },
}
