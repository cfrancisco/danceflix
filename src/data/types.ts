/**
 * Backward-compatible shim.
 * All types now live in src/types/index.ts.
 */
export type {
  Hub,
  Flow as CommonFlow,
  DanceStyle,
  DanceStep,
} from '../types/index'

// FlowMap is still used by FlowMapGraph and FlowMap page — keep it here
import type { Hub, Flow } from '../types/index'

// ── Hub ────────────────────────────────────────────────────────────────────────
export interface Hub {
  id: string
  title: string
  description: string
  icon: string
  /** CSS color for visual differentiation */
  color: string
  /** Conceptual complexity (0 = easiest, 5 = hardest) */
  difficulty: number
  /** IDs of videos that belong to this hub */
  videoIds: string[]
  notes: string
}

// ── Connection ─────────────────────────────────────────────────────────────────
export interface Connection {
  fromHub: string
  toHub: string
  /** IDs of videos that demonstrate this connection */
  videoIds: string[]
  /** Human-readable name of the move that creates this connection */
  description: string
  difficulty: number
  notes: string
}

// ── CommonFlow ─────────────────────────────────────────────────────────────────
export interface CommonFlow {
  name: string
  difficulty: string
  /** Ordered list of hub IDs */
  sequence: string[]
  description: string
}

// ── FlowMap ───────────────────────────────────────────────────────────────────
/** Complete flow map for a dance style */
export interface FlowMap {
  hubs: Record<string, Hub>
  connections: Connection[]
  commonFlows: CommonFlow[]
}

// ── DanceStyle ────────────────────────────────────────────────────────────────
/**
 * Self-contained descriptor for a dance style (Zouk, Bachata, Samba…).
 *
 * To register a new style:
 *  1. Create `src/data/styles/<style>/index.ts` exporting a `DanceStyle`.
 *  2. Add it to the `styles` array in `src/data/registry.ts`.
 */
export interface DanceStyle {
  /** Unique slug used as the URL segment and styleId on videos */
  id: string
  name: string
  description: string
  /** Emoji or single character representing the style */
  icon: string
  /** Primary brand color (used on hubs, graphs, style pill) */
  color: string
  /** UI accent color for CTAs and active states — defaults to `color` */
  accentColor?: string
  videos: Video[]
  flowMap: FlowMap
}
