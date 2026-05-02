import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getVideoById, getVideoThumbnail } from '../data/videos'
import type { Hub, DanceStep, Flow, Level } from '../types'

const FLOW_COLOR = '#3B82F6'
const FLOW_COLOR_DIM = 'rgba(59,130,246,0.35)'

function customFlowsKey(styleId: string) {
  return `danceflix.customFlows.${styleId}`
}

function loadCustomFlows(styleId: string): Flow[] {
  try {
    const raw = localStorage.getItem(customFlowsKey(styleId))
    return raw ? (JSON.parse(raw) as Flow[]) : []
  } catch { return [] }
}

function saveCustomFlows(styleId: string, flows: Flow[]) {
  try { localStorage.setItem(customFlowsKey(styleId), JSON.stringify(flows)) } catch { /* noop */ }
}

const DM = "'Poppins', sans-serif"

// Precomputed hub positions for the zouk set (keyed by stepId).
// Spaced apart enough to give each hub room for its satellite ring.
const ZOUK_HUB_POSITIONS: Record<string, { x: number; y: number }> = {
  'base-1':            { x:    0, y:    0 },
  'base-2':            { x: -520, y: -340 },
  'giro-dama-simples': { x:  580, y:  140 },
}

const HUB_R = 46
const SAT_R = 18
const SAT_RING_R = 220

interface Layout {
  positions: Record<string, { x: number; y: number }>
  hubIds: Set<string>
  /** All step ids that should be drawn as nodes (hubs + satellites). */
  nodeIds: string[]
}

function buildLayout(hubs: Hub[], steps: DanceStep[]): Layout {
  const hubIds = new Set(hubs.map((h) => h.stepId))
  const positions: Record<string, { x: number; y: number }> = {}

  // 1. Place hubs
  const allKnown = hubs.length > 0 && hubs.every((h) => h.stepId in ZOUK_HUB_POSITIONS)
  if (allKnown) {
    hubs.forEach((h) => { positions[h.stepId] = ZOUK_HUB_POSITIONS[h.stepId] })
  } else {
    const byDifficulty = [...hubs].sort((a, b) => {
      const da = steps.find((s) => s.id === a.stepId)?.difficulty ?? 0
      const db = steps.find((s) => s.id === b.stepId)?.difficulty ?? 0
      return db - da
    })
    if (byDifficulty.length > 0) {
      const center = byDifficulty[0]
      const others = byDifficulty.slice(1)
      const radius = 480
      positions[center.stepId] = { x: 0, y: 0 }
      others.forEach((hub, i) => {
        const angle = (2 * Math.PI * i) / others.length - Math.PI / 2
        positions[hub.stepId] = {
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
        }
      })
    }
  }

  // 2. Assign each non-hub step to its primary hub (first hub that references it)
  const satellitesByHub: Record<string, string[]> = {}
  const assigned = new Set<string>()
  hubs.forEach((hub) => {
    const all = [...hub.outgoingSteps, ...hub.incomingSteps]
    all.forEach((stepId) => {
      if (hubIds.has(stepId)) return
      if (assigned.has(stepId)) return
      assigned.add(stepId)
      if (!satellitesByHub[hub.stepId]) satellitesByHub[hub.stepId] = []
      satellitesByHub[hub.stepId].push(stepId)
    })
  })

  // 3. Place satellites in a ring around their primary hub.
  // Skew the ring so it points away from the centroid of other hubs (to reduce edge crossings).
  const hubsCentroid = hubs.reduce((acc, h) => {
    const p = positions[h.stepId] ?? { x: 0, y: 0 }
    return { x: acc.x + p.x, y: acc.y + p.y }
  }, { x: 0, y: 0 })
  hubsCentroid.x /= Math.max(1, hubs.length)
  hubsCentroid.y /= Math.max(1, hubs.length)

  Object.entries(satellitesByHub).forEach(([hubId, stepIds]) => {
    const hubPos = positions[hubId]
    if (!hubPos) return
    const count = stepIds.length
    // Direction pointing AWAY from the centroid → satellites lean outward
    const dx = hubPos.x - hubsCentroid.x
    const dy = hubPos.y - hubsCentroid.y
    const baseAngle = Math.atan2(dy, dx)
    // Spread satellites across an arc opposite to the centroid (3/4 of a circle)
    const arc = count > 1 ? (Math.PI * 1.5) : 0
    stepIds.forEach((id, i) => {
      const t = count === 1 ? 0 : (i / (count - 1)) - 0.5
      const angle = baseAngle + t * arc
      positions[id] = {
        x: hubPos.x + Math.cos(angle) * SAT_RING_R,
        y: hubPos.y + Math.sin(angle) * SAT_RING_R,
      }
    })
  })

  const nodeIds = [...hubs.map((h) => h.stepId), ...Array.from(assigned)]
  return { positions, hubIds, nodeIds }
}

function bezierCP(
  from: { x: number; y: number },
  to: { x: number; y: number },
  curve = 50,
) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { x: mx - (dy / len) * curve, y: my + (dx / len) * curve }
}

function edgeTip(
  from: { x: number; y: number },
  to: { x: number; y: number },
  offset: number,
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { x: to.x - (dx / len) * offset, y: to.y - (dy / len) * offset }
}

// ── Video tooltip (HTML overlay) ──────────────────────────────────────────────

interface TooltipState {
  step: DanceStep
  screenX: number
  screenY: number
  pinned: boolean
}

function VideoTooltip({ state, onClose }: { state: TooltipState; onClose: () => void }) {
  const { step, screenX, screenY, pinned } = state
  const thumb = getVideoThumbnail(step)
  const firstYT = step.youtubeVideos.find((id) => id !== '')
  const hasYT = !!firstYT

  const cardW = pinned ? 300 : 240
  const cardH = pinned ? (hasYT ? 260 : 210) : 168
  const margin = 12
  let left = screenX + 16
  let top  = screenY - 60
  if (left + cardW > window.innerWidth  - margin) left = screenX - cardW - 12
  if (top  + cardH > window.innerHeight - margin) top  = window.innerHeight - cardH - margin
  if (top < margin) top = margin

  return (
    <div
      style={{
        position: 'fixed', left, top, width: cardW,
        background: '#ffffff', border: '1px solid rgba(26,29,59,0.12)',
        borderRadius: '8px', overflow: 'hidden',
        pointerEvents: pinned ? 'auto' : 'none',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(26,29,59,0.18)',
        transition: 'width 0.2s, height 0.2s',
      }}
      onMouseLeave={pinned ? undefined : onClose}
    >
      {pinned && hasYT ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${firstYT}?autoplay=1`}
            title={step.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: 88, background: '#e8ecf8' }}>
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          <span style={{ position: 'absolute', bottom: 5, right: 6, background: 'rgba(26,29,59,0.65)', color: '#FFF', fontFamily: DM, fontSize: '9px', padding: '2px 5px', borderRadius: '2px' }}>
            {step.duration}
          </span>
          {!pinned && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,29,59,0.08)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,166,35,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontFamily: DM, fontSize: '11px', fontWeight: 600, color: '#1a1d3b', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {step.name}
        </p>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '10px' }}>
          {Array.from({ length: 5 }, (_, k) => (
            <div key={k} style={{ width: 16, height: 3, borderRadius: 2, background: k < step.difficulty ? '#f5a623' : 'rgba(26,29,59,0.1)' }} />
          ))}
          <span style={{ fontFamily: DM, fontSize: '9px', color: 'rgba(26,29,59,0.4)', marginLeft: '5px' }}>Nível</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {hasYT && (
            <button
              onClick={(e) => { e.stopPropagation() }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px 10px', borderRadius: '4px', border: 'none', background: pinned ? 'rgba(26,29,59,0.06)' : '#f5a623', color: pinned ? 'rgba(26,29,59,0.5)' : '#ffffff', fontFamily: DM, fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              {pinned ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Parar</>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>Play</>
              )}
            </button>
          )}
          <a
            href={`#/video/${step.id}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px 10px', borderRadius: '4px', border: '1px solid rgba(245,166,35,0.4)', background: 'transparent', color: '#f5a623', fontFamily: DM, fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            Abrir
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
          {pinned && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{ width: 30, height: 30, borderRadius: '4px', border: '1px solid rgba(26,29,59,0.12)', background: 'transparent', color: 'rgba(26,29,59,0.4)', fontFamily: DM, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          )}
        </div>
        {!pinned && (
          <p style={{ fontFamily: DM, fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(26,29,59,0.35)', textTransform: 'uppercase', marginTop: '8px' }}>
            Clique no nó para fixar
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface FlowMapGraphProps {
  hubs: Hub[]
  steps: DanceStep[]
  flows: Flow[]
  styleId: string
}

export function FlowMapGraph({ hubs, steps, flows, styleId }: FlowMapGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [center, setCenter] = useState({ x: 560, y: 340 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.75 })
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // ── Flow selection / builder state ────────────────────────────────────────
  const [customFlows, setCustomFlows] = useState<Flow[]>(() => loadCustomFlows(styleId))
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
  const [builderMode, setBuilderMode] = useState(false)
  const [draftSequence, setDraftSequence] = useState<string[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftDifficulty, setDraftDifficulty] = useState<Level>(2)

  useEffect(() => {
    setCustomFlows(loadCustomFlows(styleId))
    setSelectedFlowId(null)
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
  }, [styleId])

  const allFlows: Flow[] = useMemo(() => [...flows, ...customFlows], [flows, customFlows])
  const selectedFlow = selectedFlowId ? allFlows.find((f) => f.id === selectedFlowId) ?? null : null

  // The "active" sequence drives highlighting — either the selected flow or the draft being built
  const activeSequence: string[] = builderMode ? draftSequence : (selectedFlow?.sequence ?? [])
  const activeSequenceSet = useMemo(() => new Set(activeSequence), [activeSequence])

  // Map of stepId → all 1-based positions it occupies in the active sequence (for badges)
  const sequencePositions = useMemo(() => {
    const map: Record<string, number[]> = {}
    activeSequence.forEach((id, i) => {
      if (!map[id]) map[id] = []
      map[id].push(i + 1)
    })
    return map
  }, [activeSequence])

  // Edges that are part of the active flow path (consecutive pairs)
  const flowEdgeSet = useMemo(() => {
    const s = new Set<string>()
    for (let i = 0; i < activeSequence.length - 1; i++) {
      s.add(`${activeSequence[i]}->${activeSequence[i + 1]}`)
    }
    return s
  }, [activeSequence])

  const getStep = useCallback((stepId: string) => steps.find((s) => s.id === stepId), [steps])

  const layout = useMemo(() => buildLayout(hubs, steps), [hubs, steps])
  const { positions, hubIds, nodeIds } = layout

  // Derive edges from BOTH outgoing and incoming, deduped.
  // outgoing: hub → step (could be hub or satellite)
  // incoming: step → hub (covers satellite → hub edges that the satellite can't declare)
  const connections = useMemo(() => {
    const seen = new Set<string>()
    const list: { from: string; to: string }[] = []
    hubs.forEach((hub) => {
      hub.outgoingSteps.forEach((toId) => {
        const k = `${hub.stepId}->${toId}`
        if (!seen.has(k)) { seen.add(k); list.push({ from: hub.stepId, to: toId }) }
      })
      hub.incomingSteps.forEach((fromId) => {
        const k = `${fromId}->${hub.stepId}`
        if (!seen.has(k)) { seen.add(k); list.push({ from: fromId, to: hub.stepId }) }
      })
    })
    return list
  }, [hubs])

  useEffect(() => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setCenter({ x: r.width / 2, y: r.height / 2 })
  }, [])

  const selectedHub = selectedStepId ? hubs.find((h) => h.stepId === selectedStepId) ?? null : null
  const selectedStep = selectedStepId ? getStep(selectedStepId) ?? null : null
  const outgoing = selectedStepId ? connections.filter((c) => c.from === selectedStepId) : []
  const incoming = selectedStepId ? connections.filter((c) => c.to === selectedStepId) : []

  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('.graph-node')) return
    dragging.current = true
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
  }, [])

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.9
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.2, Math.min(3.5, t.scale * factor)),
    }))
  }, [])

  const panelWidth = selectedStep ? 300 : 0

  const showTooltip = useCallback((stepId: string, e: React.MouseEvent) => {
    const step = getVideoById(stepId)
    if (!step) return
    setTooltip((prev) =>
      prev?.pinned ? prev : { step, screenX: e.clientX, screenY: e.clientY, pinned: false }
    )
  }, [])
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => prev && !prev.pinned ? { ...prev, screenX: e.clientX, screenY: e.clientY } : prev ?? null)
  }, [])
  const hideTooltip = useCallback(() => {
    setTooltip((prev) => prev?.pinned ? prev : null)
  }, [])
  const pinTooltip = useCallback((stepId: string, e: React.MouseEvent) => {
    const step = getVideoById(stepId)
    if (!step) return
    setTooltip((prev) =>
      prev?.pinned && prev.step.id === stepId
        ? null
        : { step, screenX: e.clientX, screenY: e.clientY, pinned: true }
    )
  }, [])

  // Determine if a node is "related" to the selected one (directly connected)
  const isRelatedToSelected = useCallback((stepId: string) => {
    if (!selectedStepId || stepId === selectedStepId) return false
    return outgoing.some((c) => c.to === stepId) || incoming.some((c) => c.from === stepId)
  }, [selectedStepId, outgoing, incoming])

  // ── Flow selector / builder handlers ──────────────────────────────────────
  const handleSelectFlow = useCallback((flowId: string | null) => {
    setSelectedFlowId(flowId)
    setSelectedStepId(null)
    setTooltip(null)
  }, [])

  const enterBuilder = useCallback(() => {
    setBuilderMode(true)
    setSelectedFlowId(null)
    setSelectedStepId(null)
    setTooltip(null)
    setDraftSequence([])
    setDraftName('')
    setDraftDifficulty(2)
  }, [])

  const exitBuilder = useCallback(() => {
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
  }, [])

  const addToDraft = useCallback((stepId: string) => {
    setDraftSequence((seq) => [...seq, stepId])
  }, [])

  const removeFromDraftAt = useCallback((index: number) => {
    setDraftSequence((seq) => seq.filter((_, i) => i !== index))
  }, [])

  const saveDraft = useCallback(() => {
    if (draftSequence.length < 2 || !draftName.trim()) return
    const newFlow: Flow = {
      id: `custom-${Date.now()}`,
      name: draftName.trim(),
      description: 'Flow personalizado',
      difficulty: draftDifficulty,
      sequence: [...draftSequence],
    }
    const next = [...customFlows, newFlow]
    setCustomFlows(next)
    saveCustomFlows(styleId, next)
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
    setSelectedFlowId(newFlow.id)
  }, [draftSequence, draftName, draftDifficulty, customFlows, styleId])

  const deleteCustomFlow = useCallback((flowId: string) => {
    const next = customFlows.filter((f) => f.id !== flowId)
    setCustomFlows(next)
    saveCustomFlows(styleId, next)
    if (selectedFlowId === flowId) setSelectedFlowId(null)
  }, [customFlows, styleId, selectedFlowId])

  // Click on a node — different behavior based on mode
  const handleNodeClick = useCallback((stepId: string, e: React.MouseEvent) => {
    if (builderMode) {
      addToDraft(stepId)
      return
    }
    setSelectedStepId((prev) => (prev === stepId ? null : stepId))
    pinTooltipFromEvent(stepId, e)
  }, [builderMode, addToDraft])

  // Helper for pin (defined later below in original code — we redeclare to avoid TDZ)
  function pinTooltipFromEvent(stepId: string, e: React.MouseEvent) {
    const step = getVideoById(stepId)
    if (!step) return
    setTooltip((prev) =>
      prev?.pinned && prev.step.id === stepId
        ? null
        : { step, screenX: e.clientX, screenY: e.clientY, pinned: true }
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f0f4ff' }}
    >
      <svg
        width="100%"
        height="100%"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
      >
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="rgba(26,29,59,0.3)" />
          </marker>
          <marker id="arr-hi" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#f5a623" />
          </marker>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.9" fill="rgba(26,29,59,0.07)" />
          </pattern>
          <radialGradient id="ng-sel" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff8ee" />
            <stop offset="100%" stopColor="#fff3e0" />
          </radialGradient>
          <radialGradient id="ng" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f4f6ff" />
          </radialGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="7" floodColor="#1a1d3b" floodOpacity="0.12" />
          </filter>
        </defs>

        <g transform={`translate(${center.x + transform.x - panelWidth / 2}, ${center.y + transform.y}) scale(${transform.scale})`}>
          <rect x="-3000" y="-2500" width="6000" height="5000" fill="url(#grid)" />

          {/* Edges */}
          {connections.map((conn, i) => {
            const from = positions[conn.from] ?? { x: 0, y: 0 }
            const to   = positions[conn.to]   ?? { x: 0, y: 0 }
            const isSelf    = conn.from === conn.to
            const isHover   = hoveredEdge === i
            const isRelated = selectedStepId !== null && (conn.from === selectedStepId || conn.to === selectedStepId)
            const active = isHover || isRelated
            const stroke = active ? '#f5a623' : 'rgba(26,29,59,0.18)'
            const sw     = active ? 2 : 1
            const marker = active ? 'url(#arr-hi)' : 'url(#arr)'
            const dash   = active ? undefined : '5 4'
            const targetR = hubIds.has(conn.to) ? HUB_R : SAT_R

            if (isSelf) {
              const lx = from.x, ly = from.y
              return (
                <g key={i} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)} style={{ cursor: 'pointer' }}>
                  <path d={`M ${lx-30} ${ly-38} C ${lx-100} ${ly-140} ${lx+100} ${ly-140} ${lx+30} ${ly-38}`} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} markerEnd={marker} style={{ transition: 'stroke 0.2s' }} />
                  <path d={`M ${lx-30} ${ly-38} C ${lx-100} ${ly-140} ${lx+100} ${ly-140} ${lx+30} ${ly-38}`} fill="none" stroke="transparent" strokeWidth={16} />
                </g>
              )
            }

            const cp  = bezierCP(from, to, 35)
            const tip = edgeTip(cp, to, targetR + 4)

            return (
              <g key={i} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)} style={{ cursor: 'pointer' }}>
                <path d={`M ${from.x} ${from.y} Q ${cp.x} ${cp.y} ${tip.x} ${tip.y}`} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} markerEnd={marker} style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
                <path d={`M ${from.x} ${from.y} Q ${cp.x} ${cp.y} ${tip.x} ${tip.y}`} fill="none" stroke="transparent" strokeWidth={18} />
              </g>
            )
          })}

          {/* Satellite step nodes — render before hubs so hubs sit on top */}
          {nodeIds.filter((id) => !hubIds.has(id)).map((stepId) => {
            const pos        = positions[stepId] ?? { x: 0, y: 0 }
            const step       = getStep(stepId)
            const label      = step?.name ?? stepId
            const isSelected = selectedStepId === stepId
            const isRelated  = isRelatedToSelected(stepId)
            const isDimmed   = selectedStepId !== null && !isSelected && !isRelated

            return (
              <g
                key={stepId}
                className="graph-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  setSelectedStepId(isSelected ? null : stepId)
                  pinTooltip(stepId, e as unknown as React.MouseEvent)
                }}
                onMouseEnter={(e) => showTooltip(stepId, e as unknown as React.MouseEvent)}
                onMouseMove={moveTooltip as unknown as React.MouseEventHandler<SVGGElement>}
                onMouseLeave={hideTooltip}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && <circle r={32} fill="none" stroke="#f5a623" strokeWidth={0.8} opacity={0.4} filter="url(#glow)" />}
                <circle
                  r={SAT_R}
                  fill={isSelected ? 'url(#ng-sel)' : 'url(#ng)'}
                  stroke={isSelected ? '#f5a623' : isRelated ? 'rgba(245,166,35,0.5)' : 'rgba(26,29,59,0.18)'}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  opacity={isDimmed ? 0.25 : 1}
                  filter="url(#shadow)"
                  style={{ transition: 'all 0.25s' }}
                />
                {step && (
                  <circle cx={11} cy={-11} r={3} fill={step.difficulty >= 4 ? '#ef4444' : step.difficulty >= 2 ? '#f5a623' : '#10b981'} opacity={isDimmed ? 0.2 : 0.85} />
                )}
                <foreignObject x={-58} y={SAT_R + 2} width={116} height={32} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <div style={{ fontFamily: DM, fontSize: '8px', fontWeight: 500, letterSpacing: '0.01em', color: isSelected ? '#f5a623' : isRelated ? 'rgba(26,29,59,0.78)' : 'rgba(26,29,59,0.55)', textAlign: 'center', lineHeight: 1.2, opacity: isDimmed ? 0.25 : 1, transition: 'color 0.25s, opacity 0.25s', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {label}
                  </div>
                </foreignObject>
              </g>
            )
          })}

          {/* Hub nodes */}
          {hubs.map((hub) => {
            const pos        = positions[hub.stepId] ?? { x: 0, y: 0 }
            const step       = getStep(hub.stepId)
            const label      = step?.name ?? hub.stepId
            const isSelected = selectedStepId === hub.stepId
            const isRelated  = isRelatedToSelected(hub.stepId)
            const isDimmed   = selectedStepId !== null && !isSelected && !isRelated

            return (
              <g
                key={hub.stepId}
                className="graph-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  setSelectedStepId(isSelected ? null : hub.stepId)
                  pinTooltip(hub.stepId, e as unknown as React.MouseEvent)
                }}
                onMouseEnter={(e) => showTooltip(hub.stepId, e as unknown as React.MouseEvent)}
                onMouseMove={moveTooltip as unknown as React.MouseEventHandler<SVGGElement>}
                onMouseLeave={hideTooltip}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && <circle r={64} fill="none" stroke="#f5a623" strokeWidth={0.8} opacity={0.3} filter="url(#glow)" />}
                {isRelated  && <circle r={54} fill="none" stroke="rgba(245,166,35,0.35)" strokeWidth={1} />}
                <circle
                  r={HUB_R}
                  fill={isSelected ? 'url(#ng-sel)' : 'url(#ng)'}
                  stroke={isSelected ? '#f5a623' : isRelated ? 'rgba(245,166,35,0.4)' : 'rgba(26,29,59,0.15)'}
                  strokeWidth={isSelected ? 1.5 : 1}
                  opacity={isDimmed ? 0.22 : 1}
                  filter="url(#shadow)"
                  style={{ transition: 'all 0.25s' }}
                />
                <circle cx={30} cy={-30} r={5} fill={hub.color} opacity={isDimmed ? 0.2 : 0.9} style={{ transition: 'opacity 0.25s' }} />
                <text textAnchor="middle" y={-4} fontSize="22" opacity={isDimmed ? 0.2 : 1} style={{ userSelect: 'none', pointerEvents: 'none', transition: 'opacity 0.25s' }}>
                  {hub.icon}
                </text>
                <foreignObject x={-50} y={16} width={100} height={34} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <div style={{ fontFamily: DM, fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em', color: isSelected ? '#f5a623' : isRelated ? 'rgba(26,29,59,0.85)' : 'rgba(26,29,59,0.6)', textAlign: 'center', lineHeight: 1.25, opacity: isDimmed ? 0.2 : 1, transition: 'color 0.25s, opacity 0.25s', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {label}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </g>
      </svg>

      {tooltip && <VideoTooltip state={tooltip} onClose={() => setTooltip(null)} />}

      <div style={{ position: 'absolute', bottom: 18, left: `calc(50% - ${panelWidth / 2}px)`, transform: 'translateX(-50%)', fontFamily: DM, fontSize: '10px', letterSpacing: '0.18em', color: 'rgba(26,29,59,0.35)', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap', transition: 'left 0.3s' }}>
        Arraste · Scroll zoom · Clique no nó para detalhes
      </div>

      <div style={{ position: 'absolute', bottom: 18, right: panelWidth + 16, display: 'flex', flexDirection: 'column', gap: '4px', transition: 'right 0.3s' }}>
        {([
          { label: '+', fn: () => setTransform((t) => ({ ...t, scale: Math.min(3.5, t.scale * 1.2) })) },
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) })) },
          { label: '⌂', fn: () => setTransform({ x: 0, y: 0, scale: 0.75 }) },
        ] as const).map(({ label, fn }) => (
          <button key={label} onClick={fn} style={{ width: 32, height: 32, background: 'rgba(26,29,59,0.04)', border: '1px solid rgba(26,29,59,0.12)', borderRadius: '4px', color: 'rgba(26,29,59,0.55)', fontFamily: DM, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</button>
        ))}
      </div>

      {/* Details panel */}
      {selectedStep && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${panelWidth}px`, background: '#ffffff', borderLeft: '1px solid #dde3f5', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #dde3f5' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedHub && <span style={{ fontSize: '30px' }}>{selectedHub.icon}</span>}
                <div>
                  <h3 style={{ fontFamily: DM, fontSize: '15px', fontWeight: 700, color: '#1a1d3b', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{selectedStep.name}</h3>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {Array.from({ length: 5 }, (_, k) => (
                      <div key={k} style={{ width: 14, height: 3, borderRadius: 2, background: k < selectedStep.difficulty ? '#f5a623' : 'rgba(26,29,59,0.1)' }} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStepId(null)} style={{ background: 'none', border: 'none', color: 'rgba(26,29,59,0.35)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>✕</button>
            </div>
            <p style={{ fontFamily: DM, fontSize: '12px', color: 'rgba(26,29,59,0.6)', lineHeight: 1.7, margin: 0 }}>{selectedStep.description}</p>
            {selectedHub?.notes && (
              <p style={{ fontFamily: DM, fontSize: '11px', fontStyle: 'italic', color: 'rgba(26,29,59,0.38)', lineHeight: 1.6, marginTop: '8px' }}>"{selectedHub.notes}"</p>
            )}
            <Link
              to={`/video/${selectedStep.id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontFamily: DM, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5a623', textDecoration: 'none' }}
            >
              Ver passo
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>

          {outgoing.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3f5' }}>
              <p style={{ fontFamily: DM, fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(26,29,59,0.45)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>Vai para</p>
              {outgoing.map((conn, i) => {
                const toHub  = hubs.find((h) => h.stepId === conn.to)
                const toStep = getStep(conn.to)
                return (
                  <div key={i} onClick={() => setSelectedStepId(conn.to)} style={{ padding: '10px 12px', borderRadius: '5px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', marginBottom: '5px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.12)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.06)')}
                  >
                    <p style={{ fontFamily: DM, fontSize: '12px', fontWeight: 600, color: '#f5a623' }}>→ {toHub?.icon ?? '·'} {toStep?.name ?? conn.to}</p>
                  </div>
                )
              })}
            </div>
          )}

          {incoming.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontFamily: DM, fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(26,29,59,0.45)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>Chega de</p>
              {incoming.map((conn, i) => {
                const fromHub  = hubs.find((h) => h.stepId === conn.from)
                const fromStep = getStep(conn.from)
                return (
                  <div key={i} onClick={() => setSelectedStepId(conn.from)} style={{ padding: '10px 12px', borderRadius: '5px', background: 'rgba(26,29,59,0.03)', border: '1px solid rgba(26,29,59,0.1)', marginBottom: '5px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(26,29,59,0.06)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(26,29,59,0.03)')}
                  >
                    <p style={{ fontFamily: DM, fontSize: '12px', fontWeight: 600, color: 'rgba(26,29,59,0.65)' }}>← {fromHub?.icon ?? '·'} {fromStep?.name ?? conn.from}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
