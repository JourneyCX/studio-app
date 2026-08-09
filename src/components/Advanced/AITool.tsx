import { useState, useRef, useEffect } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { stratumApi } from '../../lib/api'

type Mode   = 'recommender' | 'planner' | 'assistant'
type Msg    = { role: 'user' | 'assistant'; content: string }

export type AIToolProps = {
  mode: Mode
  headline: string
  subheadline: string
  proxyEndpoint: string
  apiKey: string
  systemPrompt: string
  starterPrompts: string
  inputPlaceholder: string
  assistantName: string
  assistantAvatar: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderRadius: number
  maxHeight: number
}

const MODE_META: Record<Mode, { icon: string; label: string }> = {
  recommender: { icon: '🛍', label: 'Product Recommender' },
  planner:     { icon: '🗺', label: 'Travel Planner' },
  assistant:   { icon: '💬', label: 'Store Assistant' },
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      <style>{`
        @keyframes ai-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .ai-d1{animation:ai-dot 1.2s infinite 0s}
        .ai-d2{animation:ai-dot 1.2s infinite 0.2s}
        .ai-d3{animation:ai-dot 1.2s infinite 0.4s}
      `}</style>
      {['ai-d1','ai-d2','ai-d3'].map(c => <span key={c} className={c} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />)}
    </div>
  )
}

function ChatInner(props: AIToolProps) {
  const { mode, headline, subheadline, proxyEndpoint, apiKey, systemPrompt, starterPrompts, inputPlaceholder, assistantName, assistantAvatar, accentColor, backgroundColor, cardColor, textColor, borderRadius, maxHeight } = props

  const [messages, setMessages]   = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const bottomRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const starters = starterPrompts.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setError('')

    if (!proxyEndpoint) {
      setTimeout(() => {
        setMessages([...updated, { role: 'assistant', content: 'Configure the Proxy Endpoint and API Key in the block settings (AI Settings → Storefront AI Block) to enable live responses.' }])
        setLoading(false)
      }, 900)
      return
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['X-AI-Key'] = apiKey

      const res  = await fetch(proxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode,
          systemPrompt: systemPrompt || undefined,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      // Surface a credit-exhausted response as a distinct message
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

  const meta = MODE_META[mode]

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 16, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}

        <div style={{ backgroundColor: cardColor, borderRadius, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden', border: `1px solid ${textColor}0f` }}>
          {/* Header bar */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${textColor}0f`, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: accentColor + '0a' }}>
            <span style={{ fontSize: 22 }}>{meta.icon}</span>
            <div>
              <p style={{ color: textColor, fontWeight: 700, fontSize: 14, margin: 0 }}>{assistantName || meta.label}</p>
              <p style={{ color: '#10b981', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ height: maxHeight, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 && starters.length > 0 && (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                {assistantAvatar ? (
                  <img src={assistantAvatar} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>{meta.icon}</div>
                )}
                <p style={{ color: textColor, opacity: 0.55, fontSize: 14, marginBottom: 20 }}>Hi! How can I help you today?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {starters.map((s, i) => (
                    <button key={i} onClick={() => send(s)} style={{ backgroundColor: accentColor + '12', color: accentColor, border: `1px solid ${accentColor}30`, borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                )}
                <div style={{ maxWidth: '75%', backgroundColor: msg.role === 'user' ? accentColor : textColor + '0c', color: msg.role === 'user' ? '#fff' : textColor, borderRadius: msg.role === 'user' ? `${borderRadius / 1.5}px ${borderRadius / 1.5}px 4px ${borderRadius / 1.5}px` : `${borderRadius / 1.5}px ${borderRadius / 1.5}px ${borderRadius / 1.5}px 4px`, padding: '10px 14px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                <div style={{ backgroundColor: textColor + '0c', borderRadius: `${borderRadius / 1.5}px ${borderRadius / 1.5}px ${borderRadius / 1.5}px 4px`, padding: '12px 16px' }}>
                  <TypingDots color={accentColor} />
                </div>
              </div>
            )}

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>⚠ {error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${textColor}0f`, display: 'flex', gap: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={inputPlaceholder}
              rows={1}
              style={{ flex: 1, resize: 'none', border: `1px solid ${textColor}18`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', color: textColor, backgroundColor: '#fff' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{ backgroundColor: accentColor, border: 'none', borderRadius: 10, padding: '0 18px', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {!proxyEndpoint && (
          <p style={{ color: textColor, opacity: 0.4, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            ℹ️ This block configures itself automatically — if this message persists, check <strong>AI Settings → Storefront AI Block</strong> in your Stratum admin, or set the Proxy Endpoint/API Key fields manually below.
          </p>
        )}
      </div>
    </section>
  )
}

export const AITool: ComponentConfig<AIToolProps> = {
  label: 'AI-Powered Tool',
  fields: {
    mode:             { type: 'select',   label: 'Tool Mode', options: [{ label: '🛍 Product Recommender', value: 'recommender' }, { label: '🗺 Travel Planner', value: 'planner' }, { label: '💬 Store Assistant', value: 'assistant' }] },
    headline:         { type: 'text',     label: 'Section Headline' },
    subheadline:      { type: 'textarea', label: 'Section Subheadline' },
    proxyEndpoint:    { type: 'text',     label: 'Proxy Endpoint URL (auto-configured — override only for a custom AI backend)' },
    apiKey:           { type: 'text',     label: 'API Key (auto-configured — override only for a custom AI backend)' },
    systemPrompt:     { type: 'textarea', label: 'System Prompt (optional override — leave blank for default)' },
    starterPrompts:   { type: 'textarea', label: 'Starter Prompts (one per line, shown as clickable chips)' },
    inputPlaceholder: { type: 'text',     label: 'Input Placeholder Text' },
    assistantName:    { type: 'text',     label: 'Assistant Name' },
    assistantAvatar:  { type: 'text',     label: 'Assistant Avatar URL (optional)' },
    accentColor:      { type: 'text',     label: 'Accent Colour (hex)' },
    backgroundColor:  { type: 'text',    label: 'Section Background (hex)' },
    cardColor:        { type: 'text',     label: 'Card Background (hex)' },
    textColor:        { type: 'text',     label: 'Text Colour (hex)' },
    borderRadius:     { type: 'number',   label: 'Border Radius (px)' },
    maxHeight:        { type: 'number',   label: 'Chat Window Height (px)' },
  },
  defaultProps: {
    mode:             'recommender',
    headline:         'Find Your Perfect Product',
    subheadline:      'Tell our AI assistant what you\'re looking for and get personalised recommendations.',
    proxyEndpoint:    '',
    apiKey:           '',
    systemPrompt:     '',
    starterPrompts:   "I'm looking for a gift under R500\nWhat's your best seller this season?\nI need something for a home office\nRecommend something eco-friendly",
    inputPlaceholder: 'Ask me anything…',
    assistantName:    'Shop Assistant',
    assistantAvatar:  '',
    accentColor:      '#2563eb',
    backgroundColor:  '#f8fafc',
    cardColor:        '#ffffff',
    textColor:        '#1e293b',
    borderRadius:     16,
    maxHeight:        400,
  },
  // Fills proxyEndpoint/apiKey the first time this block is dropped onto a page,
  // so a merchant never has to visit AI Settings and paste them in by hand. Only
  // fires when both are still blank — an existing published block (or one whose
  // fields were deliberately overridden) is never touched. See
  // Store_builder_api::ai_storefront_key() for what this resolves to.
  async resolveData(data) {
    if (data.props.proxyEndpoint || data.props.apiKey) {
      return { props: {} }
    }
    try {
      const { key, endpoint } = await stratumApi.getActiveAiStorefrontKey()
      return { props: { apiKey: key, proxyEndpoint: endpoint } }
    } catch {
      return { props: {} }
    }
  },

  render(props) { return <ChatInner {...props} /> },
}
