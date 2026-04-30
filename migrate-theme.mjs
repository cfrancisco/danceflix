import fs from 'fs'
import path from 'path'

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')

function write(rel, content) {
    const full = path.join(root, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, 'utf8')
    console.log('✓', rel)
}

// ── index.html ──────────────────────────────────────────────────────────────
write('index.html', `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/youflix/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Biblioteca pessoal de passos de dança Zouk — do básico às finalizações avançadas" />
    <title>ZoukSteps — Biblioteca de Passos de Zouk</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`)

// ── src/index.css ────────────────────────────────────────────────────────────
write('src/index.css', `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

@import "tailwindcss";

@theme {
  --color-bg: #eef2ff;
  --color-bg-card: #ffffff;
  --color-navy: #1a1d3b;
  --color-navy-soft: #2d3163;
  --color-text: #4a4e6b;
  --color-amber: #f5a623;
  --color-amber-dark: #e09010;
  --color-grad-teal: #00c9a7;
  --color-grad-green: #00e676;
  --color-grad-blue: #4fc3f7;
  --color-grad-purple: #b39ddb;
  --color-grad-pink: #f06292;
  --color-grad-yellow: #ffd54f;
  --font-body: 'Poppins', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  background-color: #eef2ff;
  color: #4a4e6b;
  font-family: 'Poppins', sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #eef2ff; }
::-webkit-scrollbar-thumb { background: #b39ddb; border-radius: 3px; }

.text-rainbow {
  background: linear-gradient(90deg, #00c9a7, #4fc3f7, #b39ddb, #f06292);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(26,29,59,0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(26,29,59,0.13);
}
`)

// ── src/App.tsx ──────────────────────────────────────────────────────────────
write('src/App.tsx', `import { HashRouter, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { VideoDetail } from './pages/VideoDetail'
import { TrainingQueue } from './pages/TrainingQueue'
import { FlowMap } from './pages/FlowMap'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen" style={{ background: '#eef2ff', color: '#1a1d3b' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/training" element={<TrainingQueue />} />
          <Route path="/flow-map" element={<FlowMap />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App
`)

// ── src/components/Navbar.tsx ────────────────────────────────────────────────
write('src/components/Navbar.tsx', `import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const P = "'Poppins', sans-serif"

export function Navbar() {
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(\`/?q=\${encodeURIComponent(query.trim())}\`)
  }

  function isActive(to: string) {
    return location.pathname === to
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'rgba(238,242,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dde3f5' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center h-[64px] gap-8">

        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #00c9a7, #4fc3f7)', boxShadow: '0 2px 8px rgba(0,201,167,0.35)' }}
          >
            <span style={{ fontFamily: P, fontSize: '14px', fontWeight: 800, color: '#fff' }}>Z</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span style={{ fontFamily: P, fontSize: '8px', letterSpacing: '0.4em', color: '#8b95b8', fontWeight: 600, textTransform: 'uppercase' }}>ZOUK</span>
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
          className="hidden md:flex flex-1 max-w-[260px] ml-auto items-center gap-2.5 rounded-full px-4 py-2"
          style={{ background: '#ffffff', border: '1px solid #dde3f5' }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#b39ddb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar passos…"
            className="flex-1 bg-transparent focus:outline-none"
            style={{ color: '#1a1d3b', fontFamily: P, fontSize: '13px' }}
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
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
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
`)

// ── src/components/VideoCard.tsx ─────────────────────────────────────────────
write('src/components/VideoCard.tsx', `import { Link } from 'react-router-dom'
import type { Video } from '../types'
import { getVideoThumbnail } from '../data/videos'

interface VideoCardProps {
  video: Video
}

const LEVEL_CONFIG = [
  { dot: '#b39ddb', label: 'Não praticado' },
  { dot: '#f06292', label: 'Iniciante'     },
  { dot: '#ffd54f', label: 'Desenvolvendo' },
  { dot: '#4fc3f7', label: 'Confortável'   },
  { dot: '#00c9a7', label: 'Forte'         },
  { dot: '#f5a623', label: 'Dominado'      },
]

const P = "'Poppins', sans-serif"

export function VideoCard({ video }: VideoCardProps) {
  const thumbnail = getVideoThumbnail(video)
  const hasRealThumb = video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ'
  const level = LEVEL_CONFIG[video.knowledgeLevel] ?? LEVEL_CONFIG[0]

  return (
    <Link to={\`/video/\${video.id}\`} className="group block" style={{ textDecoration: 'none' }}>
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden mb-3"
        style={{ borderRadius: '14px', background: '#e8ecf8' }}
      >
        {hasRealThumb ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #dde3f5 0%, #eef2ff 100%)' }}
          >
            <svg className="w-10 h-10" style={{ color: '#b39ddb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <span
          className="absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(26,29,59,0.72)', color: '#fff', fontFamily: P }}
        >
          {video.duration}
        </span>

        {/* Play overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{ background: 'rgba(26,29,59,0.12)' }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-200"
            style={{ background: '#f5a623', boxShadow: '0 6px 20px rgba(245,166,35,0.45)' }}
          >
            <svg className="w-5 h-5 ml-0.5" style={{ color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: '#00c9a7', fontFamily: P }}>
          {video.category}
        </p>
        <h3
          className="text-sm leading-snug line-clamp-2 mb-1.5 transition-colors duration-150"
          style={{ fontFamily: P, fontWeight: 700, color: '#1a1d3b' }}
        >
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: level.dot }} />
          <span style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8' }}>{level.label}</span>
        </div>
      </div>
    </Link>
  )
}
`)

// ── src/components/CategoryTag.tsx ───────────────────────────────────────────
write('src/components/CategoryTag.tsx', `import type { VideoCategory } from '../types'

interface CategoryTagProps {
  category: Exclude<VideoCategory, 'All'>
  size?: 'sm' | 'md'
}

const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Base e Deslocamento':           { bg: 'rgba(0,201,167,0.10)',  color: '#00a086', border: 'rgba(0,201,167,0.30)'  },
  'Abertura':                      { bg: 'rgba(79,195,247,0.10)', color: '#0086b3', border: 'rgba(79,195,247,0.30)' },
  'Giros e Dinâmicas':             { bg: 'rgba(179,157,219,0.12)',color: '#7c5cbf', border: 'rgba(179,157,219,0.35)'},
  'Pêndulos':                      { bg: 'rgba(240,98,146,0.10)', color: '#c2185b', border: 'rgba(240,98,146,0.30)' },
  'Movimentos de Tronco e Cabeça': { bg: 'rgba(255,213,79,0.15)', color: '#b87e00', border: 'rgba(255,213,79,0.40)' },
  'Conexões e Estilizações':       { bg: 'rgba(245,166,35,0.10)', color: '#c97d00', border: 'rgba(245,166,35,0.30)' },
  'Finalizações':                  { bg: 'rgba(0,230,118,0.10)',  color: '#00875a', border: 'rgba(0,230,118,0.30)'  },
}

const DEFAULT_COLOR = { bg: 'rgba(139,149,184,0.10)', color: '#4a4e6b', border: 'rgba(139,149,184,0.30)' }

export function CategoryTag({ category, size = 'sm' }: CategoryTagProps) {
  const sizeStyle = size === 'md'
    ? { padding: '5px 14px', fontSize: '12px' }
    : { padding: '2px 9px', fontSize: '10px' }

  const colors = CAT_COLORS[category] ?? DEFAULT_COLOR

  return (
    <span
      style={{
        ...sizeStyle,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        background: colors.bg,
        border: \`1px solid \${colors.border}\`,
        color: colors.color,
        borderRadius: '20px',
        display: 'inline-block',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {category}
    </span>
  )
}
`)

// ── src/components/TrainingPanel.tsx ─────────────────────────────────────────
write('src/components/TrainingPanel.tsx', `import { useState } from 'react'
import type { TrainingScore, VideoProgress, Video } from '../types'
import { useTraining } from '../hooks/useTraining'

const P = "'Poppins', sans-serif"

const SCORE_LABELS: Record<TrainingScore, { description: string; color: string }> = {
  0: { description: 'Não praticado — nunca tentou',          color: '#8b95b8' },
  1: { description: 'Iniciante — começando a aprender',       color: '#f06292' },
  2: { description: 'Em desenvolvimento — precisa praticar',  color: '#ffa726' },
  3: { description: 'Confortável — executa com confiança',    color: '#4fc3f7' },
  4: { description: 'Forte — pequenos ajustes',               color: '#00c9a7' },
  5: { description: 'Dominado — totalmente confiante',        color: '#f5a623' },
}

interface TrainingPanelProps {
  videoId: string
  video: Video
}

export function TrainingPanel({ videoId, video }: TrainingPanelProps) {
  const { getProgress, markReviewed, resetProgress } = useTraining()
  const progress: VideoProgress | undefined = getProgress(videoId)

  const [selectedScore, setSelectedScore] = useState<TrainingScore>(
    progress?.trainingScore ?? video.knowledgeLevel,
  )
  const [justSaved, setJustSaved] = useState(false)

  function handleMarkReviewed() {
    markReviewed(videoId, selectedScore)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  const lastReviewed = progress?.lastReviewedAt
    ? new Date(progress.lastReviewedAt).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid #dde3f5',
      background: '#f0f4ff',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginBottom: '32px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontFamily: P, fontWeight: 700, fontSize: '18px', color: '#1a1d3b' }}>
          Rastreador de Treino
        </h2>
        {progress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8' }}>
              {progress.timesReviewed}× revisado
            </span>
            {lastReviewed && (
              <span style={{ fontFamily: P, fontSize: '12px', color: '#b39ddb' }}>
                Último: {lastReviewed}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score selector */}
      <div>
        <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b', marginBottom: '12px' }}>
          Qual o seu <strong style={{ color: '#1a1d3b', fontWeight: 700 }}>nível de conhecimento</strong> neste passo?
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([0, 1, 2, 3, 4, 5] as TrainingScore[]).map((score) => {
            const isSelected = selectedScore === score
            return (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                title={SCORE_LABELS[score].description}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '8px',
                  border: \`1px solid \${isSelected ? SCORE_LABELS[score].color : '#dde3f5'}\`,
                  background: isSelected ? SCORE_LABELS[score].color : '#ffffff',
                  color: isSelected ? '#ffffff' : '#8b95b8',
                  fontFamily: P,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {score}
              </button>
            )
          })}
        </div>
        <p style={{ fontFamily: P, fontSize: '12px', marginTop: '8px', color: SCORE_LABELS[selectedScore].color }}>
          {SCORE_LABELS[selectedScore].description}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleMarkReviewed}
          style={{
            flex: 1,
            padding: '11px 20px',
            borderRadius: '10px',
            border: 'none',
            fontFamily: P,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: justSaved ? '#00c9a7' : '#f5a623',
            color: '#ffffff',
            boxShadow: justSaved ? '0 4px 12px rgba(0,201,167,0.35)' : '0 4px 12px rgba(245,166,35,0.35)',
          }}
        >
          {justSaved ? '✓ Salvo!' : progress ? 'Marcar como Revisado Novamente' : 'Marcar como Revisado'}
        </button>

        {progress && (
          <button
            onClick={() => resetProgress(videoId)}
            title="Resetar progresso deste vídeo"
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid #dde3f5',
              background: '#ffffff',
              color: '#8b95b8',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#f06292'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#f06292'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#dde3f5'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#8b95b8'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
`)

// ── src/components/RelatedVideos.tsx ─────────────────────────────────────────
write('src/components/RelatedVideos.tsx', `import { Link } from 'react-router-dom'
import type { Video } from '../types'
import { getVideoThumbnail } from '../data/videos'
import { CategoryTag } from './CategoryTag'

const P = "'Poppins', sans-serif"

interface RelatedVideosProps {
  videos: Video[]
}

export function RelatedVideos({ videos }: RelatedVideosProps) {
  if (videos.length === 0) return null

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #dde3f5' }}>
      <h2 style={{ fontFamily: P, fontWeight: 700, fontSize: '20px', color: '#1a1d3b', marginBottom: '20px' }}>
        Passos relacionados
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {videos.map((video) => (
          <RelatedCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

function RelatedCard({ video }: { video: Video }) {
  const thumbnail = getVideoThumbnail(video)
  const formattedDate = new Date(video.date).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Link
      to={\`/video/\${video.id}\`}
      className="group"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        borderRadius: '14px',
        border: '1px solid #dde3f5',
        background: '#ffffff',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'
        e.currentTarget.style.background = '#fdfbf5'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,29,59,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#dde3f5'
        e.currentTarget.style.background = '#ffffff'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0, width: '110px', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#e8ecf8' }}>
        <img
          src={thumbnail}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          loading="lazy"
        />
        <span style={{
          position: 'absolute', bottom: '4px', right: '4px',
          background: 'rgba(26,29,59,0.72)', color: '#fff',
          fontFamily: P, fontSize: '10px', fontWeight: 600,
          padding: '1px 5px', borderRadius: '4px',
        }}>
          {video.duration}
        </span>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
        <p style={{
          fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {video.title}
        </p>
        <CategoryTag category={video.category} />
        <p style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8', marginTop: 'auto' }}>
          {formattedDate}
        </p>
      </div>
    </Link>
  )
}
`)

// ── src/pages/Home.tsx ───────────────────────────────────────────────────────
write('src/pages/Home.tsx', `import { useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { videos } from '../data/videos'
import { VideoCard } from '../components/VideoCard'
import type { Video, VideoCategory } from '../types'

const CATEGORIES: VideoCategory[] = [
  'All',
  'Base e Deslocamento',
  'Abertura',
  'Giros e Dinâmicas',
  'Pêndulos',
  'Movimentos de Tronco e Cabeça',
  'Conexões e Estilizações',
  'Finalizações',
]

const CAT_SHORT: Record<string, string> = {
  'All':                              'Todos',
  'Base e Deslocamento':              'Base',
  'Abertura':                         'Abertura',
  'Giros e Dinâmicas':                'Giros',
  'Pêndulos':                         'Pêndulos',
  'Movimentos de Tronco e Cabeça':    'Corpo',
  'Conexões e Estilizações':          'Conexões',
  'Finalizações':                     'Finalizações',
}

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
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('All')
  const [highlights] = useState<Video[]>(() =>
    [...videos].sort(() => Math.random() - 0.5).slice(0, 5)
  )
  const [hoveredStrip, setHoveredStrip] = useState<string | null>(null)

  const query = searchParams.get('q')?.toLowerCase() ?? ''

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const matchesCategory = activeCategory === 'All' || v.category === activeCategory
      const matchesQuery =
        !query ||
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.presenter.toLowerCase().includes(query) ||
        v.tags.some((t) => t.toLowerCase().includes(query))
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

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

          <div className="max-w-7xl mx-auto px-6 pt-16 pb-0 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-8 items-start">

              {/* Left: text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
                <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.45em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase' }}>
                  Biblioteca de Passos de Zouk
                </p>
                <h1 style={{ fontFamily: P, fontWeight: 900, lineHeight: 0.92, fontSize: 'clamp(3rem,8vw,5.5rem)', letterSpacing: '-0.03em' }}>
                  <span style={{ display: 'block', color: '#4a4e6b' }}>Aprenda</span>
                  <span style={{ display: 'block', background: 'linear-gradient(90deg, #00c9a7, #4fc3f7, #b39ddb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ZOUK</span>
                  <span style={{ display: 'block', color: '#1a1d3b' }}>Steps</span>
                </h1>
                <p style={{ fontFamily: P, fontSize: '14px', lineHeight: 1.75, color: '#4a4e6b', maxWidth: '280px' }}>
                  Do básico às finalizações avançadas. Acompanhe seu progresso pessoal e domine cada passo.
                </p>
                <Link
                  to="/training"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontFamily: P, fontSize: '12px', letterSpacing: '0.15em', fontWeight: 700,
                    textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none',
                    background: '#f5a623', padding: '12px 24px', borderRadius: '50px',
                    boxShadow: '0 4px 16px rgba(245,166,35,0.38)', width: 'fit-content',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,166,35,0.45)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.38)' }}
                >
                  Ver fila de treino
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Right: featured card */}
              <Link
                to={\`/video/\${highlights[0]?.id}\`}
                className="group relative overflow-hidden block"
                style={{ borderRadius: '20px', aspectRatio: '4/3', boxShadow: '0 8px 40px rgba(26,29,59,0.15)' }}
              >
                <FeaturedThumb video={highlights[0]} />
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
                    {highlights[0]?.title}
                  </h3>
                </div>
              </Link>
            </div>

            {/* Big title */}
            <div style={{ marginTop: '8px', overflow: 'hidden' }}>
              <h2 style={{
                fontFamily: P, fontWeight: 900, textTransform: 'uppercase',
                fontSize: 'clamp(72px, 15vw, 200px)', letterSpacing: '-0.03em', lineHeight: 0.88,
                background: 'linear-gradient(90deg, #1a1d3b 0%, #4a4e6b 60%, #b39ddb 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                ZOUK<br />
                <span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  STEPS
                </span>
              </h2>
            </div>
          </div>
        </section>
      )}

      {/* ── EM DESTAQUE ─────────────────────────────────────── */}
      {!query && (
        <section style={{ background: '#ffffff', paddingTop: '72px' }}>
          <div className="max-w-7xl mx-auto px-6">
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

            {/* Accordion strip */}
            <div style={{ display: 'flex', height: '300px', gap: '6px' }}>
              {highlights.slice(1).map((v) => (
                <Link
                  key={v.id}
                  to={\`/video/\${v.id}\`}
                  onMouseEnter={() => setHoveredStrip(v.id)}
                  onMouseLeave={() => setHoveredStrip(null)}
                  className="group relative overflow-hidden block"
                  style={{
                    borderRadius: '16px',
                    flexGrow: hoveredStrip === v.id ? 3 : (hoveredStrip ? 0.55 : 1),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    filter: hoveredStrip === v.id ? 'none' : 'saturate(0.5) brightness(0.9)',
                    transition: 'flex-grow 0.45s cubic-bezier(0.4,0,0.2,1), filter 0.4s ease',
                    textDecoration: 'none',
                  }}
                >
                  <FeaturedThumb video={v} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(26,29,59,0.82) 0%, transparent 60%)',
                    opacity: hoveredStrip === v.id ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, padding: '14px',
                    opacity: hoveredStrip === v.id ? 1 : 0,
                    transform: hoveredStrip === v.id ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.25s 0.1s, transform 0.25s 0.1s',
                  }}>
                    <span style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, color: '#f5a623' }}>
                      {v.category}
                    </span>
                    <p style={{ fontFamily: P, fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '3px', lineHeight: 1.25,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {v.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LIBRARY ─────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', paddingTop: query ? '40px' : '72px', paddingBottom: '100px' }}>
        <div className="max-w-7xl mx-auto px-6">

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
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat
                  const ac = CAT_ACTIVE[cat] ?? CAT_ACTIVE['All']
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        fontFamily: P, fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600,
                        textTransform: 'uppercase', padding: '7px 16px', borderRadius: '50px',
                        border: \`1px solid \${isActive ? ac.border : '#dde3f5'}\`,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: isActive ? ac.bg : '#ffffff',
                        color: isActive ? ac.color : '#4a4e6b',
                      }}
                    >
                      {CAT_SHORT[cat]}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Video grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filtered.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
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
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <h2 style={{
              fontFamily: P, fontWeight: 900, fontSize: 'clamp(40px, 8vw, 110px)',
              lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #1a1d3b 0%, #b39ddb 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ZOUK<br /><span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>STEPS</span>
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

function FeaturedThumb({ video }: { video: Video | undefined }) {
  if (!video) return <div style={{ width: '100%', height: '100%', background: '#dde3f5' }} />
  const hasThumb = video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ'
  if (hasThumb) {
    return (
      <img
        src={\`https://img.youtube.com/vi/\${video.youtubeId}/maxresdefault.jpg\`}
        alt={video.title}
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
`)

// ── src/pages/VideoDetail.tsx ────────────────────────────────────────────────
write('src/pages/VideoDetail.tsx', `import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { getVideoById, getRelatedVideos } from '../data/videos'
import { CategoryTag } from '../components/CategoryTag'
import { TrainingPanel } from '../components/TrainingPanel'
import { RelatedVideos } from '../components/RelatedVideos'

const P = "'Poppins', sans-serif"

export function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const video = id ? getVideoById(id) : undefined

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (!video) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: P, color: '#8b95b8', fontSize: '15px', marginBottom: '16px' }}>
          Vídeo não encontrado.
        </p>
        <Link to="/" style={{ fontFamily: P, color: '#f5a623', fontSize: '13px', textDecoration: 'none' }}>
          ← Voltar para a biblioteca
        </Link>
      </div>
    )
  }

  const formattedDate = new Date(video.date).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const related = getRelatedVideos(video)

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Breadcrumb bar */}
      <div style={{ background: '#f0f4ff', padding: '12px 0', borderBottom: '1px solid #dde3f5' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: P, fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600,
              textTransform: 'uppercase', color: '#4a4e6b', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f5a623')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4e6b')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Biblioteca
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Player */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#1a1d3b', aspectRatio: '16/9', marginBottom: '32px', boxShadow: '0 8px 40px rgba(26,29,59,0.2)' }}>
          {video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ' ? (
            <iframe
              style={{ width: '100%', height: '100%', border: 'none' }}
              src={\`https://www.youtube.com/embed/\${video.youtubeId}\`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video.videoUrl ? (
            <video
              style={{ width: '100%', height: '100%', background: '#1a1d3b' }}
              src={video.videoUrl}
              controls
              controlsList="nodownload"
              playsInline
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a1d3b 0%, #2d3163 100%)',
            }}>
              <svg width="52" height="52" style={{ color: 'rgba(179,157,219,0.4)', marginBottom: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p style={{ fontFamily: P, color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '4px' }}>Vídeo ainda não disponível</p>
              <p style={{ fontFamily: P, color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Este passo será documentado em breve</p>
            </div>
          )}
        </div>

        {/* Title + category */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: P, fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: '#1a1d3b', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            {video.title}
          </h1>
          <CategoryTag category={video.category} size="md" />
        </div>

        {/* Metadata row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '20px',
          paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #dde3f5',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {video.presenter}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {video.duration}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontFamily: P, fontSize: '14px', lineHeight: 1.75, color: '#4a4e6b', marginBottom: '20px' }}>
          {video.description}
        </p>

        {/* Technical details */}
        {video.technicalDetails && (
          <div style={{
            padding: '16px 20px', background: '#f0f4ff',
            borderLeft: '3px solid #00c9a7', borderRadius: '0 10px 10px 0', marginBottom: '20px',
          }}>
            <p style={{ fontFamily: P, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, color: '#00c9a7', marginBottom: '6px' }}>
              Detalhes Técnicos
            </p>
            <p style={{ fontFamily: P, fontSize: '13px', lineHeight: 1.7, color: '#4a4e6b' }}>
              {video.technicalDetails}
            </p>
          </div>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {video.tags.map((tag) => (
              <Link
                key={tag}
                to={\`/?q=\${encodeURIComponent(tag)}\`}
                style={{
                  fontFamily: P, fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600,
                  padding: '5px 12px', borderRadius: '20px',
                  background: 'rgba(179,157,219,0.1)', border: '1px solid rgba(179,157,219,0.3)',
                  color: '#7c5cbf', textDecoration: 'none', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(179,157,219,0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(179,157,219,0.1)')}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <TrainingPanel videoId={video.id} video={video} />
        <RelatedVideos videos={related} />
      </main>
    </div>
  )
}
`)

// ── src/pages/TrainingQueue.tsx ──────────────────────────────────────────────
write('src/pages/TrainingQueue.tsx', `import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTraining } from '../hooks/useTraining'
import { videos } from '../data/videos'
import { CategoryTag } from '../components/CategoryTag'
import type { TrainingScore, VideoCategory } from '../types'

const P = "'Poppins', sans-serif"

const SCORE_CONFIG: Record<TrainingScore, { label: string; barColor: string; textColor: string; bg: string; border: string }> = {
  0: { label: 'Não praticado',      barColor: '#b39ddb', textColor: '#7c5cbf', bg: 'rgba(179,157,219,0.1)', border: 'rgba(179,157,219,0.3)' },
  1: { label: 'Iniciante',          barColor: '#f06292', textColor: '#c2185b', bg: 'rgba(240,98,146,0.1)',  border: 'rgba(240,98,146,0.3)'  },
  2: { label: 'Em desenvolvimento', barColor: '#ffa726', textColor: '#e65100', bg: 'rgba(255,167,38,0.1)',  border: 'rgba(255,167,38,0.3)'  },
  3: { label: 'Confortável',        barColor: '#4fc3f7', textColor: '#0086b3', bg: 'rgba(79,195,247,0.1)',  border: 'rgba(79,195,247,0.3)'  },
  4: { label: 'Forte',              barColor: '#00c9a7', textColor: '#00a086', bg: 'rgba(0,201,167,0.1)',   border: 'rgba(0,201,167,0.3)'   },
  5: { label: 'Dominado',           barColor: '#f5a623', textColor: '#c97d00', bg: 'rgba(245,166,35,0.1)',  border: 'rgba(245,166,35,0.3)'  },
}

export function TrainingQueue() {
  const { getProgress } = useTraining()
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'needs' | 'ontrack' | 'all'>('all')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent' | 'never'>('score')

  const allVideosWithProgress = videos.map((video) => {
    const progress = getProgress(video.id)
    return {
      video,
      progress,
      effectiveScore: progress?.trainingScore ?? video.knowledgeLevel,
      timesReviewed: progress?.timesReviewed ?? 0,
      lastReviewedAt: progress?.lastReviewedAt,
    }
  })

  const filteredAndSorted = useMemo(() => {
    let result = allVideosWithProgress
    if (selectedCategory !== 'all') result = result.filter((i) => i.video.category === selectedCategory)
    if (statusFilter === 'needs') result = result.filter((i) => i.effectiveScore <= 2)
    else if (statusFilter === 'ontrack') result = result.filter((i) => i.effectiveScore >= 3)

    return result.sort((a, b) => {
      if (sortBy === 'score') {
        if (a.effectiveScore !== b.effectiveScore) return a.effectiveScore - b.effectiveScore
        return a.video.title.localeCompare(b.video.title)
      }
      if (sortBy === 'name') return a.video.title.localeCompare(b.video.title)
      if (sortBy === 'recent') {
        const aT = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0
        const bT = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0
        return bT - aT
      }
      if (sortBy === 'never') {
        if (a.timesReviewed === 0 && b.timesReviewed === 0) return a.effectiveScore - b.effectiveScore
        if (a.timesReviewed === 0) return -1
        if (b.timesReviewed === 0) return 1
        return a.effectiveScore - b.effectiveScore
      }
      return 0
    })
  }, [allVideosWithProgress, selectedCategory, statusFilter, sortBy])

  const needsTraining = filteredAndSorted.filter((i) => i.effectiveScore <= 2)
  const onTrack = filteredAndSorted.filter((i) => i.effectiveScore >= 3)

  const selectStyle: React.CSSProperties = {
    fontFamily: P, fontSize: '13px', color: '#1a1d3b',
    background: '#ffffff', border: '1px solid #dde3f5',
    borderRadius: '10px', padding: '9px 12px', width: '100%',
    cursor: 'pointer', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: P, fontSize: '10px', letterSpacing: '0.2em',
    fontWeight: 700, textTransform: 'uppercase', color: '#8b95b8',
    marginBottom: '8px', display: 'block',
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Light header */}
      <div style={{ background: '#f0f4ff', borderBottom: '1px solid #dde3f5', padding: '56px 0 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #b39ddb22 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.45em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Progresso
          </p>
          <h1 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(48px, 9vw, 88px)', color: '#1a1d3b', lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            FILA DE<br />
            <span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              TREINO
            </span>
          </h1>
          <p style={{ fontFamily: P, fontSize: '14px', color: '#4a4e6b', marginTop: '16px', lineHeight: 1.6 }}>
            Passos que você deve revisar, ordenados por prioridade de treino.
          </p>
        </div>
      </div>

      {/* Body */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', padding: '24px', background: '#f0f4ff', borderRadius: '16px', border: '1px solid #dde3f5' }}>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={labelStyle}>Categoria</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as VideoCategory | 'all')} style={selectStyle}>
                <option value="all">Todas as categorias</option>
                <option value="Base e Deslocamento">Base e Deslocamento</option>
                <option value="Abertura">Abertura</option>
                <option value="Giros e Dinâmicas">Giros e Dinâmicas</option>
                <option value="Pêndulos">Pêndulos</option>
                <option value="Movimentos de Tronco e Cabeça">Movimentos de Tronco e Cabeça</option>
                <option value="Conexões e Estilizações">Conexões e Estilizações</option>
                <option value="Finalizações">Finalizações</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={labelStyle}>Ordenar por</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={selectStyle}>
                <option value="score">Por Nível (Menor Prioridade)</option>
                <option value="never">Nunca Revisados Primeiro</option>
                <option value="recent">Mais Recentemente Revisado</option>
                <option value="name">Por Nome (A-Z)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {([
                { key: 'all',     label: \`Todos (\${filteredAndSorted.length})\`,        activeBg: '#1a1d3b', activeFg: '#ffffff', activeBorder: '#1a1d3b' },
                { key: 'needs',   label: \`Precisam Treino (\${needsTraining.length})\`,  activeBg: 'rgba(240,98,146,0.12)', activeFg: '#c2185b', activeBorder: '#f06292' },
                { key: 'ontrack', label: \`No Caminho Certo (\${onTrack.length})\`,        activeBg: 'rgba(0,201,167,0.12)',  activeFg: '#00a086', activeBorder: '#00c9a7' },
              ] as const).map(({ key, label, activeBg, activeFg, activeBorder }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  style={{
                    fontFamily: P, fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600,
                    textTransform: 'uppercase', padding: '7px 16px', borderRadius: '50px',
                    border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    background: statusFilter === key ? activeBg : '#ffffff',
                    color: statusFilter === key ? activeFg : '#4a4e6b',
                    borderColor: statusFilter === key ? activeBorder : '#dde3f5',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
            <p style={{ fontFamily: P, color: '#8b95b8', fontSize: '14px' }}>Nenhum passo encontrado com esses filtros.</p>
          </div>
        ) : (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[
                { value: filteredAndSorted.length, label: 'Passos visíveis',  color: '#1a1d3b' },
                { value: needsTraining.length,     label: 'Precisam treino',  color: '#f06292' },
                { value: onTrack.length,            label: 'No caminho certo', color: '#00c9a7' },
              ].map(({ value, label, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '16px', border: '1px solid #dde3f5', borderRadius: '14px', background: '#f0f4ff' }}>
                  <p style={{ fontFamily: P, fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontFamily: P, fontSize: '11px', letterSpacing: '0.08em', color: '#8b95b8', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredAndSorted.map((item, index) => (
                <TrainingRow
                  key={item.video.id}
                  rank={statusFilter === 'all' ? index + 1 : undefined}
                  video={item.video}
                  timesReviewed={item.timesReviewed}
                  score={item.effectiveScore}
                  lastReviewedAt={item.lastReviewedAt}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

interface TrainingRowProps {
  rank?: number
  video: { id: string; title: string; category: Exclude<VideoCategory, 'All'>; youtubeId?: string }
  timesReviewed: number
  score: TrainingScore
  lastReviewedAt?: string
}

function TrainingRow({ rank, video, timesReviewed, score, lastReviewedAt }: TrainingRowProps) {
  const cfg = SCORE_CONFIG[score]
  const lastReviewed = lastReviewedAt
    ? new Date(lastReviewedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    : null
  const hasRealVideo = video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ'

  return (
    <Link
      to={\`/video/\${video.id}\`}
      className="group"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 16px', borderBottom: '1px solid #f0f4ff',
        textDecoration: 'none', transition: 'background 0.15s',
        background: '#ffffff', borderRadius: '2px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9ff')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
    >
      {rank !== undefined && (
        <span style={{ fontFamily: P, fontSize: '13px', fontWeight: 600, color: '#b39ddb', width: '24px', textAlign: 'center', flexShrink: 0 }}>
          {rank}
        </span>
      )}

      {hasRealVideo ? (
        <img
          src={\`https://img.youtube.com/vi/\${video.youtubeId}/hqdefault.jpg\`}
          alt={video.title}
          style={{ width: '72px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: '72px', height: '44px', borderRadius: '8px', background: '#e8ecf8',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" style={{ color: '#b39ddb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: P, fontSize: '14px', fontWeight: 700, color: '#1a1d3b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
          {video.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CategoryTag category={video.category} />
          {timesReviewed > 0 && (
            <span style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8' }}>
              {timesReviewed}× {lastReviewed && \`· \${lastReviewed}\`}
            </span>
          )}
        </div>
      </div>

      <div style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: '10px',
        border: \`1px solid \${cfg.border}\`, background: cfg.bg, textAlign: 'center', minWidth: '72px',
      }}>
        <p style={{ fontFamily: P, fontSize: '18px', fontWeight: 800, color: cfg.textColor, lineHeight: 1 }}>{score}</p>
        <p style={{ fontFamily: P, fontSize: '10px', fontWeight: 600, color: cfg.textColor, marginTop: '2px', letterSpacing: '0.04em' }}>{cfg.label}</p>
      </div>

      <div className="hidden sm:block" style={{ width: '80px', flexShrink: 0 }}>
        <div style={{ height: '4px', borderRadius: '2px', background: '#dde3f5', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '2px', background: cfg.barColor, width: \`\${(score / 5) * 100}%\`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontFamily: P, fontSize: '10px', color: '#8b95b8', textAlign: 'right', marginTop: '3px' }}>{score}/5</p>
      </div>
    </Link>
  )
}
`)

// ── src/pages/FlowMap.tsx — list view goes light, rede stays dark ─────────────
write('src/pages/FlowMap.tsx', `import { useState } from 'react'
import { Link } from 'react-router-dom'
import { zoukFlowMap as conexoes } from '../data/styles/zouk/flowMap'
import { videos, getVideoById } from '../data/videos'
import { FlowMapGraph } from '../components/FlowMapGraph'

const P = "'Poppins', sans-serif"

type HubId = keyof typeof conexoes.hubs

interface HubData {
  id: HubId
  title: string
  description: string
  icon: string
  color: string
  difficulty: number
  videoIds: string[]
  notes: string
}

void videos

export function FlowMap() {
  const [view, setView] = useState<'lista' | 'rede'>('lista')
  const [selectedFlow, setSelectedFlow] = useState<number>(0)
  const [expandedHub, setExpandedHub] = useState<HubId | null>(null)

  const hubs = Object.values(conexoes.hubs) as HubData[]
  const flows = conexoes.commonFlows
  const currentFlow = flows[selectedFlow]
  const flowHubIds = currentFlow.sequence as HubId[]

  return (
    <div
      style={{
        background: view === 'rede' ? '#080706' : '#ffffff',
        minHeight: '100vh',
        display: view === 'rede' ? 'flex' : 'block',
        flexDirection: 'column',
        height: view === 'rede' ? '100vh' : 'auto',
        overflow: view === 'rede' ? 'hidden' : 'auto',
      }}
    >
      {/* Header */}
      <div style={{
        background: view === 'rede' ? '#0A0A0A' : '#f0f4ff',
        borderBottom: view === 'rede' ? 'none' : '1px solid #dde3f5',
        padding: '40px 0 44px', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        {view === 'lista' && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #b39ddb22 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        )}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.45em', color: view === 'rede' ? '#C9A55A' : '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Estrutura
          </p>
          <h1 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(36px, 7vw, 72px)', color: view === 'rede' ? '#ffffff' : '#1a1d3b', lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            MAPA<br />
            <span style={view === 'rede'
              ? { color: '#C9A55A' }
              : { background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
            }>
              MENTAL
            </span>
          </h1>
          <p style={{ fontFamily: P, fontSize: '14px', color: view === 'rede' ? 'rgba(255,255,255,0.38)' : '#4a4e6b', marginTop: '14px', marginBottom: '20px' }}>
            Entenda como os passos se conectam em fluxos musicais
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['lista', 'rede'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontFamily: P, fontSize: '10px', letterSpacing: '0.2em', fontWeight: 700,
                  textTransform: 'uppercase', padding: '8px 20px', borderRadius: '50px',
                  border: \`1px solid \${view === v ? '#f5a623' : (v === 'rede' && view !== 'lista') ? 'rgba(255,255,255,0.12)' : '#dde3f5'}\`,
                  background: view === v ? 'rgba(245,166,35,0.12)' : 'transparent',
                  color: view === v ? '#f5a623' : (view === 'rede' ? 'rgba(255,255,255,0.4)' : '#4a4e6b'),
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {v === 'lista' ? '☰ Lista' : '◉ Rede'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── REDE VIEW (stays dark) ── */}
      {view === 'rede' && (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <FlowMapGraph />
        </div>
      )}

      {/* ── LISTA VIEW (light) ── */}
      {view === 'lista' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 100px' }}>

          {/* Flow Selector */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Fluxos Comuns
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {flows.map((flow, index) => (
                <button
                  key={index}
                  onClick={() => { setSelectedFlow(index); setExpandedHub(null) }}
                  style={{
                    padding: '16px', borderRadius: '14px',
                    border: \`1px solid \${selectedFlow === index ? '#f5a623' : '#dde3f5'}\`,
                    background: selectedFlow === index ? 'rgba(245,166,35,0.08)' : '#ffffff',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontFamily: P, fontWeight: 700, fontSize: '14px', color: '#1a1d3b', marginBottom: '4px' }}>{flow.name}</p>
                  <p style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8' }}>{flow.difficulty}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Current Flow */}
          <div style={{ marginBottom: '48px', padding: '24px', background: '#f0f4ff', borderRadius: '16px', border: '1px solid #dde3f5' }}>
            <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {currentFlow.name}
            </h3>
            <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b', marginBottom: '20px', lineHeight: 1.6 }}>
              {currentFlow.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
              {flowHubIds.map((hubId, index) => {
                const hub = conexoes.hubs[hubId] as HubData
                return (
                  <div key={hubId} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedHub(expandedHub === hubId ? null : hubId)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: '10px 14px', borderRadius: '10px',
                        border: \`1px solid \${expandedHub === hubId ? '#f5a623' : '#dde3f5'}\`,
                        background: expandedHub === hubId ? 'rgba(245,166,35,0.08)' : '#ffffff',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{hub.icon}</span>
                      <p style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#1a1d3b', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {hub.title}
                      </p>
                    </button>
                    {index < flowHubIds.length - 1 && (
                      <svg width="20" height="12" style={{ color: '#b39ddb', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 8">
                        <path d="M0 4h20m-5-3l5 3-5 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expanded Hub */}
          {expandedHub && (
            <div style={{ marginBottom: '40px', padding: '24px', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '16px', background: 'rgba(245,166,35,0.04)' }}>
              <HubDetails hubId={expandedHub} onClose={() => setExpandedHub(null)} />
            </div>
          )}

          {/* All Hubs Grid */}
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Todos os Hubs
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => setExpandedHub(expandedHub === hub.id ? null : hub.id)}
                  style={{
                    textAlign: 'left', padding: '20px', borderRadius: '16px',
                    border: \`1px solid \${expandedHub === hub.id ? '#f5a623' : '#dde3f5'}\`,
                    background: expandedHub === hub.id ? 'rgba(245,166,35,0.05)' : '#ffffff',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (expandedHub !== hub.id) e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)' }}
                  onMouseLeave={(e) => { if (expandedHub !== hub.id) e.currentTarget.style.borderColor = '#dde3f5' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{hub.icon}</span>
                    <span style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#8b95b8', padding: '2px 8px', border: '1px solid #dde3f5', borderRadius: '20px' }}>
                      {hub.difficulty}/5
                    </span>
                  </div>
                  <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '16px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                    {hub.title}
                  </h3>
                  <p style={{ fontFamily: P, fontSize: '12px', color: '#4a4e6b', lineHeight: 1.5 }}>{hub.description}</p>
                  {hub.videoIds.length > 0 && (
                    <p style={{ fontFamily: P, fontSize: '11px', color: '#f5a623', marginTop: '8px', fontWeight: 700 }}>
                      {hub.videoIds.length} vídeo{hub.videoIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <p style={{ fontFamily: P, fontSize: '11px', color: '#b39ddb', fontStyle: 'italic', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dde3f5' }}>
                    {hub.notes}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

interface HubDetailsProps {
  hubId: HubId
  onClose: () => void
}

function HubDetails({ hubId, onClose }: HubDetailsProps) {
  const hub = conexoes.hubs[hubId] as HubData
  const outgoing = conexoes.connections.filter((c) => c.fromHub === hubId)
  const incoming = conexoes.connections.filter((c) => c.toHub === hubId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '36px' }}>{hub.icon}</span>
          <div>
            <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', letterSpacing: '-0.01em' }}>{hub.title}</h3>
            <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>{hub.description}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ fontFamily: P, fontSize: '14px', color: '#8b95b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          ✕
        </button>
      </div>

      {hub.videoIds.length > 0 && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #dde3f5' }}>
          <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Passos deste hub
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hub.videoIds.map((videoId) => {
              const video = getVideoById(videoId)
              if (!video) return null
              return (
                <Link
                  key={videoId}
                  to={\`/video/\${videoId}\`}
                  style={{
                    fontFamily: P, fontSize: '12px', fontWeight: 600, color: '#1a1d3b',
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid #dde3f5',
                    background: '#ffffff', textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f5a623'; e.currentTarget.style.color = '#c97d00' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde3f5'; e.currentTarget.style.color = '#1a1d3b' }}
                >
                  {video.title}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: outgoing.length > 0 && incoming.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {outgoing.length > 0 && (
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#8b95b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              Para onde vai daqui
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outgoing.map((conn, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{(conexoes.hubs[conn.toHub as HubId] as HubData)?.icon}</span>
                  <div>
                    <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{(conexoes.hubs[conn.toHub as HubId] as HubData)?.title}</p>
                    {conn.description && <p style={{ fontFamily: P, fontSize: '11px', color: '#4a4e6b' }}>{conn.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {incoming.length > 0 && (
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#8b95b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              De onde vem
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incoming.map((conn, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{(conexoes.hubs[conn.fromHub as HubId] as HubData)?.icon}</span>
                  <div>
                    <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{(conexoes.hubs[conn.fromHub as HubId] as HubData)?.title}</p>
                    {conn.description && <p style={{ fontFamily: P, fontSize: '11px', color: '#4a4e6b' }}>{conn.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
`)

console.log('\nAll files written successfully!')
