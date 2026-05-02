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

// ── Video sources ─────────────────────────────────────────────────────────────

/** A single video recording — used for local/alternate sources */
export interface VideoSource {
  label?: string
  youtubeId?: string
  videoUrl?: string
  /** Overrides the step's default duration */
  duration?: string
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
  /** Primary YouTube video IDs for embed and thumbnail */
  youtubeVideos: string[]
  /** Local or alternate recordings with optional metadata overrides */
  localVideos: VideoSource[]
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

/** An ordered path through Hubs, representing a reference sequence */
export interface Flow {
  id: string
  name: string
  description: string
  /** Ordered list of Hub stepIds defining the path */
  sequence: string[]
  difficulty: Level
  videos?: VideoSource[]
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
