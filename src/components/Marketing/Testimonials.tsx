import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type TestimonialItem = {
  quote: string
  authorName: string
  authorRole: string
  authorAvatar: string
  rating: number
}

export type TestimonialsProps = {
  headline: string
  subheadline: string
  columns: 2 | 3
  backgroundColor: string
  cardColor: string
  textColor: string
  accentColor: string
  items: TestimonialItem[]
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ fontSize: 18, color: n <= rating ? color : '#d1d5db' }}>★</span>
      ))}
    </div>
  )
}

export const Testimonials: ComponentConfig<TestimonialsProps> = {
  label: 'Testimonials',
  fields: {
    headline:       { type: 'text',    label: 'Section Headline' },
    subheadline:    { type: 'textarea', label: 'Section Subheadline' },
    columns:        { type: 'select',  label: 'Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }] },
    backgroundColor: { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardColor:      { type: 'custom',  label: 'Card Background (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:      { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:    { type: 'custom',  label: 'Star / Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    items: {
      type: 'array',
      label: 'Testimonials',
      arrayFields: {
        quote:        { type: 'textarea', label: 'Quote' },
        authorName:   { type: 'text',    label: 'Author Name' },
        authorRole:   { type: 'text',    label: 'Author Role / Company' },
        authorAvatar: { type: 'custom', label: 'Avatar Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        rating:       { type: 'number',  label: 'Star Rating (1–5)' },
      },
      defaultItemProps: {
        quote: 'This product has completely transformed the way we run our business. Highly recommended!',
        authorName: 'Jane Smith',
        authorRole: 'CEO, Acme Corp',
        authorAvatar: '',
        rating: 5,
      },
      getItemSummary: (item: TestimonialItem) => item.authorName || 'Testimonial',
    },
  },
  defaultProps: {
    headline:        'What Our Customers Say',
    subheadline:     'Trusted by thousands of businesses worldwide.',
    columns:         3,
    backgroundColor: '#f8fafc',
    cardColor:       '#ffffff',
    textColor:       '#1e293b',
    accentColor:     '#f59e0b',
    items: [
      { quote: 'Absolutely outstanding service. The team went above and beyond to make sure everything was perfect.', authorName: 'Sarah Johnson', authorRole: 'Owner, The Bloom Studio', authorAvatar: '', rating: 5 },
      { quote: 'We doubled our online sales within 3 months of switching. The results speak for themselves.', authorName: 'Mark Williams', authorRole: 'Director, FreshPick Foods', authorAvatar: '', rating: 5 },
      { quote: 'The setup was painless and the support team is always available. Couldn\'t be happier.', authorName: 'Priya Naidoo', authorRole: 'Founder, Silk & Thread', authorAvatar: '', rating: 4 },
    ],
  },
  render({ headline, subheadline, columns, backgroundColor, cardColor, textColor, accentColor, items }) {
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              {headline && <h2 className="sb-text-fluid-md" style={{ color: textColor, fontWeight: 800, margin: '0 0 16px' }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: 18, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          {/* sb-grid collapses this to 1 column on mobile / 2 on tablet regardless of the merchant's chosen column count */}
          <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 24 }}>
            {items.map((item, i) => (
              <div key={i} style={{ backgroundColor: cardColor, borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <StarRating rating={Math.min(5, Math.max(1, item.rating))} color={accentColor} />
                <p style={{ color: textColor, fontSize: 16, lineHeight: 1.7, margin: '0 0 24px', flexGrow: 1, fontStyle: 'italic' }}>"{item.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {item.authorAvatar ? (
                    <img src={item.authorAvatar} alt={item.authorName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {item.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ color: textColor, fontWeight: 700, fontSize: 15, margin: 0 }}>{item.authorName}</p>
                    <p style={{ color: textColor, opacity: 0.6, fontSize: 13, margin: 0 }}>{item.authorRole}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
