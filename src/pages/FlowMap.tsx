import { useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowMapGraph } from '../components/FlowMapGraph'
import { VideoPreviewTooltip, type VideoPreviewTooltipState } from '../components/VideoPreviewTooltip'
import { useActiveStyle } from '../context/StyleContext'
import { useCustomSteps } from '../hooks/useCustomSteps'
import { LEVEL_LABELS } from '../types'
import { getVideoThumbnail } from '../data/videos'
import type { Hub, DanceStep } from '../types'
import './FlowMap.css'

function exportData() {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('danceflix')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)!) }
      catch { data[key] = localStorage.getItem(key) }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `danceflix-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target!.result as string) as Record<string, unknown>
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('danceflix')) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
      }
      window.location.reload()
    } catch { alert('Ficheiro inválido ou corrompido.') }
  }
  reader.readAsText(file)
}

export function FlowMap() {
  const [view, setView] = useState<'lista' | 'rede'>('rede')
  const [selectedFlow, setSelectedFlow] = useState<number>(0)
  const [expandedHub, setExpandedHub] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<VideoPreviewTooltipState | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  function hideTooltipDelayed() {
    tooltipTimerRef.current = setTimeout(() => setTooltip(null), 350)
  }
  function cancelHideTooltip() {
    if (tooltipTimerRef.current) { clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null }
  }

  const { activeStyle } = useActiveStyle()
  const { hubs, flows, steps: staticSteps } = activeStyle
  const { customSteps, addStep: addCustomStep } = useCustomSteps(activeStyle.id)
  const steps = useMemo(() => [...staticSteps, ...customSteps], [staticSteps, customSteps])

  const currentFlow = flows[selectedFlow]
  const flowHubIds = currentFlow?.sequence ?? []

  return (
    <div
      className="fmap-page"
      style={{
        display: view === 'rede' ? 'flex' : 'block',
        height: view === 'rede' ? 'calc(100vh - 120px)' : 'auto',
        overflow: view === 'rede' ? 'hidden' : 'auto',
      }}
    >
      <div className="fmap-header">
        <div className="fmap-header__dot-grid" />
        <div className="fmap-header__label-wrap">
          <span className="fmap-header__label">Estrutura</span>
          <div className="fmap-header__title-row">
            <h1 className="fmap-header__title">
              MAPA<br />
              <span className="fmap-header__title-accent">MENTAL</span>
            </h1>
            <span className="fmap-header__stats">
              {hubs.length} hubs · {steps.length} passos · {flows.length} flows
            </span>
          </div>
        </div>
        <div className="fmap-header__toggle-wrap">
          <div className="fm-io">
            <button className="fm-io__btn" onClick={exportData} title="Exportar dados do localStorage como JSON">
              ↓ Exportar
            </button>
            <button className="fm-io__btn fm-io__btn--import" onClick={() => importInputRef.current?.click()} title="Importar JSON e restaurar dados">
              ↑ Importar
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) importData(e.target.files[0]) }}
            />
          </div>
          <ViewToggle view={view} setView={setView} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── REDE VIEW ── */}
        {view === 'rede' && (
          <motion.div
            key="rede"
            className="fmap-rede"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <FlowMapGraph hubs={hubs} steps={steps} flows={flows} styleId={activeStyle.id} onAddStep={addCustomStep} />
          </motion.div>
        )}

        {/* ── LISTA VIEW ── */}
        {view === 'lista' && (
          <motion.main
            key="lista"
            className="fmap-lista"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Flow Selector */}
            {flows.length > 0 && (
              <div className="fmap-flows">
                <p className="fmap-flows__label">Fluxos Comuns</p>
                <div className="fmap-flows__grid">
                  {flows.map((flow, index) => (
                    <button
                      key={flow.id}
                      onClick={() => { setSelectedFlow(index); setExpandedHub(null) }}
                      className="fmap-flows__btn"
                      style={{
                        border: `1px solid ${selectedFlow === index ? '#f5a623' : '#dde3f5'}`,
                        background: selectedFlow === index ? 'rgba(245,166,35,0.08)' : '#ffffff',
                      }}
                    >
                      <p className="fmap-flows__btn-name">{flow.name}</p>
                      <p className="fmap-flows__btn-level">{LEVEL_LABELS[flow.difficulty]}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Flow */}
            {currentFlow && (
              <div className="fmap-current">
                <h3 className="fmap-current__title">{currentFlow.name}</h3>
                <p className="fmap-current__desc">{currentFlow.description}</p>
                <div className="fmap-current__steps">
                  {flowHubIds.map((stepId, index) => {
                    const hub  = hubs.find((h) => h.stepId === stepId)
                    const step = steps.find((s) => s.id === stepId)
                    const thumb = step ? getVideoThumbnail(step) : undefined
                    const isHub = !!hub
                    return (
                      <div key={`${stepId}-${index}`} className="fmap-step-btn__wrap">
                        <button
                          onClick={() => isHub ? setExpandedHub(expandedHub === stepId ? null : stepId) : undefined}
                          onMouseEnter={(e) => {
                            cancelHideTooltip()
                            if (expandedHub !== stepId) e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'
                            if (step && !tooltip?.pinned) {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({ step, screenX: rect.right + 8, screenY: rect.top, pinned: false })
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (expandedHub !== stepId) e.currentTarget.style.borderColor = '#dde3f5'
                            if (!tooltip?.pinned) hideTooltipDelayed()
                          }}
                          className="fmap-step-btn"
                          style={{
                            border: `1px solid ${expandedHub === stepId ? '#f5a623' : isHub ? '#dde3f5' : 'rgba(179,157,219,0.3)'}`,
                            background: expandedHub === stepId ? 'rgba(245,166,35,0.08)' : '#ffffff',
                            cursor: isHub ? 'pointer' : 'default',
                          }}
                        >
                          {thumb ? (
                            <div
                              className="fmap-step-btn__thumb"
                              style={{ border: `2px solid ${hub?.color ?? '#b39ddb'}` }}
                            >
                              <img src={thumb} alt={step?.name ?? stepId} className="fmap-step-btn__thumb-img" />
                            </div>
                          ) : (
                            <span className="fmap-step-btn__icon">{hub?.icon ?? '💃'}</span>
                          )}
                          <p className="fmap-step-btn__name">{step?.name ?? stepId}</p>
                          {isHub && (
                            <span className="fmap-step-btn__dot" style={{ background: hub!.color }} />
                          )}
                        </button>
                        {index < flowHubIds.length - 1 && (
                          <svg width="20" height="12" className="fmap-step-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 8">
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
              <div className="fmap-expanded">
                <HubDetails stepId={expandedHub} hubs={hubs} steps={steps} onClose={() => setExpandedHub(null)} />
              </div>
            )}

            {/* All Hubs Grid */}
            <div>
              <p className="fmap-hubs-grid__label">Todos os Hubs</p>
              <div className="fmap-hubs-grid__grid">
                {hubs.map((hub) => {
                  const step = steps.find((s) => s.id === hub.stepId)
                  return (
                    <button
                      key={hub.stepId}
                      onClick={() => setExpandedHub(expandedHub === hub.stepId ? null : hub.stepId)}
                      className="fmap-hubs-grid__card"
                      style={{
                        border: `1px solid ${expandedHub === hub.stepId ? '#f5a623' : '#dde3f5'}`,
                        background: expandedHub === hub.stepId ? 'rgba(245,166,35,0.05)' : '#ffffff',
                      }}
                    >
                      <div className="fmap-hubs-grid__card-header">
                        <span className="fmap-hubs-grid__card-icon">{hub.icon}</span>
                        {step && <span className="fmap-hubs-grid__card-badge">{step.difficulty}/5</span>}
                      </div>
                      <h3 className="fmap-hubs-grid__card-name">{step?.name ?? hub.stepId}</h3>
                      <p className="fmap-hubs-grid__card-desc">{step?.description}</p>
                      {hub.notes && <p className="fmap-hubs-grid__card-notes">{hub.notes}</p>}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {tooltip && createPortal(
        <VideoPreviewTooltip
          state={tooltip}
          interactive
          onClose={() => setTooltip(null)}
          onPin={() => setTooltip((prev) => prev ? { ...prev, pinned: true } : null)}
          onMouseEnter={cancelHideTooltip}
          onMouseLeave={() => { if (!tooltip.pinned) hideTooltipDelayed() }}
        />,
        document.body
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
  const hub  = hubs.find((h) => h.stepId === stepId)
  const step = steps.find((s) => s.id === stepId)
  if (!hub) return null

  const outgoing = hub.outgoingSteps.map((id) => ({ hub: hubs.find((h) => h.stepId === id), step: steps.find((s) => s.id === id), id }))
  const incoming = hub.incomingSteps.map((id) => ({ hub: hubs.find((h) => h.stepId === id), step: steps.find((s) => s.id === id), id }))

  return (
    <div>
      <div className="fmap-hub-detail__header">
        <div className="fmap-hub-detail__header-left">
          <span className="fmap-hub-detail__icon">{hub.icon}</span>
          <div>
            <h3 className="fmap-hub-detail__title">{step?.name ?? stepId}</h3>
            <p className="fmap-hub-detail__desc">{step?.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="fmap-hub-detail__close">✕</button>
      </div>

      {step && (
        <div className="fmap-hub-detail__link-wrap">
          <Link to={`/video/${step.id}`} className="fmap-hub-detail__link">
            Ver passo →
          </Link>
        </div>
      )}

      <div
        className="fmap-hub-detail__connections"
        style={{ gridTemplateColumns: outgoing.length > 0 && incoming.length > 0 ? '1fr 1fr' : '1fr' }}
      >
        {outgoing.length > 0 && (
          <div>
            <p className="fmap-hub-detail__conn-label">Para onde vai daqui</p>
            <div className="fmap-hub-detail__conn-list">
              {outgoing.map(({ hub: h, step: s, id }) => {
                const thumb = s ? getVideoThumbnail(s) : undefined
                return (
                  <div key={id} className="fmap-hub-detail__conn-item">
                    {thumb
                      ? <img src={thumb} alt={s?.name ?? id} className="fmap-hub-detail__conn-thumb" />
                      : <span className="fmap-hub-detail__conn-icon">{h?.icon ?? '💃'}</span>
                    }
                    <p className="fmap-hub-detail__conn-name">{s?.name ?? id}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {incoming.length > 0 && (
          <div>
            <p className="fmap-hub-detail__conn-label">De onde vem</p>
            <div className="fmap-hub-detail__conn-list">
              {incoming.map(({ hub: h, step: s, id }) => {
                const thumb = s ? getVideoThumbnail(s) : undefined
                return (
                  <div key={id} className="fmap-hub-detail__conn-item">
                    {thumb
                      ? <img src={thumb} alt={s?.name ?? id} className="fmap-hub-detail__conn-thumb" />
                      : <span className="fmap-hub-detail__conn-icon">{h?.icon ?? '💃'}</span>
                    }
                    <p className="fmap-hub-detail__conn-name">{s?.name ?? id}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewToggle({ view, setView }: { view: 'lista' | 'rede'; setView: (v: 'lista' | 'rede') => void }) {
  return (
    <div className="fmap-view-toggle">
      {(['lista', 'rede'] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`fmap-view-toggle__btn${view === v ? ' is-active' : ''}`}
        >
          {v === 'lista' ? '☰ Lista' : '◉ Rede'}
        </button>
      ))}
    </div>
  )
}
