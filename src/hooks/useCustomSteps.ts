import { useState, useCallback } from 'react'
import type { DanceStep, Level } from '../types'

function storageKey(styleId: string) { return `danceflix:customSteps:${styleId}` }

function load(styleId: string): DanceStep[] {
  try { return JSON.parse(localStorage.getItem(storageKey(styleId)) ?? '[]') } catch { return [] }
}

function persist(styleId: string, steps: DanceStep[]) {
  localStorage.setItem(storageKey(styleId), JSON.stringify(steps))
}

export function useCustomSteps(styleId: string) {
  const [customSteps, setCustomSteps] = useState<DanceStep[]>(() => load(styleId))

  const addStep = useCallback((name: string): DanceStep => {
    const step: DanceStep = {
      id: `custom-step-${Date.now()}`,
      styleId,
      name: name.trim(),
      description: '',
      videoIds: [],
      tags: [],
      category: 'Base e Deslocamento',
      difficulty: 1 as Level,
    }
    const next = [...load(styleId), step]
    setCustomSteps(next)
    persist(styleId, next)
    return step
  }, [styleId])

  const deleteStep = useCallback((id: string) => {
    const next = load(styleId).filter((s) => s.id !== id)
    setCustomSteps(next)
    persist(styleId, next)
  }, [styleId])

  return { customSteps, addStep, deleteStep }
}
