import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getVideoById, getRelatedVideos } from '../data/videos'
import { CategoryTag } from '../components/CategoryTag'
import type { StepCategory, VideoSource } from '../types'
import { TrainingPanel } from '../components/TrainingPanel'
import { RelatedVideos } from '../components/RelatedVideos'

const P = "'Poppins', sans-serif"

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
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: P, color: '#8b95b8', fontSize: '15px', marginBottom: '16px' }}>
          Vídeo não encontrado.
        </p>
        <Link to="/" style={{ fontFamily: P, color: '#f5a623', fontSize: '13px', textDecoration: 'none' }}>
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
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Breadcrumb bar */}
      <div style={{ background: '#f0f4ff', padding: '12px 0', borderBottom: '1px solid #dde3f5' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: P, fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600,
              textTransform: 'uppercase', color: '#4a4e6b', textDecoration: 'none', transition: 'color 0.2s',
            }}
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

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Source selector — shown only when there are multiple sources */}
        {effectiveSources.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {effectiveSources.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  fontFamily: P, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '6px 16px', borderRadius: '50px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${activeIdx === i ? '#f5a623' : '#dde3f5'}`,
                  background: activeIdx === i ? 'rgba(245,166,35,0.10)' : '#ffffff',
                  color: activeIdx === i ? '#c97d00' : '#4a4e6b',
                }}
              >
                {src.label ?? `Fonte ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#1a1d3b', aspectRatio: '16/9', marginBottom: '32px', boxShadow: '0 8px 40px rgba(26,29,59,0.2)' }}>
          {activeSource.youtubeId && activeSource.youtubeId !== '' ? (
            <iframe
              style={{ width: '100%', height: '100%', border: 'none' }}
              src={`https://www.youtube.com/embed/${activeSource.youtubeId}`}
              title={video.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : activeSource.videoUrl ? (
            <video
              style={{ width: '100%', height: '100%', background: '#1a1d3b' }}
              src={activeSource.videoUrl}
              controls
              controlsList="nodownload"
              playsInline
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a1d3b 0%, #2d3163 100%)',
            }}>
              <svg width="52" height="52" style={{ color: 'rgba(179,157,219,0.4)', marginBottom: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p style={{ fontFamily: P, color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '4px' }}>Vídeo ainda não disponível</p>
              <p style={{ fontFamily: P, color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Este passo será documentado em breve</p>
            </div>
          )}
        </div>

        {/* Title + category */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: P, fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: '#1a1d3b', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            {video.name}
          </h1>
          <CategoryTag category={video.category as Exclude<StepCategory, 'All'>} size="md" />
        </div>

        {/* Metadata row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '20px',
          paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #dde3f5',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {activeSource.presenter ?? video.presenter}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activeSource.duration ?? video.duration}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontFamily: P, fontSize: '14px', lineHeight: 1.75, color: '#4a4e6b', marginBottom: '20px' }}>
          {video.description}
        </p>

        {/* Technical details */}
        {video.technicalDetails && (
          <div style={{
            padding: '16px 20px', background: '#f0f4ff',
            borderLeft: '3px solid #00c9a7', borderRadius: '0 10px 10px 0', marginBottom: '20px',
          }}>
            <p style={{ fontFamily: P, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, color: '#00c9a7', marginBottom: '6px' }}>
              Detalhes Técnicos
            </p>
            <p style={{ fontFamily: P, fontSize: '13px', lineHeight: 1.7, color: '#4a4e6b' }}>
              {video.technicalDetails}
            </p>
          </div>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {video.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?q=${encodeURIComponent(tag)}`}
                style={{
                  fontFamily: P, fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600,
                  padding: '5px 12px', borderRadius: '20px',
                  background: 'rgba(179,157,219,0.1)', border: '1px solid rgba(179,157,219,0.3)',
                  color: '#7c5cbf', textDecoration: 'none', transition: 'background 0.15s',
                }}
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
