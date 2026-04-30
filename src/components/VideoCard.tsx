import { Link } from 'react-router-dom'
import type { Video } from '../types'
import { getVideoThumbnail } from '../data/videos'

interface VideoCardProps {
  video: Video
}

const LEVEL_CONFIG = [
  { dot: '#b39ddb', label: 'Não praticado' },
  { dot: '#f06292', label: 'Iniciante'     },
  { dot: '#ffd54f', label: 'Desenvolvendo' },
  { dot: '#4fc3f7', label: 'Confortável'   },
  { dot: '#00c9a7', label: 'Forte'         },
  { dot: '#f5a623', label: 'Dominado'      },
]

const P = "'Poppins', sans-serif"

export function VideoCard({ video }: VideoCardProps) {
  const thumbnail = getVideoThumbnail(video)
  const hasRealThumb = video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ'
  const level = LEVEL_CONFIG[video.knowledgeLevel] ?? LEVEL_CONFIG[0]

  return (
    <Link to={`/video/${video.id}`} className="group block video-card" style={{ textDecoration: 'none' }}>
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden mb-3"
        style={{ borderRadius: '14px', background: '#e8ecf8' }}
      >
        {hasRealThumb ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #dde3f5 0%, #eef2ff 100%)' }}
          >
            <svg className="w-10 h-10" style={{ color: '#b39ddb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <span
          className="absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(26,29,59,0.72)', color: '#fff', fontFamily: P }}
        >
          {video.duration}
        </span>

        {/* Play overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{ background: 'rgba(26,29,59,0.12)' }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-200"
            style={{ background: '#f5a623', boxShadow: '0 6px 20px rgba(245,166,35,0.45)' }}
          >
            <svg className="w-5 h-5 ml-0.5" style={{ color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: '#00c9a7', fontFamily: P }}>
          {video.category}
        </p>
        <h3
          className="text-sm leading-snug line-clamp-2 mb-1.5 transition-colors duration-150"
          style={{ fontFamily: P, fontWeight: 700, color: '#1a1d3b' }}
        >
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: level.dot }} />
          <span style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8' }}>{level.label}</span>
        </div>
      </div>
    </Link>
  )
}
