'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface AuthUser {
  id: string
  email?: string
  user_metadata?: { full_name?: string }
}

// ── Token helpers ──────────────────────────────────────────────────────────────
function saveSession(accessToken: string, user: AuthUser) {
  localStorage.setItem('hw_access_token', accessToken)
  localStorage.setItem('hw_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('hw_access_token')
  localStorage.removeItem('hw_user')
}

function loadSession(): { token: string; user: AuthUser } | null {
  try {
    const token = localStorage.getItem('hw_access_token')
    const raw = localStorage.getItem('hw_user')
    if (!token || !raw) return null
    return { token, user: JSON.parse(raw) }
  } catch {
    return null
  }
}

// ── Auth Modal ─────────────────────────────────────────────────────────────────
function AuthModal({
  initialMode,
  onClose,
  onAuth,
}: {
  initialMode: 'login' | 'signup'
  onClose: () => void
  onAuth: (u: AuthUser) => void
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [familySize, setFamilySize] = useState('')
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const res = await fetch(`${API}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            firstName: name,
            annualIncome: annualIncome ? parseInt(annualIncome) : undefined,
            downPayment: downPayment ? parseInt(downPayment) : undefined,
            familySize: familySize ? parseInt(familySize) : undefined,
            firstTimeBuyer
          })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Signup failed')
        }
        const data = await res.json()
        if (data.session) {
          saveSession(data.session.access_token, data.session.user)
          onAuth(data.session.user)
        } else {
          setSuccess('Signup successful! Please log in.')
        }
      } else {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Login failed')
        }
        const data = await res.json()
        if (data.session) {
          saveSession(data.session.access_token, data.session.user)
          onAuth(data.session.user)
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 36px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          <img src="/image.png" alt="HomeWay" style={{ height: '26px', width: '26px', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 700, color: '#111827' }}>HomeWay</span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 28px', lineHeight: 1.5 }}>
          {mode === 'login'
            ? 'Sign in to access Map View, Budget Planner & more'
            : 'Get started with AI-powered home buying tools'}
        </p>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: '#f3f4f6',
          borderRadius: '9px', padding: '3px', marginBottom: '24px',
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                transition: 'all 0.2s',
                background: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? '#16a34a' : '#6b7280',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {mode === 'signup' && (
            <>
              <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Annual Income ($)" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Down Payment ($)" value={downPayment} onChange={e => setDownPayment(e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Family Size" value={familySize} onChange={e => setFamilySize(e.target.value)} style={inputStyle} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '2px 0' }}>
                <input type="checkbox" checked={firstTimeBuyer} onChange={e => setFirstTimeBuyer(e.target.checked)} style={{ accentColor: '#16a34a', cursor: 'pointer', width: '15px', height: '15px' }} />
                First-time Homebuyer
              </label>
            </>
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={inputStyle} />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '13px',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px',
          }}>{success}</div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
            background: loading ? '#86efac' : '#16a34a',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            letterSpacing: '0.01em',
          }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '12px', padding: '10px',
            background: 'transparent', color: '#9ca3af',
            border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Continue browsing
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px',
  color: '#111827', outline: 'none',
}

// ── Nav items ──────────────────────────────────────────────────────────────────
const navItems = [
  { href: '/', label: 'Features' },
  { href: '/mapview', label: 'Map View' },
  { href: '/mortgage-calculator', label: 'Mortgage' },
  { href: '/Budget-planner', label: 'Budget Planner' },
]

// ── Navbar ─────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // On mount: restore session from localStorage and verify with oracle
  useEffect(() => {
    const stored = loadSession()
    if (!stored) return
    // Immediately restore from cache — no flicker on navigation
    setUser(stored.user)
    // Background verify: only clear on 401 (invalid token), never on network/server errors
    fetch(`${API}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: stored.token }),
    })
      .then(r => {
        if (r.status === 401) {
          clearSession()
          setUser(null)
          return
        }
        if (r.ok) return r.json().then((data: { user: AuthUser }) => setUser(data.user))
        // Any other error (5xx, network) → keep cached user, don't clear
      })
      .catch(() => {
        // Oracle unreachable → keep cached user so navigation doesn't break auth
      })
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const signOut = async () => {
    const stored = loadSession()
    if (stored) {
      fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: stored.token }),
      }).catch(() => {})
    }
    clearSession()
    setUser(null)
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0; right: 0;
          height: 2px;
          background: #22c55e;
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          transform: scaleX(1);
        }
        .user-menu {
          animation: slideDown 0.2s ease;
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#1a2e1c',
        borderBottom: '1px solid rgba(34,197,94,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          height: '64px', padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0, marginRight: 'auto' }}>
            <img src="/image.png" alt="HomeWay" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>HomeWay</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#22c55e', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '2px' }}>Real Estate</span>
            </div>
          </Link>

          {/* ── Center Nav Links (always visible) ── */}
          <div className="desktop-nav" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '36px' }}>
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${isActive ? ' active' : ''}`}
                  style={{
                    fontSize: '14px', fontWeight: 500,
                    color: isActive ? '#ffffff' : '#9ca3af',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    paddingBottom: '2px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = isActive ? '#ffffff' : '#9ca3af')}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* ── Right: Auth / User ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {user ? (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 14px 6px 8px',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#e5e7eb', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="user-menu" style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#1e3320', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    minWidth: '220px', overflow: 'hidden', zIndex: 50,
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Account</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                    <div style={{ padding: '6px' }}>
                      <button
                        onClick={signOut}
                        style={{
                          width: '100%', padding: '9px 12px', textAlign: 'left',
                          background: 'transparent', border: 'none', borderRadius: '6px',
                          fontSize: '13px', fontWeight: 500, color: '#6b7280',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('login')}
                  style={{
                    padding: '7px 18px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px',
                    fontSize: '13px', fontWeight: 500, color: '#d1d5db',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#d1d5db' }}
                >
                  Log in
                </button>
                <button
                  onClick={() => setAuthModal('signup')}
                  style={{
                    padding: '7px 18px',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    border: '1px solid #16a34a', borderRadius: '7px',
                    fontSize: '13px', fontWeight: 600, color: '#ffffff',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #15803d, #166534)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #16a34a, #15803d)')}
                >
                  Sign up
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '4px' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                {mobileMenuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-only" ref={mobileMenuRef} style={{
            background: '#1a2e1c', borderTop: '1px solid rgba(34,197,94,0.15)',
            padding: '16px 24px 20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '10px 12px', borderRadius: '7px',
                    fontSize: '14px', fontWeight: 500,
                    color: pathname === item.href ? '#22c55e' : '#d1d5db',
                    textDecoration: 'none',
                    background: pathname === item.href ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {!user && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setAuthModal('login'); setMobileMenuOpen(false) }}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', color: '#d1d5db', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  Log in
                </button>
                <button onClick={() => { setAuthModal('signup'); setMobileMenuOpen(false) }}
                  style={{ flex: 1, padding: '10px', background: '#16a34a', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Sign up
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
          onAuth={u => { setUser(u); setAuthModal(null) }}
        />
      )}
    </>
  )
}
