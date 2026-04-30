export type VideoCategory =
  | 'Base e Deslocamento'
  | 'Abertura'
  | 'Giros e Dinâmicas'
  | 'Pêndulos'
  | 'Movimentos de Tronco e Cabeça'
  | 'Conexões e Estilizações'
  | 'Finalizações'
  | 'All'

/**
 * 1 = Needs training — critical gap
 * 2 = Developing — needs practice
 * 3 = Comfortable — needs refinement
 * 4 = Strong — minor adjustments
 * 5 = Mastered — no need to revisit
 */
export type TrainingScore = 0 | 1 | 2 | 3 | 4 | 5

export interface VideoProgress {
  videoId: string
  timesReviewed: number
  /** How much the user still needs to train this topic (0–5) */
  trainingScore: TrainingScore
  lastReviewedAt: string // ISO date string
  notes?: string
}

/** A single video recording of a dance step. */
export interface VideoSource {
  /** Short label shown in the source selector tab, e.g. "Câmera frontal", "Slow-motion" */
  label?: string
  youtubeId?: string
  videoUrl?: string
  /** Overrides Video.duration for this specific source */
  duration?: string
  /** Overrides Video.presenter for this specific source */
  presenter?: string
}

export interface Video {
  id: string
  /** Dance style this video belongs to (e.g. 'zouk', 'bachata') */
  styleId?: string
  title: string
  description: string
  /** Primary YouTube video ID (used for embed and thumbnail) */
  youtubeId?: string
  /** Primary direct video URL (for internally hosted videos) */
  videoUrl?: string
  /** Thumbnail image URL — defaults to YouTube thumbnail if youtubeId is set */
  thumbnail?: string
  duration: string
  date: string
  category: string
  tags: string[]
  presenter: string
  /** Knowledge level (0-5): how comfortable you are with this step */
  knowledgeLevel: TrainingScore
  /** Technical details about the movement */
  technicalDetails?: string
  /** Hub IDs que esse passo pode ser usado (fluxo/mapa mental) */
  hubs?: string[]
  /**
   * Additional video recordings of this step (different angles, speeds, presenters).
   * When present, VideoDetail shows a source selector and uses these instead of
   * the top-level youtubeId/videoUrl.
   */
  sources?: VideoSource[]
}
