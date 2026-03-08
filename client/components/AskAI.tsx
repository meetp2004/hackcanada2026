'use client'

import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'

interface Property {
  address: {
    street_number: string
    street: string
    city: string
    state_code: string
    postal_code: string
  }
  list_price?: number
  description?: {
    beds?: number
    baths?: number
    sqft_living?: number
    year_built?: number
  }
  agent?: { name: string; office: string }
}

const fmt = (n?: number) =>
  n != null ? `$${n.toLocaleString('en-CA')}` : 'Price N/A'

export default function AskAI({
  user,
  property,
  onClose,
}: {
  user: User | null
  property: Property | null
  onClose: () => void
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const systemPrompt = property
    ? `You are MapleEstate AI, a helpful Canadian real estate assistant.
The user is viewing: ${property.address.street_number} ${property.address.street}, ${property.address.city}, ${property.address.state_code} ${property.address.postal_code}.
Price: ${fmt(property.list_price)}. Beds: ${property.description?.beds}, Baths: ${property.description?.baths}, Sqft: ${property.description?.sqft_living}, Year Built: ${property.description?.year_built}.
Agent: ${property.agent?.name} at ${property.agent?.office}.
Provide helpful insights about this property, neighbourhood, market trends, and answer questions. Be concise and helpful.`
    : `You are MapleEstate AI, a helpful Canadian real estate assistant. Help users explore properties across Canada, understand market trends, and make informed decisions. Be concise and helpful.`

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get a response."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'absolute', bottom: '16px', right: '16px',
      width: '360px', height: '480px',
      background: '#ffffff', borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Ask AI</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
            {property ? property.address.city : 'Canada-wide insights'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: '5px',
            width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '4px' }}>
              {property ? 'Ask about this property' : 'Ask about any Canadian property'}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              Market trends · Neighbourhood · Investment
            </div>
            {!user && (
              <div style={{
                marginTop: '16px', padding: '10px 14px',
                background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb',
                fontSize: '12px', color: '#6b7280',
              }}>
                Sign in to save conversations
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '8px 12px', borderRadius: '10px',
              fontSize: '13px', lineHeight: '1.5',
              background: m.role === 'user' ? '#111827' : '#f3f4f6',
              color: m.role === 'user' ? 'white' : '#374151',
              borderBottomRightRadius: m.role === 'user' ? '2px' : '10px',
              borderBottomLeftRadius: m.role === 'user' ? '10px' : '2px',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '8px 12px', borderRadius: '10px',
              background: '#f3f4f6', borderBottomLeftRadius: '2px',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#d1d5db',
                  animation: `fadeUp 0.8s ease ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about this property…"
          style={{
            flex: 1, padding: '8px 12px', background: '#f9fafb',
            border: '1px solid #e5e7eb', borderRadius: '7px',
            fontSize: '13px', color: '#374151', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 12px', background: '#111827', color: 'white',
            border: 'none', borderRadius: '7px', cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1, transition: 'opacity 0.2s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
