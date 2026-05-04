import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getVideoThumbnail } from '../data/videos'
import { VideoPreviewTooltip, type VideoPreviewTooltipState } from './VideoPreviewTooltip'
import type { Flow, DanceStep, Hub, VideoSource } from '../types'
import './FlowSequenceFooter.css'

interface FlowSequenceFooterProps {
  flow: Flow
  steps: DanceStep[]
  hubs: Hub[]
  onStepClick: (stepId: string) => void
  onClose: () => void
  onUpdateFlow?: (flow: Flow) => void
}

/** Extract YouTube ID from various URL formats or bare ID */
function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  // Already a bare ID (11 chars, no slashes/dots)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v')
  } catch { /* not a URL */ }
  return null
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function FlowSequenceFooter({
  flow,
  steps,
  hubs,
  onStepClick,
  onClose,
  onUpdateFlow,
}: FlowSequenceFooterProps) {
  const [expanded, setExpanded] = useState(false)
  const [syncMode, setSyncMode] = useState(false)
  const [addingVideo, setAddingVideo] = useState(false)
  const [videoInput, setVideoInput] = useState('')
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<VideoPreviewTooltipState | null>(null)
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current video source
  const videoSource: VideoSource | null = flow.videos?.[0] ?? null
  const hasVideo = !!(videoSource?.youtubeId || videoSource?.videoUrl)
  const isLocalVideo = !!videoSource?.videoUrl && !videoSource?.youtubeId
  const timestamps = flow.videoTimestamps ?? {}

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (localVideoUrl) URL.revokeObjectURL(localVideoUrl)
    }
  }, [localVideoUrl])

  const getCurrentTime = useCallback((): number => {
    if (isLocalVideo && videoRef.current) {
      return videoRef.current.currentTime
    }
    // For YouTube, we'd need the IFrame API — simplified: return 0
    // TODO: integrate YouTube IFrame API for precise currentTime
    return 0
  }, [isLocalVideo])

  const seekTo = useCallback((time: number) => {
    if (isLocalVideo && videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play()
    }
  }, [isLocalVideo])

  const handleStepClickInFooter = useCallback((stepId: string, index: number) => {
    if (syncMode) {
      // In sync mode: record current video time for this step
      const time = getCurrentTime()
      const newTimestamps = { ...timestamps, [`${stepId}:${index}`]: time }
      onUpdateFlow?.({ ...flow, videoTimestamps: newTimestamps })
    } else if (timestamps[`${stepId}:${index}`] !== undefined) {
      // Has timestamp: seek video
      seekTo(timestamps[`${stepId}:${index}`])
      onStepClick(stepId)
    } else {
      // No timestamp: just focus on map
      onStepClick(stepId)
    }
  }, [syncMode, getCurrentTime, seekTo, timestamps, flow, onUpdateFlow, onStepClick])

  const handleAddYouTube = useCallback(() => {
    const ytId = parseYouTubeId(videoInput)
    if (!ytId) return
    const newVideos: VideoSource[] = [{ youtubeId: ytId, label: 'Flow video' }]
    onUpdateFlow?.({ ...flow, videos: newVideos })
    setVideoInput('')
    setAddingVideo(false)
    setExpanded(true)
  }, [videoInput, flow, onUpdateFlow])

  const handleAddLocal = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setLocalVideoUrl(objectUrl)
    const newVideos: VideoSource[] = [{ videoUrl: objectUrl, label: file.name }]
    onUpdateFlow?.({ ...flow, videos: newVideos })
    setAddingVideo(false)
    setExpanded(true)
  }, [flow, onUpdateFlow])

  const handleRemoveVideo = useCallback(() => {
    onUpdateFlow?.({ ...flow, videos: [], videoTimestamps: {} })
    setExpanded(false)
    setSyncMode(false)
  }, [flow, onUpdateFlow])

  return (
    <div className={`fsf ${expanded && hasVideo ? 'fsf--expanded' : ''}`}>
      {/* ── Video player area (when expanded) ── */}
      {expanded && hasVideo && (
        <div className="fsf__player">
          {isLocalVideo ? (
            <video
              ref={videoRef}
              className="fsf__video"
              src={videoSource!.videoUrl}
              controls
            />
          ) : (
            <iframe
              className="fsf__iframe"
              src={`https://www.youtube.com/embed/${videoSource!.youtubeId}?enablejsapi=1`}
              title="Flow video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <div className="fsf__player-controls">
            <button
              className={`fsf__sync-btn ${syncMode ? 'is-active' : ''}`}
              onClick={() => setSyncMode(!syncMode)}
              title={syncMode ? 'Sair do modo sync' : 'Marcar timestamps nos passos'}
            >
              {syncMode ? '⏸ Parar sync' : '⏱ Sincronizar'}
            </button>
            <button className="fsf__remove-btn" onClick={handleRemoveVideo} title="Remover video">
              🗑
            </button>
          </div>
          {syncMode && (
            <p className="fsf__sync-hint">
              Clique num passo abaixo para marcar o momento atual do video
            </p>
          )}
        </div>
      )}

      {/* ── Main bar: flow name + step sequence ── */}
      <div className="fsf__bar">
        {/* Left: video toggle / add */}
        <div className="fsf__left">
          {hasVideo ? (
            <button
              className={`fsf__video-toggle ${expanded ? 'is-active' : ''}`}
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Recolher video' : 'Expandir video'}
            >
              {expanded ? '▼' : '▶'} Video
            </button>
          ) : (
            <div className="fsf__add-video">
              {addingVideo ? (
                <div className="fsf__add-form">
                  <input
                    className="fsf__add-input"
                    type="text"
                    placeholder="Cole URL do YouTube..."
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddYouTube()}
                    autoFocus
                  />
                  <button className="fsf__add-ok" onClick={handleAddYouTube}>OK</button>
                  <span className="fsf__add-sep">ou</span>
                  <button className="fsf__add-file" onClick={() => fileInputRef.current?.click()}>
                    📁 Local
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={handleAddLocal}
                  />
                  <button className="fsf__add-cancel" onClick={() => setAddingVideo(false)}>✕</button>
                </div>
              ) : (
                <button className="fsf__add-btn" onClick={() => setAddingVideo(true)}>
                  + Video
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: flow name + sequence */}
        <div className="fsf__center">
          <span className="fsf__flow-name">{flow.name}</span>
          <div className="fsf__steps">
            {flow.sequence.map((stepId, index) => {
              const step = steps.find((s) => s.id === stepId)
              const hub = hubs.find((h) => h.stepId === stepId)
              const thumb = step ? getVideoThumbnail(step) : undefined
              const ts = timestamps[`${stepId}:${index}`]
              const hasTs = ts !== undefined

              return (
                <div key={`${stepId}-${index}`} className="fsf__step-item">
                  {index > 0 && <span className="fsf__arrow">→</span>}
                  <button
                    className={`fsf__step ${syncMode ? 'fsf__step--sync' : ''} ${hasTs ? 'fsf__step--stamped' : ''}`}
                    onClick={() => handleStepClickInFooter(stepId, index)}
                    title={hasTs ? `${formatTimestamp(ts)} — clique para ir` : step?.name ?? stepId}
                    onMouseEnter={(e) => {
                      if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null }
                      if (step && !tooltip?.pinned) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ step, screenX: rect.left, screenY: rect.top - 12, pinned: false })
                      }
                    }}
                    onMouseLeave={() => {
                      if (!tooltip?.pinned) {
                        tooltipHideTimer.current = setTimeout(() => setTooltip(null), 200)
                      }
                    }}
                  >
                    <span className="fsf__step-num">{index + 1}</span>
                    {thumb ? (
                      <img className="fsf__step-thumb" src={thumb} alt="" />
                    ) : (
                      <span className="fsf__step-icon">{hub?.icon ?? '💃'}</span>
                    )}
                    <span className="fsf__step-name">{step?.name ?? stepId}</span>
                    {hasTs && <span className="fsf__step-ts">{formatTimestamp(ts)}</span>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: close */}
        <button className="fsf__close" onClick={onClose} title="Fechar">
          ✕
        </button>
      </div>

      {tooltip && createPortal(
        <VideoPreviewTooltip
          state={tooltip}
          onClose={() => setTooltip(null)}
          interactive
          onPin={() => {
            if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null }
            setTooltip((prev) => prev ? { ...prev, pinned: true } : null)
          }}
          onMouseEnter={() => {
            if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null }
          }}
          onMouseLeave={() => {
            if (!tooltip.pinned) {
              tooltipHideTimer.current = setTimeout(() => setTooltip(null), 150)
            }
          }}
        />,
        document.body
      )}
    </div>
  )
}
