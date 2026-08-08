import type { ComponentConfig } from '@measured/puck'

type PricingPlan = {
  name: string
  price: string
  period: string
  description: string
  features: string
  highlighted: boolean
  highlightColor: string
  buttonText: string
  buttonUrl: string
}

export type PricingTableProps = {
  headline: string
  subheadline: string
  backgroundColor: string
  textColor: string
  plans: PricingPlan[]
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="9" fill={color} fillOpacity="0.15" />
      <path d="M5 9l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const PricingTable: ComponentConfig<PricingTableProps> = {
  label: 'Pricing Table',
  fields: {
    headline:       { type: 'text',    label: 'Section Headline' },
    subheadline:    { type: 'textarea', label: 'Section Subheadline' },
    backgroundColor: { type: 'text',  label: 'Background Colour (hex)' },
    textColor:      { type: 'text',    label: 'Text Colour (hex)' },
    plans: {
      type: 'array',
      label: 'Pricing Plans',
      arrayFields: {
        name:           { type: 'text',    label: 'Plan Name' },
        price:          { type: 'text',    label: 'Price (e.g. R499)' },
        period:         { type: 'text',    label: 'Period (e.g. / month)' },
        description:    { type: 'textarea', label: 'Short Description' },
        features:       { type: 'textarea', label: 'Features (one per line)' },
        highlighted:    { type: 'radio',   label: 'Highlight This Plan?', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
        highlightColor: { type: 'text',    label: 'Highlight / Button Colour (hex)' },
        buttonText:     { type: 'text',    label: 'Button Text' },
        buttonUrl:      { type: 'text',    label: 'Button URL' },
      },
      defaultItemProps: {
        name: 'Pro',
        price: 'R499',
        period: '/ month',
        description: 'Everything you need to grow.',
        features: 'Up to 500 products\nUnlimited orders\nEmail support\nAnalytics dashboard',
        highlighted: false,
        highlightColor: '#2563eb',
        buttonText: 'Get Started',
        buttonUrl: '/signup',
      },
      getItemSummary: (item: PricingPlan) => item.name || 'Plan',
    },
  },
  defaultProps: {
    headline:        'Simple, Transparent Pricing',
    subheadline:     'No hidden fees. Cancel anytime.',
    backgroundColor: '#f8fafc',
    textColor:       '#1e293b',
    plans: [
      {
        name: 'Starter', price: 'R199', period: '/ month',
        description: 'Perfect for getting started.',
        features: 'Up to 50 products\n100 orders / month\nEmail support',
        highlighted: false, highlightColor: '#64748b', buttonText: 'Start Free', buttonUrl: '/signup',
      },
      {
        name: 'Growth', price: 'R499', period: '/ month',
        description: 'Everything you need to scale.',
        features: 'Up to 500 products\nUnlimited orders\nPriority support\nAnalytics dashboard\nCustom domain',
        highlighted: true, highlightColor: '#2563eb', buttonText: 'Get Started', buttonUrl: '/signup',
      },
      {
        name: 'Enterprise', price: 'Custom', period: '',
        description: 'For large businesses with unique needs.',
        features: 'Unlimited products\nDedicated account manager\nSLA guarantee\nCustom integrations',
        highlighted: false, highlightColor: '#0f172a', buttonText: 'Contact Sales', buttonUrl: '/contact',
      },
    ],
  },
  render({ headline, subheadline, backgroundColor, textColor, plans }) {
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              {headline && <h2 style={{ color: textColor, fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: 18, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: 24, alignItems: 'start' }}>
            {plans.map((plan, i) => {
              const features = plan.features ? plan.features.split('\n').filter(Boolean) : []
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 16,
                    padding: plan.highlighted ? '40px 32px' : '32px',
                    backgroundColor: plan.highlighted ? plan.highlightColor : '#fff',
                    color: plan.highlighted ? '#fff' : textColor,
                    boxShadow: plan.highlighted ? `0 8px 32px ${plan.highlightColor}44` : '0 2px 12px rgba(0,0,0,0.07)',
                    border: plan.highlighted ? 'none' : `1px solid ${textColor}18`,
                    position: 'relative',
                  }}
                >
                  {plan.highlighted && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fbbf24', color: '#1e293b', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 20, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px', opacity: 0.8 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: 16, opacity: 0.7 }}>{plan.period}</span>}
                  </div>
                  {plan.description && <p style={{ fontSize: 15, opacity: 0.75, margin: '0 0 24px', lineHeight: 1.5 }}>{plan.description}</p>}
                  <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {features.map((f, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15 }}>
                        <CheckIcon color={plan.highlighted ? '#fff' : plan.highlightColor} />
                        <span style={{ opacity: 0.9 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.buttonText && (
                    <a
                      href={plan.buttonUrl}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '13px 24px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 15,
                        backgroundColor: plan.highlighted ? '#fff' : plan.highlightColor,
                        color: plan.highlighted ? plan.highlightColor : '#fff',
                      }}
                    >
                      {plan.buttonText}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}
