import { useState, useCallback } from 'react'
import type { Video, VideoStepOccurrence } from '../types'

const STORAGE_KEY = 'danceflix:videoLibrary'

function load(): Video[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(videos: Video[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(videos)) } catch { /* noop */ }
}

function generateId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function useVideoLibrary() {
  const [videos, setVideos] = useState<Video[]>(load)

  const persist = useCallback((next: Video[]) => {
    setVideos(next)
    save(next)
  }, [])

  const addVideo = useCallback((data: Omit<Video, 'id' | 'createdAt'> & { title: string }): Video => {
    const video: Video = { steps: [], ...data, id: generateId(), createdAt: new Date().toISOString() }
    persist([...load(), video])
    return video
  }, [persist])

  const updateVideo = useCallback((id: string, patch: Partial<Omit<Video, 'id' | 'createdAt'>>) => {
    const next = load().map((v) => (v.id === id ? { ...v, ...patch } : v))
    persist(next)
  }, [persist])

  const deleteVideo = useCallback((id: string) => {
    persist(load().filter((v) => v.id !== id))
  }, [persist])

  const linkStep = useCallback((videoId: string, occurrence: VideoStepOccurrence) => {
    const current = load()
    const next = current.map((v) => {
      if (v.id !== videoId) return v
      const existing = v.steps ?? []
      const alreadyLinked = existing.some((s) => s.stepId === occurrence.stepId)
      if (alreadyLinked) return v
      return { ...v, steps: [...existing, occurrence] }
    })
    persist(next)
  }, [persist])

  const unlinkStep = useCallback((videoId: string, stepId: string) => {
    const next = load().map((v) =>
      v.id === videoId ? { ...v, steps: (v.steps ?? []).filter((s) => s.stepId !== stepId) } : v
    )
    persist(next)
  }, [persist])

  const updateStepOccurrence = useCallback((videoId: string, stepId: string, patch: Partial<VideoStepOccurrence>) => {
    const next = load().map((v) =>
      v.id === videoId
        ? { ...v, steps: (v.steps ?? []).map((s) => (s.stepId === stepId ? { ...s, ...patch } : s)) }
        : v
    )
    persist(next)
  }, [persist])

  const getVideosForStep = useCallback((stepId: string): Video[] => {
    return load().filter((v) => v.steps?.some((s) => s.stepId === stepId))
  }, [])

  return {
    videos,
    addVideo,
    updateVideo,
    deleteVideo,
    linkStep,
    unlinkStep,
    updateStepOccurrence,
    getVideosForStep,
  }
}
