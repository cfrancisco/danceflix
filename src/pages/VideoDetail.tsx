import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getVideoById, getRelatedVideos } from '../data/videos'
import { CategoryTag } from '../components/CategoryTag'
import type { StepCategory, VideoSource } from '../types'
import { TrainingPanel } from '../components/TrainingPanel'
import { RelatedVideos } from '../components/RelatedVideos'
import './VideoDetail.css'

export function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const video = id ? getVideoById(id) : undefined
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  useEffect(() => {
    setActiveIdx(0)
  }, [id])

  if (!video) {
    return (
      <div className="vd-not-found">
        <p className="vd-not-found__text">
          Vídeo não encontrado.
        </p>
        <Link to="/" className="vd-not-found__link">
          ← Voltar para a biblioteca
        </Link>
      </div>
    )
  }

  const related = getRelatedVideos(video)

  // Build effective source list from youtubeVideos + localVideos
  const ytSources: VideoSource[] = video.youtubeVideos
    .filter((id) => id !== '')
    .map((youtubeId) => ({ youtubeId }))
  const effectiveSources: VideoSource[] = [...ytSources, ...video.localVideos]
  const activeSource = effectiveSources[Math.min(activeIdx, effectiveSources.length - 1)] ?? {}

  return (
    <div className="vd-page">

      {/* Breadcrumb bar */}
      <div className="vd-breadcrumb">
        <div className="vd-breadcrumb__inner">
          <Link
            to="/"
            className="vd-breadcrumb__link"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f5a623')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4e6b')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Biblioteca
          </Link>
        </div>
      </div>

      <main className="vd-main">

        {/* Source selector — shown only when there are multiple sources */}
        {effectiveSources.length > 1 && (
          <div className="vd-source-pills">
            {effectiveSources.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`vd-source-btn${activeIdx === i ? ' is-active' : ''}`}
                style={activeIdx === i ? {
                  borderColor: '#f5a623',
                  background: 'rgba(245,166,35,0.10)',
                  color: '#c97d00',
                } : undefined}
              >
                {src.label ?? `Fonte ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="vd-player">
          {activeSource.youtubeId && activeSource.youtubeId !== '' ? (
            <iframe
              src={`https://www.youtube.com/embed/${activeSource.youtubeId}`}
              title={video.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : activeSource.videoUrl ? (
            <video
              src={activeSource.videoUrl}
              controls
              controlsList="nodownload"
              playsInline
            />
          ) : (
            <div className="vd-placeholder">
              <svg width="52" height="52" className="vd-placeholder__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="vd-placeholder__title">Vídeo ainda não disponível</p>
              <p className="vd-placeholder__subtitle">Este passo será documentado em breve</p>
            </div>
          )}
        </div>

        {/* Title + category */}
        <div className="vd-title-row">
          <h1 className="vd-title">
            {video.name}
          </h1>
          <CategoryTag category={video.category as Exclude<StepCategory, 'All'>} size="md" />
        </div>

        {/* Metadata row */}
        {(activeSource.duration ?? video.duration) && (
          <div className="vd-meta">
            <span className="vd-meta__item">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activeSource.duration ?? video.duration}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="vd-desc">
          {video.description}
        </p>

        {/* Technical details */}
        {video.technicalDetails && (
          <div className="vd-tech">
            <p className="vd-tech__label">
              Detalhes Técnicos
            </p>
            <p className="vd-tech__text">
              {video.technicalDetails}
            </p>
          </div>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="vd-tags">
            {video.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?q=${encodeURIComponent(tag)}`}
                className="vd-tag"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(179,157,219,0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(179,157,219,0.1)')}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <TrainingPanel stepId={video.id} step={video} />
        <RelatedVideos videos={related} />
      </main>
    </div>
  )
}
