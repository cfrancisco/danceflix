import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getVideoThumbnail } from '../data/videos'
import { VideoPreviewTooltip, type VideoPreviewTooltipState } from './VideoPreviewTooltip'
import type { Flow, FlowStepTimestamp, DanceStep, Hub, Level } from '../types'
import { useVideoLibrary } from '../hooks/useVideoLibrary'
import './FlowSequenceFooter.css'

// ── YouTube IFrame API ────────────────────────────────────────────────────────
// Window.YT is declared as `any` in VideoDetail.tsx — no re-augmentation here.

interface YTPlayer {
  getCurrentTime(): number
  seekTo(s: number, allow: boolean): void
  playVideo(): void
  pauseVideo(): void
  destroy(): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _win = window as any

let _ytApiPromise: Promise<void> | null = null
function loadYTApi(): Promise<void> {
  if (_win.YT?.Player) return Promise.resolve()
  if (_ytApiPromise) return _ytApiPromise
  _ytApiPromise = new Promise<void>((resolve) => {
    const prev = _win.onYouTubeIframeAPIReady
    _win.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  })
  return _ytApiPromise
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

// ── Training store ────────────────────────────────────────────────────────────

function readTrainingStore(): Record<string, number> {
  try {
    const raw = localStorage.getItem('danceflix:training')
    if (!raw) return {}
    const store = JSON.parse(raw) as Record<string, { learningLevel?: number }>
    const result: Record<string, number> = {}
    for (const [id, p] of Object.entries(store)) result[id] = p.learningLevel ?? 0
    return result
  } catch { return {} }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseTs(val: string): number | null {
  const clean = val.trim()
  if (!clean) return null
  if (/^\d+$/.test(clean)) return parseInt(clean, 10)
  const m = clean.match(/^(\d+):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function isYouTubeUrl(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FlowSequenceFooterProps {
  flow: Flow
  steps: DanceStep[]
  hubs: Hub[]
  onStepClick: (stepId: string) => void
  onClose: () => void
  onUpdateFlow?: (flow: Flow) => void
  onEditModeChange?: (active: boolean, addStepFn: (id: string) => void) => void
  onAddStep?: (name: string) => DanceStep
  sidebar?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FlowSequenceFooter({
  flow, steps, hubs, onStepClick, onClose, onUpdateFlow, onEditModeChange, onAddStep,
  sidebar = false,
}: FlowSequenceFooterProps) {
  const isCustom = flow.id.startsWith('custom-')
  const hubIds   = new Set(hubs.map((h) => h.stepId))
  const lib      = useVideoLibrary()

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const [tooltip, setTooltip]   = useState<VideoPreviewTooltipState | null>(null)
  const tooltipHideTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editMode, setEditMode]             = useState(false)
  const [editName, setEditName]             = useState('')
  const [editDifficulty, setEditDifficulty] = useState<Level>(flow.difficulty)
  const [editSequence, setEditSequence]     = useState<string[]>([])
  const [editVideo, setEditVideo]           = useState('')
  const [editTimestamps, setEditTimestamps] = useState<{ start: string; end: string }[]>([])
  const [stepSearch, setStepSearch]         = useState('')

  // ── Library picker state ──────────────────────────────────────────────────
  const [showLibrary, setShowLibrary]         = useState(false)
  const [librarySearch, setLibrarySearch]     = useState('')
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(null)

  // ── Video / capture state ─────────────────────────────────────────────────
  const [playerReady, setPlayerReady]   = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [captureStart, setCaptureStart] = useState<number | null>(null)
  const [captureEnd, setCaptureEnd]     = useState<number | null>(null)
  const [isDragging, setIsDragging]     = useState(false)
  const [playingIdx, setPlayingIdx]     = useState<number | null>(null)

  const ytPlayerRef   = useRef<YTPlayer | null>(null)
  const ytMountRef    = useRef<HTMLDivElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)
  const segEndRef     = useRef<number | null>(null)
  const playingIdxRef = useRef<number | null>(null)
  const dragSrcIdx    = useRef<number | null>(null)

  const isYT    = isYouTubeUrl(editVideo)
  const hasVideo = !!editVideo.trim()

  // ── YouTube player lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (!editMode || !editVideo.trim() || !isYT) return
    const ytId = extractYouTubeId(editVideo)
    if (!ytId) return

    let destroyed = false
    setPlayerReady(false)
    setCurrentTime(0)

    loadYTApi().then(() => {
      if (destroyed || !ytMountRef.current) return
      ytMountRef.current.innerHTML = ''
      const inner = document.createElement('div')
      ytMountRef.current.appendChild(inner)
      const player = new _win.YT.Player(inner, {
        videoId: ytId,
        width: sidebar ? 460 : 320,
        height: sidebar ? 258 : 180,
        playerVars: { enablejsapi: 1, rel: 0, modestbranding: 1 },
        events: { onReady: () => { if (!destroyed) setPlayerReady(true) } },
      })
      ytPlayerRef.current = player
    })

    return () => {
      destroyed = true
      setPlayerReady(false)
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy() } catch { /* noop */ }
        ytPlayerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, editVideo])

  // ── Poll current time (YT) ────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady) return
    const id = setInterval(() => {
      const t = ytPlayerRef.current?.getCurrentTime() ?? 0
      setCurrentTime(t)
      if (segEndRef.current !== null && t >= segEndRef.current) {
        ytPlayerRef.current?.pauseVideo()
        segEndRef.current = null
        playingIdxRef.current = null
        setPlayingIdx(null)
      }
    }, 200)
    return () => clearInterval(id)
  }, [playerReady])

  // ── Local video time tracking ─────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const t = videoRef.current.currentTime
    setCurrentTime(t)
    if (segEndRef.current !== null && t >= segEndRef.current) {
      videoRef.current.pause()
      segEndRef.current = null
      playingIdxRef.current = null
      setPlayingIdx(null)
    }
  }, [])

  // ── Capture controls ──────────────────────────────────────────────────────
  const getLiveTime = useCallback(() => {
    if (isYT) return ytPlayerRef.current?.getCurrentTime() ?? currentTime
    return videoRef.current?.currentTime ?? currentTime
  }, [isYT, currentTime])

  const markStart = useCallback(() => {
    setCaptureStart(getLiveTime())
    setCaptureEnd(null)
  }, [getLiveTime])

  const markEnd = useCallback(() => {
    if (captureStart === null) return
    const t = getLiveTime()
    if (t > captureStart) setCaptureEnd(t)
  }, [getLiveTime, captureStart])

  const assignTimestamp = useCallback((i: number) => {
    if (captureStart === null || captureEnd === null) return
    setEditTimestamps((prev) => prev.map((ts, idx) =>
      idx === i ? { start: formatTs(captureStart), end: formatTs(captureEnd!) } : ts
    ))
    setCaptureStart(null)
    setCaptureEnd(null)
  }, [captureStart, captureEnd])

  const clearTimestamp = useCallback((i: number) => {
    setEditTimestamps((prev) => prev.map((ts, idx) => idx === i ? { start: '', end: '' } : ts))
    if (playingIdxRef.current === i) {
      segEndRef.current = null
      playingIdxRef.current = null
      setPlayingIdx(null)
    }
  }, [])

  const playSegment = useCallback((i: number) => {
    const ts    = editTimestamps[i]
    const start = parseTs(ts?.start ?? '')
    const end   = parseTs(ts?.end ?? '')
    if (start === null || end === null) return

    segEndRef.current     = end
    playingIdxRef.current = i
    setPlayingIdx(i)

    if (isYT && playerReady && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(start, true)
      ytPlayerRef.current.playVideo()
    } else if (!isYT && videoRef.current) {
      videoRef.current.currentTime = start
      videoRef.current.play()
    }
  }, [editTimestamps, isYT, playerReady])

  // ── Sequence helpers ──────────────────────────────────────────────────────
  const updateTimestamp = useCallback((i: number, field: 'start' | 'end', val: string) => {
    setEditTimestamps((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }, [])

  const addStep = useCallback((id: string) => {
    setEditSequence((prev) => [...prev, id])
    setEditTimestamps((prev) => [...prev, { start: '', end: '' }])
  }, [])

  const removeStep = useCallback((i: number) => {
    setEditSequence((prev) => prev.filter((_, idx) => idx !== i))
    setEditTimestamps((prev) => prev.filter((_, idx) => idx !== i))
  }, [])

  const moveStep = useCallback((from: number, to: number) => {
    if (from === to) return
    setEditSequence((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setEditTimestamps((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  // ── Edit lifecycle ────────────────────────────────────────────────────────
  const enterEdit = useCallback(() => {
    setEditName(flow.name)
    setEditDifficulty(flow.difficulty)
    setEditSequence([...flow.sequence])
    setEditVideo(flow.video ?? '')
    setEditTimestamps(
      flow.sequence.map((_, i) => {
        const ts = flow.stepTimestamps?.find((t) => t.index === i)
        return ts ? { start: formatTs(ts.start), end: formatTs(ts.end) } : { start: '', end: '' }
      })
    )
    setCaptureStart(null); setCaptureEnd(null)
    setLinkedLibraryId(null); setShowLibrary(false); setLibrarySearch('')
    setStepSearch(''); setEditMode(true)
    onEditModeChange?.(true, (id) => {
      setEditSequence((prev) => [...prev, id])
      setEditTimestamps((prev) => [...prev, { start: '', end: '' }])
    })
  }, [flow, onEditModeChange])

  const exitEdit = useCallback(() => {
    setEditMode(false); setStepSearch('')
    setCaptureStart(null); setCaptureEnd(null)
    setPlayingIdx(null); segEndRef.current = null
    setLinkedLibraryId(null); setShowLibrary(false); setLibrarySearch('')
    onEditModeChange?.(false, () => {})
    if (sidebar) onClose()
  }, [onEditModeChange, sidebar, onClose])

  const saveEdit = useCallback(() => {
    if (!editName.trim()) return
    const stepTimestamps: FlowStepTimestamp[] = editTimestamps
      .map((ts, i) => {
        const start = parseTs(ts.start)
        const end   = parseTs(ts.end)
        if (start === null || end === null) return null
        return { index: i, stepId: editSequence[i], start, end }
      })
      .filter((t): t is FlowStepTimestamp => t !== null)

    // Sync timestamps to the linked video in the library
    if (linkedLibraryId) {
      const libVideo = lib.videos.find((v) => v.id === linkedLibraryId)
      if (libVideo) {
        const updatedSteps = [...(libVideo.steps ?? [])]
        for (const ts of stepTimestamps) {
          const existing = updatedSteps.findIndex((s) => s.stepId === ts.stepId)
          if (existing >= 0) {
            updatedSteps[existing] = { stepId: ts.stepId, startTime: ts.start, endTime: ts.end }
          } else {
            updatedSteps.push({ stepId: ts.stepId, startTime: ts.start, endTime: ts.end })
          }
        }
        // Link any sequence steps not yet in the video (no timestamps yet)
        for (const stepId of editSequence) {
          if (!updatedSteps.some((s) => s.stepId === stepId)) {
            updatedSteps.push({ stepId })
          }
        }
        lib.updateVideo(linkedLibraryId, { steps: updatedSteps })
      }
    }

    onUpdateFlow?.({
      ...flow,
      name: editName.trim(), difficulty: editDifficulty,
      sequence: editSequence,
      video: editVideo.trim() || undefined,
      stepTimestamps: stepTimestamps.length > 0 ? stepTimestamps : undefined,
    })
    setEditMode(false); setStepSearch('')
    setCaptureStart(null); setCaptureEnd(null)
    setLinkedLibraryId(null); setShowLibrary(false); setLibrarySearch('')
    onEditModeChange?.(false, () => {})
  }, [flow, editName, editDifficulty, editSequence, editVideo, editTimestamps, linkedLibraryId, lib, onUpdateFlow, onEditModeChange])

  useEffect(() => {
    setEditMode(false); setEditVideo(''); setEditTimestamps([])
    setCaptureStart(null); setCaptureEnd(null); setStepSearch('')
    setLinkedLibraryId(null); setShowLibrary(false); setLibrarySearch('')
    onEditModeChange?.(false, () => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.id])

  // Auto-enter edit mode when used in sidebar variant
  useEffect(() => {
    if (!sidebar) return
    setEditName(flow.name)
    setEditDifficulty(flow.difficulty)
    setEditSequence([...flow.sequence])
    setEditVideo(flow.video ?? '')
    setEditTimestamps(
      flow.sequence.map((_, i) => {
        const ts = flow.stepTimestamps?.find((t) => t.index === i)
        return ts ? { start: formatTs(ts.start), end: formatTs(ts.end) } : { start: '', end: '' }
      })
    )
    setCaptureStart(null); setCaptureEnd(null)
    setLinkedLibraryId(null); setShowLibrary(false); setLibrarySearch('')
    setStepSearch(''); setEditMode(true)
    onEditModeChange?.(true, (id) => {
      setEditSequence((prev) => [...prev, id])
      setEditTimestamps((prev) => [...prev, { start: '', end: '' }])
    })
    return () => { if (sidebar) onEditModeChange?.(false, () => {}) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebar])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const avgDifficulty = editSequence.length > 0
    ? editSequence.reduce((acc, id) => acc + (steps.find((s) => s.id === id)?.difficulty ?? 0), 0) / editSequence.length
    : 0
  const trainingStore = readTrainingStore()
  const nonHubRecall  = editSequence.filter((id) => !hubIds.has(id)).map((id) => trainingStore[id] ?? 0)
  const avgRecall     = nonHubRecall.length > 0 ? nonHubRecall.reduce((a, b) => a + b, 0) / nonHubRecall.length : 0

  const searchResults  = stepSearch.trim()
    ? steps.filter((s) => s.name.toLowerCase().includes(stepSearch.toLowerCase())).slice(0, 6)
    : []
  const hasPendingPair = captureStart !== null && captureEnd !== null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`fsf ${editMode ? 'fsf--expanded' : ''} ${sidebar ? 'fsf--sidebar' : ''}`}>

      {editMode && (
        <div className="fsf__edit-panel">

          {/* ── Zone 1: Identity ── */}
          <div className="fsf__edit-identity">
            <div className="fsf__edit-name-row">
              <input className="fsf__edit-input" value={editName}
                onChange={(e) => setEditName(e.target.value)} placeholder="Nome do flow…" />
              <select className="fsf__edit-select" value={editDifficulty}
                onChange={(e) => setEditDifficulty(Number(e.target.value) as Level)}>
                {([1, 2, 3, 4, 5] as Level[]).map((lvl) => (
                  <option key={lvl} value={lvl}>Dif. {lvl}/5</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Zone 2: Vídeo ── */}
          <div className="fsf__edit-section">
            <span className="fsf__section-label">Vídeo</span>

          {/* ── Video URL input ── */}
          <div className="fsf__edit-video-row">
            <span className="fsf__edit-video-icon">{hasVideo ? (isYT ? '▶' : '📁') : '🎬'}</span>
            <input
              className={`fsf__edit-video-input ${hasVideo ? 'fsf__edit-video-input--active' : ''}`}
              value={editVideo}
              onChange={(e) => {
                setEditVideo(e.target.value)
                setCaptureStart(null); setCaptureEnd(null)
                setLinkedLibraryId(null)
              }}
              placeholder="Link do YouTube ou URL do vídeo…"
            />
            {hasVideo && (
              <button className="fsf__edit-video-clear"
                onClick={() => {
                  setEditVideo('')
                  setCaptureStart(null); setCaptureEnd(null)
                  setLinkedLibraryId(null)
                }}>✕</button>
            )}
            {lib.videos.length > 0 && (
              <button
                className={`fsf__library-toggle ${showLibrary ? 'fsf__library-toggle--active' : ''}`}
                onClick={() => setShowLibrary((v) => !v)}
                title="Buscar na biblioteca de vídeos"
              >
                Biblioteca {linkedLibraryId ? '✓' : ''}
              </button>
            )}
          </div>

          {/* ── Library picker ── */}
          {showLibrary && (
            <div className="fsf__library-picker">
              <input
                className="fsf__library-search"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Buscar vídeo na biblioteca…"
                autoFocus
              />
              <div className="fsf__library-list">
                {lib.videos
                  .filter((v) =>
                    !librarySearch.trim() ||
                    v.title.toLowerCase().includes(librarySearch.toLowerCase())
                  )
                  .map((v) => {
                    const isSelected = linkedLibraryId === v.id
                    const url = v.youtubeId
                      ? `https://www.youtube.com/watch?v=${v.youtubeId}`
                      : v.videoUrl ?? ''
                    return (
                      <button
                        key={v.id}
                        className={`fsf__library-item ${isSelected ? 'fsf__library-item--selected' : ''}`}
                        onClick={() => {
                          setEditVideo(url)
                          setLinkedLibraryId(v.id)
                          setShowLibrary(false)
                          setCaptureStart(null); setCaptureEnd(null)
                        }}
                      >
                        {v.youtubeId && (
                          <img
                            src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                            alt=""
                            className="fsf__library-item-thumb"
                          />
                        )}
                        <span className="fsf__library-item-title">{v.title}</span>
                        {(v.steps?.length ?? 0) > 0 && (
                          <span className="fsf__library-item-count">{v.steps!.length} passos</span>
                        )}
                        {isSelected && <span className="fsf__library-item-check">✓</span>}
                      </button>
                    )
                  })
                }
              </div>
            </div>
          )}

          {linkedLibraryId && !showLibrary && (
            <div className="fsf__library-linked">
              <span className="fsf__library-linked-label">Vinculado:</span>
              <span className="fsf__library-linked-name">
                {lib.videos.find((v) => v.id === linkedLibraryId)?.title ?? linkedLibraryId}
              </span>
              <button className="fsf__edit-video-clear" onClick={() => {
                setLinkedLibraryId(null)
              }} title="Desvincular">✕</button>
            </div>
          )}

          {/* ── Video player + capture controls ── */}
          {hasVideo && (
            <div className="fsf__video-section">

              {/* Player */}
              <div className="fsf__player-wrap">
                {isYT ? (
                  <>
                    {!playerReady && <div className="fsf__player-loading">Carregando player…</div>}
                    <div ref={ytMountRef} className="fsf__yt-mount" />
                  </>
                ) : (
                  <video ref={videoRef} className="fsf__local-video" src={editVideo}
                    controls onTimeUpdate={handleTimeUpdate} />
                )}
              </div>

              {/* Capture zone */}
              <div className="fsf__capture-zone">

                {/* Live clock */}
                <div className="fsf__capture-clock">
                  <span className="fsf__capture-clock-val">{formatTs(Math.floor(currentTime))}</span>
                  <span className="fsf__capture-clock-label">tempo atual</span>
                </div>

                {/* Mark buttons */}
                <div className="fsf__capture-btns">
                  <button
                    className={`fsf__capture-btn fsf__capture-btn--start ${captureStart !== null ? 'fsf__capture-btn--marked' : ''}`}
                    onClick={markStart}
                  >
                    <span className="fsf__capture-btn-icon">▷</span>
                    <span>Início</span>
                    {captureStart !== null && (
                      <span className="fsf__capture-btn-val">{formatTs(Math.floor(captureStart))}</span>
                    )}
                  </button>
                  <button
                    className={`fsf__capture-btn fsf__capture-btn--end ${captureEnd !== null ? 'fsf__capture-btn--marked' : ''}`}
                    onClick={markEnd}
                    disabled={captureStart === null}
                  >
                    <span className="fsf__capture-btn-icon">◼</span>
                    <span>Fim</span>
                    {captureEnd !== null && (
                      <span className="fsf__capture-btn-val">{formatTs(Math.floor(captureEnd))}</span>
                    )}
                  </button>
                </div>

                {/* Pending pair — draggable badge */}
                {captureStart !== null && (
                  <div className="fsf__capture-pending">
                    <div
                      className={`fsf__capture-pair ${hasPendingPair ? 'fsf__capture-pair--ready' : ''}`}
                      draggable={hasPendingPair}
                      onDragStart={(e) => {
                        if (!hasPendingPair) { e.preventDefault(); return }
                        e.dataTransfer.setData('text/plain', 'ts-pair')
                        e.dataTransfer.effectAllowed = 'copy'
                        setIsDragging(true)
                      }}
                      onDragEnd={() => setIsDragging(false)}
                    >
                      <span className="fsf__capture-pair-start">▷ {formatTs(Math.floor(captureStart))}</span>
                      <span className="fsf__capture-pair-sep">→</span>
                      <span className={`fsf__capture-pair-end ${captureEnd === null ? 'fsf__capture-pair-end--pending' : ''}`}>
                        {captureEnd !== null ? `◼ ${formatTs(Math.floor(captureEnd))}` : '◼ ?'}
                      </span>
                      {hasPendingPair && (
                        <span className="fsf__capture-pair-dur">
                          {formatTs(Math.floor(captureEnd! - captureStart))}
                        </span>
                      )}
                    </div>
                    <p className="fsf__capture-hint">
                      {!hasPendingPair
                        ? 'Marque o ponto de fim'
                        : isDragging
                          ? 'Solte num passo ↓'
                          : 'Arraste ou clique num passo para vincular'}
                    </p>
                  </div>
                )}

                {captureStart === null && (
                  <p className="fsf__capture-idle">
                    Reproduza o vídeo e marque os pontos de cada passo
                  </p>
                )}
              </div>
            </div>
          )}

          </div>{/* end zone 2: vídeo */}

          {/* ── Zone 3: Sequência ── */}
          <div className="fsf__edit-section">
            <span className="fsf__section-label">Sequência</span>

          <div className="fsf__edit-seq">
            {editSequence.length === 0 ? (
              <span className="fsf__edit-empty">Clique nos nós do grafo ou busque abaixo para adicionar passos</span>
            ) : editSequence.map((stepId, i) => {
              const s       = steps.find((st) => st.id === stepId)
              const isHub   = hubIds.has(stepId)
              const ts      = editTimestamps[i] ?? { start: '', end: '' }
              const tsStart = parseTs(ts.start)
              const tsEnd   = parseTs(ts.end)
              const tsValid = tsStart !== null && tsEnd !== null && tsEnd > tsStart
              const tsSet   = tsStart !== null || tsEnd !== null
              const isPlay  = playingIdx === i

              return (
                <div
                  key={i}
                  className="fsf__edit-chip-group"
                  draggable={!hasPendingPair}
                  onDragStart={(e) => {
                    dragSrcIdx.current = i
                    e.dataTransfer.setData('step-reorder', String(i))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => { dragSrcIdx.current = null }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('step-reorder') && dragSrcIdx.current !== null && dragSrcIdx.current !== i) {
                      e.preventDefault()
                      e.currentTarget.setAttribute('data-drag-over', '1')
                    }
                  }}
                  onDragLeave={(e) => e.currentTarget.removeAttribute('data-drag-over')}
                  onDrop={(e) => {
                    e.currentTarget.removeAttribute('data-drag-over')
                    const src = parseInt(e.dataTransfer.getData('step-reorder'), 10)
                    if (!isNaN(src) && src !== i) moveStep(src, i)
                  }}
                >
                  {i > 0 && <span className="fsf__arrow">→</span>}
                  <div
                    className={`fsf__edit-chip-wrap ${hasVideo ? 'fsf__edit-chip-wrap--ts' : ''}`}
                    onDragOver={(e) => { if (hasPendingPair) { e.preventDefault(); e.currentTarget.setAttribute('data-drop', '1') } }}
                    onDragLeave={(e) => e.currentTarget.removeAttribute('data-drop')}
                    onDrop={(e) => {
                      e.currentTarget.removeAttribute('data-drop')
                      if (e.dataTransfer.getData('text/plain') === 'ts-pair') {
                        e.stopPropagation()
                        assignTimestamp(i); setIsDragging(false)
                      }
                    }}
                  >
                    {/* Label chip */}
                    <span className={`fsf__edit-chip ${isHub ? 'fsf__edit-chip--hub' : ''} ${hasPendingPair && !isDragging ? 'fsf__edit-chip--assignable' : ''}`}>
                      {!hasPendingPair && <span className="fsf__drag-handle">⠿</span>}
                      <span className="fsf__edit-chip-num">{i + 1}</span>
                      {s?.name ?? stepId}
                      {hasPendingPair && !isDragging && (
                        <button className="fsf__chip-assign-btn" onClick={() => assignTimestamp(i)} title="Vincular timestamp">
                          +
                        </button>
                      )}
                      <button className="fsf__edit-chip-remove" onClick={() => removeStep(i)} title="Remover">×</button>
                    </span>

                    {/* Timestamp row */}
                    {hasVideo && (
                      <div className={`fsf__ts-row ${!tsSet ? '' : tsValid ? 'fsf__ts-row--valid' : 'fsf__ts-row--invalid'}`}>
                        {tsValid && (
                          <button
                            className={`fsf__chip-play-btn ${isPlay ? 'fsf__chip-play-btn--active' : ''}`}
                            onClick={() => playSegment(i)}
                            title="Reproduzir segmento"
                          >▶</button>
                        )}
                        <span className="fsf__ts-label fsf__ts-label--start">▷</span>
                        <input className="fsf__ts-input" value={ts.start} placeholder="0:00"
                          onChange={(e) => updateTimestamp(i, 'start', e.target.value)} />
                        <span className="fsf__ts-sep">—</span>
                        <span className="fsf__ts-label fsf__ts-label--end">◼</span>
                        <input className="fsf__ts-input" value={ts.end} placeholder="0:00"
                          onChange={(e) => updateTimestamp(i, 'end', e.target.value)} />
                        {tsValid && (
                          <>
                            <span className="fsf__ts-duration">{formatTs(tsEnd! - tsStart!)}</span>
                            <button className="fsf__ts-clear" onClick={() => clearTimestamp(i)} title="Limpar">✕</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Step search ── */}
          <div className="fsf__edit-search-area">
            <input className="fsf__edit-search" value={stepSearch}
              onChange={(e) => setStepSearch(e.target.value)}
              placeholder="Buscar passo para adicionar…" />
            {stepSearch.trim() && (
              <div className="fsf__edit-candidates">
                {searchResults.map((s) => (
                  <button key={s.id} className="fsf__edit-candidate"
                    onClick={() => { addStep(s.id); setStepSearch('') }}>
                    {hubIds.has(s.id) && <span className="fsf__edit-candidate-hub">◉</span>}
                    {s.name}
                    <span className="fsf__edit-candidate-cat">{s.category}</span>
                  </button>
                ))}
                {searchResults.length === 0 && onAddStep && (
                  <button
                    className="fsf__edit-candidate fsf__edit-candidate--create"
                    onClick={() => {
                      const newStep = onAddStep(stepSearch.trim())
                      addStep(newStep.id)
                      setStepSearch('')
                    }}
                  >
                    <span className="fsf__edit-candidate-create-icon">+</span>
                    Criar passo "{stepSearch.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          </div>{/* end zone 3: sequência */}

          {/* ── Zone 4: Actions ── */}
          <div className="fsf__edit-actions">
            {editSequence.length > 0 && (
              <div className="fsf__edit-stats">
                <span className="fsf__edit-stat">{editSequence.length} {editSequence.length === 1 ? 'passo' : 'passos'}</span>
                <span className="fsf__edit-stat fsf__edit-stat--difficulty">★ {avgDifficulty.toFixed(1)} dif.</span>
                {nonHubRecall.length > 0 && (
                  <span className="fsf__edit-stat fsf__edit-stat--recall">◎ {avgRecall.toFixed(1)} rec.</span>
                )}
              </div>
            )}
            <div className="fsf__edit-action-btns">
              <button className="fsf__edit-cancel" onClick={exitEdit}>Cancelar</button>
              <button className="fsf__edit-save" onClick={saveEdit} disabled={!editName.trim()}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main bar (footer mode only) ── */}
      {!sidebar && (
        <div className="fsf__bar">
          <div className="fsf__left">
            {isCustom && (
              <button
                className={`fsf__edit-btn ${editMode ? 'fsf__edit-btn--active' : ''}`}
                onClick={editMode ? exitEdit : enterEdit}
              >
                {editMode ? '✎ Editando…' : '✎ Editar'}
              </button>
            )}
          </div>

          <div className="fsf__center">
            <span className="fsf__flow-name">{flow.name}</span>
            {flow.video && (
              <span className="fsf__bar-video-badge" title={flow.video}>
                {isYouTubeUrl(flow.video) ? '▶ YT' : '▶ vídeo'}
              </span>
            )}
            <div className="fsf__steps">
              {flow.sequence.map((stepId, index) => {
                const step  = steps.find((s) => s.id === stepId)
                const hub   = hubs.find((h) => h.stepId === stepId)
                const thumb = step ? getVideoThumbnail(step) : undefined
                const ts    = flow.stepTimestamps?.find((t) => t.index === index)

                return (
                  <div key={`${stepId}-${index}`} className="fsf__step-item">
                    {index > 0 && <span className="fsf__arrow">→</span>}
                    <button
                      className={`fsf__step ${ts ? 'fsf__step--stamped' : ''}`}
                      onClick={() => onStepClick(stepId)}
                      title={step?.name ?? stepId}
                      onMouseEnter={(e) => {
                        if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null }
                        if (step && !tooltip?.pinned) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setTooltip({ step, screenX: rect.left, screenY: rect.top - 12, pinned: false })
                        }
                      }}
                      onMouseLeave={() => {
                        if (!tooltip?.pinned) tooltipHideTimer.current = setTimeout(() => setTooltip(null), 200)
                      }}
                    >
                      <span className="fsf__step-num">{index + 1}</span>
                      {thumb ? <img className="fsf__step-thumb" src={thumb} alt="" />
                             : <span className="fsf__step-icon">{hub?.icon ?? '💃'}</span>}
                      <span className="fsf__step-name">{step?.name ?? stepId}</span>
                      {ts && <span className="fsf__step-ts">{formatTs(ts.start)}</span>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <button className="fsf__close" onClick={onClose} title="Fechar">✕</button>
        </div>
      )}

      {tooltip && createPortal(
        <VideoPreviewTooltip
          state={tooltip}
          onClose={() => setTooltip(null)}
          interactive
          onPin={() => {
            if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null }
            setTooltip((prev) => prev ? { ...prev, pinned: true } : null)
          }}
          onMouseEnter={() => { if (tooltipHideTimer.current) { clearTimeout(tooltipHideTimer.current); tooltipHideTimer.current = null } }}
          onMouseLeave={() => { if (!tooltip.pinned) { tooltipHideTimer.current = setTimeout(() => setTooltip(null), 150) } }}
        />,
        document.body,
      )}
    </div>
  )
}
