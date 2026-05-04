import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoCard } from '../components/VideoCard'
import { AnimatedSection } from '../components/AnimatedSection'
import { StepTable } from '../components/StepTable'
import type { StepSortCol } from '../components/StepTable'
import { useActiveStyle } from '../context/StyleContext'
import type { DanceStep } from '../types'
import './Home.css'

// Zouk-specific category color overrides — falls back to style accent for unknown categories
const CAT_ACTIVE: Record<string, { bg: string; color: string; border: string }> = {
  'All':                              { bg: '#1a1d3b', color: '#ffffff',  border: '#1a1d3b'  },
  'Base e Deslocamento':              { bg: 'rgba(0,201,167,0.15)',  color: '#00a086', border: '#00c9a7'  },
  'Abertura':                         { bg: 'rgba(79,195,247,0.15)', color: '#0086b3', border: '#4fc3f7' },
  'Giros e Dinâmicas':                { bg: 'rgba(179,157,219,0.15)',color: '#7c5cbf', border: '#b39ddb' },
  'Pêndulos':                         { bg: 'rgba(240,98,146,0.15)', color: '#c2185b', border: '#f06292' },
  'Movimentos de Tronco e Cabeça':    { bg: 'rgba(255,213,79,0.2)',  color: '#b87e00', border: '#ffd54f' },
  'Conexões e Estilizações':          { bg: 'rgba(245,166,35,0.15)', color: '#c97d00', border: '#f5a623' },
  'Finalizações':                     { bg: 'rgba(0,230,118,0.15)',  color: '#00875a', border: '#00e676' },
}

export function Home() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activeStyle } = useActiveStyle()
  const styleSteps = activeStyle.steps
  const accent = activeStyle.accentColor ?? activeStyle.color

  const [hoveredStrip, setHoveredStrip] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'lista'>('grid')
  const [sortBy, setSortBy] = useState<StepSortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: StepSortCol) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const categories = useMemo(() => {
    const cats = new Set(styleSteps.map((s) => s.category))
    return ['All', ...Array.from(cats)]
  }, [styleSteps])

  const [categoryState, setCategoryState] = useState<{ styleId: string; cat: string }>({
    styleId: activeStyle.id,
    cat: 'All',
  })
  const activeCategory =
    categoryState.styleId === activeStyle.id ? categoryState.cat : 'All'
  const setActiveCategory = (cat: string) =>
    setCategoryState({ styleId: activeStyle.id, cat })

  const [highlights, setHighlights] = useState<DanceStep[]>([])
  useEffect(() => {
    const withYoutube = styleSteps.filter((s) => s.youtubeVideos.some((id) => id !== ''))
    const pool = withYoutube.length >= 5 ? withYoutube : styleSteps
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5)
    setHighlights(shuffled)
  }, [activeStyle.id, styleSteps])

  const query = searchParams.get('q')?.toLowerCase() ?? ''

  const filtered = useMemo(() => {
    return styleSteps.filter((s) => {
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
      return matchesCategory && matchesQuery
    })
  }, [styleSteps, activeCategory, query])

  const sortedSteps = useMemo(() => {
    if (!sortBy) return filtered
    return [...filtered].sort((a, b) => {
      const av = sortBy === 'difficulty' ? a.difficulty : sortBy === 'duration' ? (a.duration ?? '') : a[sortBy]
      const bv = sortBy === 'difficulty' ? b.difficulty : sortBy === 'duration' ? (b.duration ?? '') : b[sortBy]
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortBy, sortDir])

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────── */}
      {!query && (
        <section className="home-hero">
          {/* dot grid */}
          <div className="home-hero__dot-grid" />

          <div className="page-wrap relative z-10 home-hero__wrap">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-8 items-center">

              {/* Left: text */}
              <AnimatedSection direction="right" delay={0}>
              <div className="home-hero__text">
                <p className="home-hero__label">
                  Biblioteca de Passos de {activeStyle.name}
                </p>
                <h1 className="home-hero__title">
                  <span className="home-hero__title-name">{activeStyle.name}</span>
                  <span className="home-hero__title-steps">STEPS</span>
                </h1>
                <p className="home-hero__desc">
                  Do básico às finalizações avançadas. Acompanhe seu progresso pessoal e domine cada passo.
                </p>
                <Link
                  to="/training"
                  className="home-hero__cta"
                  style={{
                    background: accent,
                    boxShadow: `0 4px 16px ${accent}60`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accent}70` }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px ${accent}60` }}
                >
                  Ver fila de treino
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              </AnimatedSection>

              {/* Right: featured card */}
              <AnimatedSection direction="left" delay={0.1}>
              <Link
                to={`/video/${highlights[0]?.id}`}
                className="group relative overflow-hidden block home-hero__card"
              >
                <FeaturedThumb step={highlights[0]} />
                <div className="home-hero__card-overlay" />
                <div
                  className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 home-hero__card-play"
                >
                  <svg className="w-5 h-5 ml-0.5 home-hero__card-play-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
                  </svg>
                </div>
                <div className="home-hero__card-info">
                  <span className="home-hero__card-category">
                    {highlights[0]?.category}
                  </span>
                  <h3 className="home-hero__card-name">
                    {highlights[0]?.name}
                  </h3>
                </div>
              </Link>
              </AnimatedSection>
            </div>
          </div>
        </section>
      )}

      {/* ── EM DESTAQUE ─────────────────────────────────────── */}
      {!query && (
        <section className="home-featured">
          <div className="page-wrap">
            <AnimatedSection>
            <div className="home-featured__header">
              <div>
                <p className="home-featured__label">
                  Seleção aleatória
                </p>
                <h2 className="home-featured__title">
                  Em Destaque
                </h2>
              </div>
              <span className="home-featured__note">
                Troca a cada visita
              </span>
            </div>
            </AnimatedSection>

            {/* Accordion strip */}
            <AnimatedSection delay={0.1}>
            <div className="home-strip">
              {highlights.slice(1).map((s) => (
                <Link
                  key={s.id}
                  to={`/video/${s.id}`}
                  onMouseEnter={() => setHoveredStrip(s.id)}
                  onMouseLeave={() => setHoveredStrip(null)}
                  className="group relative overflow-hidden block home-strip__item"
                  style={{
                    flexGrow: hoveredStrip === s.id ? 3 : (hoveredStrip ? 0.55 : 1),
                    filter: hoveredStrip === s.id ? 'none' : 'saturate(0.5) brightness(0.9)',
                  }}
                >
                  <FeaturedThumb step={s} />
                  <div
                    className="home-strip__overlay"
                    style={{
                      opacity: hoveredStrip === s.id ? 1 : 0,
                    }}
                  />
                  <div
                    className="home-strip__info"
                    style={{
                      opacity: hoveredStrip === s.id ? 1 : 0,
                      transform: hoveredStrip === s.id ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    <span className="home-strip__category">
                      {s.category}
                    </span>
                    <p className="home-strip__name">
                      {s.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── LIBRARY ─────────────────────────────────────────── */}
      <section className="home-library" style={{ paddingTop: query ? '40px' : '72px' }}>
        <div className="page-wrap">

          {query ? (
            <div className="home-search__header">
              <div>
                <p className="home-search__label">Busca</p>
                <h2 className="home-search__title">
                  "{query}"
                </h2>
                <p className="home-search__count">
                  {filtered.length} passo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ViewToggle view={view} setView={setView} accent={accent} />
                <button onClick={() => navigate('/')} className="home-search__clear">
                  ← Limpar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="home-library__header">
                <div>
                  <p className="home-library__label">
                    Todos os passos
                  </p>
                  <h2 className="home-library__title">
                    Nossa Biblioteca
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ViewToggle view={view} setView={setView} accent={accent} />
                  <Link to="/training" className="home-library__link">
                    Fila de treino →
                  </Link>
                </div>
              </div>

              {/* Filter chips */}
              <div className="home-chips">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat
                  const ac = CAT_ACTIVE[cat] ?? {
                    bg: `${accent}1a`,
                    color: accent,
                    border: accent,
                  }
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="home-chip"
                      style={{
                        border: `1px solid ${isActive ? ac.border : '#dde3f5'}`,
                        background: isActive ? ac.bg : '#ffffff',
                        color: isActive ? ac.color : '#4a4e6b',
                      }}
                    >
                      {cat === 'All' ? 'Todos' : cat}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Video grid / list */}
          {sortedSteps.length > 0 ? (
            <AnimatePresence mode="wait">
              {view === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {sortedSteps.map((step) => (
                      <VideoCard key={step.id} video={step} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="lista"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <StepTable
                    steps={sortedSteps}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                    accentColor={accent}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="home-empty">
              <p className="home-empty__text">Nenhum passo encontrado.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER BAND ─────────────────────────────────────── */}
      {!query && (
        <div className="home-footer">
          <div className="page-wrap flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <h2 className="home-footer__title">
              FIRST<br /><span className="home-footer__title-accent">STEPS</span>
            </h2>
            <div className="home-footer__meta">
              <p className="home-footer__desc">
                Biblioteca pessoal de Zouk
              </p>
              <Link
                to="/training"
                className="home-footer__link"
              >
                Fila de Treino
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const P = "'Poppins', sans-serif"

function ViewToggle({
  view,
  setView,
  accent,
}: {
  view: 'grid' | 'lista'
  setView: (v: 'grid' | 'lista') => void
  accent: string
}) {
  const options = [
    { key: 'grid' as const,  label: '⊞ Grade' },
    { key: 'lista' as const, label: '☰ Lista'  },
  ]
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {options.map(({ key, label }) => {
        const active = view === key
        return (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              fontFamily: P,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              padding: '7px 14px',
              borderRadius: '50px',
              border: `1.5px solid ${active ? accent : '#dde3f5'}`,
              background: active ? `${accent}1a` : '#ffffff',
              color: active ? accent : '#4a4e6b',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function FeaturedThumb({ step }: { step: DanceStep | undefined }) {
  if (!step) return <div className="home-thumb__empty" />
  const firstYT = step.youtubeVideos.find((id) => id !== '')
  if (firstYT) {
    return (
      <img
        src={`https://img.youtube.com/vi/${firstYT}/maxresdefault.jpg`}
        alt={step.name}
        className="home-thumb__img group-hover:scale-105 transition-transform duration-500"
      />
    )
  }
  return (
    <div className="home-thumb__placeholder">
      <svg width="40" height="40" className="home-thumb__placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
  )
}
