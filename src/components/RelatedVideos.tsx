import { Link } from 'react-router-dom'
import type { Video, VideoCategory } from '../types'
import { getVideoThumbnail } from '../data/videos'
import { CategoryTag } from './CategoryTag'

const P = "'Poppins', sans-serif"

interface RelatedVideosProps {
  videos: Video[]
}

export function RelatedVideos({ videos }: RelatedVideosProps) {
  if (videos.length === 0) return null

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #dde3f5' }}>
      <h2 style={{ fontFamily: P, fontWeight: 700, fontSize: '20px', color: '#1a1d3b', marginBottom: '20px' }}>
        Passos relacionados
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {videos.map((video) => (
          <RelatedCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

function RelatedCard({ video }: { video: Video }) {
  const thumbnail = getVideoThumbnail(video)
  const formattedDate = new Date(video.date).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Link
      to={`/video/${video.id}`}
      className="group"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        borderRadius: '14px',
        border: '1px solid #dde3f5',
        background: '#ffffff',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'
        e.currentTarget.style.background = '#fdfbf5'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,29,59,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#dde3f5'
        e.currentTarget.style.background = '#ffffff'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0, width: '110px', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#e8ecf8' }}>
        <img
          src={thumbnail}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          loading="lazy"
        />
        <span style={{
          position: 'absolute', bottom: '4px', right: '4px',
          background: 'rgba(26,29,59,0.72)', color: '#fff',
          fontFamily: P, fontSize: '10px', fontWeight: 600,
          padding: '1px 5px', borderRadius: '4px',
        }}>
          {video.duration}
        </span>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
        <p style={{
          fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {video.title}
        </p>
        <CategoryTag category={video.category as Exclude<VideoCategory, 'All'>} />
        <p style={{ fontFamily: P, fontSize: '11px', color: '#8b95b8', marginTop: 'auto' }}>
          {formattedDate}
        </p>
      </div>
    </Link>
  )
}
