import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useVideoLibrary } from '../hooks/useVideoLibrary'
import { useActiveStyle } from '../context/StyleContext'
import { useStaticOverrides } from '../hooks/useStaticOverrides'
import { getStepById } from '../data/registry'
import type { Video } from '../types'
import './VideoLibrary.css'


function ytThumb(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

function parseYoutubeId(input: string): string | undefined {
  const s = input.trim()
  if (!s) return undefined
  const match = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : s.length === 11 ? s : undefined
}

// ── Hold-to-delete button ─────────────────────────────────────────────────────

function HoldToDelete({ onDelete }: { onDelete: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holding, setHolding] = useState(false)

  function start() {
    setHolding(true)
    timerRef.current = setTimeout(() => { setHolding(false); onDelete() }, 1500)
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHolding(false)
  }

  return (
    <button
      className={`vlb-hold-delete${holding ? ' is-holding' : ''}`}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={(e) => { e.preventDefault(); start() }}
      onTouchEnd={cancel}
      title="Segurar para apagar"
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}

// ── Video form (create / edit) ─────────────────────────────────────────────────

interface VideoFormProps {
  initial?: Partial<Video>
  onSave: (data: Omit<Video, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function VideoForm({ initial, onSave, onCancel }: VideoFormProps) {
  const { activeStyle } = useActiveStyle()
  const [title, setTitle]       = useState(initial?.title ?? '')
  const [desc, setDesc]         = useState(initial?.description ?? '')
  const [ytInput, setYtInput]   = useState(initial?.youtubeId ?? '')
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '')

  const ytId = parseYoutubeId(ytInput)

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: desc.trim() || undefined,
      youtubeId: ytId,
      videoUrl: videoUrl.trim() || undefined,
      styleId: activeStyle.id,
      steps: initial?.steps ?? [],
    })
  }

  return (
    <div className="vlb-form">
      <div className="vlb-form__field">
        <label className="vlb-form__label">Título *</label>
        <input
          className="vlb-form__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Aula de zouk — março 2025"
          autoFocus
        />
      </div>

      <div className="vlb-form__field">
        <label className="vlb-form__label">Descrição</label>
        <textarea
          className="vlb-form__input vlb-form__textarea"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Contexto, professor, evento…"
          rows={3}
        />
      </div>

      <div className="vlb-form__row">
        <div className="vlb-form__field">
          <label className="vlb-form__label">YouTube (URL ou ID)</label>
          <input
            className="vlb-form__input"
            value={ytInput}
            onChange={(e) => setYtInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=… ou dQw4w9WgXcQ"
          />
          {ytInput && !ytId && (
            <span className="vlb-form__hint vlb-form__hint--err">ID do YouTube não reconhecido</span>
          )}
          {ytId && (
            <span className="vlb-form__hint">ID: <strong>{ytId}</strong></span>
          )}
        </div>

        <div className="vlb-form__field">
          <label className="vlb-form__label">URL de vídeo local</label>
          <input
            className="vlb-form__input"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="/videos/aula.mp4"
          />
        </div>
      </div>

      {ytId && (
        <div className="vlb-form__preview">
          <img src={ytThumb(ytId)} alt="thumbnail" className="vlb-form__thumb" />
        </div>
      )}

      <div className="vlb-form__actions">
        <button className="vlb-btn vlb-btn--cancel" onClick={onCancel}>Cancelar</button>
        <button className="vlb-btn vlb-btn--save" onClick={handleSave} disabled={!title.trim()}>
          Salvar
        </button>
      </div>
    </div>
  )
}

// ── Catalog video card (with inline edit) ────────────────────────────────────

interface CatalogVideoCardProps {
  video: Video
  onSave: (patch: Partial<Video>) => void
  onReset: () => void
  onDelete: () => void
  hasOverride: boolean
}

function CatalogVideoCard({ video, onSave, onReset, onDelete, hasOverride }: CatalogVideoCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle]     = useState(video.title)
  const [desc, setDesc]       = useState(video.description ?? '')
  const [ytId, setYtId]       = useState(video.youtubeId ?? '')
  const [vidUrl, setVidUrl]   = useState(video.videoUrl ?? '')

  function handleSave() {
    onSave({
      title: title.trim() || video.title,
      description: desc.trim() || undefined,
      youtubeId: ytId.trim() || undefined,
      videoUrl: vidUrl.trim() || undefined,
    })
    setEditing(false)
  }

  const thumb = video.youtubeId ? ytThumb(video.youtubeId) : null

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="vlb-card vlb-card--catalog">
      <div className="vlb-card__thumb">
        {thumb
          ? <img src={thumb} alt={video.title} className="vlb-card__img" />
          : <div className="vlb-card__no-thumb">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="vlb-no-thumb-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
        }
        {video.youtubeId && (
          <a href={`https://youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noreferrer"
            className="vlb-card__yt-badge" title="Abrir no YouTube">▶</a>
        )}
      </div>

      {editing ? (
        <div className="vlb-card__body vlb-catalog-edit">
          <div className="vlb-catalog-edit__field">
            <label className="vlb-catalog-edit__label">Título</label>
            <input className="vlb-catalog-edit__input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="vlb-catalog-edit__field">
            <label className="vlb-catalog-edit__label">YouTube ID / URL</label>
            <input className="vlb-catalog-edit__input" value={ytId} onChange={(e) => setYtId(e.target.value)}
              placeholder="dQw4w9WgXcQ ou URL completa" />
          </div>
          <div className="vlb-catalog-edit__field">
            <label className="vlb-catalog-edit__label">URL local</label>
            <input className="vlb-catalog-edit__input" value={vidUrl} onChange={(e) => setVidUrl(e.target.value)}
              placeholder="/videos/aula.mp4" />
          </div>
          <div className="vlb-catalog-edit__field">
            <label className="vlb-catalog-edit__label">Descrição</label>
            <textarea className="vlb-catalog-edit__input vlb-catalog-edit__textarea" rows={2}
              value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="vlb-catalog-edit__actions">
            {hasOverride && (
              <button className="vlb-icon-btn vlb-icon-btn--danger" onClick={() => { onReset(); setEditing(false) }}
                title="Repor original">↩</button>
            )}
            <button className="vlb-btn vlb-btn--cancel" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="vlb-btn vlb-btn--save" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      ) : (
        <div className="vlb-card__body">
          <div className="vlb-card__catalog-row">
            <h3 className="vlb-card__title">{video.title}</h3>
            <span className={`vlb-catalog-badge${hasOverride ? ' vlb-catalog-badge--edited' : ''}`}>
              {hasOverride ? 'Editado' : 'Catálogo'}
            </span>
          </div>
          {video.description && <p className="vlb-card__desc">{video.description}</p>}
          {(video.steps ?? []).length > 0 && (
            <div className="vlb-card__steps">
              {(video.steps ?? []).map((occ) => {
                const step = getStepById(occ.stepId)
                return (
                  <Link key={occ.stepId} to={`/video/${occ.stepId}`} className="vlb-step-chip" title={step?.name ?? occ.stepId}>
                    {step?.name ?? occ.stepId}
                  </Link>
                )
              })}
            </div>
          )}
          {(video.steps ?? []).length === 0 && (
            <p className="vlb-card__no-steps">Nenhum passo vinculado</p>
          )}
        </div>
      )}

      {!editing && (
        <div className="vlb-card__actions">
          <button className="vlb-icon-btn" onClick={() => { setTitle(video.title); setDesc(video.description ?? ''); setYtId(video.youtubeId ?? ''); setVidUrl(video.videoUrl ?? ''); setEditing(true) }} title="Editar">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <HoldToDelete onDelete={onDelete} />
        </div>
      )}
    </motion.div>
  )
}

// ── Video card ─────────────────────────────────────────────────────────────────

interface VideoCardProps {
  video: Video
  onEdit: () => void
  onDelete: () => void
}

function LibraryVideoCard({ video, onEdit, onDelete }: VideoCardProps) {

  const thumb = video.youtubeId ? ytThumb(video.youtubeId) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="vlb-card"
    >
      <div className="vlb-card__thumb">
        {thumb
          ? <img src={thumb} alt={video.title} className="vlb-card__img" />
          : <div className="vlb-card__no-thumb">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="vlb-no-thumb-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
        }
        {video.youtubeId && (
          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="vlb-card__yt-badge"
            title="Abrir no YouTube"
          >
            ▶
          </a>
        )}
      </div>

      <div className="vlb-card__body">
        <h3 className="vlb-card__title">{video.title}</h3>
        {video.description && <p className="vlb-card__desc">{video.description}</p>}

        {(video.steps ?? []).length > 0 && (
          <div className="vlb-card__steps">
            {(video.steps ?? []).map((occ) => {
              const step = getStepById(occ.stepId)
              return (
                <Link
                  key={occ.stepId}
                  to={`/video/${occ.stepId}`}
                  className="vlb-step-chip"
                  title={step?.name ?? occ.stepId}
                >
                  {step?.name ?? occ.stepId}
                  {(occ.startTime !== undefined || occ.endTime !== undefined) && (
                    <span className="vlb-step-chip__ts">
                      {occ.startTime !== undefined ? fmtTs(occ.startTime) : '0:00'}
                      {occ.endTime !== undefined ? `–${fmtTs(occ.endTime)}` : ''}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {(video.steps ?? []).length === 0 && (
          <p className="vlb-card__no-steps">Nenhum passo vinculado</p>
        )}
      </div>

      <div className="vlb-card__actions">
        <button className="vlb-icon-btn" onClick={onEdit} title="Editar">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <HoldToDelete onDelete={onDelete} />
      </div>
    </motion.div>
  )
}

function fmtTs(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function VideoLibrary() {
  const lib = useVideoLibrary()
  const { activeStyle } = useActiveStyle()
  const overrides = useStaticOverrides()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const catalogIds = new Set(activeStyle.videos.map((v) => v.id))
  const userVideos = lib.videos.filter((v) => !catalogIds.has(v.id))

  function handleCreate(data: Omit<Video, 'id' | 'createdAt'>) {
    lib.addVideo(data)
    setCreating(false)
  }

  function handleUpdate(id: string, data: Omit<Video, 'id' | 'createdAt'>) {
    lib.updateVideo(id, data)
    setEditingId(null)
  }

  const editingVideo = editingId ? lib.videos.find((v) => v.id === editingId) : undefined

  return (
    <div className="vlb-page">
      <div className="vlb-header">
        <div className="vlb-header__inner">
          <div className="vlb-header__top">
            <div>
              <p className="vlb-header__eyebrow">Biblioteca</p>
              <h1 className="vlb-header__title">Vídeos</h1>
            </div>
            <div className="vlb-header__actions">
              <button
                className={`vlb-btn vlb-btn--export${Object.keys(overrides.stepOverrides).length > 0 ? ' vlb-btn--export-active' : ''}`}
                onClick={() => overrides.exportStepsJSON(activeStyle.id)}
                title="Exporta steps.json pronto para substituir na base de dados"
              >
                ↓ Passos
                {Object.keys(overrides.stepOverrides).length > 0 && (
                  <span className="vlb-export-badge">{Object.keys(overrides.stepOverrides).length}</span>
                )}
              </button>
              <button
                className={`vlb-btn vlb-btn--export${Object.keys(overrides.videoOverrides).length > 0 ? ' vlb-btn--export-active' : ''}`}
                onClick={() => overrides.exportVideosJSON(activeStyle.id)}
                title="Exporta videos.json pronto para substituir na base de dados"
              >
                ↓ Vídeos
                {Object.keys(overrides.videoOverrides).length > 0 && (
                  <span className="vlb-export-badge">{Object.keys(overrides.videoOverrides).length}</span>
                )}
              </button>
              {!creating && !editingId && (
                <button className="vlb-btn vlb-btn--primary" onClick={() => setCreating(true)}>
                  + Novo vídeo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="vlb-main">

        <AnimatePresence>
          {creating && (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="vlb-form-wrap"
            >
              <p className="vlb-form-wrap__title">Novo vídeo</p>
              <VideoForm onSave={handleCreate} onCancel={() => setCreating(false)} />
            </motion.div>
          )}

          {editingVideo && (
            <motion.div
              key="edit-form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="vlb-form-wrap"
            >
              <p className="vlb-form-wrap__title">Editar vídeo</p>
              <VideoForm
                initial={editingVideo}
                onSave={(data) => handleUpdate(editingVideo.id, data)}
                onCancel={() => setEditingId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {userVideos.length === 0 && activeStyle.videos.length === 0 && !creating && (
          <div className="vlb-empty">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="vlb-empty__icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="vlb-empty__text">Nenhum vídeo na biblioteca ainda.</p>
            <p className="vlb-empty__sub">Adicione vídeos aqui ou a partir da página de um passo.</p>
          </div>
        )}

        {userVideos.length > 0 && (
          <>
            <p className="vlb-section-label">Minha biblioteca</p>
            <AnimatePresence>
              <div className="vlb-grid">
                {userVideos.map((video) => (
                  <LibraryVideoCard
                    key={video.id}
                    video={video}
                    onEdit={() => { setCreating(false); setEditingId(video.id) }}
                    onDelete={() => lib.deleteVideo(video.id)}
                  />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}

        {activeStyle.videos.some((v) => !overrides.isVideoHidden(v.id)) && (
          <>
            <p className={`vlb-section-label${userVideos.length > 0 ? ' vlb-section-label--spaced' : ''}`}>Catálogo — {activeStyle.name}</p>
            <div className="vlb-grid">
              {activeStyle.videos
                .filter((v) => !overrides.isVideoHidden(v.id))
                .map((video) => {
                  const merged = overrides.getMergedVideo(video)
                  return (
                    <CatalogVideoCard
                      key={video.id}
                      video={merged}
                      hasOverride={overrides.hasVideoOverride(video.id)}
                      onSave={(patch) => overrides.updateVideo(video.id, patch)}
                      onReset={() => overrides.resetVideo(video.id)}
                      onDelete={() => overrides.hideCatalogVideo(video.id)}
                    />
                  )
                })}
            </div>
          </>
        )}

      </main>
    </div>
  )
}
