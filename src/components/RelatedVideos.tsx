import { Link } from 'react-router-dom'
import type { DanceStep, StepCategory } from '../types'
import { getVideoThumbnail } from '../data/videos'
import { CategoryTag } from './CategoryTag'
import './RelatedVideos.css'

interface RelatedVideosProps {
  videos: DanceStep[]
}

export function RelatedVideos({ videos }: RelatedVideosProps) {
  if (videos.length === 0) return null

  return (
    <section className="rv-section">
      <h2 className="rv-title">Passos relacionados</h2>
      <div className="rv-grid">
        {videos.map((video) => (
          <RelatedCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

function RelatedCard({ video }: { video: DanceStep }) {
  const thumbnail = getVideoThumbnail(video)

  return (
    <Link to={`/video/${video.id}`} className="rv-card group">
      <div className="rv-card__thumb">
        <img
          src={thumbnail}
          alt={video.name}
          className="rv-card__thumb-img"
          loading="lazy"
        />
        <span className="rv-card__duration">{video.duration}</span>
      </div>

      <div className="rv-card__meta">
        <p className="rv-card__name">{video.name}</p>
        <CategoryTag category={video.category as Exclude<StepCategory, 'All'>} />
      </div>
    </Link>
  )
}
