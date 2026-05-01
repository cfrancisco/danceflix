import { createContext, useContext, useState } from 'react'
import { getAllStyles } from '../data/registry'
import type { DanceStyle } from '../types'

interface StyleContextValue {
  activeStyle: DanceStyle
  allStyles: DanceStyle[]
  setActiveStyleId: (id: string) => void
}

const StyleContext = createContext<StyleContextValue | null>(null)

const STORAGE_KEY = 'danceflix:activeStyle'

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const allStyles = getAllStyles()

  const [styleId, setStyleIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? allStyles[0]?.id ?? 'zouk'
  })

  const activeStyle = allStyles.find((s) => s.id === styleId) ?? allStyles[0]

  function setActiveStyleId(id: string) {
    setStyleIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <StyleContext.Provider value={{ activeStyle, allStyles, setActiveStyleId }}>
      {children}
    </StyleContext.Provider>
  )
}

export function useActiveStyle(): StyleContextValue {
  const ctx = useContext(StyleContext)
  if (!ctx) throw new Error('useActiveStyle must be used within StyleProvider')
  return ctx
}
