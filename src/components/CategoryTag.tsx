import type { StepCategory } from '../types'

interface CategoryTagProps {
  category: Exclude<StepCategory, 'All'>
  size?: 'sm' | 'md'
}

const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Base e Deslocamento':           { bg: 'rgba(0,201,167,0.10)',  color: '#00a086', border: 'rgba(0,201,167,0.30)'  },
  'Abertura':                      { bg: 'rgba(79,195,247,0.10)', color: '#0086b3', border: 'rgba(79,195,247,0.30)' },
  'Giros e Dinâmicas':             { bg: 'rgba(179,157,219,0.12)',color: '#7c5cbf', border: 'rgba(179,157,219,0.35)'},
  'Pêndulos':                      { bg: 'rgba(240,98,146,0.10)', color: '#c2185b', border: 'rgba(240,98,146,0.30)' },
  'Movimentos de Tronco e Cabeça': { bg: 'rgba(255,213,79,0.15)', color: '#b87e00', border: 'rgba(255,213,79,0.40)' },
  'Conexões e Estilizações':       { bg: 'rgba(245,166,35,0.10)', color: '#c97d00', border: 'rgba(245,166,35,0.30)' },
  'Finalizações':                  { bg: 'rgba(0,230,118,0.10)',  color: '#00875a', border: 'rgba(0,230,118,0.30)'  },
}

const DEFAULT_COLOR = { bg: 'rgba(139,149,184,0.10)', color: '#4a4e6b', border: 'rgba(139,149,184,0.30)' }

export function CategoryTag({ category, size = 'sm' }: CategoryTagProps) {
  const sizeStyle = size === 'md'
    ? { padding: '5px 14px', fontSize: '12px' }
    : { padding: '2px 9px', fontSize: '10px' }

  const colors = CAT_COLORS[category] ?? DEFAULT_COLOR

  return (
    <span
      style={{
        ...sizeStyle,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.color,
        borderRadius: '20px',
        display: 'inline-block',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {category}
    </span>
  )
}
