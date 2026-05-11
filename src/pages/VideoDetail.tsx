import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import { getStepById, getRelatedVideos, getEffectiveVideos } from '../data/videos'
import { steps as allCatalogSteps } from '../data/registry'
import { CategoryTag } from '../components/CategoryTag'
import type { StepCategory, Video, DanceStep, Level } from '../types'
import { DIFFICULTY_LABELS } from '../types'
import { TrainingPanel } from '../components/TrainingPanel'
import { RelatedVideos } from '../components/RelatedVideos'
import { useVideoLibrary } from '../hooks/useVideoLibrary'
import { useActiveStyle } from '../context/StyleContext'
import { useStaticOverrides } from '../hooks/useStaticOverrides'
import './VideoDetail.css'

const STEP_CATEGORIES: StepCategory[] = [
  'Base e Deslocamento', 'Abertura', 'Giros e Dinâmicas', 'Pêndulos',
  'Movimentos de Tronco e Cabeça', 'Conexões e Estilizações', 'Finalizações',
]

// ─── YouTube IFrame API ───────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let _ytApiPromise: Promise<void> | null = null

function loadYTApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (_ytApiPromise) return _ytApiPromise
  _ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return _ytApiPromise
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseMmSs(str: string): number | undefined {
  const s = str.trim()
  if (!s) return undefined
  if (s.includes(':')) {
    const [m, sec] = s.split(':')
    const val = parseInt(m || '0') * 60 + parseFloat(sec || '0')
    return isNaN(val) ? undefined : val
  }
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

// ─── Timestamp override storage ───────────────────────────────────────────────

interface TsOverride { start?: number; end?: number }

function tsKey(stepId: string) { return `danceflix:stepTs:${stepId}` }

function loadTsOverrides(stepId: string): Record<number, TsOverride> {
  try { const raw = localStorage.getItem(tsKey(stepId)); return raw ? JSON.parse(raw) : {} } catch { return {} }
}

function saveTsOverrides(stepId: string, data: Record<number, TsOverride>) {
  try { localStorage.setItem(tsKey(stepId), JSON.stringify(data)) } catch { /* noop */ }
}

// ─── Player imperative handle ─────────────────────────────────────────────────

interface PlayerHandle {
  getCurrentTime(): number
  seekToStart(): void
}

// ─── YouTube segment player ───────────────────────────────────────────────────

interface YTPlayerProps {
  youtubeId: string
  startTimestamp?: number
  endTimestamp?: number
  title: string
}

const YouTubeSegmentPlayer = forwardRef<PlayerHandle, YTPlayerProps>(
  function YouTubeSegmentPlayer({ youtubeId, startTimestamp, endTimestamp, title }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef    = useRef<any>(null)
    const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
    const [playerReady, setPlayerReady] = useState(false)

    const clearPoll = useCallback(() => {
      if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null }
    }, [])

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
      seekToStart: () => {
        if (!playerRef.current || !playerReady) return
        playerRef.current.seekTo(startTimestamp ?? 0, true)
        playerRef.current.playVideo()
      },
    }), [startTimestamp, playerReady])

    useEffect(() => {
      if (!containerRef.current) return
      let destroyed = false

      const init = async () => {
        await loadYTApi()
        if (destroyed || !containerRef.current) return
        if (playerRef.current) { try { playerRef.current.destroy() } catch { /* ignore */ } playerRef.current = null }
        setPlayerReady(false)
        containerRef.current.innerHTML = ''
        const mount = document.createElement('div')
        containerRef.current.appendChild(mount)

        playerRef.current = new window.YT.Player(mount, {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            ...(startTimestamp !== undefined ? { start: Math.floor(startTimestamp) } : {}),
          },
          events: {
            onReady: (e: any) => {
              if (destroyed) return
              setPlayerReady(true)
              if (startTimestamp !== undefined) e.target.seekTo(startTimestamp, true)
            },
            onStateChange: (e: any) => {
              if (destroyed) return
              if (e.data === 1 && endTimestamp !== undefined) {
                clearPoll()
                pollRef.current = setInterval(() => {
                  const ct: number = playerRef.current?.getCurrentTime?.() ?? 0
                  if (ct >= endTimestamp) { playerRef.current?.pauseVideo(); clearPoll() }
                }, 200)
              } else if (e.data !== 1) { clearPoll() }
            },
          },
        })
      }

      init()
      return () => {
        destroyed = true; clearPoll()
        if (playerRef.current) { try { playerRef.current.destroy() } catch { /* ignore */ } playerRef.current = null }
        setPlayerReady(false)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeId, startTimestamp, endTimestamp])

    return <div ref={containerRef} className="vd-yt-container" title={title} />
  }
)

// ─── Local video segment player ───────────────────────────────────────────────

interface LocalVideoProps {
  src: string
  startTimestamp?: number
  endTimestamp?: number
}

const LocalVideoSegmentPlayer = forwardRef<PlayerHandle, LocalVideoProps>(
  function LocalVideoSegmentPlayer({ src, startTimestamp, endTimestamp }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      seekToStart: () => {
        if (!videoRef.current) return
        videoRef.current.currentTime = startTimestamp ?? 0
        videoRef.current.play()
      },
    }), [startTimestamp])

    const handleLoadedMetadata = useCallback(() => {
      if (videoRef.current && startTimestamp !== undefined) videoRef.current.currentTime = startTimestamp
    }, [startTimestamp])

    const handleTimeUpdate = useCallback(() => {
      if (!videoRef.current || endTimestamp === undefined) return
      if (videoRef.current.currentTime >= endTimestamp) videoRef.current.pause()
    }, [endTimestamp])

    return (
      <video
        ref={videoRef}
        className="vd-local-video"
        src={src}
        controls
        controlsList="nodownload"
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />
    )
  }
)

// ─── Source player ────────────────────────────────────────────────────────────

interface SourcePlayerProps {
  source: Video
  stepName: string
  playerRef: React.RefObject<PlayerHandle | null>
}

function SourcePlayer({ source, stepName, playerRef }: SourcePlayerProps) {
  if (source.youtubeId && source.youtubeId !== '') {
    return (
      <YouTubeSegmentPlayer
        ref={playerRef}
        youtubeId={source.youtubeId}
        startTimestamp={source.startTimestamp}
        endTimestamp={source.endTimestamp}
        title={stepName}
      />
    )
  }
  if (source.videoUrl) {
    return (
      <LocalVideoSegmentPlayer
        ref={playerRef}
        src={source.videoUrl}
        startTimestamp={source.startTimestamp}
        endTimestamp={source.endTimestamp}
      />
    )
  }
  return (
    <div className="vd-placeholder">
      <svg width="52" height="52" className="vd-placeholder__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <p className="vd-placeholder__title">Vídeo ainda não disponível</p>
      <p className="vd-placeholder__subtitle">Este passo será documentado em breve</p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ytThumb(id: string) { return `https://img.youtube.com/vi/${id}/hqdefault.jpg` }

function parseYoutubeId(input: string): string | undefined {
  const s = input.trim()
  if (!s) return undefined
  const match = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : s.length === 11 ? s : undefined
}

// ─── Linked-videos panel ──────────────────────────────────────────────────────

interface StepVideoPanelProps {
  stepId: string
}

function StepVideoPanel({ stepId }: StepVideoPanelProps) {
  const lib = useVideoLibrary()
  const { activeStyle } = useActiveStyle()
  const linkedLibVideos = lib.getVideosForStep(stepId)

  const catalogLinked   = activeStyle.videos.filter(
    (v) => (v.steps ?? []).some((s) => s.stepId === stepId)
  )
  const catalogUnlinked = activeStyle.videos.filter(
    (v) => !(v.steps ?? []).some((s) => s.stepId === stepId)
  )
  const unlinkedLibVideos = lib.videos.filter(
    (v) => !(v.steps ?? []).some((s) => s.stepId === stepId)
  )
  const unlinkedVideos = [...unlinkedLibVideos, ...catalogUnlinked]

  // "add" form state
  const [mode, setMode] = useState<'idle' | 'link' | 'create'>('idle')
  const [ytInput, setYtInput]   = useState('')
  const [vidUrl, setVidUrl]     = useState('')
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [linkId, setLinkId]     = useState('')
  const [linkStart, setLinkStart] = useState('')
  const [linkEnd, setLinkEnd]     = useState('')

  const ytId = parseYoutubeId(ytInput)

  function buildOccurrence(wholeVideo?: boolean) {
    const startTime = wholeVideo ? undefined : parseMmSs(linkStart)
    const endTime   = wholeVideo ? undefined : parseMmSs(linkEnd)
    return { stepId, ...(startTime !== undefined ? { startTime } : {}), ...(endTime !== undefined ? { endTime } : {}) }
  }

  function doLink(occ: ReturnType<typeof buildOccurrence>) {
    const isLibVideo = lib.videos.some((v) => v.id === linkId)
    if (isLibVideo) {
      lib.linkStep(linkId, occ)
    } else {
      const catalog = activeStyle.videos.find((v) => v.id === linkId)
      if (catalog) {
        lib.addVideo({
          title: catalog.title,
          description: catalog.description,
          youtubeId: catalog.youtubeId,
          videoUrl: catalog.videoUrl,
          styleId: catalog.styleId,
          steps: [occ],
        })
      }
    }
    setLinkId(''); setLinkStart(''); setLinkEnd('')
    setMode('idle')
  }

  function handleLink()      { if (!linkId) return; doLink(buildOccurrence()) }
  function handleLinkWhole() { if (!linkId) return; doLink(buildOccurrence(true)) }

  function handleCreate() {
    if (!title.trim()) return
    const video = lib.addVideo({
      title: title.trim(),
      description: desc.trim() || undefined,
      youtubeId: ytId,
      videoUrl: vidUrl.trim() || undefined,
      styleId: activeStyle.id,
      steps: [{ stepId }],
    })
    void video
    resetForm()
  }

  function resetForm() {
    setYtInput(''); setVidUrl(''); setTitle(''); setDesc('')
    setLinkId(''); setLinkStart(''); setLinkEnd('')
    setMode('idle')
  }

  return (
    <div className="vd-vidpanel">
      <div className="vd-vidpanel__header">
        <p className="vd-vidpanel__eyebrow">Vídeos</p>
        <h2 className="vd-vidpanel__title">Vídeos que contêm este passo</h2>
      </div>

      {catalogLinked.length > 0 && (
        <div className="vd-vidpanel__list">
          {catalogLinked.map((vid) => (
            <div key={vid.id} className="vd-vidpanel__item">
              <div className="vd-vidpanel__item-thumb">
                {vid.youtubeId
                  ? <img src={ytThumb(vid.youtubeId)} alt={vid.title} className="vd-vidpanel__item-img" />
                  : <div className="vd-vidpanel__item-nothumb" />
                }
              </div>
              <div className="vd-vidpanel__item-info">
                <p className="vd-vidpanel__item-title">{vid.title}</p>
                <span className="vd-catalog-badge">Catálogo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkedLibVideos.length > 0 && (
        <div className="vd-vidpanel__list">
          {linkedLibVideos.map((vid) => {
            const occ = vid.steps?.find((s) => s.stepId === stepId)
            return (
              <div key={vid.id} className="vd-vidpanel__item">
                <div className="vd-vidpanel__item-thumb">
                  {vid.youtubeId
                    ? <img src={ytThumb(vid.youtubeId)} alt={vid.title} className="vd-vidpanel__item-img" />
                    : <div className="vd-vidpanel__item-nothumb" />
                  }
                </div>
                <div className="vd-vidpanel__item-info">
                  <p className="vd-vidpanel__item-title">{vid.title}</p>
                  {(occ?.startTime !== undefined || occ?.endTime !== undefined) && (
                    <p className="vd-vidpanel__item-ts">
                      {occ?.startTime !== undefined ? fmt(occ.startTime) : '0:00'}
                      {occ?.endTime !== undefined ? ` – ${fmt(occ.endTime)}` : ''}
                    </p>
                  )}
                </div>
                <button
                  className="vd-vidpanel__unlink"
                  onClick={() => lib.unlinkStep(vid.id, stepId)}
                  title="Desvincular"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {catalogLinked.length === 0 && linkedLibVideos.length === 0 && mode === 'idle' && (
        <p className="vd-vidpanel__empty">Nenhum vídeo vinculado ainda.</p>
      )}

      {mode === 'idle' && (
        <div className="vd-vidpanel__ctas">
          {unlinkedVideos.length > 0 && (
            <button className="vd-vidpanel__cta-btn" onClick={() => setMode('link')}>
              Vincular vídeo existente
            </button>
          )}
          <button className="vd-vidpanel__cta-btn vd-vidpanel__cta-btn--primary" onClick={() => setMode('create')}>
            + Adicionar novo vídeo
          </button>
        </div>
      )}

      {mode === 'link' && (
        <div className="vd-vidpanel__form">
          <p className="vd-vidpanel__form-title">Vincular vídeo existente</p>
          {unlinkedVideos.length === 0 ? (
            <p className="vd-vidpanel__empty">Todos os vídeos já estão vinculados.</p>
          ) : (
            <div className="vd-vidpanel__link-list">
              {unlinkedVideos.map((v) => (
                <button
                  key={v.id}
                  className={`vd-vidpanel__link-item${linkId === v.id ? ' is-selected' : ''}`}
                  onClick={() => { setLinkId(v.id); setLinkStart(''); setLinkEnd('') }}
                >
                  <div className="vd-vidpanel__link-thumb">
                    {v.youtubeId
                      ? <img src={ytThumb(v.youtubeId)} alt={v.title} />
                      : <div className="vd-vidpanel__item-nothumb" />
                    }
                  </div>
                  <span className="vd-vidpanel__link-title">{v.title}</span>
                  {linkId === v.id && <span className="vd-vidpanel__link-check">✓</span>}
                </button>
              ))}
            </div>
          )}

          {linkId && (
            <div className="vd-vidpanel__ts-section">
              <p className="vd-vidpanel__ts-label">Segmento do passo neste vídeo <span className="vd-vidpanel__ts-hint">(opcional)</span></p>
              <div className="vd-vidpanel__ts-fields">
                <div className="vd-vidpanel__ts-field">
                  <label className="vd-vidpanel__label">Início</label>
                  <input
                    className="vd-ts-input"
                    value={linkStart}
                    onChange={(e) => setLinkStart(e.target.value)}
                    placeholder="0:00"
                  />
                </div>
                <div className="vd-vidpanel__ts-field">
                  <label className="vd-vidpanel__label">Fim</label>
                  <input
                    className="vd-ts-input"
                    value={linkEnd}
                    onChange={(e) => setLinkEnd(e.target.value)}
                    placeholder="0:00"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="vd-vidpanel__form-actions">
            <button className="vd-ts-btn vd-ts-btn--cancel" onClick={resetForm}>Cancelar</button>
            {linkId && (
              <button className="vd-ts-btn vd-ts-btn--whole" onClick={handleLinkWhole} title="Vincular sem timestamps — o passo aparece ao longo de todo o vídeo">
                Vídeo inteiro
              </button>
            )}
            <button className="vd-ts-btn vd-ts-btn--save" onClick={handleLink} disabled={!linkId}>Vincular</button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="vd-vidpanel__form">
          <p className="vd-vidpanel__form-title">Novo vídeo</p>

          <div className="vd-vidpanel__field">
            <label className="vd-vidpanel__label">Título *</label>
            <input className="vd-ts-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aula de março 2025" />
          </div>

          <div className="vd-vidpanel__field-row">
            <div className="vd-vidpanel__field">
              <label className="vd-vidpanel__label">YouTube (URL ou ID)</label>
              <input className="vd-ts-input" value={ytInput} onChange={(e) => setYtInput(e.target.value)} placeholder="https://youtube.com/watch?v=…" />
              {ytInput && !ytId && <span className="vd-yt-error">ID não reconhecido</span>}
            </div>

            <div className="vd-vidpanel__field">
              <label className="vd-vidpanel__label">ou URL local</label>
              <input className="vd-ts-input" value={vidUrl} onChange={(e) => setVidUrl(e.target.value)} placeholder="/videos/aula.mp4" />
            </div>
          </div>

          {ytId && (
            <img src={ytThumb(ytId)} alt="preview" className="vd-yt-preview" />
          )}

          <div className="vd-vidpanel__field">
            <label className="vd-vidpanel__label">Descrição</label>
            <input className="vd-ts-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="vd-vidpanel__form-actions">
            <button className="vd-ts-btn vd-ts-btn--cancel" onClick={resetForm}>Cancelar</button>
            <button className="vd-ts-btn vd-ts-btn--save" onClick={handleCreate} disabled={!title.trim()}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tag editor ───────────────────────────────────────────────────────────────

interface TagEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  allTags: string[]
}

function TagEditor({ tags, onChange, allTags }: TagEditorProps) {
  const [input, setInput]           = useState('')
  const [dropdownOpen, setDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    const q = input.toLowerCase().trim()
    return allTags.filter((t) => !tags.includes(t) && (q === '' || t.toLowerCase().includes(q))).slice(0, 8)
  }, [input, tags, allTags])

  function addTag(raw: string) {
    const t = raw.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
    setDropdown(false)
    inputRef.current?.focus()
  }

  function removeTag(t: string) { onChange(tags.filter((x) => x !== t)) }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setDropdown(false)
    }
  }

  return (
    <div className="vd-tageditor" onClick={() => inputRef.current?.focus()}>
      <div className="vd-tageditor__field">
        {tags.map((t) => (
          <span key={t} className="vd-tageditor__chip">
            {t}
            <button
              className="vd-tageditor__chip-remove"
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(t) }}
              tabIndex={-1}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="vd-tageditor__input"
          value={input}
          placeholder={tags.length === 0 ? 'Adicionar tag…' : ''}
          onChange={(e) => { setInput(e.target.value); setDropdown(true) }}
          onFocus={() => setDropdown(true)}
          onBlur={() => setTimeout(() => setDropdown(false), 150)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {dropdownOpen && suggestions.length > 0 && (
        <div className="vd-tageditor__dropdown">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="vd-tageditor__suggestion"
              onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step edit form ───────────────────────────────────────────────────────────

interface StepEditFormProps {
  step: DanceStep
  onSave: (patch: Partial<DanceStep>) => void
  onReset: () => void
  hasOverride: boolean
}

function StepEditForm({ step, onSave, onReset, hasOverride }: StepEditFormProps) {
  const [open, setOpen]             = useState(false)
  const [name, setName]             = useState(step.name)
  const [desc, setDesc]             = useState(step.description)
  const [difficulty, setDifficulty] = useState<Level>(step.difficulty)
  const [category, setCategory]     = useState(step.category)
  const [tags, setTags]             = useState<string[]>(step.tags)
  const [techDetails, setTechDetails] = useState(step.technicalDetails ?? '')
  const [duration, setDuration]     = useState(step.duration ?? '')

  const allTags = useMemo(
    () => [...new Set(allCatalogSteps.flatMap((s) => s.tags))].sort(),
    []
  )

  // Re-sync fields if the step changes (e.g. override was reset elsewhere)
  useEffect(() => {
    setName(step.name); setDesc(step.description); setDifficulty(step.difficulty)
    setCategory(step.category); setTags(step.tags)
    setTechDetails(step.technicalDetails ?? ''); setDuration(step.duration ?? '')
  }, [step])

  function handleSave() {
    onSave({
      name: name.trim() || step.name,
      description: desc.trim() || step.description,
      difficulty,
      category,
      tags,
      technicalDetails: techDetails.trim() || undefined,
      duration: duration.trim() || undefined,
    })
    setOpen(false)
  }

  return (
    <div className="vd-editform">
      <button className="vd-editform__toggle" onClick={() => setOpen((v) => !v)}>
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar dados do passo
        {hasOverride && <span className="vd-editform__badge">Editado</span>}
        <span className="vd-editform__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="vd-editform__body">
          <div className="vd-editform__row">
            <div className="vd-editform__field vd-editform__field--grow">
              <label className="vd-editform__label">Nome</label>
              <input className="vd-editform__input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="vd-editform__field">
              <label className="vd-editform__label">Duração</label>
              <input className="vd-editform__input vd-editform__input--sm" value={duration}
                onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 4 tempos" />
            </div>
          </div>

          <div className="vd-editform__row">
            <div className="vd-editform__field">
              <label className="vd-editform__label">Categoria</label>
              <select className="vd-editform__select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {STEP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="vd-editform__field">
              <label className="vd-editform__label">Dificuldade</label>
              <select className="vd-editform__select" value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value) as Level)}>
                {([0, 1, 2, 3, 4, 5] as Level[]).map((l) => (
                  <option key={l} value={l}>{l} — {DIFFICULTY_LABELS[l]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vd-editform__field">
            <label className="vd-editform__label">Descrição</label>
            <textarea className="vd-editform__input vd-editform__textarea" rows={3}
              value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="vd-editform__field">
            <label className="vd-editform__label">Detalhes técnicos</label>
            <textarea className="vd-editform__input vd-editform__textarea" rows={3}
              value={techDetails} onChange={(e) => setTechDetails(e.target.value)}
              placeholder="Opcional — indicações de corpo, timing, conexão…" />
          </div>

          <div className="vd-editform__field">
            <label className="vd-editform__label">Tags</label>
            <TagEditor tags={tags} onChange={setTags} allTags={allTags} />
          </div>

          <div className="vd-editform__actions">
            {hasOverride && (
              <button className="vd-editform__btn vd-editform__btn--reset" onClick={() => { onReset(); setOpen(false) }}>
                Repor original
              </button>
            )}
            <button className="vd-editform__btn vd-editform__btn--cancel" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="vd-editform__btn vd-editform__btn--save" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const staticStep = id ? getStepById(id) : undefined
  const overrides = useStaticOverrides()
  const video = staticStep ? overrides.getMergedStep(staticStep) : undefined

  const [activeIdx, setActiveIdx] = useState(0)
  const playerHandle = useRef<PlayerHandle>(null)

  // Timestamp overrides persisted in localStorage
  const [tsOverrides, setTsOverrides] = useState<Record<number, TsOverride>>({})

  // Inline edit mode
  const [editMode, setEditMode] = useState(false)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd]   = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])
  useEffect(() => { setActiveIdx(0); setEditMode(false) }, [id])
  useEffect(() => { if (id) setTsOverrides(loadTsOverrides(id)) }, [id])

  if (!video) {
    return (
      <div className="vd-not-found">
        <p className="vd-not-found__text">Vídeo não encontrado.</p>
        <Link to="/" className="vd-not-found__link">← Voltar para a biblioteca</Link>
      </div>
    )
  }

  const related         = getRelatedVideos(video)
  const effectiveSources = getEffectiveVideos(video)
  const rawSource       = effectiveSources[Math.min(activeIdx, effectiveSources.length - 1)] ?? {}

  // Merge static timestamps with localStorage overrides (overrides win)
  const override = tsOverrides[activeIdx] ?? {}
  const mergedSource: Video = {
    ...rawSource,
    startTimestamp: override.start ?? rawSource.startTimestamp,
    endTimestamp:   override.end   ?? rawSource.endTimestamp,
  }

  const hasSegment = mergedSource.startTimestamp !== undefined || mergedSource.endTimestamp !== undefined
  const isPlayable = !!(mergedSource.youtubeId || mergedSource.videoUrl)

  const enterEdit = () => {
    setEditStart(mergedSource.startTimestamp !== undefined ? fmt(mergedSource.startTimestamp) : '')
    setEditEnd(mergedSource.endTimestamp   !== undefined ? fmt(mergedSource.endTimestamp)   : '')
    setEditMode(true)
  }

  const captureStart = () => setEditStart(fmt(playerHandle.current?.getCurrentTime() ?? 0))
  const captureEnd   = () => setEditEnd(fmt(playerHandle.current?.getCurrentTime() ?? 0))

  const saveEdit = () => {
    const start = parseMmSs(editStart)
    const end   = parseMmSs(editEnd)
    const next  = { ...tsOverrides, [activeIdx]: { start, end } }
    setTsOverrides(next)
    saveTsOverrides(video.id, next)
    setEditMode(false)
  }

  const clearTs = () => {
    const next = { ...tsOverrides }
    delete next[activeIdx]
    setTsOverrides(next)
    saveTsOverrides(video.id, next)
    setEditMode(false)
  }

  return (
    <div className="vd-page">

      {/* Breadcrumb */}
      <div className="vd-breadcrumb">
        <div className="vd-breadcrumb__inner">
          <Link
            to="/"
            className="vd-breadcrumb__link"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Biblioteca
          </Link>
        </div>
      </div>

      <main className="vd-main">

        {/* Source selector pills */}
        {effectiveSources.length > 1 && (
          <div className="vd-source-pills">
            {effectiveSources.map((src, i) => {
              const ov    = tsOverrides[i] ?? {}
              const start = ov.start ?? src.startTimestamp
              const end   = ov.end   ?? src.endTimestamp
              return (
                <button
                  key={i}
                  onClick={() => { setActiveIdx(i); setEditMode(false) }}
                  className={`vd-source-btn${activeIdx === i ? ' is-active' : ''}`}
                >
                  {src.label ?? `Fonte ${i + 1}`}
                  {(start !== undefined || end !== undefined) && (
                    <span className="vd-source-btn__ts">
                      {start !== undefined ? fmt(start) : '0:00'}
                      {end !== undefined ? `–${fmt(end)}` : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Player + segment bar */}
        <div className={`vd-player${hasSegment || isPlayable ? ' vd-player--has-segment' : ''}`}>
          <div className="vd-segment-wrap">

            <SourcePlayer source={mergedSource} stepName={video.name} playerRef={playerHandle} />

            {isPlayable && (
              editMode ? (

                /* ── Edit mode ─────────────────────────────────────────── */
                <div className="vd-segment-bar vd-segment-bar--edit">
                  <div className="vd-ts-fields">
                    <div className="vd-ts-field">
                      <label className="vd-ts-label">Início</label>
                      <input
                        type="text"
                        className="vd-ts-input"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        placeholder="0:00"
                      />
                      <button className="vd-ts-capture-btn" onClick={captureStart} title="Capturar tempo atual">
                        ⦿ Capturar
                      </button>
                    </div>
                    <div className="vd-ts-field">
                      <label className="vd-ts-label">Fim</label>
                      <input
                        type="text"
                        className="vd-ts-input"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        placeholder="0:00"
                      />
                      <button className="vd-ts-capture-btn" onClick={captureEnd} title="Capturar tempo atual">
                        ⦿ Capturar
                      </button>
                    </div>
                  </div>
                  <div className="vd-ts-actions">
                    {hasSegment && (
                      <button className="vd-ts-btn vd-ts-btn--clear" onClick={clearTs}>Limpar</button>
                    )}
                    <button className="vd-ts-btn vd-ts-btn--cancel" onClick={() => setEditMode(false)}>Cancelar</button>
                    <button className="vd-ts-btn vd-ts-btn--save"   onClick={saveEdit}>Salvar</button>
                  </div>
                </div>

              ) : (

                /* ── Display mode ──────────────────────────────────────── */
                <div className="vd-segment-bar">
                  <span className="vd-segment-range">
                    {hasSegment ? (
                      <>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="vd-segment-clock">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Segmento:&nbsp;
                        <strong>{mergedSource.startTimestamp !== undefined ? fmt(mergedSource.startTimestamp) : '0:00'}</strong>
                        {mergedSource.endTimestamp !== undefined && <>&nbsp;–&nbsp;<strong>{fmt(mergedSource.endTimestamp)}</strong></>}
                      </>
                    ) : (
                      <span className="vd-segment-empty">Sem segmento definido</span>
                    )}
                  </span>
                  <div className="vd-segment-controls">
                    {hasSegment && (
                      <button
                        className="vd-segment-restart"
                        onClick={() => playerHandle.current?.seekToStart()}
                        title="Voltar ao início do segmento"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6l-8.5 6z" />
                        </svg>
                        Início do passo
                      </button>
                    )}
                    <button className="vd-segment-edit-btn" onClick={enterEdit} title="Editar timestamps">
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Title + category */}
        <div className="vd-title-row">
          <h1 className="vd-title">{video.name}</h1>
          <CategoryTag category={video.category as Exclude<StepCategory, 'All'>} size="md" />
        </div>

        {/* Metadata */}
        {(mergedSource.duration ?? video.duration) && (
          <div className="vd-meta">
            <span className="vd-meta__item">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mergedSource.duration ?? video.duration}
            </span>
          </div>
        )}

        <p className="vd-desc">{video.description}</p>

        {video.technicalDetails && (
          <div className="vd-tech">
            <p className="vd-tech__label">Detalhes Técnicos</p>
            <p className="vd-tech__text">{video.technicalDetails}</p>
          </div>
        )}

        {video.tags.length > 0 && (
          <div className="vd-tags">
            {video.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?q=${encodeURIComponent(tag)}`}
                className="vd-tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <StepVideoPanel stepId={video.id} />
        <TrainingPanel stepId={video.id} step={video} />
        <StepEditForm
          step={video}
          hasOverride={overrides.hasStepOverride(video.id)}
          onSave={(patch) => overrides.updateStep(video.id, patch)}
          onReset={() => overrides.resetStep(video.id)}
        />
        <RelatedVideos videos={related} />
      </main>
    </div>
  )
}
