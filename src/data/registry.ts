import type { DanceStyle, DanceStep, Video } from '../types'

export type { Video }
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

/** Flat list of all catalog videos across every registered style. */
const catalog: Video[] = registeredStyles.flatMap((s) => s.videos)

export function getAllVideos(): Video[] {
  return catalog
}

export function getCatalogVideoById(id: string): Video | undefined {
  return catalog.find((v) => v.id === id)
}

/** Lookup a step by its ID. */
export function getStepById(id: string): DanceStep | undefined {
  return steps.find((s) => s.id === id)
}

/** @deprecated Use getStepById — this returns a DanceStep, not a Video. */
export function getVideoById(id: string): DanceStep | undefined {
  return getStepById(id)
}

/**
 * Returns up to `limit` related steps from the same style, scored by:
 *  +3 — same category
 *  +1 — each shared tag
 * The current step is excluded. Ties broken by name alphabetically.
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

/** Resolves a step's videoIds to full Video objects from the catalog. */
export function getEffectiveVideos(step: DanceStep): Video[] {
  return step.videoIds
    .map((id) => getCatalogVideoById(id))
    .filter((v): v is Video => v !== undefined)
}

/** Returns the YouTube ID of the first catalog video for this step, if any. */
export function getFirstYoutubeId(step: DanceStep): string | undefined {
  return getEffectiveVideos(step).find((v) => v.youtubeId)?.youtubeId
}

/** True if the step has at least one catalog video with a YouTube ID. */
export function hasYoutubeVideo(step: DanceStep): boolean {
  return !!getFirstYoutubeId(step)
}

export function getVideoThumbnail(step: DanceStep): string {
  if (step.thumbnail) return step.thumbnail
  const firstYT = getFirstYoutubeId(step)
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
