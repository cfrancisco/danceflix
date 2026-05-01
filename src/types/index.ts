// ─────────────────────────────────────────────────────────────────────────────
// Domain types — Danceflix
// Single source of truth for all type definitions.
// See CONCEPTS.md for the rationale behind each entity.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ─────────────────────────────────────────────────────────────────

/**
 * Skill scale used for both objective difficulty and subjective learning level.
 *
 * Objective difficulty (`difficulty`): fixed property of a step / flow.
 * Subjective learning level (`learningLevel`): how far the practitioner has
 * internalized the movement — evolves with practice.
 *
 * 0 = Not practiced / Trivial
 * 1 = Beginner / Very easy
 * 2 = Developing / Easy
 * 3 = Comfortable / Medium
 * 4 = Strong / Hard
 * 5 = Mastered / Very hard
 */
export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5

/** @deprecated Use SkillLevel */
export type TrainingScore = SkillLevel

// ── VideoSource ────────────────────────────────────────────────────────────────

/** A single recording of a dance step (different angle, speed, presenter…). */
export interface VideoSource {
  /** Short label shown in the source selector tab, e.g. "Câmera frontal" */
  label?: string
  /** YouTube video ID for embed + thumbnail */
  youtubeId?: string
  /** Path to a locally hosted video file, relative to /public */
  videoUrl?: string
  /** Overrides DanceStep.duration for this specific recording */
  duration?: string
  /** Overrides DanceStep.presenter for this specific recording */
  presenter?: string
}

// ── DanceStep ──────────────────────────────────────────────────────────────────

/**
 * The fundamental unit of the domain.
 * Represents a single teachable movement or technique.
 */
export interface DanceStep {
  /** Unique slug — used in URLs (/video/:id) and as a cross-reference key */
  id: string
  /** Display name */
  name: string
  /** Dance style this step belongs to (injected by the style descriptor) */
  styleId?: string
  /** Long-form description of the movement and its coreographic intent */
  description: string
  /**
   * Multiple video recordings of the same step.
   * When present, VideoDetail shows a source selector.
   */
  sources?: VideoSource[]
  /** Convenience: primary YouTube ID (used when sources is absent/empty) */
  youtubeId?: string
  /** Convenience: primary local video path (used when sources is absent/empty) */
  videoUrl?: string
  /** Thumbnail URL — defaults to YouTube thumbnail if youtubeId is set */
  thumbnail?: string
  /** Primary duration displayed in cards / metadata row */
  duration: string
  /** ISO date string — when this step was first added to the catalog */
  date: string
  /** Broad category grouping steps for filter UI */
  category: string
  /** Keywords for search and recommendation scoring */
  tags: string[]
  /** Primary presenter / teacher name */
  presenter: string
  /**
   * Objective technical complexity — a property of the step, fixed.
   * 0 = trivial … 5 = very hard
   */
  difficulty: SkillLevel
  /**
   * Practitioner's current level of mastery for this step.
   * Seed value from the catalog; actual value lives in TrainingProgress.
   * 0 = not practiced … 5 = mastered
   */
  learningLevel: SkillLevel
  /** Technical notes, coaching cues, body mechanics tips */
  technicalDetails?: string
  /** IDs of hubs this step participates in (used by the FlowMap graph) */
  hubIds?: string[]
}

// ── Hub ────────────────────────────────────────────────────────────────────────

/**
 * A Hub IS a DanceStep — a central anchor node in the FlowMap graph.
 * Not every step is a hub, but every hub is a step.
 *
 * Additional graph semantics:
 * - incomingStepIds: steps that lead INTO this hub
 * - outgoingStepIds: steps that exit FROM this hub
 */
export interface Hub extends DanceStep {
  /** Visual icon for the graph node */
  icon: string
  /** CSS color for the node (visual identity in the graph) */
  color: string
  /** IDs of steps / hubs that transition INTO this hub */
  incomingStepIds: string[]
  /** IDs of steps / hubs that transition OUT OF this hub */
  outgoingStepIds: string[]
  /** Extra notes visible in the list view */
  notes: string
}

// ── Flow ───────────────────────────────────────────────────────────────────────

/**
 * An ordered path through dance steps, representing a common sequence
 * or reference choreography.
 *
 * Modeled as a directed graph: each element in `sequence` points to the next.
 */
export interface Flow {
  id: string
  name: string
  description: string
  /**
   * Ordered list of DanceStep / Hub IDs that form this path.
   * Can reference hubs and non-hub steps alike.
   */
  sequence: string[]
  /**
   * Objective complexity of this sequence as a whole.
   * 0 = beginner … 5 = advanced
   */
  difficulty: SkillLevel | string   // string kept for legacy data ("Iniciante" etc.)
  /**
   * Practitioner's current mastery of this flow.
   * 0 = not practiced … 5 = mastered
   */
  learningLevel?: SkillLevel
  /** Optional video recordings demonstrating the full flow */
  sources?: VideoSource[]
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
  /** Unique slug — used as URL segment and injected as `styleId` on steps */
  id: string
  name: string
  description: string
  /** Emoji or single character representing the style */
  icon: string
  /** Primary brand color (hubs, graphs, style pill) */
  color: string
  /** UI accent for CTAs and active states — defaults to `color` */
  accentColor?: string
  /** All teachable steps in this style (hubs included) */
  steps: DanceStep[]
  /** Hub nodes for the FlowMap graph */
  hubs: Record<string, Hub>
  /** Reference flows / common sequences */
  flows: Flow[]
}

// ── Training ───────────────────────────────────────────────────────────────────

/** Persisted training state for a single dance step (stored in localStorage). */
export interface TrainingProgress {
  stepId: string
  timesReviewed: number
  /** Current mastery level as assessed by the practitioner */
  learningLevel: SkillLevel
  lastReviewedAt: string  // ISO date string
  notes?: string
}

// ── Legacy aliases (kept for backward compatibility) ──────────────────────────

/**
 * @deprecated Use DanceStep
 * Alias kept so existing imports from '../types' continue to compile.
 */
export type Video = DanceStep & {
  /** @deprecated Use step.name */
  title?: string
  /** @deprecated Use step.difficulty */
  knowledgeLevel?: SkillLevel
  /** @deprecated Use step.hubIds */
  hubs?: string[]
}

/**
 * @deprecated Use TrainingProgress
 */
export interface VideoProgress {
  videoId: string
  timesReviewed: number
  trainingScore: SkillLevel
  lastReviewedAt: string
  notes?: string
}

/**
 * @deprecated - categories are now free-form strings on DanceStep.
 * Kept so CategoryTag and existing components compile without changes.
 */
export type VideoCategory =
  | 'Base e Deslocamento'
  | 'Abertura'
  | 'Giros e Dinâmicas'
  | 'Pêndulos'
  | 'Movimentos de Tronco e Cabeça'
  | 'Conexões e Estilizações'
  | 'Finalizações'
  | 'All'
