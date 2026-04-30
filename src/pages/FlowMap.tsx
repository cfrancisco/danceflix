import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getVideoById } from '../data/videos'
import { FlowMapGraph } from '../components/FlowMapGraph'
import { useActiveStyle } from '../context/StyleContext'
import type { FlowMap as FlowMapData, Connection } from '../data/types'

const P = "'Poppins', sans-serif"

type HubId = string

interface HubData {
  id: HubId
  title: string
  description: string
  icon: string
  color: string
  difficulty: number
  videoIds: string[]
  notes: string
}

export function FlowMap() {
  const [view, setView] = useState<'lista' | 'rede'>('lista')
  const [selectedFlow, setSelectedFlow] = useState<number>(0)
  const [expandedHub, setExpandedHub] = useState<HubId | null>(null)

  const { activeStyle } = useActiveStyle()
  const conexoes = activeStyle.flowMap

  const hubs = Object.values(conexoes.hubs) as HubData[]
  const flows = conexoes.commonFlows
  const currentFlow = flows[selectedFlow]
  const flowHubIds = currentFlow.sequence as HubId[]

  return (
    <div
      style={{
        background: '#f0f4ff',
        minHeight: '100vh',
        display: view === 'rede' ? 'flex' : 'block',
        flexDirection: 'column',
        height: view === 'rede' ? '100vh' : 'auto',
        overflow: view === 'rede' ? 'hidden' : 'auto',
      }}
    >
      {/* Header */}
      <div style={{
        background: '#f0f4ff',
        borderBottom: '1px solid #dde3f5',
        padding: '40px 0 44px', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #b39ddb22 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="page-wrap" style={{ position: 'relative' }}>
          <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.45em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Estrutura
          </p>
          <h1 style={{ fontFamily: P, fontWeight: 900, fontSize: 'clamp(36px, 7vw, 72px)', color: '#1a1d3b', lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            MAPA<br />
            <span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              MENTAL
            </span>
          </h1>
          <p style={{ fontFamily: P, fontSize: '14px', color: '#4a4e6b', marginTop: '14px', marginBottom: '20px' }}>
            Entenda como os passos se conectam em fluxos musicais
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['lista', 'rede'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontFamily: P, fontSize: '10px', letterSpacing: '0.2em', fontWeight: 700,
                  textTransform: 'uppercase', padding: '8px 20px', borderRadius: '50px',
                  border: `1px solid ${view === v ? '#f5a623' : '#dde3f5'}`,
                  background: view === v ? 'rgba(245,166,35,0.12)' : '#ffffff',
                  color: view === v ? '#f5a623' : '#4a4e6b',
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {v === 'lista' ? '☰ Lista' : '◉ Rede'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── REDE VIEW ── */}
      {view === 'rede' && (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <FlowMapGraph flowMap={conexoes} />
        </div>
      )}

      {/* ── LISTA VIEW ── */}
      {view === 'lista' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 100px' }}>

          {/* Flow Selector */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Fluxos Comuns
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {flows.map((flow, index) => (
                <button
                  key={index}
                  onClick={() => { setSelectedFlow(index); setExpandedHub(null) }}
                  style={{
                    padding: '16px', borderRadius: '14px',
                    border: `1px solid ${selectedFlow === index ? '#f5a623' : '#dde3f5'}`,
                    background: selectedFlow === index ? 'rgba(245,166,35,0.08)' : '#ffffff',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontFamily: P, fontWeight: 700, fontSize: '14px', color: '#1a1d3b', marginBottom: '4px' }}>{flow.name}</p>
                  <p style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8' }}>{flow.difficulty}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Current Flow */}
          <div style={{ marginBottom: '48px', padding: '24px', background: '#f0f4ff', borderRadius: '16px', border: '1px solid #dde3f5' }}>
            <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {currentFlow.name}
            </h3>
            <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b', marginBottom: '20px', lineHeight: 1.6 }}>
              {currentFlow.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
              {flowHubIds.map((hubId, index) => {
                const hub = conexoes.hubs[hubId] as HubData
                return (
                  <div key={hubId} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedHub(expandedHub === hubId ? null : hubId)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: '10px 14px', borderRadius: '10px',
                        border: `1px solid ${expandedHub === hubId ? '#f5a623' : '#dde3f5'}`,
                        background: expandedHub === hubId ? 'rgba(245,166,35,0.08)' : '#ffffff',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{hub.icon}</span>
                      <p style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#1a1d3b', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {hub.title}
                      </p>
                    </button>
                    {index < flowHubIds.length - 1 && (
                      <svg width="20" height="12" style={{ color: '#b39ddb', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 8">
                        <path d="M0 4h20m-5-3l5 3-5 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expanded Hub */}
          {expandedHub && (
            <div style={{ marginBottom: '40px', padding: '24px', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '16px', background: 'rgba(245,166,35,0.04)' }}>
                  <HubDetails hubId={expandedHub} flowMap={conexoes} onClose={() => setExpandedHub(null)} />
            </div>
          )}

          {/* All Hubs Grid */}
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Todos os Hubs
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => setExpandedHub(expandedHub === hub.id ? null : hub.id)}
                  style={{
                    textAlign: 'left', padding: '20px', borderRadius: '16px',
                    border: `1px solid ${expandedHub === hub.id ? '#f5a623' : '#dde3f5'}`,
                    background: expandedHub === hub.id ? 'rgba(245,166,35,0.05)' : '#ffffff',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (expandedHub !== hub.id) e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)' }}
                  onMouseLeave={(e) => { if (expandedHub !== hub.id) e.currentTarget.style.borderColor = '#dde3f5' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{hub.icon}</span>
                    <span style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#8b95b8', padding: '2px 8px', border: '1px solid #dde3f5', borderRadius: '20px' }}>
                      {hub.difficulty}/5
                    </span>
                  </div>
                  <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '16px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                    {hub.title}
                  </h3>
                  <p style={{ fontFamily: P, fontSize: '12px', color: '#4a4e6b', lineHeight: 1.5 }}>{hub.description}</p>
                  {hub.videoIds.length > 0 && (
                    <p style={{ fontFamily: P, fontSize: '11px', color: '#f5a623', marginTop: '8px', fontWeight: 700 }}>
                      {hub.videoIds.length} vídeo{hub.videoIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <p style={{ fontFamily: P, fontSize: '11px', color: '#b39ddb', fontStyle: 'italic', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dde3f5' }}>
                    {hub.notes}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

interface HubDetailsProps {
  hubId: HubId
  flowMap: FlowMapData
  onClose: () => void
}

function HubDetails({ hubId, flowMap, onClose }: HubDetailsProps) {
  const hub = flowMap.hubs[hubId] as HubData
  const outgoing = flowMap.connections.filter((c: Connection) => c.fromHub === hubId)
  const incoming = flowMap.connections.filter((c: Connection) => c.toHub === hubId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '36px' }}>{hub.icon}</span>
          <div>
            <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', letterSpacing: '-0.01em' }}>{hub.title}</h3>
            <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>{hub.description}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ fontFamily: P, fontSize: '14px', color: '#8b95b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          ✕
        </button>
      </div>

      {hub.videoIds.length > 0 && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #dde3f5' }}>
          <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Passos deste hub
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hub.videoIds.map((videoId) => {
              const video = getVideoById(videoId)
              if (!video) return null
              return (
                <Link
                  key={videoId}
                  to={`/video/${videoId}`}
                  style={{
                    fontFamily: P, fontSize: '12px', fontWeight: 600, color: '#1a1d3b',
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid #dde3f5',
                    background: '#ffffff', textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f5a623'; e.currentTarget.style.color = '#c97d00' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde3f5'; e.currentTarget.style.color = '#1a1d3b' }}
                >
                  {video.title}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: outgoing.length > 0 && incoming.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {outgoing.length > 0 && (
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#8b95b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              Para onde vai daqui
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outgoing.map((conn, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{(flowMap.hubs[conn.toHub] as HubData)?.icon}</span>
                  <div>
                    <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{(flowMap.hubs[conn.toHub] as HubData)?.title}</p>
                    {conn.description && <p style={{ fontFamily: P, fontSize: '11px', color: '#4a4e6b' }}>{conn.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {incoming.length > 0 && (
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#8b95b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              De onde vem
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incoming.map((conn, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{(flowMap.hubs[conn.fromHub] as HubData)?.icon}</span>
                  <div>
                    <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{(flowMap.hubs[conn.fromHub] as HubData)?.title}</p>
                    {conn.description && <p style={{ fontFamily: P, fontSize: '11px', color: '#4a4e6b' }}>{conn.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
