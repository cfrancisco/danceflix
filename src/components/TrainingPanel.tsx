import { useState } from 'react'
import type { Level, TrainingProgress, DanceStep } from '../types'
import { useTraining } from '../hooks/useTraining'
import './TrainingPanel.css'

const LEVEL_CONFIG: Record<Level, { description: string; color: string }> = {
  0: { description: 'Não praticado — nunca tentou',          color: '#8b95b8' },
  1: { description: 'Iniciante — começando a aprender',       color: '#f06292' },
  2: { description: 'Em desenvolvimento — precisa praticar',  color: '#ffa726' },
  3: { description: 'Confortável — executa com confiança',    color: '#4fc3f7' },
  4: { description: 'Forte — pequenos ajustes',               color: '#00c9a7' },
  5: { description: 'Dominado — totalmente confiante',        color: '#f5a623' },
}

interface TrainingPanelProps {
  stepId: string
  step: DanceStep
}

export function TrainingPanel({ stepId, step }: TrainingPanelProps) {
  const { getProgress, markReviewed, resetProgress } = useTraining()
  const progress: TrainingProgress | undefined = getProgress(stepId)

  const [selectedLevel, setSelectedLevel] = useState<Level>(
    progress?.learningLevel ?? step.difficulty,
  )
  const [justSaved, setJustSaved] = useState(false)

  function handleMarkReviewed() {
    markReviewed(stepId, selectedLevel)
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
    <div className="tp-panel">
      {/* Header */}
      <div className="tp-header">
        <h2 className="tp-header__title">Rastreador de Treino</h2>
        {progress && (
          <div className="tp-header__meta">
            <span className="tp-header__reviewed">{progress.timesReviewed}× revisado</span>
            {lastReviewed && (
              <span className="tp-header__last">Último: {lastReviewed}</span>
            )}
          </div>
        )}
      </div>

      {/* Level selector */}
      <div>
        <p className="tp-levels__prompt">
          Qual o seu <strong>nível de aprendizado</strong> neste passo?
        </p>
        <div className="tp-levels">
          {([0, 1, 2, 3, 4, 5] as Level[]).map((lvl) => {
            const isSelected = selectedLevel === lvl
            const cfg = LEVEL_CONFIG[lvl]
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                title={cfg.description}
                className="tp-levels__btn"
                style={{
                  border: `1px solid ${isSelected ? cfg.color : '#dde3f5'}`,
                  background: isSelected ? cfg.color : '#ffffff',
                  color: isSelected ? '#ffffff' : '#8b95b8',
                }}
              >
                {lvl}
              </button>
            )
          })}
        </div>
        <p className="tp-levels__desc" style={{ color: LEVEL_CONFIG[selectedLevel].color }}>
          {LEVEL_CONFIG[selectedLevel].description}
        </p>
      </div>

      {/* Actions */}
      <div className="tp-actions">
        <button
          onClick={handleMarkReviewed}
          className="tp-actions__save"
          style={{
            background: justSaved ? '#00c9a7' : '#f5a623',
            boxShadow: justSaved ? '0 4px 12px rgba(0,201,167,0.35)' : '0 4px 12px rgba(245,166,35,0.35)',
          }}
        >
          {justSaved ? '✓ Salvo!' : progress ? 'Marcar como Revisado Novamente' : 'Marcar como Revisado'}
        </button>

        {progress && (
          <button
            onClick={() => resetProgress(stepId)}
            title="Resetar progresso deste passo"
            className="tp-actions__reset"
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
