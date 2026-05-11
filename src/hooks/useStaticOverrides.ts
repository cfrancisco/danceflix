import { useState, useCallback } from 'react'
import { getStyleById } from '../data/registry'
import type { DanceStep, Video } from '../types'

const STEP_KEY         = 'danceflix:stepOverrides'
const VIDEO_KEY        = 'danceflix:videoOverrides'
const HIDDEN_VIDEO_KEY = 'danceflix:hiddenCatalogVideos'

function loadStepOverrides(): Record<string, Partial<DanceStep>> {
  try { return JSON.parse(localStorage.getItem(STEP_KEY) ?? '{}') } catch { return {} }
}

function loadVideoOverrides(): Record<string, Partial<Video>> {
  try { return JSON.parse(localStorage.getItem(VIDEO_KEY) ?? '{}') } catch { return {} }
}

function loadHiddenVideoIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_VIDEO_KEY) ?? '[]') as string[]) } catch { return new Set() }
}

function triggerDownload(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useStaticOverrides() {
  const [stepOverrides, setStepOverrides]   = useState<Record<string, Partial<DanceStep>>>(loadStepOverrides)
  const [videoOverrides, setVideoOverrides] = useState<Record<string, Partial<Video>>>(loadVideoOverrides)
  const [hiddenVideoIds, setHiddenVideoIds] = useState<Set<string>>(loadHiddenVideoIds)

  const updateStep = useCallback((id: string, patch: Partial<DanceStep>) => {
    const current = loadStepOverrides()
    const next = { ...current, [id]: { ...(current[id] ?? {}), ...patch } }
    setStepOverrides(next)
    localStorage.setItem(STEP_KEY, JSON.stringify(next))
  }, [])

  const updateVideo = useCallback((id: string, patch: Partial<Video>) => {
    const current = loadVideoOverrides()
    const next = { ...current, [id]: { ...(current[id] ?? {}), ...patch } }
    setVideoOverrides(next)
    localStorage.setItem(VIDEO_KEY, JSON.stringify(next))
  }, [])

  const resetStep = useCallback((id: string) => {
    const next = { ...loadStepOverrides() }
    delete next[id]
    setStepOverrides(next)
    localStorage.setItem(STEP_KEY, JSON.stringify(next))
  }, [])

  const resetVideo = useCallback((id: string) => {
    const next = { ...loadVideoOverrides() }
    delete next[id]
    setVideoOverrides(next)
    localStorage.setItem(VIDEO_KEY, JSON.stringify(next))
  }, [])

  const getMergedStep = useCallback((step: DanceStep): DanceStep => {
    const patch = stepOverrides[step.id]
    return patch ? { ...step, ...patch } : step
  }, [stepOverrides])

  const getMergedVideo = useCallback((video: Video): Video => {
    const patch = videoOverrides[video.id]
    return patch ? { ...video, ...patch } : video
  }, [videoOverrides])

  const hasStepOverride  = useCallback((id: string) => id in stepOverrides,  [stepOverrides])
  const hasVideoOverride = useCallback((id: string) => id in videoOverrides, [videoOverrides])
  const isVideoHidden    = useCallback((id: string) => hiddenVideoIds.has(id), [hiddenVideoIds])

  const hideCatalogVideo = useCallback((id: string) => {
    const next = new Set([...hiddenVideoIds, id])
    setHiddenVideoIds(next)
    localStorage.setItem(HIDDEN_VIDEO_KEY, JSON.stringify([...next]))
  }, [hiddenVideoIds])

  const restoreCatalogVideo = useCallback((id: string) => {
    const next = new Set([...hiddenVideoIds].filter((x) => x !== id))
    setHiddenVideoIds(next)
    localStorage.setItem(HIDDEN_VIDEO_KEY, JSON.stringify([...next]))
  }, [hiddenVideoIds])

  const totalOverrides = Object.keys(stepOverrides).length + Object.keys(videoOverrides).length

  const exportVideosJSON = useCallback((styleId: string) => {
    const style = getStyleById(styleId)
    if (!style) return
    const vOver = loadVideoOverrides()
    const date  = new Date().toISOString().slice(0, 10)

    // catalog videos with overrides applied
    const catalogData = style.videos.map((v) => { const p = vOver[v.id]; return p ? { ...v, ...p } : v })

    // user library videos (added via "Novo vídeo") filtered to this style
    const libraryRaw: Video[] = (() => {
      try { return JSON.parse(localStorage.getItem('danceflix:videoLibrary') ?? '[]') } catch { return [] }
    })()
    const libraryData = libraryRaw.filter((v) => v.styleId === styleId)

    // merge: catalog first, then library-only (skip catalog ids already exported)
    const catalogIds = new Set(style.videos.map((v) => v.id))
    const newLibrary = libraryData.filter((v) => !catalogIds.has(v.id))

    triggerDownload(`${styleId}-videos-${date}.json`, [...catalogData, ...newLibrary])
  }, [])

  const exportStepsJSON = useCallback((styleId: string) => {
    const style = getStyleById(styleId)
    if (!style) return
    const sOver = loadStepOverrides()
    const date  = new Date().toISOString().slice(0, 10)

    // catalog steps with overrides applied, styleId stripped
    const catalogData = style.steps.map(({ styleId: _sid, ...rest }) => {
      const patch = sOver[rest.id]
      if (!patch) return rest
      const { styleId: _sid2, ...clean } = { ...rest, ...patch } as DanceStep
      void _sid2
      return clean
    })

    // custom steps created via flow editor, styleId stripped
    const customRaw: DanceStep[] = (() => {
      try { return JSON.parse(localStorage.getItem(`danceflix:customSteps:${styleId}`) ?? '[]') } catch { return [] }
    })()
    const customData = customRaw.map(({ styleId: _sid, ...rest }) => { void _sid; return rest })

    triggerDownload(`${styleId}-steps-${date}.json`, [...catalogData, ...customData])
  }, [])

  return {
    stepOverrides, videoOverrides, hiddenVideoIds,
    updateStep, updateVideo,
    resetStep, resetVideo,
    getMergedStep, getMergedVideo,
    hasStepOverride, hasVideoOverride,
    isVideoHidden, hideCatalogVideo, restoreCatalogVideo,
    totalOverrides,
    exportVideosJSON,
    exportStepsJSON,
  }
}
