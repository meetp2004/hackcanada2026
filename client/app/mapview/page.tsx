'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import CompareOverlay from '@/components/CompareOverlay'
import { AIChatPanel } from '@/components/AIChatPanelV2'
import PersonaButton from '@/components/PersonaButton'
import { HARDCODED_PERSONA, type PersonaWeights } from '@/lib/elevenlabs'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Property {
  property_id: string
  list_price?: number
  listing_id: string
  status: string
  photo?: string
  open_house?: string | null
  address: {
    street_number: string
    street: string
    unit?: string | null
    city: string
    state_code: string
    postal_code: string
    latitude: number
    longitude: number
  }
  description?: {
    beds?: number
    baths?: number
    sqft_living?: number
    lot_size?: number
    year_built?: number
    property_type?: string
  }
  agent?: { name: string; office: string }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n?: number) =>
  n != null ? `$${n.toLocaleString('en-CA')}` : 'Price N/A'

const fmtSqft = (n?: number) =>
  n != null ? `${n.toLocaleString()} sq ft` : null


// ── Property Card ──────────────────────────────────────────────────────────────
function PropertyCard({ p, selected, onClick, compareMode, inCompare, onCompareToggle }: {
  p: Property
  selected: boolean
  onClick: () => void
  compareMode?: boolean
  inCompare?: boolean
  onCompareToggle?: () => void
}) {
  const borderColor = inCompare ? '#1e6b4a' : selected ? 'var(--accent)' : 'var(--border)'
  const bg = inCompare ? 'rgba(232,245,239,0.6)' : selected ? 'var(--accent-light)' : 'var(--bg-card)'
  const shadow = inCompare
    ? '0 0 0 3px rgba(30,107,74,0.18)'
    : selected ? '0 0 0 3px rgba(200,67,10,0.12)' : 'var(--shadow)'

  return (
    <div
      onClick={compareMode ? onCompareToggle : onClick}
      style={{
        background: bg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px', padding: '0', cursor: 'pointer',
        transition: 'all 0.2s', overflow: 'hidden',
        boxShadow: shadow, position: 'relative',
      }}
    >
      {/* Compare checkbox badge */}
      {compareMode && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px', zIndex: 10,
          width: '22px', height: '22px', borderRadius: '50%',
          background: inCompare ? '#1e6b4a' : 'rgba(255,255,255,0.9)',
          border: `2px solid ${inCompare ? '#1e6b4a' : '#d1d5db'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
        }}>
          {inCompare && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {p.photo && (
        <div style={{ height: '140px', overflow: 'hidden' }}>
          <img
            src={p.photo}
            alt={p.address.street}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'DM Serif Display, serif', fontSize: '18px',
            color: 'var(--accent)', lineHeight: 1
          }}>
            {fmt(p.list_price)}
          </span>
          {p.open_house && !compareMode && (
            <span style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
              background: '#FEF3C7', color: '#92400E', padding: '2px 7px',
              borderRadius: '99px', border: '1px solid #FDE68A'
            }}>OPEN HOUSE</span>
          )}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
          {p.address.street_number} {p.address.street}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          {p.address.city}, {p.address.state_code}
        </div>
        {p.description && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {p.description.beds && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BedIcon /> {p.description.beds} bd
              </span>
            )}
            {p.description.baths && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BathIcon /> {p.description.baths} ba
              </span>
            )}
            {p.description.sqft_living && (
              <span>{fmtSqft(p.description.sqft_living)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const BedIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4M2 9h20M2 9v10M22 9v10M2 19h20" />
  </svg>
)
const BathIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h16M4 12a2 2 0 01-2-2V6a2 2 0 012-2h4v8M20 12v2a6 6 0 01-6 6H10a6 6 0 01-6-6v-2" />
  </svg>
)

// ── CSS Variables and Animations ──────────────────────────────────────────────
const mapViewStyles = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.3s ease both; }
  .animate-scaleIn { animation: scaleIn 0.3s ease both; }
  .animate-fadeUp { animation: fadeUp 0.4s ease both; }
`;

// ── Main Home Component ────────────────────────────────────────────────────────
export default function Home() {
  const supabase = createClient()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<Property | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<PersonaWeights>(HARDCODED_PERSONA)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cityFilter, setCityFilter] = useState('All')
  const [maxPrice, setMaxPrice] = useState<number>(2500000)
  const [minBeds, setMinBeds] = useState<number>(0)
  const [minBaths, setMinBaths] = useState<number>(0)
  const [propertyType, setPropertyType] = useState<string>('All')
  const [mapLoaded, setMapLoaded] = useState(false)
  // ── Compare mode ─────────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState<Property[]>([])
  const [showCompare, setShowCompare] = useState(false)

  // ── Auth state (read-only — Navbar owns sign-in/out) ─────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load listings ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/listings.json')
      .then(r => r.json())
      .then(d => setProperties(d.data?.properties ?? []))
      .catch(() => { })
  }, [])

  // ── Derived data ─────────────────────────────────────────────────────────────
  // Extract city names from street field (e.g., "Waterford Dr Toronto" -> "Toronto")
  const extractCity = (street: string): string => {
    const parts = street.trim().split(/\s+/)
    return parts[parts.length - 1] || 'Unknown'
  }

  const cities = ['All', ...Array.from(new Set(properties.map(p => extractCity(p.address.street)))).sort()]

  const filtered = properties.filter(p => {
    const cityMatch = cityFilter === 'All' || extractCity(p.address.street) === cityFilter
    const priceMatch = !p.list_price || p.list_price <= maxPrice
    const bedsMatch = !p.description?.beds || p.description.beds >= minBeds
    const bathsMatch = !p.description?.baths || p.description.baths >= minBaths
    const typeMatch = propertyType === 'All' || p.description?.property_type === propertyType
    return cityMatch && priceMatch && bedsMatch && bathsMatch && typeMatch
  })

  // ── Map init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setMapLoaded(true) // show fallback
      return
    }
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-96.5, 56.1],
      zoom: 3.5,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('load', () => { setMapLoaded(true) })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Update markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filtered.forEach(p => {
      const { latitude, longitude } = p.address
      if (!latitude || !longitude) return

      const el = document.createElement('div')
      el.style.cssText = `
        background: ${selected?.property_id === p.property_id ? '#C8430A' : '#FAFAF8'};
        color: ${selected?.property_id === p.property_id ? 'white' : '#C8430A'};
        border: 2px solid #C8430A;
        border-radius: 99px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 700;
        font-family: DM Sans, sans-serif;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(200,67,10,0.25);
        transition: all 0.15s;
      `
      el.textContent = p.list_price ? `$${Math.round(p.list_price / 1000)}K` : '—'
      el.addEventListener('mouseenter', () => {
        if (selected?.property_id !== p.property_id) {
          el.style.background = '#FEF0EB'
        }
      })
      el.addEventListener('mouseleave', () => {
        if (selected?.property_id !== p.property_id) {
          el.style.background = '#FAFAF8'
        }
      })
      el.addEventListener('click', () => selectProperty(p))

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current!)
      markersRef.current.push(marker)
    })
  }, [filtered, mapLoaded, selected])

  // ── Select property ──────────────────────────────────────────────────────────
  const selectProperty = useCallback((p: Property) => {
    setSelected(p)
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [p.address.longitude, p.address.latitude],
        zoom: 14, duration: 1200, essential: true
      })
    }
  }, [])

  const toggleCompare = (p: Property) => {
    setCompareList(prev => {
      if (prev.find(x => x.property_id === p.property_id)) {
        return prev.filter(x => x.property_id !== p.property_id)
      }
      if (prev.length >= 2) return prev
      const next = [...prev, p]
      if (next.length === 2) setShowCompare(true)
      return next
    })
  }

  const avgPrice = filtered.length
    ? Math.round(filtered.filter(p => p.list_price).reduce((s, p) => s + (p.list_price ?? 0), 0) / filtered.filter(p => p.list_price).length)
    : 0

  return (
    <>
      <style>{mapViewStyles}</style>
      <Navbar />
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', paddingTop: '64px' }}>
        {/* ── TOOLBAR ── */}
        <div style={{
          height: '48px', background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0, zIndex: 100
        }}>
          {/* Sidebar toggle + stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Stat label="Listings" value={filtered.length.toString()} />
              {cityFilter !== 'All' && <Stat label={cityFilter} value={`${filtered.length} homes`} />}
              {avgPrice > 0 && <Stat label="Avg price" value={`$${Math.round(avgPrice / 1000)}K`} />}
            </div>
          </div>

          {/* Right-side action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Compare & Insight */}
            <button
              onClick={() => {
                if (compareMode && compareList.length === 2) {
                  setShowCompare(true)
                } else {
                  const next = !compareMode
                  setCompareMode(next)
                  if (!next) { setCompareList([]); setShowCompare(false) }
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                background: compareMode ? '#111827' : 'transparent',
                color: compareMode ? 'white' : '#374151',
                border: `1px solid ${compareMode ? '#111827' : '#e5e7eb'}`,
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="9" height="18" rx="1" />
                <rect x="13" y="3" width="9" height="18" rx="1" />
              </svg>
              {compareMode
                ? compareList.length === 2 ? 'View Comparison' : `Select ${2 - compareList.length} more`
                : 'Compare & Insight'}
            </button>

            {/* Persona */}
            <PersonaButton onAdjustWithAI={() => setShowChat(true)} />
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar */}
          <aside style={{
            width: sidebarOpen ? '340px' : '0',
            minWidth: sidebarOpen ? '340px' : '0',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            background: 'var(--bg)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Filters */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Filters
                </div>
                {(cityFilter !== 'All' || maxPrice < 2500000 || minBeds > 0 || minBaths > 0 || propertyType !== 'All') && (
                  <button
                    onClick={() => {
                      setCityFilter('All')
                      setMaxPrice(2500000)
                      setMinBeds(0)
                      setMinBaths(0)
                      setPropertyType('All')
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '11px', color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* City filter */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                  City
                </label>
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                    color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                >
                  {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
                </select>
              </div>

              {/* Property Type filter */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                    color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="single_family_residential">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>

              {/* Price filter */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                  Max Price: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(maxPrice)}</span>
                </label>
                <input
                  type="range" min={200000} max={2500000} step={50000}
                  value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>$200K</span><span>$2.5M</span>
                </div>
              </div>

              {/* Beds & Baths filters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                    Min Beds
                  </label>
                  <select
                    value={minBeds}
                    onChange={e => setMinBeds(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                      color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={0}>Any</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                    <option value={4}>4+</option>
                    <option value={5}>5+</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                    Min Baths
                  </label>
                  <select
                    value={minBaths}
                    onChange={e => setMinBaths(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                      color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={0}>Any</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compare mode banner */}
            {compareMode && (
              <div style={{
                padding: '10px 14px', flexShrink: 0,
                background: compareList.length === 2 ? '#1e6b4a' : 'rgba(30,107,74,0.08)',
                borderBottom: '1px solid rgba(30,107,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: compareList[i] ? '#1e6b4a' : 'rgba(30,107,74,0.2)',
                        border: `2px solid ${compareList[i] ? '#1e6b4a' : 'rgba(30,107,74,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {compareList[i] && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: compareList.length === 2 ? 'white' : '#1e6b4a',
                  }}>
                    {compareList.length === 2 ? 'Ready to compare!' : `Pick ${2 - compareList.length} propert${compareList.length === 1 ? 'y' : 'ies'}`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {compareList.length === 2 && (
                    <button onClick={() => setShowCompare(true)} style={{
                      padding: '4px 10px', background: 'white', color: '#1e6b4a',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700,
                    }}>Compare</button>
                  )}
                  <button onClick={() => { setCompareMode(false); setCompareList([]); setShowCompare(false) }} style={{
                    padding: '4px 8px',
                    background: compareList.length === 2 ? 'rgba(255,255,255,0.2)' : 'rgba(30,107,74,0.15)',
                    color: compareList.length === 2 ? 'white' : '#1e6b4a',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
                  }}>✕</button>
                </div>
              </div>
            )}

            {/* Count */}
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
              fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> properties</span>
              {selected && !compareMode && (
                <button onClick={() => setSelected(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif'
                }}>Clear selection</button>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((p, i) => (
                <div key={p.property_id} style={{ animationDelay: `${i * 0.03}s` }} className="animate-fadeUp">
                  <PropertyCard
                    p={p}
                    selected={selected?.property_id === p.property_id}
                    onClick={() => selectProperty(p)}
                    compareMode={compareMode}
                    inCompare={!!compareList.find(x => x.property_id === p.property_id)}
                    onCompareToggle={() => toggleCompare(p)}
                  />
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No properties match your filters
                </div>
              )}
            </div>
          </aside>

          {/* Map + overlay panels */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* No token fallback */}
            {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && mapLoaded && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-deep)', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ fontSize: '48px' }}>🗺️</div>
                <div style={{ fontSize: '18px', fontFamily: 'DM Serif Display, serif' }}>Map requires Mapbox token</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local</div>
              </div>
            )}

            {/* Selected property detail */}
            {selected && (
              <div className="animate-scaleIn" style={{
                position: 'absolute', top: '16px', left: '16px',
                width: '300px', background: 'var(--bg-card)',
                borderRadius: '14px', boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)', overflow: 'hidden', zIndex: 100
              }}>
                {selected.photo && (
                  <img src={selected.photo} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: 'var(--accent)' }}>
                      {fmt(selected.list_price)}
                    </span>
                    <button
                      onClick={() => setSelected(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selected.address.street_number} {selected.address.street}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {selected.address.city}, {selected.address.state_code} · {selected.address.postal_code}
                  </div>

                  {selected.description && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Beds', val: selected.description.beds },
                        { label: 'Baths', val: selected.description.baths },
                        { label: 'Sqft', val: selected.description.sqft_living?.toLocaleString() },
                        { label: 'Built', val: selected.description.year_built },
                      ].filter(x => x.val).map(x => (
                        <div key={x.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{x.val}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{x.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selected.agent && (
                    <div style={{
                      padding: '9px 12px', background: 'var(--bg-deep)',
                      borderRadius: '8px', marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Listed by</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{selected.agent.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selected.agent.office}</div>
                    </div>
                  )}

                  {selected.open_house && (
                    <div style={{ fontSize: '12px', color: '#92400E', background: '#FEF3C7', padding: '7px 10px', borderRadius: '7px', marginBottom: '10px' }}>
                      🏠 Open House: {new Date(selected.open_house).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  <button
                    onClick={() => { setShowChat(true) }}
                    style={{
                      width: '100%', padding: '9px', background: 'var(--accent)', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Ask AI about this property
                  </button>
                </div>
              </div>
            )}

            {/* AI Chat */}
            {showChat && (
              <AIChatPanel
                user={user}
                property={selected}
                onClose={() => setShowChat(false)}
                currentPersona={currentPersona}
                onPersonaUpdate={setCurrentPersona}
              />
            )}
          </div>
        </div>

        {/* Compare Overlay */}
        {showCompare && compareList.length === 2 && (
          <CompareOverlay
            propertyA={compareList[0]}
            propertyB={compareList[1]}
            onClose={() => setShowCompare(false)}
          />
        )}
      </div>
    </>
  )
}

// ── Stat badge ─────────────────────────────────────────────────────────────────
function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'DM Serif Display, serif' }}>{value}</span>
        {delta != null && (
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '1px 5px',
            borderRadius: '99px',
            background: delta >= 0 ? '#DCFCE7' : '#FEE2E2',
            color: delta >= 0 ? '#15803D' : '#DC2626'
          }}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}