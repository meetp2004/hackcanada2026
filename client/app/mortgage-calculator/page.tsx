'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

// ── Canadian mortgage helpers ──────────────────────────────────────────────────
function cmhcRate(downPct: number): number {
  if (downPct >= 20) return 0
  if (downPct >= 15) return 0.028
  if (downPct >= 10) return 0.031
  return 0.04 // 5–9.99%
}

function calcMortgage(price: number, down: number, annualRate: number, years: number) {
  const downPct = down / price
  const insRate = cmhcRate(downPct * 100)
  const baseLoan = price - down
  const cmhc = Math.round(baseLoan * insRate)
  const loan = baseLoan + cmhc

  const r = annualRate / 100 / 12
  const n = years * 12

  const monthly =
    r === 0
      ? loan / n
      : (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)

  const totalPaid = monthly * n
  const totalInterest = totalPaid - loan
  const monthlyTax = (price * 0.01) / 12
  const totalMonthly = monthly + monthlyTax
  const gds = (totalMonthly / (105000 / 12)) * 100

  return {
    monthly: Math.round(monthly),
    monthlyTax: Math.round(monthlyTax),
    totalMonthly: Math.round(totalMonthly),
    loan,
    baseLoan,
    cmhc,
    insRate,
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
    downPct: downPct * 100,
    gds: Math.round(gds * 10) / 10,
    n,
  }
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-CA')}`
const fmtPct = (n: number) => `${Math.round(n * 10) / 10}%`

// ── Slider input ──────────────────────────────────────────────────────────────
function SliderRow({
  label, hint, value, min, max, step, onChange, display,
}: {
  label: string; hint?: string; value: number; min: number; max: number
  step: number; onChange: (v: number) => void; display: string
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</label>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#111827', cursor: 'pointer', height: '4px' }}
      />
      {hint && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{hint}</div>}
    </div>
  )
}

// ── Cost bar ──────────────────────────────────────────────────────────────────
function CostBar({ principal, interest, tax }: { principal: number; interest: number; tax: number }) {
  const total = principal + interest + tax
  const pPct = (principal / total) * 100
  const iPct = (interest / total) * 100
  const tPct = (tax / total) * 100
  return (
    <div>
      <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ width: `${pPct}%`, background: '#111827' }} />
        <div style={{ width: `${iPct}%`, background: '#9ca3af' }} />
        <div style={{ width: `${tPct}%`, background: '#e5e7eb' }} />
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Principal', color: '#111827', val: fmt(principal) },
          { label: 'Interest', color: '#9ca3af', val: fmt(interest) },
          { label: 'Property tax', color: '#d1d5db', val: fmt(tax) },
        ].map(({ label, color, val }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GDS Gauge ─────────────────────────────────────────────────────────────────
function GDSGauge({ gds }: { gds: number }) {
  const capped = Math.min(gds, 50)
  const pct = (capped / 50) * 100
  const status =
    gds <= 32 ? { label: 'Healthy', color: '#16a34a' }
    : gds <= 39 ? { label: 'Manageable', color: '#d97706' }
    : { label: 'High', color: '#dc2626' }

  return (
    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>GDS Ratio</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Gross Debt Service · based on $105K income</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: status.color }}>{fmtPct(gds)}</div>
          <div style={{ fontSize: '11px', color: status.color, fontWeight: 500 }}>{status.label}</div>
        </div>
      </div>
      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '99px',
          background: status.color, transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>0%</span>
        <span style={{ fontSize: '10px', color: '#16a34a' }}>32% (healthy)</span>
        <span style={{ fontSize: '10px', color: '#d97706' }}>39%</span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>50%+</span>
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{value}</span>
        {sub && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MortgageCalculatorPage() {
  const [homePrice, setHomePrice] = useState(650000)
  const [downPayment, setDownPayment] = useState(130000)
  const [interestRate, setInterestRate] = useState(4.89)
  const [loanTerm, setLoanTerm] = useState(25)

  // Keep down payment sane when home price changes
  const safeDown = Math.min(downPayment, homePrice * 0.95)

  const m = useMemo(
    () => calcMortgage(homePrice, safeDown, interestRate, loanTerm),
    [homePrice, safeDown, interestRate, loanTerm]
  )

  const minDown = homePrice <= 500000 ? homePrice * 0.05
    : homePrice <= 999999 ? 25000 + (homePrice - 500000) * 0.1
    : homePrice * 0.2

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px 48px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Mortgage Calculator
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Canadian rates · CMHC insurance · GDS ratio · 2026
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>

          {/* ── Inputs ── */}
          <div style={{
            background: '#ffffff', borderRadius: '12px',
            border: '1px solid #e5e7eb', padding: '24px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
              Loan Details
            </div>

            <SliderRow
              label="Home Price"
              value={homePrice} min={100000} max={3000000} step={10000}
              display={fmt(homePrice)}
              onChange={setHomePrice}
            />
            <SliderRow
              label="Down Payment"
              hint={`${fmtPct(m.downPct)} of purchase price · min ${fmt(minDown)}`}
              value={safeDown} min={minDown} max={homePrice * 0.5} step={5000}
              display={fmt(safeDown)}
              onChange={setDownPayment}
            />
            <SliderRow
              label="Interest Rate"
              hint="Current 5-yr fixed average (2026)"
              value={interestRate} min={1} max={10} step={0.05}
              display={fmtPct(interestRate)}
              onChange={setInterestRate}
            />

            {/* Amortization selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Amortization</label>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{loanTerm} yrs</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[10, 15, 20, 25, 30].map(y => (
                  <button
                    key={y}
                    onClick={() => setLoanTerm(y)}
                    style={{
                      flex: 1, padding: '7px 0',
                      background: loanTerm === y ? '#111827' : '#f9fafb',
                      color: loanTerm === y ? 'white' : '#6b7280',
                      border: `1px solid ${loanTerm === y ? '#111827' : '#e5e7eb'}`,
                      borderRadius: '7px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: loanTerm === y ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {loanTerm > 25 && (
                <div style={{ fontSize: '11px', color: '#d97706', marginTop: '5px' }}>
                  30-yr amortization requires 20%+ down payment
                </div>
              )}
            </div>

            {/* CMHC notice */}
            {m.cmhc > 0 && (
              <div style={{
                padding: '12px', background: '#fffbeb', borderRadius: '8px',
                border: '1px solid #fde68a', marginTop: '4px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '2px' }}>
                  CMHC Insurance applies
                </div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  {fmtPct(m.insRate * 100)} of loan = <strong>{fmt(m.cmhc)}</strong> added to mortgage.
                  Put 20%+ down to avoid this.
                </div>
              </div>
            )}
          </div>

          {/* ── Monthly breakdown ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Main monthly number */}
            <div style={{
              background: '#ffffff', borderRadius: '12px',
              border: '1px solid #e5e7eb', padding: '24px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Monthly Payment
              </div>

              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '42px', fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', fontFamily: 'serif' }}>
                  {fmt(m.totalMonthly)}
                </span>
                <span style={{ fontSize: '14px', color: '#9ca3af', marginLeft: '4px' }}>/mo</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
                Mortgage {fmt(m.monthly)} + property tax {fmt(m.monthlyTax)}
              </div>

              <CostBar
                principal={m.monthly - Math.round((m.loan * (interestRate / 100 / 12)))}
                interest={Math.round(m.loan * (interestRate / 100 / 12))}
                tax={m.monthlyTax}
              />
            </div>

            {/* GDS */}
            <GDSGauge gds={m.gds} />

            {/* Summary rows */}
            <div style={{
              background: '#ffffff', borderRadius: '12px',
              border: '1px solid #e5e7eb', padding: '20px 24px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Full Picture
              </div>
              <Row label="Purchase price"    value={fmt(homePrice)} />
              <Row label="Down payment"      value={fmt(safeDown)}   sub={`${fmtPct(m.downPct)} down`} />
              <Row label="Mortgage amount"   value={fmt(m.loan)}     sub={m.cmhc > 0 ? `includes ${fmt(m.cmhc)} CMHC` : undefined} />
              <Row label="Total paid"        value={fmt(m.totalPaid)} sub={`over ${loanTerm} years`} />
              <Row label="Total interest"    value={fmt(m.totalInterest)} />
              <Row label="Interest ratio"    value={fmtPct((m.totalInterest / m.totalPaid) * 100)} sub="of total paid" />
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/mapview"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#111827', color: 'white',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', transition: 'opacity 0.15s',
            }}
          >
            Browse properties
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
