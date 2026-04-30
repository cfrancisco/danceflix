import { useState, useCallback } from 'react'
import type { VideoProgress, TrainingScore } from '../types'
import { getVideoById } from '../data/videos'

const STORAGE_KEY = 'zouksteps:training'

function readStore(): Record<string, VideoProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, VideoProgress>) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, VideoProgress>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function useTraining() {
  const [store, setStore] = useState<Record<string, VideoProgress>>(readStore)

  const getProgress = useCallback(
    (videoId: string): VideoProgress | undefined => store[videoId],
    [store],
  )

  const markReviewed = useCallback((videoId: string, score?: TrainingScore) => {
    setStore((prev) => {
      const existing = prev[videoId]
      
      // Se não tem score e ainda não existe progresso, usa o knowledgeLevel do vídeo
      let finalScore: TrainingScore = score ?? existing?.trainingScore ?? 0
      
      if (!existing && score === undefined) {
        const video = getVideoById(videoId)
        if (video) {
          finalScore = video.knowledgeLevel
        }
      }
      
      const updated: VideoProgress = {
        videoId,
        timesReviewed: (existing?.timesReviewed ?? 0) + 1,
        trainingScore: finalScore,
        lastReviewedAt: new Date().toISOString(),
        notes: existing?.notes,
      }
      const next = { ...prev, [videoId]: updated }
      writeStore(next)
      return next
    })
  }, [])

  const updateScore = useCallback((videoId: string, score: TrainingScore) => {
    setStore((prev) => {
      const existing = prev[videoId]
      if (!existing) return prev
      const next = {
        ...prev,
        [videoId]: { ...existing, trainingScore: score },
      }
      writeStore(next)
      return next
    })
  }, [])

  const resetProgress = useCallback((videoId: string) => {
    setStore((prev) => {
      const next = { ...prev }
      delete next[videoId]
      writeStore(next)
      return next
    })
  }, [])

  /** All video IDs that have been reviewed, sorted by training score desc */
  const allProgress = Object.values(store).sort(
    (a, b) => b.trainingScore - a.trainingScore,
  )

  return { getProgress, markReviewed, updateScore, resetProgress, allProgress }
}
