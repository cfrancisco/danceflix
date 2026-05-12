import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getVideoById, getVideoThumbnail, getFirstYoutubeId } from '../data/videos'
import { FlowSequenceFooter } from './FlowSequenceFooter'
import { useVideoLibrary } from '../hooks/useVideoLibrary'
import { useActiveStyle } from '../context/StyleContext'
import type { Hub, DanceStep, Flow, Level, Video } from '../types'
import { LEVEL_LABELS } from '../types'
import './FlowMapGraph.css'

function parseYoutubeIdFromUrl(url: string): string | undefined {
  const s = url.trim()
  if (!s) return undefined
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : s.length === 11 ? s : undefined
}

function videoToFlowUrl(v: Video): string {
  if (v.youtubeId) return `https://youtube.com/watch?v=${v.youtubeId}`
  return v.videoUrl ?? ''
}

const CLUSTER_PALETTE = [
  { fill: 'rgba(59,130,246,0.055)',  stroke: 'rgba(59,130,246,0.22)',  label: '#3B82F6' },
  { fill: 'rgba(16,185,129,0.055)',  stroke: 'rgba(16,185,129,0.22)',  label: '#10b981' },
  { fill: 'rgba(245,158,11,0.055)',  stroke: 'rgba(245,158,11,0.22)',  label: '#f59e0b' },
  { fill: 'rgba(168,85,247,0.055)',  stroke: 'rgba(168,85,247,0.22)',  label: '#a855f7' },
  { fill: 'rgba(239,68,68,0.055)',   stroke: 'rgba(239,68,68,0.22)',   label: '#ef4444' },
  { fill: 'rgba(20,184,166,0.055)',  stroke: 'rgba(20,184,166,0.22)',  label: '#14b8a6' },
]

const FLOW_COLOR     = '#3B82F6'
const FLOW_COLOR_DIM = 'rgba(59,130,246,0.35)'

// Directional edge colors: outgoing = purple, incoming = warm brown
const EDGE_OUT       = '#6d28d9'
const EDGE_OUT_IDLE  = 'rgba(109,40,217,0.36)'
const EDGE_OUT_DIM   = 'rgba(109,40,217,0.05)'
const EDGE_IN        = '#b45309'
const EDGE_IN_IDLE   = 'rgba(180,83,9,0.36)'
const EDGE_IN_DIM    = 'rgba(180,83,9,0.05)'

function customFlowsKey(styleId: string) {
  return `danceflix.customFlows.${styleId}`
}

function deletedFlowsKey(styleId: string) {
  return `danceflix.deletedFlows.${styleId}`
}

function loadDeletedFlowIds(styleId: string): Set<string> {
  try {
    const raw = localStorage.getItem(deletedFlowsKey(styleId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch { return new Set() }
}

function saveDeletedFlowIds(styleId: string, ids: Set<string>) {
  try { localStorage.setItem(deletedFlowsKey(styleId), JSON.stringify([...ids])) } catch { /* noop */ }
}

function nodePositionsKey(styleId: string) {
  return `danceflix.nodePositions.${styleId}`
}

function loadNodePositions(styleId: string): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(nodePositionsKey(styleId))
    return raw ? (JSON.parse(raw) as Record<string, { x: number; y: number }>) : {}
  } catch { return {} }
}

function saveNodePositions(styleId: string, positions: Record<string, { x: number; y: number }>) {
  try { localStorage.setItem(nodePositionsKey(styleId), JSON.stringify(positions)) } catch { /* noop */ }
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

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function readTrainingStore(): Record<string, number> {
  try {
    const raw = localStorage.getItem('danceflix:training')
    if (!raw) return {}
    const store = JSON.parse(raw) as Record<string, { learningLevel?: number }>
    const result: Record<string, number> = {}
    for (const [id, p] of Object.entries(store)) result[id] = p.learningLevel ?? 0
    return result
  } catch { return {} }
}

const DM = "'Poppins', sans-serif"

// Precomputed hub positions for the zouk set (keyed by stepId).
// Spaced apart enough to give each hub room for its satellite ring.
const ZOUK_HUB_POSITIONS: Record<string, { x: number; y: number }> = {
  'base-1':            { x:    0, y:    0 },
  'base-2':            { x: -680, y: -440 },
  'giro-dama-simples': { x:  720, y:  200 },
}

const SAT_RING_R = 200

// ── Card visual dimensions (centered at node origin) ──────────────────────
const SAT_W = 128   // satellite card width  (slightly smaller as requested)
const SAT_H = 50    // satellite card height (taller for thumbnail + difficulty)
const HUB_W = 182   // hub card width
const HUB_H = 88    // hub card height (taller: title strip + inner box)

// Thumbnail geometry (in local card coordinate space, centered at node origin)
const SAT_THUMB_R  = 14
const SAT_THUMB_CX = -(SAT_W / 2) + 8 + SAT_THUMB_R   // = -42
const HUB_THUMB_R  = 20
const HUB_THUMB_CX = -(HUB_W / 2) + 14 + HUB_THUMB_R  // = -57
const HUB_THUMB_CY = 14   // below the title strip

interface Layout {
  positions: Record<string, { x: number; y: number }>
  hubIds: Set<string>
  /** All step ids that should be drawn as nodes (hubs + satellites). */
  nodeIds: string[]
}

/**
 * Force-directed layout. Hubs are anchored to fixed positions (so the user has
 * a stable mental map), and satellites are simulated under repulsion, spring
 * (connection) attraction, and an extra category-clustering force when active.
 */
function buildLayout(
  hubs: Hub[],
  steps: DanceStep[],
  connections: { from: string; to: string }[],
  categoryFilter: string | null,
): Layout {
  const hubIds = new Set(hubs.map((h) => h.stepId))
  const positions: Record<string, { x: number; y: number }> = {}

  // 1. Anchor hubs
  const allKnown = hubs.length > 0 && hubs.every((h) => h.stepId in ZOUK_HUB_POSITIONS)
  if (allKnown) {
    hubs.forEach((h) => { positions[h.stepId] = { ...ZOUK_HUB_POSITIONS[h.stepId] } })
  } else {
    const byDifficulty = [...hubs].sort((a, b) => {
      const da = steps.find((s) => s.id === a.stepId)?.difficulty ?? 0
      const db = steps.find((s) => s.id === b.stepId)?.difficulty ?? 0
      return db - da
    })
    if (byDifficulty.length > 0) {
      const center = byDifficulty[0]
      const others = byDifficulty.slice(1)
      const radius = 680
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

  // 2. Assign each non-hub step to its primary hub for initial seeding
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

  const hubsCentroid = hubs.reduce((acc, h) => {
    const p = positions[h.stepId] ?? { x: 0, y: 0 }
    return { x: acc.x + p.x, y: acc.y + p.y }
  }, { x: 0, y: 0 })
  hubsCentroid.x /= Math.max(1, hubs.length)
  hubsCentroid.y /= Math.max(1, hubs.length)

  // Initial seed: ring around primary hub, oriented away from centroid
  Object.entries(satellitesByHub).forEach(([hubId, stepIds]) => {
    const hubPos = positions[hubId]
    if (!hubPos) return
    const count = stepIds.length
    const dx = hubPos.x - hubsCentroid.x
    const dy = hubPos.y - hubsCentroid.y
    const baseAngle = Math.atan2(dy, dx)
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

  // 3. Force simulation
  const ids = [...hubs.map((h) => h.stepId), ...Array.from(assigned)]
  const velocities: Record<string, { x: number; y: number }> = {}
  ids.forEach((id) => { velocities[id] = { x: 0, y: 0 } })

  // Neighbor map (undirected)
  const neighbors: Record<string, Set<string>> = {}
  ids.forEach((id) => { neighbors[id] = new Set() })
  connections.forEach((c) => {
    if (c.from === c.to) return
    if (neighbors[c.from] && neighbors[c.to]) {
      neighbors[c.from].add(c.to)
      neighbors[c.to].add(c.from)
    }
  })

  // Category-shared-neighbor pairs: extra spring pulls them together
  const stepById = new Map(steps.map((s) => [s.id, s]))
  const categoryPairs: { a: string; b: string; weight: number }[] = []
  if (categoryFilter) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j]
        let shared = 0
        neighbors[a].forEach((n) => {
          if (neighbors[b].has(n) && stepById.get(n)?.category === categoryFilter) shared++
        })
        if (shared >= 2) categoryPairs.push({ a, b, weight: shared })
      }
    }
  }

  const ITERATIONS = 280
  const REPEL = 10000
  const SPRING_K = 0.032
  const SPRING_REST = 230
  const CAT_K = 0.06
  const CAT_REST = 180
  const CENTER_K = 0.0012
  const DAMPING = 0.82
  const VMAX = 60
  const HUB_REPEL_BOOST = 4 // hubs push satellites harder so satellites stay clear of hub circles

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces: Record<string, { x: number; y: number }> = {}
    ids.forEach((id) => { forces[id] = { x: 0, y: 0 } })

    // Repulsion (every pair)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j]
        const dx = positions[a].x - positions[b].x
        const dy = positions[a].y - positions[b].y
        const d2 = Math.max(dx * dx + dy * dy, 4)
        const d = Math.sqrt(d2)
        const boost = (hubIds.has(a) || hubIds.has(b)) ? HUB_REPEL_BOOST : 1
        const f = (REPEL * boost) / d2
        forces[a].x += (dx / d) * f
        forces[a].y += (dy / d) * f
        forces[b].x -= (dx / d) * f
        forces[b].y -= (dy / d) * f
      }
    }

    // Connection springs
    connections.forEach((c) => {
      if (c.from === c.to) return
      const pa = positions[c.from], pb = positions[c.to]
      if (!pa || !pb) return
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const diff = d - SPRING_REST
      const f = SPRING_K * diff
      forces[c.from].x += (dx / d) * f
      forces[c.from].y += (dy / d) * f
      forces[c.to].x -= (dx / d) * f
      forces[c.to].y -= (dy / d) * f
    })

    // Category springs (clusters category-related satellites)
    categoryPairs.forEach(({ a, b, weight }) => {
      const pa = positions[a], pb = positions[b]
      if (!pa || !pb) return
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const diff = d - CAT_REST
      const f = CAT_K * weight * diff
      forces[a].x += (dx / d) * f
      forces[a].y += (dy / d) * f
      forces[b].x -= (dx / d) * f
      forces[b].y -= (dy / d) * f
    })

    // Centering
    ids.forEach((id) => {
      forces[id].x -= positions[id].x * CENTER_K
      forces[id].y -= positions[id].y * CENTER_K
    })

    // Apply forces — hubs are anchored
    ids.forEach((id) => {
      if (hubIds.has(id)) return
      const v = velocities[id]
      v.x = (v.x + forces[id].x) * DAMPING
      v.y = (v.y + forces[id].y) * DAMPING
      const speed = Math.sqrt(v.x * v.x + v.y * v.y)
      if (speed > VMAX) { v.x *= VMAX / speed; v.y *= VMAX / speed }
      positions[id].x += v.x
      positions[id].y += v.y
    })
  }

  return { positions, hubIds, nodeIds: ids }
}

/**
 * Ports always exit the RIGHT side and enter the LEFT side — like a node editor.
 * If source is to the right of the target, use left/right reversed.
 */
function getConnectionPorts(
  from: { x: number; y: number }, fromIsHub: boolean,
  to:   { x: number; y: number }, toIsHub:   boolean,
) {
  const fw = (fromIsHub ? HUB_W : SAT_W) / 2
  const tw = (toIsHub ? HUB_W : SAT_W) / 2
  const dx = to.x - from.x
  if (dx >= 0) {
    return {
      fromPort: { x: from.x + fw, y: from.y },
      toPort:   { x: to.x   - tw, y: to.y   },
    }
  } else {
    return {
      fromPort: { x: from.x - fw, y: from.y },
      toPort:   { x: to.x   + tw, y: to.y   },
    }
  }
}

/**
 * SVG path string for a smooth S-curve bezier between two card ports.
 */
function portBezierPath(
  fromPort: { x: number; y: number },
  toPort:   { x: number; y: number },
) {
  const dx = toPort.x - fromPort.x
  const dy = toPort.y - fromPort.y
  let c1: { x: number; y: number }
  let c2: { x: number; y: number }
  if (Math.abs(dx) >= Math.abs(dy)) {
    const cx = Math.max(Math.abs(dx) * 0.45, 55)
    c1 = { x: fromPort.x + (dx >= 0 ?  cx : -cx), y: fromPort.y }
    c2 = { x: toPort.x   + (dx >= 0 ? -cx :  cx), y: toPort.y   }
  } else {
    const cy = Math.max(Math.abs(dy) * 0.45, 55)
    c1 = { x: fromPort.x, y: fromPort.y + (dy >= 0 ?  cy : -cy) }
    c2 = { x: toPort.x,   y: toPort.y   + (dy >= 0 ? -cy :  cy) }
  }
  return `M ${fromPort.x} ${fromPort.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${toPort.x} ${toPort.y}`
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
  const firstYT = getFirstYoutubeId(step)
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
      className={`fm-tip ${pinned ? 'is-pinned' : ''}`}
      style={{ left, top, width: cardW }}
      onMouseLeave={pinned ? undefined : onClose}
    >
      {pinned && hasYT ? (
        <div className="fm-tip__media fm-tip__media--video">
          <iframe
            className="fm-tip__iframe"
            src={`https://www.youtube.com/embed/${firstYT}?autoplay=1`}
            title={step.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="fm-tip__media">
          <img className="fm-tip__thumb" src={thumb} alt="" />
          <span className="fm-tip__duration">{step.duration}</span>
          {!pinned && (
            <div className="fm-tip__play-overlay">
              <div className="fm-tip__play-circle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fm-tip__body">
        <p className="fm-tip__title">{step.name}</p>
        <div className="fm-tip__diff-row">
          {Array.from({ length: 5 }, (_, k) => (
            <div key={k} className={`fm-tip__diff-seg ${k < step.difficulty ? 'is-filled' : ''}`} />
          ))}
          <span className="fm-tip__diff-label">Nível</span>
        </div>
        <div className="fm-tip__actions">
          {hasYT && (
            <button
              className={`fm-tip__action fm-tip__action--play ${pinned ? 'is-paused' : ''}`}
              onClick={(e) => { e.stopPropagation() }}
            >
              {pinned ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Parar</>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"/></svg>Play</>
              )}
            </button>
          )}
          <a className="fm-tip__action fm-tip__action--open" href={`#/video/${step.id}`}>
            Abrir
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
          {pinned && (
            <button
              className="fm-tip__action fm-tip__action--close"
              onClick={(e) => { e.stopPropagation(); onClose() }}
            >✕</button>
          )}
        </div>
        {!pinned && (
          <p className="fm-tip__hint">Clique no nó para fixar</p>
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
  onAddStep?: (name: string) => DanceStep
}

export function FlowMapGraph({ hubs, steps, flows, styleId, onAddStep }: FlowMapGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [center, setCenter] = useState({ x: 560, y: 340 })
  const lib = useVideoLibrary()
  const { activeStyle } = useActiveStyle()
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.75 })
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // ── Flow selection / builder state ────────────────────────────────────────
  const [customFlows, setCustomFlows] = useState<Flow[]>(() => loadCustomFlows(styleId))
  const [deletedFlowIds, setDeletedFlowIds] = useState<Set<string>>(() => loadDeletedFlowIds(styleId))
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
  const [builderMode, setBuilderMode] = useState(false)
  const [draftSequence, setDraftSequence] = useState<string[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftDifficulty, setDraftDifficulty] = useState<Level>(2)
  const [draftVideo, setDraftVideo] = useState('')
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null)
  const [showVideoPicker, setShowVideoPicker] = useState(false)
  const [videoSearch, setVideoSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 640)
  const [sidebarView, setSidebarView] = useState<'list' | 'detail' | 'edit'>('list')
  const [sidebarDir, setSidebarDir] = useState<1 | -1>(1)

  // Footer edit mode wiring
  const footerAddStep = useRef<((id: string) => void) | null>(null)
  const [footerEditing, setFooterEditing] = useState(false)
  const [legendVisible, setLegendVisible] = useState(true)
  useEffect(() => {
    setCustomFlows(loadCustomFlows(styleId))
    setDeletedFlowIds(loadDeletedFlowIds(styleId))
    setSelectedFlowId(null)
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
    setDraftVideo('')
    setFooterEditing(false)
    footerAddStep.current = null
  }, [styleId])

  const allFlows: Flow[] = useMemo(() => {
    const customIds = new Set(customFlows.map((f) => f.id))
    return [
      ...flows.filter((f) => !customIds.has(f.id) && !deletedFlowIds.has(f.id)),
      ...customFlows.filter((f) => !deletedFlowIds.has(f.id)),
    ]
  }, [flows, customFlows, deletedFlowIds])
  const selectedFlow = selectedFlowId ? allFlows.find((f) => f.id === selectedFlowId) ?? null : null

  const allPickerVideos = useMemo<Video[]>(() => {
    const catalog = activeStyle.videos
    const seen = new Set(catalog.map((v) => v.id))
    return [...catalog, ...lib.videos.filter((v) => !seen.has(v.id))]
  }, [activeStyle.videos, lib.videos])

  const filteredPickerVideos = useMemo(() => {
    const q = videoSearch.trim().toLowerCase()
    if (!q) return allPickerVideos
    return allPickerVideos.filter((v) => v.title.toLowerCase().includes(q))
  }, [allPickerVideos, videoSearch])

  const draftVideoThumb = useMemo(() => {
    const ytId = parseYoutubeIdFromUrl(draftVideo)
    return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : undefined
  }, [draftVideo])

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

  const getStep = useCallback((stepId: string) => steps.find((s) => s.id === stepId), [steps])

  // ── Category filter ──────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    steps.forEach((s) => { if (s.category && s.category !== 'All') set.add(s.category) })
    return Array.from(set).sort()
  }, [steps])

  // Derive edges from BOTH outgoing and incoming, deduped.
  // outgoing: hub → step (could be hub or satellite)
  // incoming: step → hub (covers satellite → hub edges that the satellite can't declare)
  const connections = useMemo(() => {
    const seen = new Set<string>()
    const list: { from: string; to: string; kind: 'out' | 'in' }[] = []
    hubs.forEach((hub) => {
      // Outgoing: hub → step (purple)
      hub.outgoingSteps.forEach((toId) => {
        const k = `${hub.stepId}->${toId}`
        if (!seen.has(k)) { seen.add(k); list.push({ from: hub.stepId, to: toId, kind: 'out' }) }
      })
      // Incoming: step → hub — these are steps leading BACK into the hub (brown)
      hub.incomingSteps.forEach((fromId) => {
        const k = `${fromId}->${hub.stepId}`
        if (!seen.has(k)) { seen.add(k); list.push({ from: fromId, to: hub.stepId, kind: 'in' }) }
      })
    })
    return list
  }, [hubs])

  // For each node, count how many of its neighbors belong to the active category
  const categoryAffinity = useMemo(() => {
    const map: Record<string, number> = {}
    if (!categoryFilter) return map
    const nbrs: Record<string, Set<string>> = {}
    connections.forEach((c) => {
      if (c.from === c.to) return
      if (!nbrs[c.from]) nbrs[c.from] = new Set()
      if (!nbrs[c.to]) nbrs[c.to] = new Set()
      nbrs[c.from].add(c.to)
      nbrs[c.to].add(c.from)
    })
    Object.entries(nbrs).forEach(([id, set]) => {
      let count = 0
      set.forEach((n) => {
        if (steps.find((s) => s.id === n)?.category === categoryFilter) count++
      })
      map[id] = count
    })
    return map
  }, [categoryFilter, connections, steps])

  // Total number of steps in the filtered category (for the "X/Y" badge)
  const categoryTotal = useMemo(() => {
    if (!categoryFilter) return 0
    return steps.filter((s) => s.category === categoryFilter).length
  }, [categoryFilter, steps])

  const layout = useMemo(
    () => buildLayout(hubs, steps, connections, categoryFilter),
    [hubs, steps, connections, categoryFilter],
  )
  const { positions: layoutPositions, hubIds, nodeIds } = layout

  // ── Draggable node positions (user overrides persisted in localStorage) ──
  const [userPositions, setUserPositions] = useState<Record<string, { x: number; y: number }>>(() => loadNodePositions(styleId))
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const nodeDragMoved = useRef(false)
  const dragStartWorld = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartNodePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Merge layout positions with user overrides
  const positions = useMemo(() => {
    const merged: Record<string, { x: number; y: number }> = {}
    for (const id of nodeIds) {
      merged[id] = userPositions[id] ?? layoutPositions[id] ?? { x: 0, y: 0 }
    }
    return merged
  }, [layoutPositions, userPositions, nodeIds])

  // Reset user positions when style changes
  useEffect(() => {
    setUserPositions(loadNodePositions(styleId))
  }, [styleId])

  // ── Category master / cluster analysis ───────────────────────────────────

  // Map of category → step IDs that appear in the graph
  const stepsByCategory = useMemo(() => {
    const map: Record<string, string[]> = {}
    steps.forEach((s) => {
      if (s.category && s.category !== 'All' && nodeIds.includes(s.id)) {
        if (!map[s.category]) map[s.category] = []
        map[s.category].push(s.id)
      }
    })
    return map
  }, [steps, nodeIds])




  // ── Per-edge port positions (fixed right-exit / left-enter, y-distributed) ─
  const portAssignments = useMemo(() => {
    const PORT_H_SAT = 16  // half y-spread for satellite ports
    const PORT_H_HUB = 26  // half y-spread for hub ports

    // Group edge indices by source (outgoing) and target (incoming) per node
    const fromGroups: Record<string, number[]> = {}
    const toGroups:   Record<string, number[]> = {}
    connections.forEach((conn, i) => {
      if (!fromGroups[conn.from]) fromGroups[conn.from] = []
      if (!toGroups[conn.to])     toGroups[conn.to]     = []
      fromGroups[conn.from].push(i)
      toGroups[conn.to].push(i)
    })

    return connections.map((conn, i) => {
      const fromPos = positions[conn.from]
      const toPos   = positions[conn.to]
      if (!fromPos || !toPos || conn.from === conn.to) {
        return { fromPort: { x: 0, y: 0 }, toPort: { x: 0, y: 0 } }
      }
      const fromIsHub = hubIds.has(conn.from)
      const toIsHub   = hubIds.has(conn.to)
      const fromW   = (fromIsHub ? HUB_W : SAT_W) / 2
      const toW     = (toIsHub   ? HUB_W : SAT_W) / 2
      const fromR   = fromIsHub ? PORT_H_HUB : PORT_H_SAT
      const toR     = toIsHub   ? PORT_H_HUB : PORT_H_SAT

      const outList  = fromGroups[conn.from] ?? []
      const outIdx   = outList.indexOf(i)
      const fromY    = outList.length <= 1 ? 0 : ((outIdx / (outList.length - 1)) - 0.5) * 2 * fromR

      const inList   = toGroups[conn.to] ?? []
      const inIdx    = inList.indexOf(i)
      const toY      = inList.length <= 1 ? 0 : ((inIdx / (inList.length - 1)) - 0.5) * 2 * toR

      return {
        fromPort: { x: fromPos.x + fromW, y: fromPos.y + fromY },
        toPort:   { x: toPos.x   - toW,   y: toPos.y   + toY   },
      }
    })
  }, [connections, positions, hubIds])

  // All non-hub satellites are always visible as individual nodes
  const visibleSatIds = useMemo(() => {
    return new Set(nodeIds.filter((id) => !hubIds.has(id)))
  }, [nodeIds, hubIds])

  const handleNodeDragStart = useCallback((stepId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingNode(stepId)
    nodeDragMoved.current = false
    dragStartWorld.current = { x: e.clientX, y: e.clientY }
    dragStartNodePos.current = positions[stepId] ?? { x: 0, y: 0 }
  }, [positions])

  const handleNodeDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNode) return
    const dx = (e.clientX - dragStartWorld.current.x) / transform.scale
    const dy = (e.clientY - dragStartWorld.current.y) / transform.scale
    // Only start visual drag after 4px threshold
    if (!nodeDragMoved.current && Math.abs(dx) + Math.abs(dy) < 4) return
    nodeDragMoved.current = true
    const newPos = {
      x: dragStartNodePos.current.x + dx,
      y: dragStartNodePos.current.y + dy,
    }
    setUserPositions((prev) => ({ ...prev, [draggingNode]: newPos }))
  }, [draggingNode, transform.scale])

  const handleNodeDragEnd = useCallback(() => {
    if (draggingNode) {
      if (nodeDragMoved.current) {
        setUserPositions((prev) => {
          saveNodePositions(styleId, prev)
          return prev
        })
      }
      setDraggingNode(null)
    }
  }, [draggingNode, styleId])

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640)
  const lastPinchDist = useRef<number | null>(null)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('.graph-node')) return
    dragging.current = true
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Node dragging takes priority
    if (draggingNode) {
      handleNodeDragMove(e)
      return
    }
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [draggingNode, handleNodeDragMove])

  const onMouseUp = useCallback(() => {
    if (draggingNode) {
      handleNodeDragEnd()
      return
    }
    dragging.current = false
    setIsDragging(false)
  }, [draggingNode, handleNodeDragEnd])

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.9
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.2, Math.min(3.5, t.scale * factor)),
    }))
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      if ((e.target as Element).closest('.graph-node')) return
      dragging.current = true
      setIsDragging(true)
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
    } else if (e.touches.length === 2) {
      dragging.current = false
      setIsDragging(false)
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x
      const dy = e.touches[0].clientY - lastPos.current.y
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const factor = dist / lastPinchDist.current
      lastPinchDist.current = dist
      setTransform((t) => ({
        ...t,
        scale: Math.max(0.2, Math.min(3.5, t.scale * factor)),
      }))
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
    lastPinchDist.current = null
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
    setSidebarDir(flowId ? 1 : -1)
    setSelectedFlowId(flowId)
    setSelectedStepId(null)
    setTooltip(null)
    setSidebarView(flowId ? 'detail' : 'list')
  }, [])

  const enterBuilder = useCallback(() => {
    setSidebarDir(1)
    setBuilderMode(true)
    setSelectedFlowId(null)
    setSelectedStepId(null)
    setTooltip(null)
    setSidebarView('list')
    setDraftSequence([])
    setDraftName('')
    setDraftDifficulty(2)
    setDraftVideo('')
    setEditingFlowId(null)
  }, [])

  const exitBuilder = useCallback(() => {
    setSidebarDir(-1)
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
    setDraftVideo('')
    setEditingFlowId(null)
    setShowVideoPicker(false)
    setVideoSearch('')
  }, [])

  const addToDraft = useCallback((stepId: string) => {
    setDraftSequence((seq) => [...seq, stepId])
  }, [])

  const removeFromDraftAt = useCallback((index: number) => {
    setDraftSequence((seq) => seq.filter((_, i) => i !== index))
  }, [])

  const saveDraft = useCallback(() => {
    if (!draftName.trim()) return
    let next: Flow[]
    let savedId: string
    if (editingFlowId) {
      savedId = editingFlowId
      next = customFlows.map((f) =>
        f.id === editingFlowId
          ? { ...f, name: draftName.trim(), difficulty: draftDifficulty, sequence: [...draftSequence], video: draftVideo.trim() || undefined }
          : f
      )
    } else {
      const newFlow: Flow = {
        id: `custom-${Date.now()}`,
        name: draftName.trim(),
        description: 'Flow personalizado',
        difficulty: draftDifficulty,
        sequence: [...draftSequence],
        video: draftVideo.trim() || undefined,
      }
      savedId = newFlow.id
      next = [...customFlows, newFlow]
    }
    setCustomFlows(next)
    saveCustomFlows(styleId, next)
    setSelectedFlowId(savedId)
    setBuilderMode(false)
    setDraftSequence([])
    setDraftName('')
    setDraftVideo('')
    setEditingFlowId(null)
    setShowVideoPicker(false)
    setVideoSearch('')
  }, [draftSequence, draftName, draftDifficulty, draftVideo, editingFlowId, customFlows, styleId])

  const deleteFlow = useCallback((flowId: string) => {
    if (customFlows.some((f) => f.id === flowId)) {
      const next = customFlows.filter((f) => f.id !== flowId)
      setCustomFlows(next)
      saveCustomFlows(styleId, next)
    } else {
      const next = new Set([...deletedFlowIds, flowId])
      setDeletedFlowIds(next)
      saveDeletedFlowIds(styleId, next)
    }
    if (selectedFlowId === flowId) setSelectedFlowId(null)
  }, [customFlows, deletedFlowIds, styleId, selectedFlowId])

  // Click on a node — different behavior based on mode
  const handleNodeClick = useCallback((stepId: string, e: React.MouseEvent) => {
    if (builderMode) {
      addToDraft(stepId)
      return
    }
    if (footerEditing && footerAddStep.current) {
      footerAddStep.current(stepId)
      return
    }
    setSelectedStepId((prev) => (prev === stepId ? null : stepId))
    pinTooltip(stepId, e)
  }, [builderMode, footerEditing, addToDraft, pinTooltip])

  const sidebarWidth = isMobile
    ? Math.min(window.innerWidth - 8, 340)
    : (!builderMode && sidebarView === 'edit' ? 572 : 260)

  return (
    <div ref={containerRef} className="fm-graph" style={{ display: 'flex', height: '100%' }}>
      {/* ─ Sidebar toggle button ── */}
      <button
        onClick={() => {
          if (sidebarOpen) {
            setSidebarView('list')
            setSelectedFlowId(null)
            setBuilderMode(false)
          }
          setSidebarOpen(!sidebarOpen)
        }}
        style={{
          position: 'absolute',
          top: '16px',
          left: isMobile ? '16px' : (sidebarOpen ? `${sidebarWidth + 16}px` : '16px'),
          width: '32px',
          height: '32px',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(26,29,59,0.12)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(26,29,59,0.6)',
          fontSize: '16px',
          zIndex: 100,
          transition: 'all 0.3s',
          backdropFilter: 'blur(6px)',
        }}
        title={sidebarOpen ? 'Fechar filtros' : 'Abrir filtros'}
      >
        {sidebarOpen ? '←' : '→'}
      </button>

      {/* ─ Mobile backdrop — tap to close sidebar ── */}
      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.28)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─ Left sidebar ── */}
      {sidebarOpen && (
        <div className="fm-sidebar" style={{ width: sidebarWidth, transition: 'width 0.18s ease' }}>
          <AnimatePresence initial={false} mode="wait" custom={sidebarDir}>

            {/* ── LIST page ── */}
            {!builderMode && (sidebarView === 'list' || !selectedFlow) && (
              <motion.div key="list" className="fm-sidebar__page"
                custom={sidebarDir}
                variants={{ enter: (d) => ({ x: d * 28, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -28, opacity: 0 }) }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <div className="fm-sidebar__section">
                  <span className="fm-sidebar__label">Visualização</span>
                  <button
                    onClick={() => { saveNodePositions(styleId, {}); setUserPositions({}) }}
                    className="fm-pill fm-pill--neutral"
                  >
                    Limpar posições
                  </button>
                </div>

                <div className="fm-sidebar__section">
                  <span className="fm-sidebar__label">Flows</span>
                  <button onClick={enterBuilder} className="fm-pill fm-pill--builder">
                    + Criar flow
                  </button>
                  {allFlows.map((flow) => {
                    const isActive = selectedFlowId === flow.id
                    return (
                      <button
                        key={flow.id}
                        onClick={() => handleSelectFlow(flow.id)}
                        title={flow.description}
                        className={`fm-pill fm-pill--flow ${isActive ? 'is-active' : ''}`}
                      >
                        {flow.name}
                      </button>
                    )
                  })}
                </div>

                {categories.length > 0 && (
                  <div className="fm-sidebar__section">
                    <span className="fm-sidebar__label">Categoria</span>
                    <button
                      onClick={() => setCategoryFilter(null)}
                      className={`fm-pill fm-pill--neutral ${categoryFilter === null ? 'is-active' : ''}`}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => {
                      const isActive = categoryFilter === cat
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(isActive ? null : cat)}
                          className={`fm-pill fm-pill--category ${isActive ? 'is-active' : ''}`}
                        >
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── BUILDER page ── */}
            {builderMode && (
              <motion.div key="builder" className="fm-sidebar__page"
                custom={sidebarDir}
                variants={{ enter: (d) => ({ x: d * 28, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -28, opacity: 0 }) }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <div className="fm-builder fm-builder--sidebar">
                  <div className="fm-builder__header">
                    <div className="fm-builder__controls">
                      <span className="fm-builder__label">Construindo flow</span>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="Nome do flow…"
                        className="fm-builder__input"
                      />
                      <select
                        value={draftDifficulty}
                        onChange={(e) => setDraftDifficulty(Number(e.target.value) as Level)}
                        className="fm-builder__select"
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <option key={lvl} value={lvl}>Dificuldade {lvl}/5</option>
                        ))}
                      </select>
                      <div className="fm-builder__video-section">
                        <div className="fm-builder__video-row">
                          <input
                            type="text"
                            value={draftVideo}
                            onChange={(e) => { setDraftVideo(e.target.value); setShowVideoPicker(false) }}
                            placeholder="URL do vídeo (YouTube ou local)…"
                            className="fm-builder__input fm-builder__input--video"
                          />
                          <button
                            type="button"
                            onClick={() => setShowVideoPicker((v) => !v)}
                            className={`fm-builder__video-search-btn${showVideoPicker ? ' is-active' : ''}`}
                            title="Buscar vídeos cadastrados"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                          </button>
                        </div>
                        {draftVideoThumb && !showVideoPicker && (
                          <img src={draftVideoThumb} alt="preview" className="fm-builder__video-thumb" />
                        )}
                        {showVideoPicker && (
                          <div className="fm-builder__video-picker">
                            <input
                              value={videoSearch}
                              onChange={(e) => setVideoSearch(e.target.value)}
                              placeholder="Buscar vídeo…"
                              className="fm-builder__input fm-builder__picker-search"
                              autoFocus
                            />
                            <div className="fm-builder__video-list">
                              {filteredPickerVideos.length === 0 ? (
                                <p className="fm-builder__video-empty">Nenhum vídeo encontrado</p>
                              ) : filteredPickerVideos.map((v) => (
                                <button
                                  key={v.id}
                                  className="fm-builder__video-item"
                                  onClick={() => { setDraftVideo(videoToFlowUrl(v)); setShowVideoPicker(false); setVideoSearch('') }}
                                >
                                  {v.youtubeId && (
                                    <img src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} alt="" className="fm-builder__video-item-thumb" />
                                  )}
                                  <span className="fm-builder__video-item-title">{v.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="fm-builder__actions">
                      <button onClick={exitBuilder} className="fm-btn fm-btn--ghost">Cancelar</button>
                      <button onClick={saveDraft} disabled={!draftName.trim()} className="fm-btn fm-btn--primary">Salvar</button>
                    </div>
                  </div>
                  {(() => {
                    const trainingStore = readTrainingStore()
                    const avgDifficulty = draftSequence.length > 0
                      ? draftSequence.reduce((acc, id) => acc + (getStep(id)?.difficulty ?? 0), 0) / draftSequence.length : 0
                    const nonHubRecall = draftSequence.filter((id) => !hubIds.has(id)).map((id) => trainingStore[id] ?? 0)
                    const avgRecall = nonHubRecall.length > 0 ? nonHubRecall.reduce((a, b) => a + b, 0) / nonHubRecall.length : 0
                    return draftSequence.length > 0 ? (
                      <div className="fm-builder__stats">
                        <span className="fm-builder__stat">{draftSequence.length} {draftSequence.length === 1 ? 'passo' : 'passos'}</span>
                        <span className="fm-builder__stat fm-builder__stat--difficulty">★ {avgDifficulty.toFixed(1)} dif.</span>
                        {nonHubRecall.length > 0 && <span className="fm-builder__stat fm-builder__stat--recall">◎ {avgRecall.toFixed(1)} rec.</span>}
                      </div>
                    ) : null
                  })()}
                  <div className="fm-builder__sequence">
                    <span className="fm-builder__sequence-hint">
                      {draftSequence.length === 0 ? 'Clique nos nós para montar a sequência' : ''}
                    </span>
                    {draftSequence.map((stepId, i) => {
                      const s = getStep(stepId)
                      const isHub = hubIds.has(stepId)
                      return (
                        <div key={i} className="fm-builder__chip-group">
                          {i > 0 && <span className="fm-builder__arrow">→</span>}
                          <button
                            onClick={() => removeFromDraftAt(i)}
                            title="Remover deste flow"
                            className={`fm-builder__chip ${isHub ? 'fm-builder__chip--hub' : ''}`}
                          >
                            {i + 1}. {s?.name ?? stepId} ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── DETAIL page ── */}
            {!builderMode && sidebarView === 'detail' && selectedFlow && (
              <motion.div key="detail" className="fm-sidebar__page"
                custom={sidebarDir}
                variants={{ enter: (d) => ({ x: d * 28, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -28, opacity: 0 }) }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <div className="fm-flow-detail">
                  <button
                    className="fm-flow-detail__back"
                    onClick={() => { setSidebarDir(-1); setSelectedFlowId(null); setSidebarView('list') }}
                  >
                    ← Voltar
                  </button>
                  <div className="fm-flow-detail__header">
                    <h3 className="fm-flow-detail__title">{selectedFlow.name}</h3>
                    <span className="fm-flow-detail__level">{LEVEL_LABELS[selectedFlow.difficulty]}</span>
                  </div>
                  {selectedFlow.description && (
                    <p className="fm-flow-detail__desc">{selectedFlow.description}</p>
                  )}
                  <div className="fm-flow-detail__steps">
                    {selectedFlow.sequence.length === 0 ? (
                      <p className="fm-flow-detail__empty">Nenhum passo</p>
                    ) : selectedFlow.sequence.map((stepId, i) => {
                      const step = steps.find((s) => s.id === stepId)
                      const ts   = selectedFlow.stepTimestamps?.find((t) => t.index === i)
                      return (
                        <button
                          key={i}
                          className="fm-flow-detail__step"
                          onClick={() => {
                            setSelectedStepId(stepId)
                            const pos = positions[stepId]
                            if (pos) setTransform((t) => ({ ...t, x: -pos.x * t.scale, y: -pos.y * t.scale }))
                          }}
                        >
                          <span className="fm-flow-detail__step-num">{i + 1}</span>
                          <span className="fm-flow-detail__step-name">{step?.name ?? stepId}</span>
                          {ts && <span className="fm-flow-detail__step-ts">{formatTs(ts.start)}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="fm-flow-detail__actions">
                      <button
                        className="fm-btn fm-btn--primary"
                        onClick={() => { setSidebarDir(1); setSidebarView('edit') }}
                      >
                        ✎ Editar
                      </button>
                      <button
                        className="fm-btn fm-btn--danger"
                        onClick={() => { setSidebarDir(-1); deleteFlow(selectedFlow.id); setSidebarView('list') }}
                      >
                        Apagar
                      </button>
                    </div>
                </div>
              </motion.div>
            )}

            {/* ── EDIT page ── */}
            {!builderMode && sidebarView === 'edit' && selectedFlow && (
              <motion.div key="edit" className="fm-sidebar__page"
                custom={sidebarDir}
                variants={{ enter: (d) => ({ x: d * 28, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -28, opacity: 0 }) }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <FlowSequenceFooter
                  sidebar
                  flow={selectedFlow}
                  steps={steps}
                  hubs={hubs}
                  onStepClick={(stepId) => {
                    setSelectedStepId(stepId)
                    const pos = positions[stepId]
                    if (pos) setTransform((t) => ({ ...t, x: -pos.x * t.scale, y: -pos.y * t.scale }))
                  }}
                  onClose={() => { setSidebarDir(-1); setSidebarView('detail') }}
                  onUpdateFlow={(updated) => {
                    const next = customFlows.some((f) => f.id === updated.id)
                      ? customFlows.map((f) => f.id === updated.id ? updated : f)
                      : [...customFlows, updated]
                    setCustomFlows(next)
                    saveCustomFlows(styleId, next)
                    setSelectedFlowId(updated.id)
                    setSidebarDir(-1)
                    setSidebarView('detail')
                  }}
                  onEditModeChange={(active, addFn) => {
                    footerAddStep.current = active ? addFn : null
                    setFooterEditing(active)
                  }}
                  onAddStep={onAddStep}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

      {/* ─ Main graph area ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <svg
          className={`fm-graph__svg ${(isDragging || !!draggingNode) ? 'is-grabbing' : ''}`}
          width="100%"
          height="100%"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onClick={(e) => {
            if (!(e.target as Element).closest('.graph-node')) {
              setSelectedStepId(null)
              setTooltip(null)
            }
          }}
        >
        <defs>
          <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#1a1d3b" floodOpacity="0.09" />
          </filter>
          <filter id="shadow-sel" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="10" floodColor="#f5a623" floodOpacity="0.3" />
          </filter>

          {/* Grid lines (graph-paper style) */}
          <pattern id="grid-lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(26,29,59,0.07)" strokeWidth="0.5" />
          </pattern>

          {/* Arrow markers — outgoing (purple) / incoming (brown) / flow (blue)
              markerUnits=userSpaceOnUse → dimensions are in world-coordinate units.
              Idle markers: 22×18 · Highlighted: 28×22 · Flow: 24×20              */}
          <marker id="arrow-out" viewBox="0 0 12 12" refX="12" refY="6"
            markerWidth="22" markerHeight="18" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="1,2.5 12,6 1,9.5" fill={EDGE_OUT_IDLE} />
          </marker>
          <marker id="arrow-out-hl" viewBox="0 0 12 12" refX="12" refY="6"
            markerWidth="28" markerHeight="22" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="1,2.5 12,6 1,9.5" fill={EDGE_OUT} />
          </marker>
          <marker id="arrow-in" viewBox="0 0 12 12" refX="12" refY="6"
            markerWidth="22" markerHeight="18" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="1,2.5 12,6 1,9.5" fill={EDGE_IN_IDLE} />
          </marker>
          <marker id="arrow-in-hl" viewBox="0 0 12 12" refX="12" refY="6"
            markerWidth="28" markerHeight="22" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="1,2.5 12,6 1,9.5" fill={EDGE_IN} />
          </marker>
          <marker id="arrow-flow" viewBox="0 0 12 12" refX="12" refY="6"
            markerWidth="24" markerHeight="20" orient="auto" markerUnits="userSpaceOnUse">
            <polygon points="1,2.5 12,6 1,9.5" fill={FLOW_COLOR} />
          </marker>

          {/* Thumbnail clip paths — use userSpaceOnUse so coords are in each node's local space */}
          <clipPath id="clip-sat-thumb" clipPathUnits="userSpaceOnUse">
            <circle cx={SAT_THUMB_CX} cy="0" r={SAT_THUMB_R} />
          </clipPath>
          <clipPath id="clip-hub-thumb" clipPathUnits="userSpaceOnUse">
            <circle cx={HUB_THUMB_CX} cy={HUB_THUMB_CY} r={HUB_THUMB_R} />
          </clipPath>
        </defs>

        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid-lines)" />

        <g transform={`translate(${center.x + transform.x - panelWidth / 2}, ${center.y + transform.y}) scale(${transform.scale})`}>

          {/* Edges — directional S-curve bezier, purple=out / brown=in */}
          {connections.map((conn, i) => {
            const isSelf    = conn.from === conn.to
            const isHover   = hoveredEdge === i
            const isRelated = selectedStepId !== null && (conn.from === selectedStepId || conn.to === selectedStepId)
            const active    = isHover || isRelated
            const isFlowEdge = activeSequence.length > 0 &&
              activeSequenceSet.has(conn.from) && activeSequenceSet.has(conn.to)
            const isDimmedByFlow = activeSequence.length > 0 && !isFlowEdge

            const isOut = conn.kind === 'out'
            const idleColor  = isOut ? EDGE_OUT_IDLE  : EDGE_IN_IDLE
            const hlColor    = isOut ? EDGE_OUT        : EDGE_IN
            const dimColor   = isOut ? EDGE_OUT_DIM    : EDGE_IN_DIM
            const idleMarker = isOut ? 'url(#arrow-out)'    : 'url(#arrow-in)'
            const hlMarker   = isOut ? 'url(#arrow-out-hl)' : 'url(#arrow-in-hl)'

            const stroke = isDimmedByFlow ? dimColor : active ? hlColor : idleColor
            const marker = isDimmedByFlow ? undefined : active ? hlMarker : idleMarker
            const sw = 4

            if (isSelf) {
              const from = positions[conn.from] ?? { x: 0, y: 0 }
              const hw = (hubIds.has(conn.from) ? HUB_W : SAT_W) / 2
              const hh = (hubIds.has(conn.from) ? HUB_H : SAT_H) / 2
              const d = `M ${from.x - hw * 0.35} ${from.y - hh} C ${from.x - 100} ${from.y - 140} ${from.x + 100} ${from.y - 140} ${from.x + hw * 0.35} ${from.y - hh}`
              return (
                <g key={i} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)} style={{ cursor: 'pointer' }}>
                  <path d={d} fill="none" stroke={stroke} strokeWidth={sw} markerEnd={marker} style={{ transition: 'stroke 0.25s' }} />
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
                </g>
              )
            }

            const ports = portAssignments[i]
            if (!ports) return null
            const d = portBezierPath(ports.fromPort, ports.toPort)
            return (
              <g key={i} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)} style={{ cursor: 'pointer' }}>
                <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" markerEnd={marker} style={{ transition: 'stroke 0.25s' }} />
                <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
              </g>
            )
          })}

          {/* Flow path overlay — bezier, highlighted with arrows */}
          {activeSequence.slice(0, -1).map((fromId, idx) => {
            const toId = activeSequence[idx + 1]
            const from = positions[fromId]
            const to   = positions[toId]
            if (!from || !to || fromId === toId) return null
            const { fromPort, toPort } = getConnectionPorts(from, hubIds.has(fromId), to, hubIds.has(toId))
            const d = portBezierPath(fromPort, toPort)
            return (
              <g key={`flow-${idx}`} style={{ pointerEvents: 'none' }}>
                <path d={d} fill="none" stroke={FLOW_COLOR_DIM} strokeWidth={7} strokeLinecap="round" />
                <path d={d} fill="none" stroke={FLOW_COLOR} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arrow-flow)" />
              </g>
            )
          })}

          {/* Flow start indicator — bouncing chevrons above step 1 */}
          {activeSequence.length > 0 && (() => {
            const firstId  = activeSequence[0]
            const firstPos = positions[firstId]
            if (!firstPos) return null
            const isHub  = hubIds.has(firstId)
            const halfH  = (isHub ? HUB_H : SAT_H) / 2
            const ax     = firstPos.x
            const ay     = firstPos.y - halfH - 52   // above the node

            return (
              <g key="flow-start-indicator" style={{ pointerEvents: 'none' }}>
                {/* Dashed connector line (static) */}
                <line
                  x1={ax} y1={ay + 28} x2={ax} y2={firstPos.y - halfH - 4}
                  stroke={FLOW_COLOR} strokeWidth={1.5}
                  strokeDasharray="5 4" opacity={0.35}
                />
                {/* Bouncing double-chevron + label */}
                <g>
                  <animateTransform
                    attributeName="transform" type="translate"
                    values="0,0; 0,9; 0,0" dur="0.85s" repeatCount="indefinite"
                  />
                  {/* "INÍCIO" label */}
                  <text x={ax} y={ay - 8}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="9" fontWeight={800} fill={FLOW_COLOR}
                    letterSpacing="0.22em"
                    style={{ userSelect: 'none', fontFamily: DM }}
                  >INÍCIO</text>
                  {/* Top chevron */}
                  <polygon
                    points={`${ax - 12},${ay + 2} ${ax + 12},${ay + 2} ${ax},${ay + 14}`}
                    fill={FLOW_COLOR} opacity={0.9}
                  />
                  {/* Bottom chevron (slightly larger, faded) */}
                  <polygon
                    points={`${ax - 9},${ay + 14} ${ax + 9},${ay + 14} ${ax},${ay + 26}`}
                    fill={FLOW_COLOR} opacity={0.45}
                  />
                </g>
              </g>
            )
          })()}

          {/* Satellite step nodes — render before hubs so hubs sit on top */}
          {nodeIds.filter((id) => !hubIds.has(id) && visibleSatIds.has(id)).map((stepId) => {
            const pos        = positions[stepId] ?? { x: 0, y: 0 }
            const step       = getStep(stepId)
            const label      = step?.name ?? stepId
            const thumb      = step ? getVideoThumbnail(step) : null
            const isSelected = selectedStepId === stepId
            const isRelated  = isRelatedToSelected(stepId)
            const isInFlow   = activeSequenceSet.has(stepId)
            const flowPositions = sequencePositions[stepId]
            const affinity   = categoryAffinity[stepId] ?? 0
            const isCategoryHotspot = categoryFilter !== null && affinity >= 3
            const isCategoryMember = categoryFilter !== null && step?.category === categoryFilter
            const anyScope   = selectedStepId !== null || activeSequence.length > 0 || categoryFilter !== null
            const inScope    = isSelected || isRelated || isInFlow || isCategoryHotspot || isCategoryMember
            const isDimmed   = anyScope && !inScope

            const sw2 = SAT_W / 2
            const sh2 = SAT_H / 2
            const accentColor = isSelected ? '#f5a623'
              : isInFlow ? FLOW_COLOR
              : isCategoryHotspot ? '#10b981'
              : isCategoryMember ? '#10b981'
              : isRelated ? '#f5a623'
              : 'rgba(26,29,59,0.22)'
            const textColor = isSelected ? '#f5a623'
              : isInFlow ? FLOW_COLOR
              : isCategoryHotspot ? '#059669'
              : isRelated ? 'rgba(26,29,59,0.82)'
              : 'rgba(26,29,59,0.72)'
            const difficulty = step?.difficulty ?? 0
            // Text area: starts after thumbnail (or from left padding if no thumb)
            const textX  = thumb ? (SAT_THUMB_CX + SAT_THUMB_R + 6) : (-sw2 + 10)
            const textW  = sw2 - textX - 8
            // Category badge data
            const stepCat  = step?.category && step.category !== 'All' ? step.category : null
            const stepCatIdx = stepCat ? Object.keys(stepsByCategory).indexOf(stepCat) : -1
            const stepCatColor = stepCatIdx >= 0 ? (CLUSTER_PALETTE[stepCatIdx % CLUSTER_PALETTE.length]?.label ?? '#6366f1') : '#6366f1'

            return (
              <g
                key={stepId}
                className="graph-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => { e.stopPropagation(); if (!nodeDragMoved.current) handleNodeClick(stepId, e as unknown as React.MouseEvent) }}
                onMouseDown={(e) => handleNodeDragStart(stepId, e as unknown as React.MouseEvent)}
                onMouseEnter={(e) => { if (!draggingNode) showTooltip(stepId, e as unknown as React.MouseEvent) }}
                onMouseMove={moveTooltip as unknown as React.MouseEventHandler<SVGGElement>}
                onMouseLeave={hideTooltip}
                style={{ cursor: draggingNode === stepId ? 'grabbing' : 'grab' }}
              >
              {/* Inner wrapper gets the appear animation so the outer translate is not clobbered */}
              <g className="fm-sat-appear">
                {/* Card background */}
                <rect x={-sw2} y={-sh2} width={SAT_W} height={SAT_H} rx={8}
                  fill={isSelected ? '#fffbf0' : '#ffffff'}
                  opacity={isDimmed ? 0.2 : 1}
                  filter={isSelected ? 'url(#shadow-sel)' : 'url(#shadow)'}
                  style={{ transition: 'all 0.25s' }}
                />
                {/* Card border */}
                <rect x={-sw2} y={-sh2} width={SAT_W} height={SAT_H} rx={8}
                  fill="none" stroke={accentColor}
                  strokeWidth={isSelected || isInFlow ? 2 : 1}
                  opacity={isDimmed ? 0.15 : (isSelected || isInFlow || isRelated ? 1 : 0.38)}
                  style={{ transition: 'all 0.25s' }}
                />

                {/* Thumbnail (circular) */}
                {thumb && (
                  <>
                    <image href={thumb}
                      x={SAT_THUMB_CX - SAT_THUMB_R} y={-SAT_THUMB_R}
                      width={SAT_THUMB_R * 2} height={SAT_THUMB_R * 2}
                      clipPath="url(#clip-sat-thumb)"
                      preserveAspectRatio="xMidYMid slice"
                      opacity={isDimmed ? 0.2 : 1}
                    />
                    <circle cx={SAT_THUMB_CX} cy={0} r={SAT_THUMB_R}
                      fill="none" stroke={accentColor} strokeWidth={1.5}
                      opacity={isDimmed ? 0.15 : 0.55}
                    />
                  </>
                )}

                {/* Step name */}
                <foreignObject x={textX} y={-sh2 + 6} width={textW} height={sh2 * 2 - 20}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div style={{ fontFamily: DM, fontSize: '10px', fontWeight: isSelected || isInFlow || isCategoryHotspot ? 700 : 500, color: textColor, lineHeight: 1.25, opacity: isDimmed ? 0.3 : 1, transition: 'color 0.25s, opacity 0.25s', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {label}
                  </div>
                </foreignObject>

                {/* Difficulty dots */}
                <g opacity={isDimmed ? 0.15 : 0.75}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <rect key={k}
                      x={textX + k * 8} y={sh2 - 11} width={6} height={6} rx={2}
                      fill={k < difficulty ? accentColor : 'rgba(26,29,59,0.1)'}
                      style={{ transition: 'fill 0.25s' }}
                    />
                  ))}
                </g>

                {/* Flow position badges — one circle per occurrence */}
                {flowPositions && flowPositions.map((pos, i) => (
                  <g key={i} transform={`translate(${sw2 - 9 - i * 19}, ${-sh2 + 9})`}>
                    <circle r={9} fill={FLOW_COLOR} stroke="#fff" strokeWidth={1.5} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight={700} fill="#fff" style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}>
                      {pos}
                    </text>
                  </g>
                ))}
                {/* Category affinity badge */}
                {categoryFilter && affinity > 0 && !flowPositions && (
                  <g transform={`translate(${sw2 - 14}, ${sh2 - 11})`}>
                    <rect x={-13} y={-7} width={26} height={14} rx={7} fill="#10b981" stroke="#fff" strokeWidth={1} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight={700} fill="#fff" style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}>
                      {affinity}/{categoryTotal}
                    </text>
                  </g>
                )}
                {/* Category badge — left-edge stripe + label below card */}
                {stepCat && (
                  <g style={{ pointerEvents: 'none' }}>
                    {/* Colored left stripe */}
                    <rect x={-sw2} y={-sh2 + 4} width={4} height={SAT_H - 8} rx={2}
                      fill={stepCatColor} opacity={isDimmed ? 0.1 : 0.72}
                    />
                    {/* Category label pill below the card */}
                    <rect
                      x={-sw2} y={sh2 + 2}
                      width={Math.min(stepCat.length * 5 + 10, 64)} height={12} rx={6}
                      fill={stepCatColor} opacity={isDimmed ? 0.08 : 0.80}
                    />
                    <text x={-sw2 + Math.min(stepCat.length * 5 + 10, 64) / 2} y={sh2 + 8}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="7" fontWeight={700} fill="#fff"
                      opacity={isDimmed ? 0.08 : 1}
                      style={{ userSelect: 'none', fontFamily: DM }}
                    >
                      {stepCat.length > 9 ? stepCat.slice(0, 8) + '…' : stepCat}
                    </text>
                  </g>
                )}
                {/* Port dots */}
                <circle cx={-sw2} cy={0} r={5} fill="#fff" stroke={accentColor} strokeWidth={1.5} opacity={isDimmed ? 0.15 : 0.7} />
                <circle cx={sw2}  cy={0} r={5} fill="#fff" stroke={accentColor} strokeWidth={1.5} opacity={isDimmed ? 0.15 : 0.7} />
              </g>{/* /fm-sat-appear */}
              </g>
            )
          })}

          {/* Hub nodes */}
          {hubs.map((hub) => {
            const pos        = positions[hub.stepId] ?? { x: 0, y: 0 }
            const step       = getStep(hub.stepId)
            const label      = step?.name ?? hub.stepId
            const thumb      = step ? getVideoThumbnail(step) : null
            const isSelected = selectedStepId === hub.stepId
            const isRelated  = isRelatedToSelected(hub.stepId)
            const isInFlow   = activeSequenceSet.has(hub.stepId)
            const flowPositions = sequencePositions[hub.stepId]
            const affinity   = categoryAffinity[hub.stepId] ?? 0
            const isCategoryHotspot = categoryFilter !== null && affinity >= 3
            const isCategoryMember = categoryFilter !== null && step?.category === categoryFilter
            const anyScope   = selectedStepId !== null || activeSequence.length > 0 || categoryFilter !== null
            const inScope    = isSelected || isRelated || isInFlow || isCategoryHotspot || isCategoryMember
            const isDimmed   = anyScope && !inScope

            const hw2 = HUB_W / 2
            const hh2 = HUB_H / 2
            const hubAccent = isSelected ? '#f5a623'
              : isInFlow ? FLOW_COLOR
              : isCategoryHotspot ? '#10b981'
              : isCategoryMember ? '#10b981'
              : isRelated ? '#f5a623'
              : hub.color
            const hubTextColor = isSelected ? '#f5a623'
              : isInFlow ? FLOW_COLOR
              : isCategoryHotspot ? '#059669'
              : isRelated ? 'rgba(26,29,59,0.88)'
              : 'rgba(26,29,59,0.82)'
            const hubDifficulty = step?.difficulty ?? 0
            // Category badge data for hub
            const hubCat     = step?.category && step.category !== 'All' ? step.category : null
            const hubCatIdx  = hubCat ? Object.keys(stepsByCategory).indexOf(hubCat) : -1
            const hubCatColor = hubCatIdx >= 0 ? (CLUSTER_PALETTE[hubCatIdx % CLUSTER_PALETTE.length]?.label ?? '#6366f1') : '#6366f1'
            // Layout constants for this card
            const TITLE_H   = 28                      // height of top title strip
            const INNER_PAD = 8                       // padding inside inner box
            const innerX    = -hw2 + INNER_PAD        // inner box left
            const innerY    = -hh2 + TITLE_H + 4      // inner box top
            const innerW    = HUB_W - INNER_PAD * 2   // inner box width
            const innerH    = hh2 - TITLE_H - 4 + hh2 - INNER_PAD  // inner box height (fills rest)
            const connectedCount = [...new Set([...hub.outgoingSteps, ...hub.incomingSteps])].length

            return (
              <g
                key={hub.stepId}
                className="graph-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => { e.stopPropagation(); if (!nodeDragMoved.current) handleNodeClick(hub.stepId, e as unknown as React.MouseEvent) }}
                onMouseDown={(e) => handleNodeDragStart(hub.stepId, e as unknown as React.MouseEvent)}
                onMouseEnter={(e) => { if (!draggingNode) showTooltip(hub.stepId, e as unknown as React.MouseEvent) }}
                onMouseMove={moveTooltip as unknown as React.MouseEventHandler<SVGGElement>}
                onMouseLeave={hideTooltip}
                style={{ cursor: draggingNode === hub.stepId ? 'grabbing' : 'grab' }}
              >
                {/* Outer card */}
                <rect x={-hw2} y={-hh2} width={HUB_W} height={HUB_H} rx={10}
                  fill={isSelected ? '#fffbf0' : '#ffffff'}
                  opacity={isDimmed ? 0.2 : 1}
                  filter={isSelected ? 'url(#shadow-sel)' : 'url(#shadow)'}
                  style={{ transition: 'all 0.25s' }}
                />
                {/* Outer card border */}
                <rect x={-hw2} y={-hh2} width={HUB_W} height={HUB_H} rx={10}
                  fill="none" stroke={hubAccent}
                  strokeWidth={isSelected || isInFlow ? 2.5 : 1.5}
                  opacity={isDimmed ? 0.15 : (isSelected || isInFlow || isRelated ? 1 : 0.55)}
                  style={{ transition: 'all 0.25s' }}
                />

                {/* Title strip — centered */}
                <text
                  x={0} y={-hh2 + TITLE_H / 2 + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight={700} fill={hubTextColor}
                  opacity={isDimmed ? 0.25 : 1}
                  style={{ fontFamily: DM, userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.25s, opacity 0.25s' }}
                >
                  {hub.icon} {label.length > 18 ? label.slice(0, 17) + '…' : label}
                </text>

                {/* Separator line */}
                <line x1={-hw2 + 8} y1={-hh2 + TITLE_H} x2={hw2 - 8} y2={-hh2 + TITLE_H}
                  stroke="rgba(26,29,59,0.08)" strokeWidth={1}
                  opacity={isDimmed ? 0.1 : 1}
                />

                {/* Inner box */}
                <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={6}
                  fill="rgba(26,29,59,0.03)"
                  stroke="rgba(26,29,59,0.07)" strokeWidth={1}
                  opacity={isDimmed ? 0.1 : 1}
                />

                {/* Thumbnail inside inner box */}
                {thumb ? (
                  <>
                    <image href={thumb}
                      x={HUB_THUMB_CX - HUB_THUMB_R} y={HUB_THUMB_CY - HUB_THUMB_R}
                      width={HUB_THUMB_R * 2} height={HUB_THUMB_R * 2}
                      clipPath="url(#clip-hub-thumb)"
                      preserveAspectRatio="xMidYMid slice"
                      opacity={isDimmed ? 0.2 : 1}
                    />
                    <circle cx={HUB_THUMB_CX} cy={HUB_THUMB_CY} r={HUB_THUMB_R}
                      fill="none" stroke={hubAccent} strokeWidth={1.5}
                      opacity={isDimmed ? 0.15 : 0.5}
                    />
                  </>
                ) : (
                  /* Icon circle fallback */
                  <>
                    <circle cx={HUB_THUMB_CX} cy={HUB_THUMB_CY} r={HUB_THUMB_R}
                      fill={hubAccent} fillOpacity={isDimmed ? 0.05 : 0.12}
                      opacity={isDimmed ? 0.2 : 1}
                    />
                    <text textAnchor="middle" dominantBaseline="central"
                      x={HUB_THUMB_CX} y={HUB_THUMB_CY} fontSize="18"
                      opacity={isDimmed ? 0.2 : 1}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >{hub.icon}</text>
                  </>
                )}

                {/* Step count */}
                <text
                  x={HUB_THUMB_CX + HUB_THUMB_R + 8} y={innerY + 16}
                  fontSize="13" fontWeight={700} fill={hubTextColor}
                  opacity={isDimmed ? 0.2 : 1}
                  style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}
                >
                  {connectedCount}
                </text>
                <text
                  x={HUB_THUMB_CX + HUB_THUMB_R + 8} y={innerY + 30}
                  fontSize="9" fill="rgba(26,29,59,0.5)"
                  opacity={isDimmed ? 0.15 : 1}
                  style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}
                >
                  passos
                </text>

                {/* Difficulty dots */}
                <g opacity={isDimmed ? 0.15 : 0.8}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <rect key={k}
                      x={HUB_THUMB_CX + HUB_THUMB_R + 8 + k * 10} y={innerY + 38}
                      width={8} height={8} rx={2}
                      fill={k < hubDifficulty ? hubAccent : 'rgba(26,29,59,0.1)'}
                      style={{ transition: 'fill 0.25s' }}
                    />
                  ))}
                </g>

                {/* Flow position badges — one circle per occurrence */}
                {flowPositions && flowPositions.map((pos, i) => (
                  <g key={i} transform={`translate(${hw2 - 11 - i * 24}, ${-hh2 + 11})`}>
                    <circle r={11} fill={FLOW_COLOR} stroke="#fff" strokeWidth={2} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight={700} fill="#fff" style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}>
                      {pos}
                    </text>
                  </g>
                ))}
                {/* Category affinity badge */}
                {categoryFilter && affinity > 0 && !flowPositions && (
                  <g transform={`translate(${hw2 - 20}, ${hh2 - 13})`}>
                    <rect x={-16} y={-8} width={32} height={16} rx={8} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight={700} fill="#fff" style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: DM }}>
                      {affinity}/{categoryTotal}
                    </text>
                  </g>
                )}
                {/* Category badge — left-edge stripe + label below hub card */}
                {hubCat && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={-hw2} y={-hh2 + 4} width={5} height={HUB_H - 8} rx={2.5}
                      fill={hubCatColor} opacity={isDimmed ? 0.1 : 0.68}
                    />
                    <rect
                      x={-hw2} y={hh2 + 2}
                      width={Math.min(hubCat.length * 5.5 + 12, 72)} height={13} rx={6}
                      fill={hubCatColor} opacity={isDimmed ? 0.08 : 0.80}
                    />
                    <text x={-hw2 + Math.min(hubCat.length * 5.5 + 12, 72) / 2} y={hh2 + 8.5}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="8" fontWeight={700} fill="#fff"
                      opacity={isDimmed ? 0.08 : 1}
                      style={{ userSelect: 'none', fontFamily: DM }}
                    >
                      {hubCat.length > 10 ? hubCat.slice(0, 9) + '…' : hubCat}
                    </text>
                  </g>
                )}
                {/* Port dots */}
                <circle cx={-hw2} cy={0} r={6} fill="#fff" stroke={hubAccent} strokeWidth={2} opacity={isDimmed ? 0.15 : 0.8} />
                <circle cx={hw2}  cy={0} r={6} fill="#fff" stroke={hubAccent} strokeWidth={2} opacity={isDimmed ? 0.15 : 0.8} />
              </g>
            )
          })}
        </g>
      </svg>

      {tooltip && <VideoTooltip state={tooltip} onClose={() => setTooltip(null)} />}

      {/* ─ Legend ── */}
      {legendVisible ? (
        <div style={{
          position: 'absolute',
          bottom: 68,
          left: 16,
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(26,29,59,0.10)',
          borderRadius: 10,
          padding: '9px 13px 10px',
          fontSize: 10,
          lineHeight: 1.4,
          color: 'rgba(26,29,59,0.65)',
          zIndex: 10,
          transition: 'left 0.3s',
          boxShadow: '0 2px 14px rgba(26,29,59,0.08)',
          fontFamily: "'Poppins', sans-serif",
          minWidth: 178,
        }}>
          {/* Header row with hide button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(26,29,59,0.38)' }}>
              Legenda
            </div>
            <button
              onClick={() => setLegendVisible(false)}
              title="Esconder legenda"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(26,29,59,0.35)', fontSize: 13, lineHeight: 1,
                padding: '0 0 0 8px', display: 'flex', alignItems: 'center',
              }}
            >×</button>
          </div>
          {/* Edge rows */}
          {([
            { color: EDGE_OUT,   label: 'Saída  (hub → passo)' },
            { color: EDGE_IN,    label: 'Entrada (passo → hub)' },
            { color: FLOW_COLOR, label: 'Flow ativo' },
          ] as const).map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <svg width={36} height={10} style={{ flexShrink: 0 }}>
                <line x1={2} y1={5} x2={24} y2={5} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
                <polygon points="22,2 34,5 22,8" fill={color} />
              </svg>
              <span>{label}</span>
            </div>
          ))}
          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(26,29,59,0.07)', margin: '5px 0' }} />
          {/* Badge rows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3B82F6', opacity: 0.72, flexShrink: 0 }} />
            <span>Categoria do passo</span>
          </div>
           
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '1px 6px', borderRadius: 7, fontSize: 8, fontWeight: 700,
              background: '#6d28d9', color: '#fff', flexShrink: 0, whiteSpace: 'nowrap',
            }}>★ cat</div>
            <span>Conectado a toda a categoria</span>
          </div>
        </div>
      ) : (
        /* Collapsed pill — click to restore */
        <button
          onClick={() => setLegendVisible(true)}
          title="Mostrar legenda"
          style={{
            position: 'absolute',
            bottom: 68,
            left: sidebarOpen ? sidebarWidth + 16 : 16,
            background: 'rgba(255,255,255,0.93)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(26,29,59,0.10)',
            borderRadius: 8,
            padding: '5px 11px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(26,29,59,0.45)',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'left 0.3s',
            boxShadow: '0 2px 10px rgba(26,29,59,0.07)',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Legenda
        </button>
      )}

      <div className="fm-hint" style={{ left: `calc(50% - ${panelWidth / 2}px)` }}>
        {builderMode
          ? 'Clique nos nós para montar a sequência'
          : isMobile
            ? 'Arraste · Pinça para zoom · Toque para detalhes'
            : 'Arraste nós · Scroll zoom · Clique para detalhes'
        }
      </div>

      <div className="fm-zoom" style={{ right: panelWidth + 16, position: 'absolute' }}>
        {([
          { label: '+', fn: () => setTransform((t) => ({ ...t, scale: Math.min(3.5, t.scale * 1.2) })) },
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) })) },
          { label: '⌂', fn: () => setTransform({ x: 0, y: 0, scale: 0.75 }) },
        ] as const).map(({ label, fn }) => (
          <button key={label} onClick={fn} className="fm-zoom__btn">{label}</button>
        ))}
      </div>

      {/* Details panel */}
      {selectedStep && (
        <div className="fm-panel" style={{ width: panelWidth }}>
          <div className="fm-panel__header">
            <div className="fm-panel__title-row">
              <div className="fm-panel__title-block">
                {selectedHub && <span className="fm-panel__icon">{selectedHub.icon}</span>}
                <div>
                  <h3 className="fm-panel__title">{selectedStep.name}</h3>
                  <div className="fm-diff">
                    {Array.from({ length: 5 }, (_, k) => (
                      <div key={k} className={`fm-diff__seg ${k < selectedStep.difficulty ? 'is-filled' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStepId(null)} className="fm-panel__close">✕</button>
            </div>
            <p className="fm-panel__description">{selectedStep.description}</p>
            {selectedHub?.notes && (
              <p className="fm-panel__notes">"{selectedHub.notes}"</p>
            )}
            <Link to={`/video/${selectedStep.id}`} className="fm-panel__open">
              Ver passo
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>

          {outgoing.length > 0 && (
            <div className="fm-panel__section">
              <p className="fm-panel__section-label">Vai para</p>
              {outgoing.map((conn, i) => {
                const toHub  = hubs.find((h) => h.stepId === conn.to)
                const toStep = getStep(conn.to)
                return (
                  <div key={i} onClick={() => setSelectedStepId(conn.to)} className="fm-conn fm-conn--out">
                    → {toHub?.icon ?? '·'} {toStep?.name ?? conn.to}
                  </div>
                )
              })}
            </div>
          )}

          {incoming.length > 0 && (
            <div className="fm-panel__section">
              <p className="fm-panel__section-label">Chega de</p>
              {incoming.map((conn, i) => {
                const fromHub  = hubs.find((h) => h.stepId === conn.from)
                const fromStep = getStep(conn.from)
                return (
                  <div key={i} onClick={() => setSelectedStepId(conn.from)} className="fm-conn fm-conn--in">
                    ← {fromHub?.icon ?? '·'} {fromStep?.name ?? conn.from}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer edit mode hint */}
      {footerEditing && !isMobile && (
        <div style={{
          position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(245,166,35,0.92)', backdropFilter: 'blur(6px)',
          color: '#fff', borderRadius: '20px', padding: '6px 16px',
          fontFamily: DM, fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase', zIndex: 200, pointerEvents: 'none',
        }}>
          ✎ Clique nos nós para adicionar ao flow
        </div>
      )}

      </div>
    </div>
  )
}
