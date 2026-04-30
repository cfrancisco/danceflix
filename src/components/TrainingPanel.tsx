import { useState } from 'react'
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
                  border: `1px solid ${isSelected ? SCORE_LABELS[score].color : '#dde3f5'}`,
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
