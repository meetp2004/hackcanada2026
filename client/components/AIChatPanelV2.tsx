'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import {
    buildVoiceSettings,
    buildPersonaPrompt,
    updatePersona,
    simulatePersonaShift,
    type PersonaWeights,
    PERSONA_META,
} from '@/lib/elevenlabs'
import { askAI } from '@/lib/geminiAPI'

// ── PERSONA ORB COMPONENT ──────────────────────────────────────────────────
export function PersonaOrb({ w, size = 100, glow = true }: { w: PersonaWeights; size?: number; glow?: boolean }) {
    const total = w.family + w.finance + w.community + w.investment || 100

    const familyEnd = (w.family / total) * 360
    const financeEnd = familyEnd + (w.finance / total) * 360
    const communityEnd = financeEnd + (w.community / total) * 360

    const gradient = `conic-gradient(
    ${PERSONA_META.family.color} 0deg ${familyEnd}deg, 
    ${PERSONA_META.finance.color} ${familyEnd}deg ${financeEnd}deg, 
    ${PERSONA_META.community.color} ${financeEnd}deg ${communityEnd}deg, 
    ${PERSONA_META.investment.color} ${communityEnd}deg 360deg
  )`

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {glow && (
                <div
                    style={{
                        position: 'absolute',
                        inset: -size * 0.2,
                        background: gradient,
                        borderRadius: '50%',
                        filter: 'blur(15px)',
                        opacity: 0.4,
                    }}
                />
            )}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: gradient,
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.4), 0 4px 15px rgba(0,0,0,0.15)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    width: '30%',
                    height: '30%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    filter: 'blur(4px)',
                    zIndex: 2,
                }}
            />
        </div>
    )
}

// ── AI CHAT PANEL WITH AUDIO ────────────────────────────────────────────────
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

export function AIChatPanel({
    user,
    property,
    onClose,
    currentPersona,
    onPersonaUpdate,
}: {
    user: User | null
    property: Property | null
    onClose: () => void
    currentPersona: PersonaWeights
    onPersonaUpdate: (w: PersonaWeights) => void
}) {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [voiceOn, setVoiceOn] = useState(true)
    const [speaking, setSpeaking] = useState(false)
    const [language, setLanguage] = useState('en')
    const [showLang, setShowLang] = useState(false)

    const bottomRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const speak = useCallback(
        async (text: string, weights: PersonaWeights, lang: string) => {
            if (!voiceOn) return
            setSpeaking(true)
            try {
                const res = await fetch('/api/speak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: buildPersonaPrompt(weights, lang) + text,
                        voiceSettings: buildVoiceSettings(weights),
                        language: lang,
                    }),
                })
                if (!res.ok) throw new Error('Voice API error')
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const audio = new Audio(url)
                audioRef.current = audio
                audio.onended = () => {
                    setSpeaking(false)
                    URL.revokeObjectURL(url)
                }
                audio.play()
            } catch (e) {
                console.error(e)
                setSpeaking(false)
            }
        },
        [voiceOn]
    )

    const send = async () => {
        const text = input.trim()
        if (!text || loading) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: text }])
        setLoading(true)

        try {
            // Detect persona shift from user input
            const shift = simulatePersonaShift(text)
            const updated = updatePersona(currentPersona, shift)
            onPersonaUpdate(updated)

            // Call real Gemini API
            const result = await askAI({
                message: text,
                personaWeights: updated,
                conversationHistory: messages,
            })

            if (result.success && result.response) {
                const aiResponse = result.response
                setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
                if (voiceOn) {
                    await speak(aiResponse, updated, language)
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response from AI. Please try again.' }])
            }
        } catch (e) {
            console.error('Error:', e)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check if the backend server is running at http://localhost:5000' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '380px',
                maxHeight: '620px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'scaleIn 0.3s ease-out forwards',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PersonaOrb w={currentPersona} size={28} glow={false} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>MapleEstate AI</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Voice Toggle Button */}
                    <button
                        onClick={() => setVoiceOn(!voiceOn)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            color: speaking ? '#10B981' : voiceOn ? '#374151' : '#d1d5db',
                            transition: 'all 0.2s',
                            opacity: speaking ? 1 : 0.7,
                        }}
                        title={voiceOn ? 'Voice is on' : 'Voice is off'}
                    >
                        {speaking ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        ) : voiceOn ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="1" y1="1" x2="23" y2="23" />
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                <path d="M17 16.95A7 7 0 0 1 5 12m14 0a7 7 0 0 1-13.46 3.15" />
                            </svg>
                        )}
                    </button>

                    {/* Language Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowLang(!showLang)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#6b7280',
                                padding: '4px 6px',
                            }}
                        >
                            {language.toUpperCase()}
                        </button>
                        {showLang && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '28px',
                                    right: 0,
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    zIndex: 1000,
                                    minWidth: '100px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                            >
                                {['en', 'es', 'fr', 'de'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setLanguage(lang)
                                            setShowLang(false)
                                        }}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: 'none',
                                            background: language === lang ? '#f3f4f6' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            textAlign: 'left',
                                            color: '#374151',
                                        }}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            background: m.role === 'user' ? '#22c55e' : '#f3f4f6',
                            color: m.role === 'user' ? '#ffffff' : '#1f2937',
                            wordWrap: 'break-word',
                        }}
                    >
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: '#9ca3af', fontSize: '12px' }}>
                        AI is thinking...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div
                style={{
                    padding: '12px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '8px',
                }}
            >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && send()}
                    placeholder="Ask about schools, ROI, community..."
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        outline: 'none',
                        fontSize: '13px',
                        color: '#1f2937',
                    }}
                    disabled={loading}
                />
                <button
                    onClick={send}
                    disabled={loading}
                    style={{
                        padding: '8px 15px',
                        background: loading ? '#d1d5db' : '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    )
}
