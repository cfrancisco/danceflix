import { Link } from 'react-router-dom'
import type { DanceStep } from '../types'
import { getVideoThumbnail, getFirstYoutubeId } from '../data/videos'
import './VideoCard.css'

interface VideoCardProps {
  video: DanceStep
}

const LEVEL_CONFIG = [
  { dot: '#b39ddb', label: 'Não praticado' },
  { dot: '#f06292', label: 'Iniciante'     },
  { dot: '#ffd54f', label: 'Desenvolvendo' },
  { dot: '#4fc3f7', label: 'Confortável'   },
  { dot: '#00c9a7', label: 'Forte'         },
  { dot: '#f5a623', label: 'Dominado'      },
]

export function VideoCard({ video }: VideoCardProps) {
  const thumbnail = getVideoThumbnail(video)
  const firstYT = getFirstYoutubeId(video)
  const hasRealThumb = !!firstYT
  const level = LEVEL_CONFIG[video.difficulty] ?? LEVEL_CONFIG[0]

  return (
    <Link to={`/video/${video.id}`} className="group block video-card vc-card">
      {/* Thumbnail */}
      <div className="vc-thumb relative aspect-video overflow-hidden mb-3">
        {hasRealThumb ? (
          <img
            src={thumbnail}
            alt={video.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="vc-placeholder w-full h-full flex items-center justify-center">
            <svg className="vc-placeholder__icon w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <span className="vc-duration absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
          {video.duration}
        </span>

        {/* Play overlay */}
        <div className="vc-play-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="vc-play-btn w-11 h-11 rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-200">
            <svg className="vc-play-btn__icon w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <div>
        <p className="vc-category text-[10px] font-semibold uppercase tracking-[0.2em] mb-1">
          {video.category}
        </p>
        <h3 className="vc-title text-sm leading-snug line-clamp-2 mb-1.5 transition-colors duration-150">
          {video.name}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: level.dot }} />
          <span className="vc-level__label">{level.label}</span>
        </div>
      </div>
    </Link>
  )
}
