import { Link } from 'react-router-dom'
import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { DanceStep } from '../types'
import { getVideoThumbnail, getFirstYoutubeId } from '../data/videos'
import { VideoPreviewTooltip, type VideoPreviewTooltipState } from './VideoPreviewTooltip'
import './StepTable.css'

export type StepSortCol = 'name' | 'category' | 'difficulty' | 'duration'

export interface StepTableProps {
  steps: DanceStep[]
  sortBy: StepSortCol | null
  sortDir: 'asc' | 'desc'
  onSort: (col: StepSortCol) => void
  accentColor?: string
}

const LEVEL_CONFIG = [
  { dot: '#b39ddb', label: 'Não praticado' },
  { dot: '#f06292', label: 'Iniciante'     },
  { dot: '#ffd54f', label: 'Desenvolvendo' },
  { dot: '#4fc3f7', label: 'Confortável'   },
  { dot: '#00c9a7', label: 'Forte'         },
  { dot: '#f5a623', label: 'Dominado'      },
]

const CAT_COLOR: Record<string, string> = {
  'Base e Deslocamento':           '#00c9a7',
  'Abertura':                      '#4fc3f7',
  'Giros e Dinâmicas':             '#b39ddb',
  'Pêndulos':                      '#f06292',
  'Movimentos de Tronco e Cabeça': '#ffd54f',
  'Conexões e Estilizações':       '#f5a623',
  'Finalizações':                  '#00e676',
}

const COLS: { key: StepSortCol; label: string }[] = [
  { key: 'name',       label: 'Nome'        },
  { key: 'category',   label: 'Categoria'   },
  { key: 'difficulty', label: 'Dificuldade' },
  { key: 'duration',   label: 'Duração'     },
]


export function StepTable({ steps, sortBy, sortDir, onSort, accentColor = '#f5a623' }: StepTableProps) {
  const [tooltipState, setTooltipState] = useState<VideoPreviewTooltipState | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setTooltipState((prev) => (prev?.pinned ? prev : null))
    }, 300)
  }, [])

  const handleThumbMouseEnter = useCallback((step: DanceStep, e: React.MouseEvent) => {
    cancelClose()
    setTooltipState((prev) => {
      if (prev?.pinned) return prev
      return {
        step,
        screenX: e.clientX,
        screenY: e.clientY,
        pinned: false,
      }
    })
  }, [cancelClose])

  const handleThumbClick = useCallback((step: DanceStep, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cancelClose()
    setTooltipState((prev) => prev
      ? { ...prev, pinned: true }
      : { step, screenX: e.clientX, screenY: e.clientY, pinned: true }
    )
  }, [cancelClose])

  const handleClose = useCallback(() => {
    cancelClose()
    setTooltipState(null)
  }, [cancelClose])

  const handlePin = useCallback(() => {
    setTooltipState((prev) => prev ? { ...prev, pinned: true } : null)
  }, [])

  return (
    <div className="step-table__wrap">
      <table className="step-table">
        <thead>
          <tr>
            <th className="step-table__th step-table__th--thumb" />
            {COLS.map(({ key, label }) => {
              const active = sortBy === key
              return (
                <th
                  key={key}
                  className="step-table__th"
                  onClick={() => onSort(key)}
                  style={{ color: active ? accentColor : undefined }}
                >
                  {label}
                  <span className="step-table__sort-icon">
                    {active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            const thumbnail = getVideoThumbnail(step)
            const firstYT = getFirstYoutubeId(step)
            const level = LEVEL_CONFIG[step.difficulty] ?? LEVEL_CONFIG[0]
            const catColor = CAT_COLOR[step.category] ?? accentColor

            return (
              <tr key={step.id} className="step-table__row">
                {/* Thumbnail — hover abre preview, click fixa */}
                <td className="step-table__td step-table__td--thumb">
                  <button
                    onMouseEnter={(e) => handleThumbMouseEnter(step, e)}
                    onMouseLeave={scheduleClose}
                    onClick={(e) => handleThumbClick(step, e)}
                    className="step-table__thumb-link"
                    type="button"
                    title="Pré-visualizar vídeo"
                  >
                    {firstYT ? (
                      <img src={thumbnail} alt={step.name} className="step-table__thumb" loading="lazy" />
                    ) : (
                      <div className="step-table__thumb step-table__thumb--placeholder">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="step-table__thumb--placeholder-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </button>
                </td>

                {/* Name */}
                <td className="step-table__td">
                  <Link to={`/video/${step.id}`} className="step-table__name">
                    {step.name}
                  </Link>
                </td>

                {/* Category */}
                <td className="step-table__td">
                  <span
                    className="step-table__cat-badge"
                    style={{ color: catColor, borderColor: catColor, background: `${catColor}18` }}
                  >
                    {step.category}
                  </span>
                </td>

                {/* Difficulty */}
                <td className="step-table__td">
                  <div className="step-table__level">
                    <span className="step-table__level-dot" style={{ background: level.dot }} />
                    <span>{level.label}</span>
                  </div>
                </td>

                {/* Duration */}
                <td className="step-table__td step-table__td--duration">
                  {step.duration ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Quick-preview tooltip — portal para o body para evitar problemas de stacking context */}
      {tooltipState && createPortal(
        <VideoPreviewTooltip
          state={tooltipState}
          onClose={handleClose}
          interactive={true}
          onPin={handlePin}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          hintText="Clique na thumbnail para fixar"
        />,
        document.body
      )}
    </div>
  )
}
