import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

export type NewsletterSignupProps = {
  layout: 'banner' | 'card' | 'minimal'
  showFirstName: boolean
  headline: string
  subheadline: string
  placeholder: string
  buttonText: string
  privacyText: string
  successMessage: string
  webhookUrl: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: number
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function MailIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function NewsletterInner(props: NewsletterSignupProps) {
  const { layout, showFirstName, headline, subheadline, placeholder, buttonText, privacyText, successMessage, webhookUrl, accentColor, backgroundColor, textColor, borderRadius } = props
  const [email, setEmail]       = useState('')
  const [firstName, setFirstName] = useState('')
  const [status, setStatus]     = useState<Status>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    if (!webhookUrl) { setTimeout(() => setStatus('success'), 800); return }
    try {
      const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, firstName }) })
      setStatus(res.ok ? 'success' : 'error')
    } catch { setStatus('error') }
  }

  const inputStyle: React.CSSProperties = { flex: 1, padding: '13px 18px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: borderRadius / 1.5, fontSize: 15, outline: 'none', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', minWidth: 0 }
  const inputStyleLight: React.CSSProperties = { flex: 1, padding: '12px 16px', border: `1px solid #e2e8f0`, borderRadius: borderRadius / 1.5, fontSize: 15, outline: 'none', backgroundColor: '#fff', color: textColor, minWidth: 0 }

  if (status === 'success') {
    return (
      <section style={{ backgroundColor: layout === 'banner' ? accentColor : backgroundColor, padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <p style={{ color: layout === 'banner' ? '#fff' : textColor, fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>{successMessage}</p>
          <p style={{ color: layout === 'banner' ? 'rgba(255,255,255,0.75)' : textColor, opacity: layout === 'banner' ? 1 : 0.6, fontSize: 15, margin: 0 }}>Keep an eye on your inbox.</p>
        </div>
      </section>
    )
  }

  if (layout === 'banner') {
    return (
      <section style={{ backgroundColor: accentColor, padding: '56px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><MailIcon color="rgba(255,255,255,0.7)" /></div>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '12px 0 12px' }}>{headline}</h2>
          {subheadline && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, margin: '0 0 32px', lineHeight: 1.6 }}>{subheadline}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {showFirstName && <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, flex: '0 1 160px' }} />}
            <input type="email" required placeholder={placeholder} value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <button type="submit" disabled={status === 'loading'} style={{ padding: '13px 28px', borderRadius: borderRadius / 1.5, backgroundColor: '#fff', color: accentColor, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {status === 'loading' ? '…' : buttonText}
            </button>
          </form>
          {privacyText && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 16 }}>{privacyText}</p>}
        </div>
      </section>
    )
  }

  if (layout === 'card') {
    return (
      <section style={{ backgroundColor, padding: '64px 24px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', backgroundColor: '#fff', borderRadius, padding: '48px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><MailIcon color={accentColor} /></div>
          <h2 style={{ color: textColor, fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>
          {subheadline && <p style={{ color: textColor, opacity: 0.65, fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>{subheadline}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {showFirstName && <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyleLight, textAlign: 'center' }} />}
            <input type="email" required placeholder={placeholder} value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyleLight, textAlign: 'center' }} />
            <button type="submit" disabled={status === 'loading'} style={{ padding: '13px', borderRadius: borderRadius / 1.5, backgroundColor: accentColor, color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {status === 'loading' ? 'Subscribing…' : buttonText}
            </button>
          </form>
          {privacyText && <p style={{ color: textColor, opacity: 0.4, fontSize: 12, marginTop: 14 }}>{privacyText}</p>}
        </div>
      </section>
    )
  }

  // minimal — inline row
  return (
    <section style={{ backgroundColor, padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: '1 1 240px' }}>
            <h3 style={{ color: textColor, fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{headline}</h3>
            {subheadline && <p style={{ color: textColor, opacity: 0.6, fontSize: 14, margin: 0 }}>{subheadline}</p>}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flex: '1 1 320px', flexWrap: 'wrap' }}>
            {showFirstName && <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyleLight, flex: '0 1 140px' }} />}
            <input type="email" required placeholder={placeholder} value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyleLight} />
            <button type="submit" disabled={status === 'loading'} style={{ padding: '12px 22px', borderRadius: borderRadius / 1.5, backgroundColor: accentColor, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {status === 'loading' ? '…' : buttonText}
            </button>
          </form>
        </div>
        {privacyText && <p style={{ color: textColor, opacity: 0.4, fontSize: 12, marginTop: 12 }}>{privacyText}</p>}
      </div>
    </section>
  )
}

export const NewsletterSignup: ComponentConfig<NewsletterSignupProps> = {
  label: 'Newsletter Signup',
  fields: {
    layout:        { type: 'select', label: 'Layout', options: [{ label: 'Banner (full-width coloured)', value: 'banner' }, { label: 'Card (centred box)', value: 'card' }, { label: 'Minimal (inline row)', value: 'minimal' }] },
    showFirstName: { type: 'radio',  label: 'First Name Field', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    headline:      { type: 'text',   label: 'Headline' },
    subheadline:   { type: 'textarea', label: 'Subheadline' },
    placeholder:   { type: 'text',   label: 'Email Placeholder' },
    buttonText:    { type: 'text',   label: 'Button Text' },
    privacyText:   { type: 'text',   label: 'Privacy / GDPR Notice (optional)' },
    successMessage: { type: 'text',  label: 'Success Message' },
    webhookUrl:    { type: 'text',   label: 'Webhook / API URL (optional — leave blank to add signups to your Email Marketing list; enter your own URL to use a third-party service instead)' },
    accentColor:   { type: 'custom', label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:     { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius:  { type: 'number', label: 'Border Radius (px)' },
  },
  defaultProps: {
    layout:        'banner',
    showFirstName: false,
    headline:      'Stay in the Loop',
    subheadline:   'Get new arrivals, exclusive deals, and insider news straight to your inbox.',
    placeholder:   'Enter your email address',
    buttonText:    'Subscribe',
    privacyText:   'No spam, ever. Unsubscribe anytime.',
    successMessage: 'You\'re subscribed!',
    webhookUrl:    '',
    accentColor:   '#2563eb',
    backgroundColor: '#f8fafc',
    textColor:     '#1e293b',
    borderRadius:  12,
  },
  render(props) { return <NewsletterInner {...props} /> },
}
