import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'

export type ContactFormProps = {
  headline: string
  subheadline: string
  showPhone: boolean
  showSubject: boolean
  showCompany: boolean
  submitEndpoint: string
  submitButtonText: string
  successMessage: string
  errorMessage: string
  layout: 'standard' | 'two-column' | 'card'
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderColor: string
  borderRadius: number
}

interface FormState { name: string; email: string; phone: string; company: string; subject: string; message: string }
type Status = 'idle' | 'loading' | 'success' | 'error'

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function FormInner(props: ContactFormProps) {
  const { headline, subheadline, showPhone, showSubject, showCompany, submitEndpoint, submitButtonText, successMessage, errorMessage, layout, accentColor, backgroundColor, cardColor, textColor, borderColor, borderRadius } = props

  const [form, setForm]     = useState<FormState>({ name: '', email: '', phone: '', company: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitEndpoint) { setStatus('success'); return }
    setStatus('loading')
    try {
      const res = await fetch(submitEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1px solid ${borderColor}`, borderRadius: borderRadius / 2, fontSize: 15, color: textColor, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: textColor, marginBottom: 6, opacity: 0.8 }

  const isCard = layout === 'card'
  const isTwoCol = layout === 'two-column'

  const formContent = status === 'success' ? (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <p style={{ color: textColor, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{successMessage}</p>
      <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' }) }} style={{ marginTop: 20, background: 'none', border: `1px solid ${borderColor}`, color: textColor, padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
        Send another message
      </button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} noValidate>
      <style>{`.cf-input:focus { border-color: ${accentColor} !important; box-shadow: 0 0 0 3px ${accentColor}22; }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: isTwoCol ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input className="cf-input" type="text" required placeholder="Jane Smith" value={form.name} onChange={set('name')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input className="cf-input" type="email" required placeholder="jane@example.com" value={form.email} onChange={set('email')} style={inputStyle} />
        </div>
        {showPhone && (
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input className="cf-input" type="tel" placeholder="+27 00 000 0000" value={form.phone} onChange={set('phone')} style={inputStyle} />
          </div>
        )}
        {showCompany && (
          <div>
            <label style={labelStyle}>Company</label>
            <input className="cf-input" type="text" placeholder="Company name" value={form.company} onChange={set('company')} style={inputStyle} />
          </div>
        )}
        {showSubject && (
          <div style={{ gridColumn: isTwoCol ? '1 / -1' : undefined }}>
            <label style={labelStyle}>Subject</label>
            <input className="cf-input" type="text" placeholder="How can we help?" value={form.subject} onChange={set('subject')} style={inputStyle} />
          </div>
        )}
        <div style={{ gridColumn: isTwoCol ? '1 / -1' : undefined }}>
          <label style={labelStyle}>Message *</label>
          <textarea className="cf-input" required rows={5} placeholder="Tell us more…" value={form.message} onChange={set('message')} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      </div>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: 14, margin: '12px 0 0' }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', backgroundColor: status === 'loading' ? accentColor + 'aa' : accentColor, color: '#fff', border: 'none', padding: '13px 32px', borderRadius: borderRadius / 2, cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}
      >
        {status === 'loading' ? 'Sending…' : submitButtonText}
        {status !== 'loading' && <SendIcon />}
      </button>
    </form>
  )

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <div style={{ maxWidth: isCard ? 680 : 900, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ marginBottom: 40, textAlign: isCard ? 'center' : 'left' }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}
        <div style={isCard ? { backgroundColor: cardColor, borderRadius, padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${borderColor}` } : {}}>
          {formContent}
        </div>
      </div>
    </section>
  )
}

export const ContactForm: ComponentConfig<ContactFormProps> = {
  label: 'Contact Form',
  fields: {
    headline:         { type: 'text',    label: 'Section Headline' },
    subheadline:      { type: 'textarea', label: 'Section Subheadline' },
    showPhone:        { type: 'radio',   label: 'Phone Field',   options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showSubject:      { type: 'radio',   label: 'Subject Field', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showCompany:      { type: 'radio',   label: 'Company Field', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    submitEndpoint:   { type: 'text',    label: 'Submit Endpoint URL (POST, leave blank to preview)' },
    submitButtonText: { type: 'text',    label: 'Submit Button Text' },
    successMessage:   { type: 'text',    label: 'Success Message' },
    errorMessage:     { type: 'text',    label: 'Error Message' },
    layout:           { type: 'select',  label: 'Layout', options: [{ label: 'Standard (single column)', value: 'standard' }, { label: 'Two Column (pairs fields)', value: 'two-column' }, { label: 'Card (centred box)', value: 'card' }] },
    accentColor:      { type: 'text',    label: 'Accent Colour (hex)' },
    backgroundColor:  { type: 'text',   label: 'Section Background (hex)' },
    cardColor:        { type: 'text',    label: 'Card Background (hex)' },
    textColor:        { type: 'text',    label: 'Text Colour (hex)' },
    borderColor:      { type: 'text',    label: 'Border Colour (hex)' },
    borderRadius:     { type: 'number',  label: 'Border Radius (px)' },
  },
  defaultProps: {
    headline:         'Get in Touch',
    subheadline:      'We\'d love to hear from you. Fill in the form and we\'ll get back to you within 24 hours.',
    showPhone:        true,
    showSubject:      true,
    showCompany:      false,
    submitEndpoint:   '',
    submitButtonText: 'Send Message',
    successMessage:   'Thanks! We\'ll be in touch soon.',
    errorMessage:     'Something went wrong. Please try again.',
    layout:           'two-column',
    accentColor:      '#2563eb',
    backgroundColor:  '#ffffff',
    cardColor:        '#f8fafc',
    textColor:        '#1e293b',
    borderColor:      '#e2e8f0',
    borderRadius:     12,
  },
  render(props) { return <FormInner {...props} /> },
}
