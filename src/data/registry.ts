import type { DanceStyle } from './types'
import type { Video } from '../types'
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

/**
 * Flat list of all videos across every registered style.
 * Each video carries a `styleId` so it can be traced back to its style.
 */
export const videos: Video[] = registeredStyles.flatMap((s) => s.videos)

export function getVideoById(id: string): Video | undefined {
  return videos.find((v) => v.id === id)
}

/**
 * Returns up to `limit` related videos from the same style, scored by:
 *  +3 — same category
 *  +1 — each shared tag
 * The current video is excluded. Ties broken by date (newest first).
 */
export function getRelatedVideos(video: Video, limit = 4): Video[] {
  const pool = video.styleId
    ? videos.filter((v) => v.styleId === video.styleId)
    : videos

  return pool
    .filter((v) => v.id !== video.id)
    .map((v) => {
      const sameCategory = v.category === video.category ? 3 : 0
      const sharedTags = v.tags.filter((t) => video.tags.includes(t)).length
      return { video: v, score: sameCategory + sharedTags }
    })
    .sort((a, b) => b.score - a.score || b.video.date.localeCompare(a.video.date))
    .slice(0, limit)
    .map((item) => item.video)
}

export function getVideoThumbnail(video: Video): string {
  if (video.thumbnail) return video.thumbnail
  if (video.youtubeId && video.youtubeId !== '') {
    return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
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
