import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

type FAQItem = {
  question: string
  answer: string
}

export type FAQAccordionProps = {
  headline: string
  subheadline: string
  backgroundColor: string
  cardColor: string
  textColor: string
  accentColor: string
  maxWidth: number
  items: FAQItem[]
}

function AccordionItem({ question, answer, textColor, accentColor, cardColor }: FAQItem & { textColor: string; accentColor: string; cardColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        backgroundColor: cardColor,
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${textColor}14`,
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 16,
        }}
      >
        <span style={{ color: textColor, fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{question}</span>
        <span style={{ color: accentColor, fontSize: 22, fontWeight: 300, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 24px 20px' }}>
          <p style={{ color: textColor, opacity: 0.75, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{answer}</p>
        </div>
      )}
    </div>
  )
}

export const FAQAccordion: ComponentConfig<FAQAccordionProps> = {
  label: 'FAQ Accordion',
  fields: {
    headline:        { type: 'text',    label: 'Section Headline' },
    subheadline:     { type: 'textarea', label: 'Section Subheadline' },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardColor:       { type: 'custom', label: 'Card Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:     { type: 'custom', label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    maxWidth:        { type: 'number', label: 'Content Max Width (px)' },
    items: {
      type: 'array',
      label: 'FAQ Items',
      arrayFields: {
        question: { type: 'text',    label: 'Question' },
        answer:   { type: 'textarea', label: 'Answer' },
      },
      defaultItemProps: {
        question: 'How does it work?',
        answer: 'Provide a clear, helpful answer to this common question here.',
      },
      getItemSummary: (item: FAQItem) => item.question || 'FAQ Item',
    },
  },
  defaultProps: {
    headline:        'Frequently Asked Questions',
    subheadline:     'Everything you need to know.',
    backgroundColor: '#ffffff',
    cardColor:       '#f8fafc',
    textColor:       '#1e293b',
    accentColor:     '#2563eb',
    maxWidth:        720,
    items: [
      { question: 'How long does shipping take?', answer: 'Standard shipping typically takes 3–5 business days. Express shipping is available at checkout for delivery within 1–2 business days.' },
      { question: 'Can I return or exchange my order?', answer: 'Yes! We offer a 30-day hassle-free return policy. Items must be in their original condition with tags attached. Contact our support team to start a return.' },
      { question: 'Do you offer wholesale pricing?', answer: 'Absolutely. We have a dedicated wholesale portal for registered trade customers. Apply through our wholesale page and our team will be in touch within 24 hours.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards, EFT, PayFast, and selected buy-now-pay-later options at checkout.' },
    ],
  },
  render({ headline, subheadline, backgroundColor, cardColor, textColor, accentColor, maxWidth, items }) {
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: maxWidth, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              {headline && <h2 style={{ color: textColor, fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: 18, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          <div>
            {items.map((item, i) => (
              <AccordionItem key={i} {...item} textColor={textColor} accentColor={accentColor} cardColor={cardColor} />
            ))}
          </div>
        </div>
      </section>
    )
  },
}
