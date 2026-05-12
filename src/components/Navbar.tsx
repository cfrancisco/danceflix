import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useActiveStyle } from '../context/StyleContext'
import './Navbar.css'

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
    <header className="nav-header sticky top-0 z-50">
      <div className="page-wrap flex items-center h-[64px] gap-8">

        {/* Logo */}
        <Link to="/" className="nav-logo shrink-0 flex items-center gap-2.5">
          <div
            className="nav-logo__icon-wrap w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${activeStyle.color}, ${activeStyle.accentColor ?? activeStyle.color})`,
              boxShadow: `0 2px 8px ${activeStyle.color}55`,
            }}
          >
            <span className="nav-logo__icon">{activeStyle.icon}</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="nav-logo__style">{activeStyle.name.toUpperCase()}</span>
            <span className="nav-logo__name">Steps</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-4">
          {[
            { to: '/',         label: 'Biblioteca' },
            { to: '/training', label: 'Treino'     },
            { to: '/flow-map', label: 'Conexões'   },
            { to: '/videos',   label: 'Vídeos'     },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${isActive(to) ? ' is-active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="nav-search hidden md:flex">
          <svg width="14" height="14" className="nav-search__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar passos…"
            className="nav-search__input"
          />
        </form>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger md:hidden ml-auto p-1"
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
        <div className="nav-mobile md:hidden">
          <div className="page-wrap py-2 flex flex-col">
            {[
              { to: '/',         label: 'Biblioteca'            },
              { to: '/training', label: 'Treino'                },
              { to: '/flow-map', label: 'Conexões entre Passos' },
              { to: '/videos',   label: 'Vídeos'                },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`nav-mobile__link${isActive(to) ? ' is-active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
