import { useState } from 'react'
import type { SiteSettings } from '../../lib/siteSettings'

// Fixed bottom-right WhatsApp chat button — site-wide chrome like SiteHeader/
// SiteFooter, rendered here purely so Studio's editor preview shows it, but the
// actual button a shopper interacts with is the Vue port of this component in
// nuxt-storefront (components/storefront/WhatsAppWidget.vue). Renders null when
// disabled or no phone number is set, so a tenant who hasn't opted in sees no
// change at all.
export function WhatsAppWidget({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false)

  if (!settings.whatsappEnabled || !settings.whatsappPhone) {
    return null
  }

  const color = settings.whatsappButtonColor || '#25D366'
  const title = settings.whatsappMessageTitle || 'Chat with us on WhatsApp!'
  const body  = settings.whatsappMessageBody || 'Hello, how can we help you?'
  const waUrl = `https://wa.me/${settings.whatsappPhone}?text=${encodeURIComponent(body)}`

  const handleButtonClick = () => {
    if (settings.whatsappPopupEnabled) {
      setOpen(o => !o)
    } else {
      window.open(waUrl, '_blank', 'noopener')
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9998, fontFamily: 'inherit' }}>
      {open && settings.whatsappPopupEnabled && (
        <div
          style={{
            width: 280, marginBottom: 12, borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0,0,0,0.24)', backgroundColor: '#fff',
          }}
        >
          <div style={{ backgroundColor: color, color: '#fff', padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#334155' }}>{body}</p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              style={{
                display: 'block', textAlign: 'center', padding: '10px 12px', borderRadius: 8,
                backgroundColor: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Start Chat
            </a>
          </div>
        </div>
      )}
      <button
        onClick={handleButtonClick}
        aria-label="Chat on WhatsApp"
        style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          backgroundColor: color, color: '#fff', fontSize: 26, boxShadow: '0 6px 16px rgba(0,0,0,0.24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        💬
      </button>
    </div>
  )
}
