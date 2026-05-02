import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FlowMapGraph } from '../components/FlowMapGraph'
import { useActiveStyle } from '../context/StyleContext'
import { LEVEL_LABELS } from '../types'
import type { Hub, DanceStep } from '../types'

const P = "'Poppins', sans-serif"

export function FlowMap() {
  const [view, setView] = useState<'lista' | 'rede'>('rede')
  const [selectedFlow, setSelectedFlow] = useState<number>(0)
  const [expandedHub, setExpandedHub] = useState<string | null>(null)

  const { activeStyle } = useActiveStyle()
  const { hubs, flows, steps } = activeStyle

  const currentFlow = flows[selectedFlow]
  const flowHubIds = currentFlow?.sequence ?? []

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
      {/* Header — full when lista, compact toolbar when rede */}
        <div style={{
          background: 'rgba(240,244,255,0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #dde3f5',
          padding: '16px 52px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          zIndex: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #b39ddb18 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontFamily: P, fontSize: '9px', letterSpacing: '0.45em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase' }}>
              Estrutura
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
             <h1 style={{ fontFamily: P, fontWeight: 900, fontSize: '40px', color: '#1a1d3b', lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
              MAPA<br />
              <span style={{ background: 'linear-gradient(90deg, #f5a623, #f06292)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                MENTAL
              </span>
            </h1>
              <span style={{ marginTop:'auto', marginBottom:'0px', fontFamily: P, fontSize: '11px', color: '#b39ddb' }}>
                      {hubs.length} hubs · {steps.length} passos  · {flows.length} flows
              </span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

      {/* ── REDE VIEW ── */}
      {view === 'rede' && (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <FlowMapGraph hubs={hubs} steps={steps} flows={flows} styleId={activeStyle.id} />
        </div>
      )}

      {/* ── LISTA VIEW ── */}
      {view === 'lista' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 100px' }}>

          {/* Flow Selector */}
          {flows.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
                Fluxos Comuns
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {flows.map((flow, index) => (
                  <button
                    key={flow.id}
                    onClick={() => { setSelectedFlow(index); setExpandedHub(null) }}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      border: `1px solid ${selectedFlow === index ? '#f5a623' : '#dde3f5'}`,
                      background: selectedFlow === index ? 'rgba(245,166,35,0.08)' : '#ffffff',
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <p style={{ fontFamily: P, fontWeight: 700, fontSize: '14px', color: '#1a1d3b', marginBottom: '4px' }}>{flow.name}</p>
                    <p style={{ fontFamily: P, fontSize: '12px', color: '#8b95b8' }}>{LEVEL_LABELS[flow.difficulty]}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Flow */}
          {currentFlow && (
            <div style={{ marginBottom: '48px', padding: '24px', background: '#f0f4ff', borderRadius: '16px', border: '1px solid #dde3f5' }}>
              <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                {currentFlow.name}
              </h3>
              <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b', marginBottom: '20px', lineHeight: 1.6 }}>
                {currentFlow.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
                {flowHubIds.map((stepId, index) => {
                  const hub = hubs.find((h) => h.stepId === stepId)
                  const step = steps.find((s) => s.id === stepId)
                  if (!hub) return null
                  return (
                    <div key={stepId} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => setExpandedHub(expandedHub === stepId ? null : stepId)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          padding: '10px 14px', borderRadius: '10px',
                          border: `1px solid ${expandedHub === stepId ? '#f5a623' : '#dde3f5'}`,
                          background: expandedHub === stepId ? 'rgba(245,166,35,0.08)' : '#ffffff',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '22px' }}>{hub.icon}</span>
                        <p style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#1a1d3b', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {step?.name ?? stepId}
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
          )}

          {/* Expanded Hub */}
          {expandedHub && (
            <div style={{ marginBottom: '40px', padding: '24px', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '16px', background: 'rgba(245,166,35,0.04)' }}>
              <HubDetails stepId={expandedHub} hubs={hubs} steps={steps} onClose={() => setExpandedHub(null)} />
            </div>
          )}

          {/* All Hubs Grid */}
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.35em', color: '#00c9a7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Todos os Hubs
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {hubs.map((hub) => {
                const step = steps.find((s) => s.id === hub.stepId)
                return (
                  <button
                    key={hub.stepId}
                    onClick={() => setExpandedHub(expandedHub === hub.stepId ? null : hub.stepId)}
                    style={{
                      textAlign: 'left', padding: '20px', borderRadius: '16px',
                      border: `1px solid ${expandedHub === hub.stepId ? '#f5a623' : '#dde3f5'}`,
                      background: expandedHub === hub.stepId ? 'rgba(245,166,35,0.05)' : '#ffffff',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (expandedHub !== hub.stepId) e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)' }}
                    onMouseLeave={(e) => { if (expandedHub !== hub.stepId) e.currentTarget.style.borderColor = '#dde3f5' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '28px' }}>{hub.icon}</span>
                      {step && (
                        <span style={{ fontFamily: P, fontSize: '11px', fontWeight: 700, color: '#8b95b8', padding: '2px 8px', border: '1px solid #dde3f5', borderRadius: '20px' }}>
                          {step.difficulty}/5
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '16px', color: '#1a1d3b', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                      {step?.name ?? hub.stepId}
                    </h3>
                    <p style={{ fontFamily: P, fontSize: '12px', color: '#4a4e6b', lineHeight: 1.5 }}>{step?.description}</p>
                    {hub.notes && (
                      <p style={{ fontFamily: P, fontSize: '11px', color: '#b39ddb', fontStyle: 'italic', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dde3f5' }}>
                        {hub.notes}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

interface HubDetailsProps {
  stepId: string
  hubs: Hub[]
  steps: DanceStep[]
  onClose: () => void
}

function HubDetails({ stepId, hubs, steps, onClose }: HubDetailsProps) {
  const hub = hubs.find((h) => h.stepId === stepId)
  const step = steps.find((s) => s.id === stepId)
  if (!hub) return null

  const outgoing = hub.outgoingSteps
    .map((id) => ({ hub: hubs.find((h) => h.stepId === id), step: steps.find((s) => s.id === id) }))
    .filter((x) => x.hub)
  const incoming = hub.incomingSteps
    .map((id) => ({ hub: hubs.find((h) => h.stepId === id), step: steps.find((s) => s.id === id) }))
    .filter((x) => x.hub)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '36px' }}>{hub.icon}</span>
          <div>
            <h3 style={{ fontFamily: P, fontWeight: 800, fontSize: '22px', color: '#1a1d3b', letterSpacing: '-0.01em' }}>
              {step?.name ?? stepId}
            </h3>
            <p style={{ fontFamily: P, fontSize: '13px', color: '#4a4e6b' }}>{step?.description}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ fontFamily: P, fontSize: '14px', color: '#8b95b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          ✕
        </button>
      </div>

      {step && (
        <div style={{ marginBottom: '16px' }}>
          <Link
            to={`/video/${step.id}`}
            style={{
              fontFamily: P, fontSize: '12px', fontWeight: 600, color: '#1a1d3b',
              padding: '6px 14px', borderRadius: '20px', border: '1px solid #dde3f5',
              background: '#ffffff', textDecoration: 'none', transition: 'all 0.15s',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f5a623'; e.currentTarget.style.color = '#c97d00' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde3f5'; e.currentTarget.style.color = '#1a1d3b' }}
          >
            Ver passo →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: outgoing.length > 0 && incoming.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {outgoing.length > 0 && (
          <div>
            <p style={{ fontFamily: P, fontSize: '10px', letterSpacing: '0.25em', color: '#8b95b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              Para onde vai daqui
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outgoing.map(({ hub: h, step: s }) => (
                <div key={h!.stepId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{h!.icon}</span>
                  <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{s?.name ?? h!.stepId}</p>
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
              {incoming.map(({ hub: h, step: s }) => (
                <div key={h!.stepId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dde3f5', background: '#f0f4ff' }}>
                  <span style={{ fontSize: '18px' }}>{h!.icon}</span>
                  <p style={{ fontFamily: P, fontSize: '13px', fontWeight: 700, color: '#1a1d3b' }}>{s?.name ?? h!.stepId}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewToggle({ view, setView }: { view: 'lista' | 'rede'; setView: (v: 'lista' | 'rede') => void }) {
  return (
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
  )
}
