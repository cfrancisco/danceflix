import type { DanceStyle, DanceStep } from '../types'
import { ZoukStyle } from './styles/zouk'
import { BachataStyle } from './styles/bachata'
import { SambaStyle } from './styles/samba'

// ── Style Registry ─────────────────────────────────────────────────────────────
/**
 * To add a new dance style:
 *  1. Create `src/data/styles/<id>/index.ts` exporting a `DanceStyle`.
 *  2. Import it here and add it to the `registeredStyles` array below.
 */
const registeredStyles: DanceStyle[] = [
  ZoukStyle,
  BachataStyle,
  SambaStyle,
]

// ── Public API ─────────────────────────────────────────────────────────────────

export function getAllStyles(): DanceStyle[] {
  return registeredStyles
}

export function getStyleById(id: string): DanceStyle | undefined {
  return registeredStyles.find((s) => s.id === id)
}

/** Flat list of all steps across every registered style. */
export const steps: DanceStep[] = registeredStyles.flatMap((s) => s.steps)

/** Backward-compat alias */
export const videos = steps

export function getVideoById(id: string): DanceStep | undefined {
  return steps.find((s) => s.id === id)
}

/**
 * Returns up to `limit` related steps from the same style, scored by:
 *  +3 — same category
 *  +1 — each shared tag
 * The current step is excluded. Ties broken by date (newest first).
 */
export function getRelatedVideos(step: DanceStep, limit = 4): DanceStep[] {
  const pool = step.styleId
    ? steps.filter((s) => s.styleId === step.styleId)
    : steps

  return pool
    .filter((s) => s.id !== step.id)
    .map((s) => {
      const sameCategory = s.category === step.category ? 3 : 0
      const sharedTags = s.tags.filter((t) => step.tags.includes(t)).length
      return { step: s, score: sameCategory + sharedTags }
    })
    .sort((a, b) => b.score - a.score || a.step.name.localeCompare(b.step.name))
    .slice(0, limit)
    .map((item) => item.step)
}

export function getVideoThumbnail(step: DanceStep): string {
  if (step.thumbnail) return step.thumbnail
  const firstYT = step.youtubeVideos.find((id) => id !== '')
  if (firstYT) {
    return `https://img.youtube.com/vi/${firstYT}/hqdefault.jpg`
  }
  const svg = `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="360" fill="#1a1a1a"/>
    <g transform="translate(320, 180)">
      <circle cx="0" cy="0" r="60" fill="#374151"/>
      <polygon points="-20,-30 -20,30 40,0" fill="#6b7280"/>
    </g>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
