import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getVideoById, getVideoThumbnail } from '../data/videos'
import type { FlowMap } from '../data/types'
import type { Video } from '../types'

const DM = "'Poppins', sans-serif"
const SERIF = "'Poppins', sans-serif"

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

// Precomputed radial layout for Zouk — base_frente_tras at center
const ZOUK_POSITIONS: Record<string, { x: number; y: number }> = {
  base_frente_tras:  { x:    0, y:    0 },
  base_lateral:      { x: -210, y: -130 },
  abertura:          { x:  210, y: -130 },
  giros:             { x:  300, y:   70 },
  dama_costas:       { x: -200, y:  150 },
  pendulos:          { x:   50, y:  280 },
  movimentos_corpo:  { x: -320, y:   40 },
  conexoes_estilo:   { x:   50, y: -280 },
  finalizacao:       { x:  240, y:  220 },
}

/** Returns a position map for the given hubs.
 *  Uses the hardcoded Zouk layout when all IDs match; otherwise builds
 *  a dynamic circular layout with the highest-difficulty hub at center. */
function resolvePositions(hubs: HubData[]): Record<string, { x: number; y: number }> {
  const allKnown = hubs.every((h) => h.id in ZOUK_POSITIONS)
  if (allKnown && hubs.length > 0) return ZOUK_POSITIONS

  const sorted = [...hubs].sort((a, b) => b.difficulty - a.difficulty)
  const center = sorted[0]
  const others = sorted.slice(1)
  const radius = 250
  const result: Record<string, { x: number; y: number }> = {
    [center.id]: { x: 0, y: 0 },
  }
  others.forEach((hub, i) => {
    const angle = (2 * Math.PI * i) / others.length - Math.PI / 2
    result[hub.id] = {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    }
  })
  return result
}

const HUB_R  = 46
const ORBIT  = 86

/** Distributes step nodes in a radial fan pointing away from canvas center. */
function stepPositions(
  hub: { x: number; y: number },
  count: number,
): { x: number; y: number }[] {
  if (count === 0) return []
  const baseAngle = Math.atan2(hub.y, hub.x) + Math.PI
  const spread = count === 1 ? 0 : (Math.PI * 0.65) / (count - 1)
  const startAngle = baseAngle - (spread * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => {
    const a = startAngle + spread * i
    return { x: hub.x + Math.cos(a) * ORBIT, y: hub.y + Math.sin(a) * ORBIT }
  })
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

// ── Video Card (HTML overlay, lives outside the SVG) ──────────────────────────

interface TooltipState {
  video: Video
  screenX: number
  screenY: number
  pinned: boolean   // true = clicked, stays open with inline player
}

function VideoTooltip({
  state,
  onClose,
}: {
  state: TooltipState
  onClose: () => void
}) {
  const { video, screenX, screenY, pinned } = state
  const thumb = getVideoThumbnail(video)
  const hasYT = !!(video.youtubeId && video.youtubeId !== 'dQw4w9WgXcQ')

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
      {/* ── Media area ── */}
      {pinned && hasYT ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: 88, background: '#e8ecf8' }}>
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          <span style={{ position: 'absolute', bottom: 5, right: 6, background: 'rgba(26,29,59,0.65)', color: '#FFF', fontFamily: DM, fontSize: '9px', padding: '2px 5px', borderRadius: '2px' }}>
            {video.duration}
          </span>
          {/* play hint when not pinned */}
          {!pinned && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(26,29,59,0.08)',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,166,35,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Info ── */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontFamily: DM, fontSize: '11px', fontWeight: 600, color: '#1a1d3b', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {video.title}
        </p>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '10px' }}>
          {Array.from({ length: 5 }, (_, k) => (
            <div key={k} style={{ width: 16, height: 3, borderRadius: 2, background: k < video.knowledgeLevel ? '#f5a623' : 'rgba(26,29,59,0.1)' }} />
          ))}
          <span style={{ fontFamily: DM, fontSize: '9px', color: 'rgba(26,29,59,0.4)', marginLeft: '5px' }}>Domínio</span>
        </div>

        {/* action row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Play / Stop inline */}
          {hasYT && (
            <button
              onClick={(e) => { e.stopPropagation(); /* toggling handled by parent click */ }}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                padding: '7px 10px', borderRadius: '4px', border: 'none',
                background: pinned ? 'rgba(26,29,59,0.06)' : '#f5a623',
                color: pinned ? 'rgba(26,29,59,0.5)' : '#ffffff',
                fontFamily: DM, fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {pinned ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  Parar
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>
                  Play
                </>
              )}
            </button>
          )}

          {/* Open detail page */}
          <a
            href={`#/video/${video.id}`}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '7px 10px', borderRadius: '4px',
              border: '1px solid rgba(245,166,35,0.4)',
              background: 'transparent',
              color: '#f5a623',
              fontFamily: DM, fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Abrir
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>

          {/* Close (only when pinned) */}
          {pinned && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                width: 30, height: 30, borderRadius: '4px', border: '1px solid rgba(26,29,59,0.12)',
                background: 'transparent', color: 'rgba(26,29,59,0.4)',
                fontFamily: DM, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
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

export function FlowMapGraph({ flowMap }: { flowMap: FlowMap }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [center, setCenter] = useState({ x: 560, y: 340 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedHub, setSelectedHub] = useState<HubId | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [showSteps, setShowSteps]     = useState(true)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setCenter({ x: r.width / 2, y: r.height / 2 })
  }, [])

  const hubs = Object.values(flowMap.hubs) as HubData[]
  const connections = flowMap.connections

  const selectedData = selectedHub ? (flowMap.hubs[selectedHub] as HubData) : null
  const outgoing = selectedHub ? connections.filter((c) => c.fromHub === selectedHub) : []
  const incoming = selectedHub ? connections.filter((c) => c.toHub === selectedHub) : []

  const positions = resolvePositions(hubs)

  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('.hub-node, .step-node')) return
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

  const panelWidth = selectedData ? 300 : 0

  const showTooltip = useCallback((videoId: string, e: React.MouseEvent) => {
    const video = getVideoById(videoId)
    if (!video) return
    setTooltip((prev) =>
      // don't overwrite a pinned card from a different node on hover
      prev?.pinned ? prev : { video, screenX: e.clientX, screenY: e.clientY, pinned: false }
    )
  }, [])
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => prev && !prev.pinned ? { ...prev, screenX: e.clientX, screenY: e.clientY } : prev ?? null)
  }, [])
  const hideTooltip = useCallback(() => {
    setTooltip((prev) => prev?.pinned ? prev : null)
  }, [])
  const pinTooltip = useCallback((videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const video = getVideoById(videoId)
    if (!video) return
    setTooltip((prev) =>
      prev?.pinned && prev.video.id === videoId
        ? null  // click again on same node → close
        : { video, screenX: e.clientX, screenY: e.clientY, pinned: true }
    )
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#f0f4ff',
      }}
    >
      {/* SVG canvas */}
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
          {/* Arrowheads */}
          <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="rgba(26,29,59,0.3)" />
          </marker>
          <marker id="arr-hi" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#f5a623" />
          </marker>
          {/* Grid pattern */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.9" fill="rgba(26,29,59,0.07)" />
          </pattern>
          {/* Node gradients */}
          <radialGradient id="ng-sel" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff8ee" />
            <stop offset="100%" stopColor="#fff3e0" />
          </radialGradient>
          <radialGradient id="ng" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f4f6ff" />
          </radialGradient>
          {/* Glow filter */}
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="7" floodColor="#1a1d3b" floodOpacity="0.12" />
          </filter>
          <filter id="step-shadow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1a1d3b" floodOpacity="0.1" />
          </filter>
        </defs>

        <g
          transform={`translate(${center.x + transform.x - panelWidth / 2}, ${center.y + transform.y}) scale(${transform.scale})`}
        >
          {/* Background grid */}
          <rect x="-2000" y="-1500" width="4000" height="3000" fill="url(#grid)" />

          {/* ── STEP SPOKES (behind everything) ── */}
          {showSteps && hubs.map((hub) => {
            const pos = positions[hub.id] ?? { x: 0, y: 0 }
            const sPos = stepPositions(pos, hub.videoIds.length)
            const isDimmedHub = selectedHub !== null && selectedHub !== hub.id
            return hub.videoIds.map((_, si) => {
              const sp = sPos[si]
              return (
                <line
                  key={`spoke-${hub.id}-${si}`}
                  x1={pos.x} y1={pos.y}
                  x2={sp.x} y2={sp.y}
                  stroke={hub.color}
                  strokeWidth={0.7}
                  strokeOpacity={isDimmedHub ? 0.04 : 0.18}
                  style={{ transition: 'stroke-opacity 0.25s' }}
                />
              )
            })
          })}

          {/* ── EDGES ── */}
          {connections.map((conn, i) => {
            const from = positions[conn.fromHub] ?? { x: 0, y: 0 }
            const to   = positions[conn.toHub]   ?? { x: 0, y: 0 }
            const isSelf  = conn.fromHub === conn.toHub
            const isHover = hoveredEdge === i
            const isRelated =
              selectedHub !== null &&
              (conn.fromHub === selectedHub || conn.toHub === selectedHub)
            const active = isHover || isRelated
            const stroke = active ? '#f5a623' : 'rgba(26,29,59,0.18)'
            const sw = active ? 2 : 1
            const marker = active ? 'url(#arr-hi)' : 'url(#arr)'
            const dash = active ? undefined : '5 4'

            if (isSelf) {
              const lx = from.x
              const ly = from.y
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={`M ${lx - 30} ${ly - 38} C ${lx - 100} ${ly - 140} ${lx + 100} ${ly - 140} ${lx + 30} ${ly - 38}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={dash}
                    markerEnd={marker}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {/* hit area */}
                  <path
                    d={`M ${lx - 30} ${ly - 38} C ${lx - 100} ${ly - 140} ${lx + 100} ${ly - 140} ${lx + 30} ${ly - 38}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                  />
                  {isHover && (
                    <text
                      x={lx}
                      y={ly - 148}
                      textAnchor="middle"
                      fill="#f5a623"
                      fontSize="9"
                      fontFamily={DM}
                      style={{ pointerEvents: 'none' }}
                    >
                      {conn.description}
                    </text>
                  )}
                </g>
              )
            }

            const cp  = bezierCP(from, to, 55)
            const tip = edgeTip(cp, to, HUB_R + 5)

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={`M ${from.x} ${from.y} Q ${cp.x} ${cp.y} ${tip.x} ${tip.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  markerEnd={marker}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
                {/* wide transparent hit area */}
                <path
                  d={`M ${from.x} ${from.y} Q ${cp.x} ${cp.y} ${tip.x} ${tip.y}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={18}
                />
                {isHover && (
                  <text
                    x={cp.x}
                    y={cp.y - 10}
                    textAnchor="middle"
                    fill="#f5a623"
                    fontSize="9"
                    fontFamily={DM}
                    style={{ pointerEvents: 'none' }}
                  >
                    {conn.description}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── NODES ── */}
          {hubs.map((hub) => {
            const pos        = positions[hub.id] ?? { x: 0, y: 0 }
            const isSelected = selectedHub === hub.id
            const isRelated  =
              selectedHub !== null &&
              (outgoing.some((c) => c.toHub === hub.id) ||
               incoming.some((c) => c.fromHub === hub.id))
            const isDimmed = selectedHub !== null && !isSelected && !isRelated

            return (
              <g
                key={hub.id}
                className="hub-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedHub(isSelected ? null : hub.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* glow ring */}
                {isSelected && (
                  <circle
                    r={64}
                    fill="none"
                    stroke="#f5a623"
                    strokeWidth={0.8}
                    opacity={0.3}
                    filter="url(#glow)"
                  />
                )}
                {/* relation ring */}
                {isRelated && (
                  <circle r={54} fill="none" stroke="rgba(245,166,35,0.35)" strokeWidth={1} />
                )}

                {/* main circle */}
                <circle
                  r={HUB_R}
                  fill={isSelected ? 'url(#ng-sel)' : 'url(#ng)'}
                  stroke={
                    isSelected
                      ? '#f5a623'
                      : isRelated
                      ? 'rgba(245,166,35,0.4)'
                      : 'rgba(26,29,59,0.15)'
                  }
                  strokeWidth={isSelected ? 1.5 : 1}
                  opacity={isDimmed ? 0.22 : 1}
                  filter="url(#shadow)"
                  style={{ transition: 'all 0.25s' }}
                />

                {/* color badge */}
                <circle
                  cx={30}
                  cy={-30}
                  r={5}
                  fill={hub.color}
                  opacity={isDimmed ? 0.2 : 0.9}
                  style={{ transition: 'opacity 0.25s' }}
                />

                {/* emoji */}
                <text
                  textAnchor="middle"
                  y={-4}
                  fontSize="22"
                  opacity={isDimmed ? 0.2 : 1}
                  style={{ userSelect: 'none', pointerEvents: 'none', transition: 'opacity 0.25s' }}
                >
                  {hub.icon}
                </text>

                {/* label */}
                <foreignObject
                  x={-40}
                  y={16}
                  width={80}
                  height={34}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div
                    style={{
                      fontFamily: DM,
                      fontSize: '8.5px',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      color: isSelected
                        ? '#f5a623'
                        : isRelated
                        ? 'rgba(26,29,59,0.85)'
                        : 'rgba(26,29,59,0.5)',
                      textAlign: 'center',
                      lineHeight: 1.25,
                      opacity: isDimmed ? 0.2 : 1,
                      transition: 'color 0.25s, opacity 0.25s',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {hub.title}
                  </div>
                </foreignObject>
              </g>
            )
          })}

          {/* ── STEP NODES ── */}
          {showSteps && hubs.map((hub) => {
            const pos  = positions[hub.id] ?? { x: 0, y: 0 }
            const sPos = stepPositions(pos, hub.videoIds.length)
            const isDimmedHub = selectedHub !== null && selectedHub !== hub.id
            const W = 28, H = 28
            return hub.videoIds.map((videoId, si) => {
              const sp    = sPos[si]
              const video = getVideoById(videoId)
              if (!video) return null
              return (
                <g
                  key={`step-${hub.id}-${videoId}`}
                  className="step-node"
                  transform={`translate(${sp.x - W / 2}, ${sp.y - H / 2})`}
                  opacity={isDimmedHub ? 0.08 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.25s' }}
                  onMouseEnter={(e) => showTooltip(videoId, e as unknown as React.MouseEvent)}
                  onMouseMove={moveTooltip as unknown as React.MouseEventHandler<SVGGElement>}
                  onMouseLeave={hideTooltip}
                  onClick={(e) => pinTooltip(videoId, e as unknown as React.MouseEvent)}
                >
                  {/* background */}
                  <rect width={W} height={H} rx={4} ry={4} fill="#ffffff" stroke={hub.color} strokeWidth={1} strokeOpacity={0.5} filter="url(#step-shadow)" />
                  {/* knowledge track */}
                  <rect x={2} y={H - 5} width={W - 4} height={3} rx={2} fill={hub.color} opacity={0.1} />
                  {/* knowledge fill */}
                  <rect x={2} y={H - 5} width={(W - 4) * (video.knowledgeLevel / 5)} height={3} rx={2} fill={hub.color} opacity={0.7} />
                  {/* play icon */}
                  <polygon points={`${W/2-4},${H/2-5} ${W/2-4},${H/2+5} ${W/2+6},${H/2}`} fill={hub.color} opacity={0.65} />
                </g>
              )
            })
          })}
        </g>
      </svg>

      {/* VIDEO CARD */}
      {tooltip && <VideoTooltip state={tooltip} onClose={() => setTooltip(null)} />}

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: `calc(50% - ${panelWidth / 2}px)`,
          transform: 'translateX(-50%)',
          fontFamily: DM,
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: 'rgba(26,29,59,0.35)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          transition: 'left 0.3s',
        }}
      >
        Arraste · Scroll zoom · Hub = clique · Passo ▶ = hover / clique para fixar
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          right: panelWidth + 16,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          transition: 'right 0.3s',
        }}
      >
        {/* Steps layer toggle */}
        <button
          onClick={() => setShowSteps((v) => !v)}
          title={showSteps ? 'Ocultar camada de passos' : 'Mostrar camada de passos'}
          style={{
            width: 32,
            height: 32,
            background: showSteps ? 'rgba(245,166,35,0.12)' : 'rgba(26,29,59,0.04)',
            border: `1px solid ${showSteps ? 'rgba(245,166,35,0.45)' : 'rgba(26,29,59,0.12)'}`,
            borderRadius: '4px',
            color: showSteps ? '#f5a623' : 'rgba(26,29,59,0.4)',
            fontFamily: DM,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          ▶
        </button>
        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(26,29,59,0.1)', margin: '2px 0' }} />

        {([
          { label: '+', fn: () => setTransform((t) => ({ ...t, scale: Math.min(3.5, t.scale * 1.2) })) },
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) })) },
          { label: '⌂', fn: () => setTransform({ x: 0, y: 0, scale: 1 }) },
        ] as const).map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            style={{
              width: 32,
              height: 32,
              background: 'rgba(26,29,59,0.04)',
              border: '1px solid rgba(26,29,59,0.12)',
              borderRadius: '4px',
              color: 'rgba(26,29,59,0.55)',
              fontFamily: DM,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── DETAILS PANEL ── */}
      {selectedData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${panelWidth}px`,
            background: '#ffffff',
            borderLeft: '1px solid #dde3f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '22px 20px 18px',
              borderBottom: '1px solid #dde3f5',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '30px' }}>{selectedData.icon}</span>
                <div>
                  <h3
                    style={{
                      fontFamily: SERIF,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#1a1d3b',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedData.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {Array.from({ length: 5 }, (_, k) => (
                      <div
                        key={k}
                        style={{
                          width: 14,
                          height: 3,
                          borderRadius: 2,
                          background:
                            k < selectedData.difficulty
                              ? '#f5a623'
                              : 'rgba(26,29,59,0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHub(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(26,29,59,0.35)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: 1,
                  padding: '2px 4px',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontFamily: DM,
                fontSize: '12px',
                color: 'rgba(26,29,59,0.6)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {selectedData.description}
            </p>
            <p
              style={{
                fontFamily: DM,
                fontSize: '11px',
                fontStyle: 'italic',
                color: 'rgba(26,29,59,0.38)',
                lineHeight: 1.6,
                marginTop: '8px',
              }}
            >
              "{selectedData.notes}"
            </p>
          </div>

          {/* Videos */}
          {selectedData.videoIds.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3f5' }}>
              <p
                style={{
                  fontFamily: DM,
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  color: '#f5a623',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Passos ({selectedData.videoIds.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedData.videoIds.map((vid) => {
                  const video = getVideoById(vid)
                  if (!video) return null
                  return (
                    <Link
                      key={vid}
                      to={`/video/${vid}`}
                      style={{
                        fontFamily: DM,
                        fontSize: '12px',
                        color: 'rgba(26,29,59,0.65)',
                        padding: '7px 11px',
                        borderRadius: '4px',
                        border: '1px solid rgba(26,29,59,0.1)',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245,166,35,0.5)'
                        e.currentTarget.style.color = '#f5a623'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(26,29,59,0.1)'
                        e.currentTarget.style.color = 'rgba(26,29,59,0.65)'
                      }}
                    >
                      {video.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Outgoing connections */}
          {outgoing.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3f5' }}>
              <p
                style={{
                  fontFamily: DM,
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  color: 'rgba(26,29,59,0.45)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Vai para
              </p>
              {outgoing.map((conn, i) => {
                const toHub = flowMap.hubs[conn.toHub] as HubData
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedHub(conn.toHub as HubId)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '5px',
                      background: 'rgba(245,166,35,0.06)',
                      border: '1px solid rgba(245,166,35,0.2)',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(245,166,35,0.12)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(245,166,35,0.06)')
                    }
                  >
                    <p
                      style={{
                        fontFamily: DM,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#f5a623',
                        marginBottom: '3px',
                      }}
                    >
                      {conn.description}
                    </p>
                    <p
                      style={{
                        fontFamily: DM,
                        fontSize: '11px',
                        color: 'rgba(26,29,59,0.5)',
                      }}
                    >
                      → {toHub.icon} {toHub.title}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Incoming connections */}
          {incoming.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <p
                style={{
                  fontFamily: DM,
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  color: 'rgba(26,29,59,0.45)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Chega de
              </p>
              {incoming.map((conn, i) => {
                const fromHub = flowMap.hubs[conn.fromHub] as HubData
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedHub(conn.fromHub as HubId)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '5px',
                      background: 'rgba(26,29,59,0.03)',
                      border: '1px solid rgba(26,29,59,0.1)',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(26,29,59,0.06)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(26,29,59,0.03)')
                    }
                  >
                    <p
                      style={{
                        fontFamily: DM,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'rgba(26,29,59,0.65)',
                        marginBottom: '3px',
                      }}
                    >
                      {conn.description}
                    </p>
                    <p
                      style={{
                        fontFamily: DM,
                        fontSize: '11px',
                        color: 'rgba(26,29,59,0.4)',
                      }}
                    >
                      ← {fromHub.icon} {fromHub.title}
                    </p>
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
