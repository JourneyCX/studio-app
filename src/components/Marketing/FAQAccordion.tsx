import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { FONT_OPTIONS } from '../SiteSettings/FontsSection'

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
  // Spacing (px). Undefined on pages saved before these settings existed -> fall back to the original look.
  spaceAboveHeading: number
  spaceHeadingToSub: number
  spaceSubToQuestions: number
  // CSS font-family string; empty = inherit the theme font (same convention as TextBlock).
  fontFamily: string
  headingFontSize: number   // 0 = responsive default
  subheadingFontSize: number
  questionFontSize: number
  items: FAQItem[]
}

function AccordionItem({ question, answer, textColor, accentColor, cardColor, questionFontSize }: FAQItem & { textColor: string; accentColor: string; cardColor: string; questionFontSize: number }) {
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
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: textColor, fontSize: questionFontSize, fontWeight: 600, lineHeight: 1.4 }}>{question}</span>
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
    fontFamily:          { type: 'select', label: 'Font', options: [{ label: 'Theme default', value: '' }, ...FONT_OPTIONS] },
    headingFontSize:     { type: 'number', label: 'Headline Font Size (px, 0 = auto)' },
    subheadingFontSize:  { type: 'number', label: 'Subheadline Font Size (px)' },
    questionFontSize:    { type: 'number', label: 'Question Font Size (px)' },
    spaceAboveHeading:   { type: 'number', label: 'Space Above Headline (px)' },
    spaceHeadingToSub:   { type: 'number', label: 'Space Between Headline & Subheadline (px)' },
    spaceSubToQuestions: { type: 'number', label: 'Space Between Subheadline & Questions (px)' },
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
    fontFamily:          '',
    headingFontSize:     0,
    subheadingFontSize:  18,
    questionFontSize:    17,
    spaceAboveHeading:   0,
    spaceHeadingToSub:   16,
    spaceSubToQuestions: 48,
    items: [
      { question: 'How long does shipping take?', answer: 'Standard shipping typically takes 3–5 business days. Express shipping is available at checkout for delivery within 1–2 business days.' },
      { question: 'Can I return or exchange my order?', answer: 'Yes! We offer a 30-day hassle-free return policy. Items must be in their original condition with tags attached. Contact our support team to start a return.' },
      { question: 'Do you offer wholesale pricing?', answer: 'Absolutely. We have a dedicated wholesale portal for registered trade customers. Apply through our wholesale page and our team will be in touch within 24 hours.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards, EFT, PayFast, and selected buy-now-pay-later options at checkout.' },
    ],
  },
  render({ headline, subheadline, backgroundColor, cardColor, textColor, accentColor, maxWidth, items, fontFamily, headingFontSize, subheadingFontSize, questionFontSize, spaceAboveHeading, spaceHeadingToSub, spaceSubToQuestions }) {
    const num = (v: number | undefined, d: number) => (typeof v === 'number' && !isNaN(v) ? v : d)
    const hSize = num(headingFontSize, 0)
    return (
      <section style={{ backgroundColor, padding: '72px 24px', ...(fontFamily ? { fontFamily } : {}) }}>
        <div style={{ maxWidth: maxWidth, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginTop: num(spaceAboveHeading, 0), marginBottom: num(spaceSubToQuestions, 48) }}>
              {headline && <h2 className={hSize > 0 ? undefined : 'sb-text-fluid-md'} style={{ color: textColor, fontWeight: 800, margin: `0 0 ${subheadline ? num(spaceHeadingToSub, 16) : 0}px`, ...(hSize > 0 ? { fontSize: hSize } : {}) }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: num(subheadingFontSize, 18), margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          <div>
            {items.map((item, i) => (
              <AccordionItem key={i} {...item} textColor={textColor} accentColor={accentColor} cardColor={cardColor} questionFontSize={num(questionFontSize, 17)} />
            ))}
          </div>
        </div>
      </section>
    )
  },
}
