import { useState, useCallback } from 'react'
import type { TrainingProgress, Level } from '../types'
import { getVideoById } from '../data/videos'

const STORAGE_KEY = 'danceflix:training'
const LEGACY_KEY  = 'zouksteps:training'

function readStore(): Record<string, TrainingProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, TrainingProgress>

    // One-time migration from the old storage key / old field names
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const old = JSON.parse(legacy) as Record<string, Record<string, unknown>>
      const migrated: Record<string, TrainingProgress> = {}
      for (const [key, val] of Object.entries(old)) {
        migrated[key] = {
          stepId:        (val['videoId'] as string)       ?? key,
          timesReviewed: (val['timesReviewed'] as number) ?? 0,
          learningLevel: (val['trainingScore'] as Level)  ?? 0,
          lastReviewedAt:(val['lastReviewedAt'] as string)?? new Date().toISOString(),
          notes:          val['notes'] as string | undefined,
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }

    return {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, TrainingProgress>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function useTraining() {
  const [store, setStore] = useState<Record<string, TrainingProgress>>(readStore)

  const getProgress = useCallback(
    (stepId: string): TrainingProgress | undefined => store[stepId],
    [store],
  )

  const markReviewed = useCallback((stepId: string, level?: Level) => {
    setStore((prev) => {
      const existing = prev[stepId]

      // Default to the step's difficulty if no progress exists and no level given
      let finalLevel: Level = level ?? existing?.learningLevel ?? 0
      if (!existing && level === undefined) {
        const step = getVideoById(stepId)
        if (step) finalLevel = step.difficulty
      }

      const updated: TrainingProgress = {
        stepId,
        timesReviewed: (existing?.timesReviewed ?? 0) + 1,
        learningLevel: finalLevel,
        lastReviewedAt: new Date().toISOString(),
        notes: existing?.notes,
      }
      const next = { ...prev, [stepId]: updated }
      writeStore(next)
      return next
    })
  }, [])

  const updateLevel = useCallback((stepId: string, level: Level) => {
    setStore((prev) => {
      const existing = prev[stepId]
      if (!existing) return prev
      const next = { ...prev, [stepId]: { ...existing, learningLevel: level } }
      writeStore(next)
      return next
    })
  }, [])

  const resetProgress = useCallback((stepId: string) => {
    setStore((prev) => {
      const next = { ...prev }
      delete next[stepId]
      writeStore(next)
      return next
    })
  }, [])

  /** All step IDs that have been reviewed, sorted by learningLevel desc */
  const allProgress = Object.values(store).sort(
    (a, b) => b.learningLevel - a.learningLevel,
  )

  return { getProgress, markReviewed, updateLevel, resetProgress, allProgress }
}
