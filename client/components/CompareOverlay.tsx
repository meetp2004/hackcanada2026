'use client'

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Property {
  property_id: string
  list_price?: number
  photo?: string
  address: {
    street_number: string
    street: string
    city: string
    state_code: string
    postal_code: string
  }
  description?: {
    beds?: number
    baths?: number
    sqft_living?: number
    year_built?: number
    property_type?: string
  }
}

interface Insights {
  affordability: {
    propertyA_monthly: number
    propertyB_monthly: number
    propertyA_gds: number
    propertyB_gds: number
    relative_diff_pct: number
    winner: 'A' | 'B'
    summary: string
  }
  occupancy: {
    propertyA_ideal: number
    propertyB_ideal: number
    propertyA_label: string
    propertyB_label: string
  }
  winners: {
    price: 'A' | 'B' | 'tie'
    sqft: 'A' | 'B' | 'tie'
    beds: 'A' | 'B' | 'tie'
    baths: 'A' | 'B' | 'tie'
    affordability: 'A' | 'B' | 'tie'
    value_per_sqft: 'A' | 'B' | 'tie'
  }
  overall_recommendation: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n?: number) => (n != null ? `$${n.toLocaleString('en-CA')}` : 'N/A')
const fmtM = (n?: number) => (n != null ? `$${Math.round(n).toLocaleString()}/mo` : 'N/A')

// ── Client-side fallback calculator ───────────────────────────────────────────
function calcFallback(pA: Property, pB: Property): Insights {
  const monthly = (price?: number) => {
    if (!price) return 0
    const down = price >= 500000 ? price * 0.2 : price * 0.05
    const loan = price - down
    const r = 0.0489 / 12
    const n = 300
    return Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) + (price * 0.01) / 12)
  }
  const mA = monthly(pA.list_price)
  const mB = monthly(pB.list_price)
  const inc = 105000 / 12
  const gdsA = Math.round((mA / inc) * 1000) / 10
  const gdsB = Math.round((mB / inc) * 1000) / 10
  const affWin: 'A' | 'B' = gdsA <= gdsB ? 'A' : 'B'
  const diffPct = Math.abs(Math.round(((Math.max(gdsA, gdsB) - Math.min(gdsA, gdsB)) / Math.max(gdsA, gdsB)) * 100))

  const cmp = (a?: number, b?: number, lowerBetter = false): 'A' | 'B' | 'tie' => {
    if (!a && !b) return 'tie'
    if (!a) return 'B'
    if (!b) return 'A'
    if (a === b) return 'tie'
    return lowerBetter ? (a < b ? 'A' : 'B') : (a > b ? 'A' : 'B')
  }

  const bedsA = pA.description?.beds ?? 0
  const bedsB = pB.description?.beds ?? 0
  const ppsA = pA.list_price && pA.description?.sqft_living ? pA.list_price / pA.description.sqft_living : undefined
  const ppsB = pB.list_price && pB.description?.sqft_living ? pB.list_price / pB.description.sqft_living : undefined

  return {
    affordability: {
      propertyA_monthly: mA, propertyB_monthly: mB,
      propertyA_gds: gdsA, propertyB_gds: gdsB,
      relative_diff_pct: diffPct, winner: affWin,
      summary: `Property ${affWin} has lower monthly carrying costs.`,
    },
    occupancy: {
      propertyA_ideal: bedsA + 1, propertyB_ideal: bedsB + 1,
      propertyA_label: bedsA > 0 ? `Ideal for ${bedsA === 1 ? 'a couple' : `a family of ${bedsA + 1}`}` : 'N/A',
      propertyB_label: bedsB > 0 ? `Ideal for ${bedsB === 1 ? 'a couple' : `a family of ${bedsB + 1}`}` : 'N/A',
    },
    winners: {
      price: cmp(pA.list_price, pB.list_price, true),
      sqft: cmp(pA.description?.sqft_living, pB.description?.sqft_living),
      beds: cmp(pA.description?.beds, pB.description?.beds),
      baths: cmp(pA.description?.baths, pB.description?.baths),
      affordability: affWin,
      value_per_sqft: cmp(ppsA, ppsB, true),
    },
    overall_recommendation: `Property ${affWin} offers better affordability based on estimated carrying costs relative to median Canadian income. Consider location, condition, and long-term value when making your decision.`,
  }
}

// ── Compare Overlay ────────────────────────────────────────────────────────────
export default function CompareOverlay({
  propertyA,
  propertyB,
  onClose,
}: {
  propertyA: Property
  propertyB: Property
  onClose: () => void
}) {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiNote, setAiNote] = useState('')

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!key) {
      setInsights(calcFallback(propertyA, propertyB))
      setAiNote('Gemini API key not set — showing calculated comparison.')
      setLoading(false)
      return
    }
    fetchGemini(key)
  }, [])

  const fetchGemini = async (key: string) => {
    const prompt = `You are a Canadian real estate analyst. Compare these two properties and return a precise JSON analysis.

Property A: ${propertyA.address.street_number} ${propertyA.address.street}, ${propertyA.address.city}, ${propertyA.address.state_code}
- Price: ${propertyA.list_price ? `$${propertyA.list_price.toLocaleString()} CAD` : 'Unknown'}
- Beds: ${propertyA.description?.beds ?? 'N/A'}, Baths: ${propertyA.description?.baths ?? 'N/A'}
- Sqft: ${propertyA.description?.sqft_living ?? 'N/A'}, Year: ${propertyA.description?.year_built ?? 'N/A'}
- Type: ${propertyA.description?.property_type ?? 'N/A'}

Property B: ${propertyB.address.street_number} ${propertyB.address.street}, ${propertyB.address.city}, ${propertyB.address.state_code}
- Price: ${propertyB.list_price ? `$${propertyB.list_price.toLocaleString()} CAD` : 'Unknown'}
- Beds: ${propertyB.description?.beds ?? 'N/A'}, Baths: ${propertyB.description?.baths ?? 'N/A'}
- Sqft: ${propertyB.description?.sqft_living ?? 'N/A'}, Year: ${propertyB.description?.year_built ?? 'N/A'}
- Type: ${propertyB.description?.property_type ?? 'N/A'}

Calculation rules:
- Mortgage: 4.89% fixed, 25-year amortization. Down payment: 5% if price < $500K CAD, 20% if >= $500K CAD.
- Property tax: 1% of price per year (monthly = price × 0.01 / 12).
- Monthly carrying cost = mortgage payment + monthly property tax.
- City median annual household income (CAD): Toronto=104000, Vancouver=98000, Calgary=116000, Ottawa=115000, Edmonton=110000, Waterloo=122400, Kitchener=122400, Hamilton=95000, default=105000.
- GDS = (monthly carrying cost / (city_income / 12)) × 100, as a decimal percentage (e.g., 32.5).
- Canadian National Occupancy Standard: primary bedroom = 2 people, each extra bedroom = 1 person, +1 for living area.
- "winner" for price/affordability/value_per_sqft = lower is better. For sqft/beds/baths = higher is better.

Return ONLY valid JSON — no markdown, no explanation:
{
  "affordability": {
    "propertyA_monthly": <integer>,
    "propertyB_monthly": <integer>,
    "propertyA_gds": <decimal e.g. 32.5>,
    "propertyB_gds": <decimal>,
    "relative_diff_pct": <positive integer>,
    "winner": "A" or "B",
    "summary": "<1 sentence>"
  },
  "occupancy": {
    "propertyA_ideal": <integer>,
    "propertyB_ideal": <integer>,
    "propertyA_label": "<e.g. Ideal for a family of 4>",
    "propertyB_label": "<e.g. Perfect for a couple>"
  },
  "winners": {
    "price": "A"|"B"|"tie",
    "sqft": "A"|"B"|"tie",
    "beds": "A"|"B"|"tie",
    "baths": "A"|"B"|"tie",
    "affordability": "A"|"B"|"tie",
    "value_per_sqft": "A"|"B"|"tie"
  },
  "overall_recommendation": "<2–3 sentences with a clear recommendation>"
}`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        }
      )
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('empty')
      setInsights(JSON.parse(text))
    } catch {
      setInsights(calcFallback(propertyA, propertyB))
      setAiNote('Gemini unavailable — showing calculated comparison.')
    } finally {
      setLoading(false)
    }
  }

  // ── Comparison rows ──────────────────────────────────────────────────────────
  const ppsA =
    propertyA.list_price && propertyA.description?.sqft_living
      ? Math.round(propertyA.list_price / propertyA.description.sqft_living)
      : null
  const ppsB =
    propertyB.list_price && propertyB.description?.sqft_living
      ? Math.round(propertyB.list_price / propertyB.description.sqft_living)
      : null

  const rows: Array<{
    label: string
    valA: string | number
    valB: string | number
    winner?: 'A' | 'B' | 'tie'
    aiOnly?: boolean
  }> = [
    {
      label: 'List Price',
      valA: fmt(propertyA.list_price),
      valB: fmt(propertyB.list_price),
      winner: insights?.winners.price,
    },
    {
      label: 'Bedrooms',
      valA: propertyA.description?.beds ?? 'N/A',
      valB: propertyB.description?.beds ?? 'N/A',
      winner: insights?.winners.beds,
    },
    {
      label: 'Bathrooms',
      valA: propertyA.description?.baths ?? 'N/A',
      valB: propertyB.description?.baths ?? 'N/A',
      winner: insights?.winners.baths,
    },
    {
      label: 'Living Area',
      valA: propertyA.description?.sqft_living
        ? `${propertyA.description.sqft_living.toLocaleString()} ft²`
        : 'N/A',
      valB: propertyB.description?.sqft_living
        ? `${propertyB.description.sqft_living.toLocaleString()} ft²`
        : 'N/A',
      winner: insights?.winners.sqft,
    },
    {
      label: 'Price / ft²',
      valA: ppsA ? `$${ppsA}` : 'N/A',
      valB: ppsB ? `$${ppsB}` : 'N/A',
      winner: insights?.winners.value_per_sqft,
    },
    {
      label: 'Year Built',
      valA: propertyA.description?.year_built ?? 'N/A',
      valB: propertyB.description?.year_built ?? 'N/A',
    },
    {
      label: 'Type',
      valA: propertyA.description?.property_type?.replace(/_/g, ' ') ?? 'N/A',
      valB: propertyB.description?.property_type?.replace(/_/g, ' ') ?? 'N/A',
    },
    {
      label: 'Monthly Cost',
      valA: insights ? fmtM(insights.affordability.propertyA_monthly) : '…',
      valB: insights ? fmtM(insights.affordability.propertyB_monthly) : '…',
      winner: insights?.winners.affordability,
      aiOnly: true,
    },
    {
      label: 'GDS Ratio',
      valA: insights ? `${insights.affordability.propertyA_gds}%` : '…',
      valB: insights ? `${insights.affordability.propertyB_gds}%` : '…',
      winner: insights?.winners.affordability,
      aiOnly: true,
    },
    {
      label: 'Occupancy',
      valA: insights ? insights.occupancy.propertyA_label : '…',
      valB: insights ? insights.occupancy.propertyB_label : '…',
      aiOnly: true,
    },
  ]

  const winsA = Object.values(insights?.winners ?? {}).filter(v => v === 'A').length
  const winsB = Object.values(insights?.winners ?? {}).filter(v => v === 'B').length

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '860px', maxHeight: '92vh',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'slideUp 0.25s ease both',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            padding: '16px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                Property Comparison
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
                AI-powered analysis · Canadian mortgage rates 2026
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6b7280',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ overflowY: 'auto', flex: 1 }}>

            {/* Property header columns — sticky */}
            <div style={{
              display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
              position: 'sticky', top: 0, zIndex: 10,
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Category
                </span>
              </div>

              {([
                { p: propertyA, side: 'A', wins: winsA },
                { p: propertyB, side: 'B', wins: winsB },
              ] as const).map(({ p, side, wins }) => (
                <div key={side} style={{
                  padding: '14px 16px',
                  borderLeft: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      background: '#111827', color: 'white',
                      fontSize: '10px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{side}</span>
                    {!loading && insights && wins > 0 && (
                      <span style={{
                        fontSize: '10px', color: '#6b7280', fontWeight: 600,
                      }}>
                        {wins} win{wins > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                    {p.address.street_number} {p.address.street}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                    {p.address.city}, {p.address.state_code}
                  </div>
                  {p.list_price && (
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                      {fmt(p.list_price)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Comparison rows ── */}
            {rows.map((row, i) => {
              const isAiRow = row.aiOnly
              return (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr 1fr',
                    background: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  {/* Row label */}
                  <div style={{
                    padding: '12px 12px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    borderRight: '1px solid #f3f4f6',
                  }}>
                    {isAiRow && (
                      <span style={{
                        fontSize: '8px', fontWeight: 700, color: '#9ca3af',
                        border: '1px solid #e5e7eb',
                        padding: '1px 4px', borderRadius: '3px',
                        flexShrink: 0, letterSpacing: '0.04em',
                      }}>AI</span>
                    )}
                    <span style={{
                      fontSize: '11px', fontWeight: 500, color: '#6b7280',
                    }}>
                      {row.label}
                    </span>
                  </div>

                  {/* A and B cells */}
                  {(['A', 'B'] as const).map(side => {
                    const val = side === 'A' ? row.valA : row.valB
                    const isWinner = row.winner === side
                    const isTie = row.winner === 'tie'
                    const isLoading = isAiRow && loading

                    return (
                      <div
                        key={side}
                        style={{
                          padding: '12px 16px',
                          borderLeft: '1px solid #f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: isWinner ? '#f0fdf4' : 'transparent',
                        }}
                      >
                        {isLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '10px', height: '10px', borderRadius: '50%',
                              border: '1.5px solid #d1d5db', borderTopColor: '#6b7280',
                              animation: 'spin 0.7s linear infinite',
                            }} />
                            <span style={{ fontSize: '11px', color: '#d1d5db' }}>loading</span>
                          </div>
                        ) : (
                          <>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: isWinner ? 600 : 400,
                              color: isWinner ? '#166534' : '#374151',
                            }}>
                              {String(val)}
                            </span>
                            {row.winner && !isTie && isWinner && (
                              <span style={{
                                fontSize: '10px', fontWeight: 500,
                                color: '#166534',
                                flexShrink: 0,
                              }}>better</span>
                            )}
                            {row.winner && isTie && (
                              <span style={{ fontSize: '10px', color: '#d1d5db', flexShrink: 0 }}>tie</span>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* ── AI Insights ── */}
            <div style={{ padding: '20px 20px 24px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              }}>
                Analysis
              </div>

              {loading ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '16px', borderRadius: '8px',
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid #e5e7eb', borderTopColor: '#6b7280',
                    animation: 'spin 0.8s linear infinite', flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Analyzing with Gemini AI</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                      Calculating mortgage rates, GDS ratios & occupancy
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiNote && (
                    <div style={{
                      fontSize: '12px', color: '#6b7280',
                      background: '#f9fafb', border: '1px solid #e5e7eb',
                      padding: '8px 12px', borderRadius: '6px',
                    }}>
                      {aiNote}
                    </div>
                  )}

                  {/* Affordability section */}
                  {insights?.affordability && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, color: '#6b7280',
                        marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Affordability
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65, marginBottom: '14px' }}>
                        {insights.affordability.summary}
                        {insights.affordability.relative_diff_pct > 0 && (
                          <>
                            {' '}Property{' '}
                            <strong>{insights.affordability.winner}</strong>{' '}
                            is{' '}
                            <strong>{insights.affordability.relative_diff_pct}% more affordable</strong>{' '}
                            based on GDS ratio.
                          </>
                        )}
                      </div>
                      {/* GDS meters */}
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {([
                          { label: 'A', gds: insights.affordability.propertyA_gds },
                          { label: 'B', gds: insights.affordability.propertyB_gds },
                        ] as const).map(item => (
                          <div key={item.label} style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '11px', color: '#6b7280',
                              marginBottom: '4px', display: 'flex', justifyContent: 'space-between',
                            }}>
                              <span>Property {item.label} GDS</span>
                              <span style={{ fontWeight: 600, color: item.gds <= 32 ? '#166534' : item.gds <= 39 ? '#92400e' : '#991b1b' }}>
                                {item.gds}%
                              </span>
                            </div>
                            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: '99px',
                                width: `${Math.min(item.gds, 60) / 60 * 100}%`,
                                background: item.gds <= 32 ? '#4ade80' : item.gds <= 39 ? '#fbbf24' : '#f87171',
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                              {item.gds <= 32 ? 'Healthy' : item.gds <= 39 ? 'Manageable' : 'High'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Occupancy section */}
                  {insights?.occupancy && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, color: '#6b7280',
                        marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Occupancy (CNOS)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {([
                          { label: 'A', data: insights.occupancy.propertyA_label, n: insights.occupancy.propertyA_ideal },
                          { label: 'B', data: insights.occupancy.propertyB_label, n: insights.occupancy.propertyB_ideal },
                        ] as const).map(item => (
                          <div key={item.label} style={{
                            padding: '10px 12px', borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                          }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                              Property {item.label}
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                              {item.data}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              up to {item.n} occupants
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {insights?.overall_recommendation && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, color: '#6b7280',
                        marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Recommendation
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
                        {insights.overall_recommendation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#f9fafb', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>
              Gemini AI · Canadian mortgage rates 2026 · CNOS
            </span>
            <button
              onClick={onClose}
              style={{
                padding: '7px 18px', background: '#111827', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
