import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { VideoCard } from '../components/VideoCard'
import { AnimatedSection } from '../components/AnimatedSection'
import { useActiveStyle } from '../context/StyleContext'
import type { DanceStep } from '../types'

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

const P = "'Poppins', sans-serif"

export function Home() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activeStyle } = useActiveStyle()
  const styleSteps = activeStyle.steps
  const accent = activeStyle.accentColor ?? activeStyle.color

  const [hoveredStrip, setHoveredStrip] = useState<string | null>(null)

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
        s.presenter.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
      return matchesCategory && matchesQuery
    })
  }, [styleSteps, activeCategory, query])

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────── */}
      {!query && (
        <section style={{ background: '#f0f4ff', position: 'relative', overflow: 'hidden' }}>
          {/* dot grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, #b39ddb33 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          <div className="page-wrap relative z-10" style={{ paddingTop: '64px', paddingBottom: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-8 items-center">

              {/* Left: text */}
              <AnimatedSection direction="right" delay={0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.45em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase' }}>
                  Biblioteca de Passos de {activeStyle.name}
                </p>
                <h1 style={{ fontFamily: P, fontWeight: 900, lineHeight: 0.92, fontSize: 'clamp(3.6rem,9.5vw,7rem)', letterSpacing: '-0.03em' }}>
                  <span style={{ display: 'block', color: '#4a4e6b' }}>{activeStyle.name}</span>
                  <span style={{ display: 'block', background: 'linear-gradient(90deg, #00c9a7, #4fc3f7, #b39ddb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>STEPS</span>
                </h1>
                <p style={{ fontFamily: P, fontSize: '12px', lineHeight: 1.7, color: '#4a4e6b', maxWidth: '260px' }}>
                  Do básico às finalizações avançadas. Acompanhe seu progresso pessoal e domine cada passo.
                </p>
                <Link
                  to="/training"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontFamily: P, fontSize: '12px', letterSpacing: '0.15em', fontWeight: 700,
                    textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none',
                    background: accent, padding: '12px 24px', borderRadius: '50px',
                    boxShadow: `0 4px 16px ${accent}60`, width: 'fit-content',
                    transition: 'transform 0.2s, box-shadow 0.2s',
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
                className="group relative overflow-hidden block"
                style={{ borderRadius: '20px', aspectRatio: '4/3', boxShadow: '0 8px 40px rgba(26,29,59,0.15)' }}
              >
                <FeaturedThumb step={highlights[0]} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,29,59,0.85) 0%, rgba(26,29,59,0.05) 55%, transparent 100%)' }} />
                <div
                  className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
                  style={{ background: '#f5a623', boxShadow: '0 4px 16px rgba(245,166,35,0.5)' }}
                >
                  <svg className="w-5 h-5 ml-0.5" style={{ color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '20px' }}>
                  <span style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', color: '#f5a623' }}>
                    {highlights[0]?.category}
                  </span>
                  <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '20px', color: '#ffffff', marginTop: '4px', lineHeight: 1.25 }}>
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
        <section style={{ background: '#ffffff', paddingTop: '72px' }}>
          <div className="page-wrap">
            <AnimatedSection>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.4em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Seleção aleatória
                </p>
                <h2 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(32px, 5vw, 56px)', color: '#1a1d3b', lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Em Destaque
                </h2>
              </div>
              <span style={{ fontFamily: P, fontSize: '11px', letterSpacing: '0.18em', color: '#8b95b8', textTransform: 'uppercase', paddingBottom: '6px', fontWeight: 500 }}>
                Troca a cada visita
              </span>
            </div>
            </AnimatedSection>

            {/* Accordion strip */}
            <AnimatedSection delay={0.1}>
            <div style={{ display: 'flex', height: '300px', gap: '6px' }}>
              {highlights.slice(1).map((s) => (
                <Link
                  key={s.id}
                  to={`/video/${s.id}`}
                  onMouseEnter={() => setHoveredStrip(s.id)}
                  onMouseLeave={() => setHoveredStrip(null)}
                  className="group relative overflow-hidden block"
                  style={{
                    borderRadius: '16px',
                    flexGrow: hoveredStrip === s.id ? 3 : (hoveredStrip ? 0.55 : 1),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    filter: hoveredStrip === s.id ? 'none' : 'saturate(0.5) brightness(0.9)',
                    transition: 'flex-grow 0.45s cubic-bezier(0.4,0,0.2,1), filter 0.4s ease',
                    textDecoration: 'none',
                  }}
                >
                  <FeaturedThumb step={s} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(26,29,59,0.82) 0%, transparent 60%)',
                    opacity: hoveredStrip === s.id ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, padding: '14px',
                    opacity: hoveredStrip === s.id ? 1 : 0,
                    transform: hoveredStrip === s.id ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.25s 0.1s, transform 0.25s 0.1s',
                  }}>
                    <span style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, color: '#f5a623' }}>
                      {s.category}
                    </span>
                    <p style={{ fontFamily: P, fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '3px', lineHeight: 1.25,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
      <section style={{ background: '#ffffff', paddingTop: query ? '40px' : '72px', paddingBottom: '100px' }}>
        <div className="page-wrap">

          {query ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.3em', color: '#00c9a7', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Busca</p>
                <h2 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(28px, 5vw, 52px)', color: '#1a1d3b', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  "{query}"
                </h2>
                <p style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8', marginTop: '6px' }}>
                  {filtered.length} passo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                style={{ fontFamily: P, fontSize: '12px', fontWeight: 600, color: '#f5a623', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
              >
                ← Limpar
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                  <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.4em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Todos os passos
                  </p>
                  <h2 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', color: '#1a1d3b', lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                    Nossa Biblioteca
                  </h2>
                </div>
                <Link to="/training" style={{ fontFamily: P, fontSize: '12px', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', color: '#f5a623', textDecoration: 'none', paddingBottom: '4px' }}>
                  Fila de treino →
                </Link>
              </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '44px' }}>
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
                      style={{
                        fontFamily: P, fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600,
                        textTransform: 'uppercase', padding: '7px 16px', borderRadius: '50px',
                        border: `1px solid ${isActive ? ac.border : '#dde3f5'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
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

          {/* Video grid */}
          {filtered.length > 0 ? (
            <AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filtered.map((step) => (
                <VideoCard key={step.id} video={step} />
              ))}
            </div>
            </AnimatedSection>
          ) : (
            <div style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
              <p style={{ color: '#8b95b8', fontFamily: P }}>Nenhum passo encontrado.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER BAND ─────────────────────────────────────── */}
      {!query && (
        <div style={{ background: '#f0f4ff', borderTop: '1px solid #dde3f5', padding: '64px 0' }}>
          <div className="page-wrap flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <h2 style={{
              fontFamily: P, fontWeight: 900, fontSize: 'clamp(40px, 8vw, 110px)',
              lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #1a1d3b 0%, #b39ddb 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              FIRST<br /><span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>STEPS</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
              <p style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8', letterSpacing: '0.06em' }}>
                Biblioteca pessoal de Zouk
              </p>
              <Link
                to="/training"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: P, fontSize: '11px', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: '#f5a623', textDecoration: 'none' }}
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

function FeaturedThumb({ step }: { step: DanceStep | undefined }) {
  if (!step) return <div style={{ width: '100%', height: '100%', background: '#dde3f5' }} />
  const firstYT = step.youtubeVideos.find((id) => id !== '')
  if (firstYT) {
    return (
      <img
        src={`https://img.youtube.com/vi/${firstYT}/maxresdefault.jpg`}
        alt={step.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        className="group-hover:scale-105 transition-transform duration-500"
      />
    )
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #dde3f5 0%, #eef2ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="40" height="40" style={{ color: '#b39ddb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
  )
}
