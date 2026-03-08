'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ── Auth Modal ─────────────────────────────────────────────────────────────────
function AuthModal({
  initialMode,
  onClose,
  onAuth,
}: {
  initialMode: 'login' | 'signup'
  onClose: () => void
  onAuth: (u: User) => void
}) {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: e } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (e) throw e
        if (data.user && !data.session) {
          setSuccess('Check your email to confirm your account!')
        } else if (data.user) {
          onAuth(data.user)
        }
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password })
        if (e) throw e
        if (data.user) onAuth(data.user)
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
        background: 'rgba(15,15,14,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: '16px', padding: '40px',
          width: '100%', maxWidth: '420px',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '12px', letterSpacing: '-0.01em' }}>
            HomeWay
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            {mode === 'login'
              ? 'Sign in to access Map View, Budget Planner & more'
              : 'Get started with AI-powered home buying tools'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-deep)', borderRadius: '8px',
          padding: '3px', marginBottom: '20px',
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                transition: 'all 0.2s',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {mode === 'signup' && (
            <input
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
            background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '13px',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
            background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontSize: '13px',
          }}>{success}</div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            background: loading ? '#9ca3af' : '#111827',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '8px', padding: '10px',
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
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: '9px', fontSize: '14px',
  color: 'var(--text-primary)', outline: 'none',
}

// ── Nav items ──────────────────────────────────────────────────────────────────
const navItems = [
  { href: '/mapview', label: 'Map View' },
  { href: '/mortgage-calculator', label: 'Mortgage' },
  { href: '/Budget-planner', label: 'Budget Planner' },
]

// ── Navbar ─────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  // Close user menu on outside click
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
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes underline-expand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        .nav-link {
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
          border-radius: 1.5px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .nav-link.active::before {
          transform: scaleX(1);
        }
        
        .nav-link:hover::before {
          transform: scaleX(1);
        }
        
        .user-menu {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }
        
        .mobile-menu {
          animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }
        
        .logo-glow {
          animation: pulse-glow 3s infinite;
          transition: all 0.3s ease;
        }
        
        .logo-glow:hover {
          animation: none;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
        }
        
        @media (max-width: 768px) {
          .nav-items-desktop {
            display: none !important;
          }
        }
        
        @media (min-width: 769px) {
          .nav-items-mobile {
            display: none !important;
          }
        }
      `}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100/80" style={{
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="max-w-7xl mx-auto h-24 px-6 lg:px-8 flex items-center justify-between">

          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative logo-glow p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl transition-all duration-300 group-hover:from-green-100 group-hover:to-emerald-100">
              <img src="/image.png" alt="HomeWay" className="h-10 w-10 object-contain" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-serif text-2xl font-bold text-gray-900 tracking-tight">HomeWay</span>
              <span className="text-xs text-green-600 font-medium tracking-wide">REAL ESTATE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-items-desktop flex-1 flex items-center justify-center ml-16">
            {user && (
              <div className="flex items-center gap-12">
                {navItems.map((item, idx) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`nav-link text-lg font-semibold transition-colors duration-300 pb-1 ${isActive
                          ? 'text-gray-900 active'
                          : hoveredItem === item.href
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      style={{
                        animation: `slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 50}ms forwards`,
                        opacity: 0
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-items-mobile p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#111827]">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Right: Auth Area */}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 border-2 border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e5e7eb] to-[#d1d5db] text-[#374151] flex items-center justify-center text-sm font-bold shrink-0 group-hover:from-[#d1d5db] group-hover:to-[#bfdbfe] transition-all duration-200">
                    {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <span className="text-base font-semibold text-[#374151] max-w-[140px] truncate hidden sm:inline">
                    {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`text-[#9ca3af] transition-transform duration-300 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="user-menu absolute top-16 right-0 bg-white border border-[#e5e7eb] rounded-lg shadow-2xl min-w-[260px] overflow-hidden z-50">
                    <div className="px-5 py-4 border-b border-[#f3f4f6] bg-[#fafafa]">
                      <div className="text-xs font-bold text-[#9ca3af] mb-1.5 tracking-wide">ACCOUNT</div>
                      <div className="text-base font-semibold text-[#111827] truncate">{user.email}</div>
                    </div>
                    <div className="py-3">
                      {navItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-base font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors duration-200 group"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-[#f3f4f6]">
                      <button
                        onClick={signOut}
                        className="w-full px-5 py-3 text-left text-base font-medium text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] transition-all duration-200"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <button
                  onClick={() => setAuthModal('login')}
                  className="px-5 py-2.5 text-base font-semibold text-[#6b7280] hover:text-[#111827] transition-all duration-200 relative group"
                >
                  Log in
                  <span className="absolute bottom-1 left-5 right-5 h-px bg-[#d1d5db] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
                <button
                  onClick={() => setAuthModal('signup')}
                  className="px-5 py-2.5 border-2 border-[#e5e7eb] rounded-lg text-base font-semibold text-[#374151] hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all duration-200"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="nav-items-mobile border-t border-[#e5e7eb] bg-white" ref={mobileMenuRef}>
            <div className="px-6 py-4 max-w-7xl mx-auto">
              {user && (
                <div className="flex flex-col gap-4 mb-6">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium py-2 transition-colors ${pathname === item.href
                          ? 'text-[#111827] border-b-2 border-[#111827]'
                          : 'text-[#6b7280]'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
              {!user && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setAuthModal('login'); setMobileMenuOpen(false) }}
                    className="w-full px-5 py-3 text-lg font-semibold text-[#6b7280] hover:text-[#111827] transition-colors text-left"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { setAuthModal('signup'); setMobileMenuOpen(false) }}
                    className="w-full px-5 py-3 border-2 border-[#e5e7eb] rounded-lg text-lg font-semibold text-[#374151] hover:bg-[#f9fafb] transition-all"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
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
