import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTraining } from '../hooks/useTraining'
import { CategoryTag } from '../components/CategoryTag'
import { useActiveStyle } from '../context/StyleContext'
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
  const { activeStyle } = useActiveStyle()
  const styleVideos = activeStyle.videos

  const categories = useMemo(() => {
    const cats = new Set(styleVideos.map((v) => v.category))
    return Array.from(cats)
  }, [styleVideos])

  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'needs' | 'ontrack' | 'all'>('all')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent' | 'never'>('score')

  const allVideosWithProgress = styleVideos.map((video) => {
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
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={selectStyle}>
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
                { key: 'all',     label: `Todos (${filteredAndSorted.length})`,        activeBg: '#1a1d3b', activeFg: '#ffffff', activeBorder: '#1a1d3b' },
                { key: 'needs',   label: `Precisam Treino (${needsTraining.length})`,  activeBg: 'rgba(240,98,146,0.12)', activeFg: '#c2185b', activeBorder: '#f06292' },
                { key: 'ontrack', label: `No Caminho Certo (${onTrack.length})`,        activeBg: 'rgba(0,201,167,0.12)',  activeFg: '#00a086', activeBorder: '#00c9a7' },
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
  video: { id: string; title: string; category: string; youtubeId?: string }
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
      to={`/video/${video.id}`}
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
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
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
          <CategoryTag category={video.category as Exclude<VideoCategory, 'All'>} />
          {timesReviewed > 0 && (
            <span style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8' }}>
              {timesReviewed}× {lastReviewed && `· ${lastReviewed}`}
            </span>
          )}
        </div>
      </div>

      <div style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: '10px',
        border: `1px solid ${cfg.border}`, background: cfg.bg, textAlign: 'center', minWidth: '72px',
      }}>
        <p style={{ fontFamily: P, fontSize: '18px', fontWeight: 800, color: cfg.textColor, lineHeight: 1 }}>{score}</p>
        <p style={{ fontFamily: P, fontSize: '10px', fontWeight: 600, color: cfg.textColor, marginTop: '2px', letterSpacing: '0.04em' }}>{cfg.label}</p>
      </div>

      <div className="hidden sm:block" style={{ width: '80px', flexShrink: 0 }}>
        <div style={{ height: '4px', borderRadius: '2px', background: '#dde3f5', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '2px', background: cfg.barColor, width: `${(score / 5) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontFamily: P, fontSize: '10px', color: '#8b95b8', textAlign: 'right', marginTop: '3px' }}>{score}/5</p>
      </div>
    </Link>
  )
}
