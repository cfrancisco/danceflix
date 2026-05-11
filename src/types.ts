// ── Core scale ────────────────────────────────────────────────────────────────

/** Shared 0–5 scale used for both objective difficulty and subjective learning level */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

// ── Step categories ───────────────────────────────────────────────────────────

export type StepCategory =
  | 'Base e Deslocamento'
  | 'Abertura'
  | 'Giros e Dinâmicas'
  | 'Pêndulos'
  | 'Movimentos de Tronco e Cabeça'
  | 'Conexões e Estilizações'
  | 'Finalizações'
  | 'All'

// ── Video ─────────────────────────────────────────────────────────────────────

/** A step occurrence inside a video with optional timestamps */
export interface VideoStepOccurrence {
  stepId: string
  startTime?: number
  endTime?: number
}

/** A video entity — either a static catalog entry or a user library video. */
export interface Video {
  // ── Identity ───────────────────────────────────────────────────────────────
  id: string
  title: string
  description?: string
  styleId?: string
  /** ISO date string — present on library videos, absent on catalog entries */
  createdAt?: string
  // ── Playback source ────────────────────────────────────────────────────────
  youtubeId?: string
  videoUrl?: string
  /** Short display label for source-selector pills */
  label?: string
  /** Overrides the step's default duration */
  duration?: string
  /** Segment start in seconds — used by the player to jump to the relevant part */
  startTimestamp?: number
  /** Segment end in seconds — used by the player to stop at the relevant part */
  endTimestamp?: number
  // ── Catalog relationship (video-centric view) ──────────────────────────────
  /** Steps that appear in this video with optional timestamps */
  steps?: VideoStepOccurrence[]
}

// ── DanceStep ─────────────────────────────────────────────────────────────────

/**
 * The fundamental domain unit — a teachable dance movement.
 *
 * `difficulty` is an objective property of the step (set at creation, never changes).
 * The practitioner's current mastery lives in `TrainingProgress.learningLevel`.
 */
export interface DanceStep {
  id: string
  /** Dance style this step belongs to — injected by the DanceStyle descriptor */
  styleId?: string
  name: string
  description: string
  /** IDs of catalog/library videos that teach this step */
  videoIds: string[]
  /** Override thumbnail URL — defaults to the first YouTube thumbnail */
  thumbnail?: string
  duration?: string
  tags: string[]
  /** Step category (matches StepCategory) */
  category: string
  /** Objective technical complexity — set at creation, does not change with practice */
  difficulty: Level
  technicalDetails?: string
}

// ── Hub ───────────────────────────────────────────────────────────────────────

/**
 * A Hub is a DanceStep that participates in the FlowMap graph.
 * `stepId` equals the DanceStep.id it represents — name/description/difficulty
 * are read from the step, not duplicated here.
 *
 * What makes a step a hub is simply having connections (incomingSteps or outgoingSteps).
 */
export interface Hub {
  /** Must equal a DanceStep.id — this hub IS that step */
  stepId: string
  icon: string
  color: string
  notes?: string
  /** stepIds of other Hub-steps that flow INTO this hub */
  incomingSteps: string[]
  /** stepIds of other Hub-steps reachable FROM this hub */
  outgoingSteps: string[]
}

// ── Flow ──────────────────────────────────────────────────────────────────────

/**
 * Links one occurrence of a step in a Flow sequence to a video segment.
 * `index` matches the position in `Flow.sequence` so duplicate stepIds are unambiguous.
 */
export interface FlowStepTimestamp {
  /** Position in Flow.sequence (0-based) */
  index: number
  stepId: string
  /** Start of the segment, in seconds */
  start: number
  /** End of the segment, in seconds */
  end: number
}

/** An ordered path through Hubs, representing a reference sequence */
export interface Flow {
  id: string
  name: string
  description: string
  /** Ordered list of Hub stepIds defining the path */
  sequence: string[]
  difficulty: Level
  /** YouTube URL (youtube.com/watch or youtu.be) or direct video URL */
  video?: string
  /** Per-occurrence video segments for each step in the sequence */
  stepTimestamps?: FlowStepTimestamp[]
}

// ── DanceStyle ────────────────────────────────────────────────────────────────

/**
 * Self-contained descriptor for a dance style (Zouk, Bachata, Samba…).
 *
 * To register a new style:
 *  1. Create `src/data/styles/<id>/index.ts` exporting a `DanceStyle`.
 *  2. Add it to the `styles` array in `src/data/registry.ts`.
 */
export interface DanceStyle {
  /** Unique slug used as the URL segment and styleId on steps */
  id: string
  name: string
  description: string
  icon: string
  /** Primary brand color */
  color: string
  /** UI accent color for CTAs — defaults to `color` */
  accentColor?: string
  /** All steps in this style — styleId is injected by the descriptor */
  steps: DanceStep[]
  /** Video catalog for this style */
  videos: Video[]
  /** Hub nodes for the FlowMap graph */
  hubs: Hub[]
  /** Reference flows/sequences */
  flows: Flow[]
}

// ── Training ──────────────────────────────────────────────────────────────────

/**
 * Practitioner's training state for a single step.
 * Persisted in localStorage, separate from the static step catalog.
 */
export interface TrainingProgress {
  stepId: string
  timesReviewed: number
  /** Current mastery level (0 = not practiced, 5 = mastered) — evolves with practice */
  learningLevel: Level
  lastReviewedAt: string // ISO date string
  notes?: string
}

// ── Convenience labels ────────────────────────────────────────────────────────

export const LEVEL_LABELS: Record<Level, string> = {
  0: 'Não praticado',
  1: 'Em desenvolvimento',
  2: 'Iniciante',
  3: 'Estável',
  4: 'Confortável',
  5: 'Dominado',
}

export const DIFFICULTY_LABELS: Record<Level, string> = {
  0: 'Muito fácil',
  1: 'Fácil',
  2: 'Médio',
  3: 'Intermediário',
  4: 'Avançado',
  5: 'Difícil',
}
