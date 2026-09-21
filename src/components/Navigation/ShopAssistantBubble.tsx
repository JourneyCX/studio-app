import { useEffect, useRef, useState } from 'react'
import type { SiteSettings } from '../../lib/siteSettings'

type Msg = { role: 'user' | 'assistant'; content: string }

// Fixed-position floating chat bubble — site-wide chrome like WhatsAppWidget.tsx
// right next to it, rendered here purely so Studio's editor preview shows it, but
// the actual bubble a shopper interacts with is the Vue port of this component in
// nuxt-storefront (components/storefront/ShopAssistantBubble.vue). Distinct from
// the per-page "AI-Powered Tool" Puck block (AITool.tsx) a merchant can still drag
// onto individual pages — this makes the same Shop Assistant persistently reachable
// on every page without needing to place a block anywhere. Renders null when
// disabled, same convention as WhatsAppWidget.

const WHATSAPP_BUTTON_FOOTPRINT = 56 + 16 // button height + gap, matches WhatsAppWidget.tsx

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatMessage(content: string, accentColor: string): string {
  let html = escapeHtml(content)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const trailing = url.match(/[.,;:!?)\]]+$/)?.[0] ?? ''
    const clean = trailing ? url.slice(0, -trailing.length) : url
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" style="color:${accentColor};text-decoration:underline;">${clean}</a>${trailing}`
  })
  return html
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      <style>{`
        @keyframes ai-bubble-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .ai-bubble-d1{animation:ai-bubble-dot 1.2s infinite 0s}
        .ai-bubble-d2{animation:ai-bubble-dot 1.2s infinite 0.2s}
        .ai-bubble-d3{animation:ai-bubble-dot 1.2s infinite 0.4s}
      `}</style>
      {['ai-bubble-d1', 'ai-bubble-d2', 'ai-bubble-d3'].map(c => (
        <span key={c} className={c} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      ))}
    </div>
  )
}

export function ShopAssistantBubble({ settings }: { settings: SiteSettings }) {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading, open])

  if (!settings.aiBubbleEnabled) {
    return null
  }

  const accentColor   = settings.aiBubbleAccentColor || '#2563eb'
  const assistantName = settings.aiBubbleAssistantName || 'Shop Assistant'
  const greeting       = settings.aiBubbleGreeting || 'Hi! How can I help you today?'
  const starters = (settings.aiBubbleStarterPrompts || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4)
  const isRight = settings.aiBubblePosition !== 'bottom-left'

  // Stacks above the WhatsApp button when both are enabled and share the same
  // corner — WhatsApp's own position is always bottom-right (no position field),
  // so a collision is only possible when the assistant is also right-aligned.
  const collidesWithWhatsapp = isRight && settings.whatsappEnabled && !!settings.whatsappPhone
  const bottomOffset = collidesWithWhatsapp ? 24 + WHATSAPP_BUTTON_FOOTPRINT : 24

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setError('')

    if (!settings.aiBubbleProxyEndpoint) {
      setTimeout(() => {
        setMessages([...updated, { role: 'assistant', content: 'Save the Shop Assistant section in Site Settings to enable live responses.' }])
        setLoading(false)
      }, 900)
      return
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.aiBubbleApiKey) headers['X-AI-Key'] = settings.aiBubbleApiKey

      const res = await fetch(settings.aiBubbleProxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'assistant',
          systemPrompt: settings.aiBubbleSystemPrompt || undefined,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (data?.error === 'insufficient_credits') {
        setMessages([...updated, {
          role: 'assistant',
          content: '⚠️ ' + (data.message ?? 'AI credit balance is empty. Please top up in the Stratum admin panel.'),
        }])
        return
      }

      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      const content: string = data?.content ?? data?.choices?.[0]?.message?.content ?? 'No response received.'
      setMessages([...updated, { role: 'assistant', content }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: bottomOffset, [isRight ? 'right' : 'left']: 24,
        zIndex: 9997, fontFamily: 'inherit',
      }}
    >
      {open && (
        <div
          style={{
            position: 'absolute', bottom: 68, [isRight ? 'right' : 'left']: 0,
            width: 'min(340px, calc(100vw - 48px))', height: 'min(480px, calc(100vh - 160px))',
            display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.28)', backgroundColor: '#fff',
          }}
        >
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, backgroundColor: accentColor, color: '#fff', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{assistantName}</p>
              <p style={{ fontSize: 11, margin: 0, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
                Online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 10px' }}>💬</div>
                <p style={{ color: '#334155', opacity: 0.75, fontSize: 13, marginBottom: 16 }}>{greeting}</p>
                {starters.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {starters.map((s, i) => (
                      <button key={i} onClick={() => send(s)} style={{ backgroundColor: accentColor + '12', color: accentColor, border: `1px solid ${accentColor}30`, borderRadius: 16, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div
                  style={{ maxWidth: '80%', backgroundColor: msg.role === 'user' ? accentColor : '#fff', color: msg.role === 'user' ? '#fff' : '#1e293b', borderRadius: 12, padding: '9px 12px', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.06)' : undefined }}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content, msg.role === 'user' ? '#fff' : accentColor) }}
                />
              </div>
            ))}

            {loading && (
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '10px 12px', width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                <TypingDots color={accentColor} />
              </div>
            )}

            {error && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>⚠ {error}</p>}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, backgroundColor: '#fff', flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Ask me anything…"
              rows={1}
              style={{ flex: 1, resize: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{ backgroundColor: accentColor, border: 'none', borderRadius: 8, padding: '0 14px', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Chat with us'}
        style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          backgroundColor: accentColor, boxShadow: '0 6px 16px rgba(0,0,0,0.24)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
