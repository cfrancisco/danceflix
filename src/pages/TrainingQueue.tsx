import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTraining } from '../hooks/useTraining'
import { getFirstYoutubeId } from '../data/videos'
import { CategoryTag } from '../components/CategoryTag'
import { useActiveStyle } from '../context/StyleContext'
import type { Level, StepCategory, DanceStep } from '../types'
import './TrainingQueue.css'

const SCORE_CONFIG: Record<Level, { label: string; barColor: string; textColor: string; bg: string; border: string }> = {
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
  const styleSteps = activeStyle.steps

  const categories = useMemo(() => {
    const cats = new Set(styleSteps.map((s) => s.category))
    return Array.from(cats)
  }, [styleSteps])

  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'needs' | 'ontrack' | 'all'>('all')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent' | 'never'>('score')

  const allStepsWithProgress = styleSteps.map((step) => {
    const progress = getProgress(step.id)
    return {
      step,
      progress,
      effectiveScore: (progress?.learningLevel ?? step.difficulty) as Level,
      timesReviewed: progress?.timesReviewed ?? 0,
      lastReviewedAt: progress?.lastReviewedAt,
    }
  })

  const filteredAndSorted = useMemo(() => {
    let result = allStepsWithProgress
    if (selectedCategory !== 'all') result = result.filter((i) => i.step.category === selectedCategory)
    if (statusFilter === 'needs') result = result.filter((i) => i.effectiveScore <= 2)
    else if (statusFilter === 'ontrack') result = result.filter((i) => i.effectiveScore >= 3)

    return result.sort((a, b) => {
      if (sortBy === 'score') {
        if (a.effectiveScore !== b.effectiveScore) return a.effectiveScore - b.effectiveScore
        return a.step.name.localeCompare(b.step.name)
      }
      if (sortBy === 'name') return a.step.name.localeCompare(b.step.name)
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
  }, [allStepsWithProgress, selectedCategory, statusFilter, sortBy])

  const needsTraining = filteredAndSorted.filter((i) => i.effectiveScore <= 2)
  const onTrack = filteredAndSorted.filter((i) => i.effectiveScore >= 3)

  return (
    <div className="tq-page">

      {/* Light header */}
      <div className="tq-header">
        <div className="tq-header__dot-grid" />
        <div className="tq-header__inner">
          <p className="tq-header__label">
            Progresso
          </p>
          <h1 className="tq-header__title">
            FILA DE<br />
            <span className="tq-header__title-gradient">
              TREINO
            </span>
          </h1>
          <p className="tq-header__desc">
            Passos que você deve revisar, ordenados por prioridade de treino.
          </p>
        </div>
      </div>

      {/* Body */}
      <main className="tq-main">

        {/* Filters */}
        <div className="tq-filters">

          <div className="tq-filters__row">
            <div className="tq-filters__field">
              <label className="tq-label">Categoria</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="tq-select">
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="tq-filters__field">
              <label className="tq-label">Ordenar por</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="tq-select">
                <option value="score">Por Nível (Menor Prioridade)</option>
                <option value="never">Nunca Revisados Primeiro</option>
                <option value="recent">Mais Recentemente Revisado</option>
                <option value="name">Por Nome (A-Z)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="tq-label">Status</label>
            <div className="tq-status-btns">
              {([
                { key: 'all',     label: `Todos (${filteredAndSorted.length})`,        activeBg: '#1a1d3b', activeFg: '#ffffff', activeBorder: '#1a1d3b' },
                { key: 'needs',   label: `Precisam Treino (${needsTraining.length})`,  activeBg: 'rgba(240,98,146,0.12)', activeFg: '#c2185b', activeBorder: '#f06292' },
                { key: 'ontrack', label: `No Caminho Certo (${onTrack.length})`,        activeBg: 'rgba(0,201,167,0.12)',  activeFg: '#00a086', activeBorder: '#00c9a7' },
              ] as const).map(({ key, label, activeBg, activeFg, activeBorder }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`tq-status-btn${statusFilter === key ? ' is-active' : ''}`}
                  style={statusFilter === key ? {
                    background: activeBg,
                    color: activeFg,
                    borderColor: activeBorder,
                  } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="tq-empty">
            <p className="tq-empty__text">Nenhum passo encontrado com esses filtros.</p>
          </div>
        ) : (
          <div>
            {/* Stats */}
            <div className="tq-stats">
              {[
                { value: filteredAndSorted.length, label: 'Passos visíveis',  color: '#1a1d3b' },
                { value: needsTraining.length,     label: 'Precisam treino',  color: '#f06292' },
                { value: onTrack.length,            label: 'No caminho certo', color: '#00c9a7' },
              ].map(({ value, label, color }) => (
                <div key={label} className="tq-stats__card">
                  <p className="tq-stats__value" style={{ color }}>{value}</p>
                  <p className="tq-stats__label">{label}</p>
                </div>
              ))}
            </div>

            <div className="tq-rows">
              {filteredAndSorted.map((item, index) => (
                <TrainingRow
                  key={item.step.id}
                  rank={statusFilter === 'all' ? index + 1 : undefined}
                  step={item.step}
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
  step: DanceStep
  timesReviewed: number
  score: Level
  lastReviewedAt?: string
}

function TrainingRow({ rank, step, timesReviewed, score, lastReviewedAt }: TrainingRowProps) {
  const cfg = SCORE_CONFIG[score]
  const lastReviewed = lastReviewedAt
    ? new Date(lastReviewedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    : null
  const firstYT = getFirstYoutubeId(step)

  return (
    <Link
      to={`/video/${step.id}`}
      className="tq-row group"
    >
      {rank !== undefined && (
        <span className="tq-row__rank">
          {rank}
        </span>
      )}

      {firstYT ? (
        <img
          src={`https://img.youtube.com/vi/${firstYT}/hqdefault.jpg`}
          alt={step.name}
          className="tq-row__thumb"
          loading="lazy"
        />
      ) : (
        <div className="tq-row__thumb-placeholder">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="tq-row__body">
        <p className="tq-row__name">
          {step.name}
        </p>
        <div className="tq-row__meta">
          <CategoryTag category={step.category as Exclude<StepCategory, 'All'>} />
          {timesReviewed > 0 && (
            <span className="tq-row__review-info">
              {timesReviewed}× {lastReviewed && `· ${lastReviewed}`}
            </span>
          )}
        </div>
      </div>

      <div
        className="tq-row__score-badge"
        style={{ borderColor: cfg.border, background: cfg.bg }}
      >
        <p className="tq-row__score-value" style={{ color: cfg.textColor }}>{score}</p>
        <p className="tq-row__score-label" style={{ color: cfg.textColor }}>{cfg.label}</p>
      </div>

      <div className="tq-row__progress hidden sm:block">
        <div className="tq-row__progress-track">
          <div className="tq-row__progress-fill" style={{ background: cfg.barColor, width: `${(score / 5) * 100}%` }} />
        </div>
        <p className="tq-row__progress-text">{score}/5</p>
      </div>
    </Link>
  )
}
