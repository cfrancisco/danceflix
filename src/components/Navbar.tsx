import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useActiveStyle } from '../context/StyleContext'

const P = "'Poppins', sans-serif"

export function Navbar() {
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { activeStyle } = useActiveStyle()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`)
  }

  function isActive(to: string) {
    return location.pathname === to
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'rgba(238,242,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dde3f5' }}
    >
      <div className="page-wrap flex items-center h-[64px] gap-8">

        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${activeStyle.color}, ${activeStyle.accentColor ?? activeStyle.color})`, boxShadow: `0 2px 8px ${activeStyle.color}55`, transition: 'background 0.3s' }}
          >
            <span style={{ fontFamily: P, fontSize: '14px', fontWeight: 800, color: '#fff' }}>{activeStyle.icon}</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span style={{ fontFamily: P, fontSize: '8px', letterSpacing: '0.4em', color: '#8b95b8', fontWeight: 600, textTransform: 'uppercase', transition: 'color 0.3s' }}>{activeStyle.name.toUpperCase()}</span>
            <span style={{ fontFamily: P, fontSize: '16px', fontWeight: 800, color: '#1a1d3b', letterSpacing: '-0.02em' }}>Steps</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-4">
          {[
            { to: '/',         label: 'Biblioteca' },
            { to: '/training', label: 'Treino'     },
            { to: '/flow-map', label: 'Flow Map'   },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: P,
                fontSize: '12px',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: isActive(to) ? '#f5a623' : '#4a4e6b',
                textDecoration: 'none',
                transition: 'color 0.2s',
                borderBottom: isActive(to) ? '2px solid #f5a623' : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center"
          style={{
            flex: '1 1 0', maxWidth: '260px', marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ffffff', border: '1.5px solid #dde3f5',
            borderRadius: '50px', padding: '7px 16px',
            boxShadow: '0 1px 4px rgba(26,29,59,0.06)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#b39ddb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(179,157,219,0.15)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#dde3f5'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,29,59,0.06)' }}
        >
          <svg width="14" height="14" style={{ color: '#b39ddb', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar passos…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#1a1d3b', fontFamily: P, fontSize: '12px', fontWeight: 500,
            }}
          />
        </form>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-1"
          style={{ color: '#4a4e6b', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background: '#ffffff', borderTop: '1px solid #dde3f5' }}>
          <div className="page-wrap py-4 flex flex-col gap-4">
            {[
              { to: '/',         label: 'Biblioteca' },
              { to: '/training', label: 'Treino'     },
              { to: '/flow-map', label: 'Flow Map'   },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={{ fontFamily: P, fontSize: '13px', fontWeight: 600, color: isActive(to) ? '#f5a623' : '#1a1d3b', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #dde3f5' }}>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar passos…"
                className="flex-1 bg-transparent focus:outline-none"
                style={{ fontFamily: P, fontSize: '13px', color: '#1a1d3b' }}
              />
              <button type="submit" style={{ color: '#f5a623', background: 'none', border: 'none', cursor: 'pointer', fontFamily: P, fontSize: '16px' }}>→</button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
