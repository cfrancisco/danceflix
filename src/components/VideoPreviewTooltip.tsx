import type { DanceStep } from '../types'
import { getVideoThumbnail } from '../data/videos'
import './VideoPreviewTooltip.css'

export interface VideoPreviewTooltipState {
  step: DanceStep
  screenX: number
  screenY: number
  pinned: boolean
}

interface VideoPreviewTooltipProps {
  state: VideoPreviewTooltipState
  onClose: () => void
  /** When true, tooltip accepts pointer events even when unpinned (for footer hover) */
  interactive?: boolean
  /** Called when user clicks Play — should set pinned to true */
  onPin?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function VideoPreviewTooltip({ state, onClose, interactive, onPin, onMouseEnter, onMouseLeave }: VideoPreviewTooltipProps) {
  const { step, screenX, screenY, pinned } = state
  const thumb = getVideoThumbnail(step)
  const firstYT = step.youtubeVideos.find((id) => id !== '')
  const hasYT = !!firstYT

  const cardW = pinned ? 300 : 240
  const cardH = pinned ? (hasYT ? 260 : 210) : 168
  const margin = 12
  let left = screenX + 16
  let top = screenY - 60
  if (left + cardW > window.innerWidth - margin) left = screenX - cardW - 12
  if (top + cardH > window.innerHeight - margin) top = window.innerHeight - cardH - margin
  if (top < margin) top = margin

  return (
    <div
      className={`fm-tip ${pinned ? 'is-pinned' : ''} ${interactive ? 'is-interactive' : ''}`}
      style={{ left, top, width: cardW }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave ?? (pinned ? undefined : onClose)}
    >
      {pinned && hasYT ? (
        <div className="fm-tip__media fm-tip__media--video">
          <iframe
            className="fm-tip__iframe"
            src={`https://www.youtube.com/embed/${firstYT}?autoplay=1`}
            title={step.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="fm-tip__media">
          <img className="fm-tip__thumb" src={thumb} alt="" />
          <span className="fm-tip__duration">{step.duration}</span>
          {!pinned && (
            <div className="fm-tip__play-overlay">
              <div className="fm-tip__play-circle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fm-tip__body">
        <p className="fm-tip__title">{step.name}</p>
        <div className="fm-tip__diff-row">
          {Array.from({ length: 5 }, (_, k) => (
            <div key={k} className={`fm-tip__diff-seg ${k < step.difficulty ? 'is-filled' : ''}`} />
          ))}
          <span className="fm-tip__diff-label">Nível</span>
        </div>
        <div className="fm-tip__actions">
          {hasYT && (
            <button
              className={`fm-tip__action fm-tip__action--play ${pinned ? 'is-paused' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                if (pinned) {
                  onClose()
                } else {
                  onPin?.()
                }
              }}
            >
              {pinned ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Parar
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
                  </svg>
                  Play
                </>
              )}
            </button>
          )}
          <a className="fm-tip__action fm-tip__action--open" href={`#/video/${step.id}`}>
            Abrir
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          {pinned && (
            <button
              className="fm-tip__action fm-tip__action--close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              ✕
            </button>
          )}
        </div>
        {!pinned && <p className="fm-tip__hint">Clique no nó para fixar</p>}
      </div>
    </div>
  )
}
