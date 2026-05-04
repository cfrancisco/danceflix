import { Link } from 'react-router-dom'
import type { DanceStep } from '../types'
import { getVideoThumbnail } from '../data/videos'
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

const P = "'Poppins', sans-serif"

export function StepTable({ steps, sortBy, sortDir, onSort, accentColor = '#f5a623' }: StepTableProps) {
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
            const firstYT = step.youtubeVideos.find((id) => id !== '')
            const level = LEVEL_CONFIG[step.difficulty] ?? LEVEL_CONFIG[0]
            const catColor = CAT_COLOR[step.category] ?? accentColor

            return (
              <tr key={step.id} className="step-table__row">
                {/* Thumbnail */}
                <td className="step-table__td step-table__td--thumb">
                  <Link to={`/video/${step.id}`} className="step-table__thumb-link">
                    {firstYT ? (
                      <img src={thumbnail} alt={step.name} className="step-table__thumb" loading="lazy" />
                    ) : (
                      <div className="step-table__thumb step-table__thumb--placeholder">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#b39ddb' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>
                </td>

                {/* Name */}
                <td className="step-table__td">
                  <Link to={`/video/${step.id}`} className="step-table__name" style={{ fontFamily: P }}>
                    {step.name}
                  </Link>
                </td>

                {/* Category */}
                <td className="step-table__td">
                  <span
                    className="step-table__cat-badge"
                    style={{ color: catColor, borderColor: catColor, background: `${catColor}18`, fontFamily: P }}
                  >
                    {step.category}
                  </span>
                </td>

                {/* Difficulty */}
                <td className="step-table__td">
                  <div className="step-table__level">
                    <span className="step-table__level-dot" style={{ background: level.dot }} />
                    <span style={{ fontFamily: P }}>{level.label}</span>
                  </div>
                </td>

                {/* Duration */}
                <td className="step-table__td step-table__td--duration" style={{ fontFamily: P }}>
                  {step.duration ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
