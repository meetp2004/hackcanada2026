'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PersonaWeights {
  family: number      // 0–100
  finance: number
  community: number
  investment: number
}

const PERSONA_COLORS = {
  family:     { color: '#FACC15', label: 'Family' },
  finance:    { color: '#EF4444', label: 'Finance' },
  community:  { color: '#22C55E', label: 'Community' },
  investment: { color: '#3B82F6', label: 'Investment' },
} as const

const VERDICTS: Record<string, { label: string; desc: string }> = {
  YES:   { label: 'Great fit',   desc: 'This property aligns well with your priorities.' },
  MAYBE: { label: 'Possible',    desc: 'Some trade-offs — worth exploring further.' },
  NO:    { label: 'Not ideal',   desc: 'This property doesn\'t match your current goals.' },
}

// ── Orb ───────────────────────────────────────────────────────────────────────
function Orb({ w, size = 24 }: { w: PersonaWeights; size?: number }) {
  const total = (w.family + w.finance + w.community + w.investment) || 1
  const familyEnd     = (w.family     / total) * 360
  const financeEnd    = familyEnd  + (w.finance    / total) * 360
  const communityEnd  = financeEnd + (w.community  / total) * 360

  const gradient = `conic-gradient(
    #FACC15 0deg ${familyEnd}deg,
    #EF4444 ${familyEnd}deg ${financeEnd}deg,
    #22C55E ${financeEnd}deg ${communityEnd}deg,
    #3B82F6 ${communityEnd}deg 360deg
  )`

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient, flexShrink: 0,
      boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.25)',
    }} />
  )
}

// ── Persona Button + Dropdown ─────────────────────────────────────────────────
export default function PersonaButton({
  onAdjustWithAI,
}: {
  onAdjustWithAI?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Example weights — will be driven by AI/oracle later
  const [weights] = useState<PersonaWeights>({
    family: 60, finance: 15, community: 20, investment: 5,
  })
  const verdict = 'MAYBE'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const topPersona = (Object.keys(weights) as (keyof PersonaWeights)[])
    .reduce((a, b) => weights[a] >= weights[b] ? a : b)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '5px 12px 5px 7px',
          background: open ? '#f3f4f6' : 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: '99px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, color: '#374151',
          transition: 'background 0.15s',
        }}
      >
        <Orb w={weights} size={22} />
        Persona
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '260px', background: '#ffffff',
          border: '1px solid #e5e7eb', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Orb section */}
          <div style={{
            padding: '20px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', borderBottom: '1px solid #f3f4f6',
          }}>
            {/* Large orb with glow */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div style={{
                position: 'absolute', inset: -8,
                background: `conic-gradient(#FACC15 0deg ${(weights.family / 100) * 360}deg, #EF4444 ${(weights.family / 100) * 360}deg ${((weights.family + weights.finance) / 100) * 360}deg, #22C55E ${((weights.family + weights.finance) / 100) * 360}deg ${((weights.family + weights.finance + weights.community) / 100) * 360}deg, #3B82F6 ${((weights.family + weights.finance + weights.community) / 100) * 360}deg 360deg)`,
                borderRadius: '50%', filter: 'blur(10px)', opacity: 0.3,
              }} />
              <Orb w={weights} size={80} />
            </div>

            {/* Verdict */}
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {VERDICTS[verdict]?.label ?? verdict}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
              {VERDICTS[verdict]?.desc}
            </div>
          </div>

          {/* Weight breakdown */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Your priorities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {(Object.keys(PERSONA_COLORS) as (keyof typeof PERSONA_COLORS)[]).map(key => {
                const { color, label } = PERSONA_COLORS[key]
                const pct = weights[key]
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12px', color: '#374151' }}>{label}</div>
                    <div style={{ width: '80px', height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', width: '28px', textAlign: 'right' }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
              Strongest priority: <span style={{ color: PERSONA_COLORS[topPersona].color, fontWeight: 600 }}>{PERSONA_COLORS[topPersona].label}</span>
            </div>
            <button
              onClick={() => { setOpen(false); onAdjustWithAI?.() }}
              style={{
                width: '100%', padding: '9px',
                background: '#111827', color: 'white',
                border: 'none', borderRadius: '7px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Adjust with AI
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
