import type { FlowMap } from '../../types'

/**
 * Bachata flow map — hubs, directed connections, and common flows.
 */
export const bachataFlowMap: FlowMap = {
  hubs: {
    base: {
      id: 'base',
      title: 'Base',
      description: 'O passo básico da Bachata — quatro tempos laterais com tap',
      icon: '🎵',
      color: '#DC2626',
      difficulty: 5,
      videoIds: [],
      notes: 'Fundamento de tudo na Bachata',
    },
    giros: {
      id: 'giros',
      title: 'Giros',
      description: 'Rotações guiadas pelo condutor',
      icon: '🌀',
      color: '#EF4444',
      difficulty: 3,
      videoIds: [],
      notes: 'Requer conexão firme na condução',
    },
    lateral: {
      id: 'lateral',
      title: 'Lateral',
      description: 'Deslocamentos laterais com variações',
      icon: '↔️',
      color: '#B91C1C',
      difficulty: 4,
      videoIds: [],
      notes: 'Base para a maioria das combinações',
    },
    sensual: {
      id: 'sensual',
      title: 'Sensual',
      description: 'Ondulações e movimentos corporais íntimos',
      icon: '💃',
      color: '#7F1D1D',
      difficulty: 3,
      videoIds: [],
      notes: 'Estilo de Bachata Sensual / Moderna',
    },
    footwork: {
      id: 'footwork',
      title: 'Footwork',
      description: 'Variações e ornamentos de pés',
      icon: '👣',
      color: '#F87171',
      difficulty: 2,
      videoIds: [],
      notes: 'Pode ser adicionado em qualquer momento',
    },
  },
  connections: [
    { fromHub: 'base', toHub: 'giros',    videoIds: [], description: 'Base → Giro',    difficulty: 3, notes: '' },
    { fromHub: 'base', toHub: 'lateral',  videoIds: [], description: 'Base → Lateral', difficulty: 2, notes: '' },
    { fromHub: 'lateral', toHub: 'sensual', videoIds: [], description: 'Lateral → Sensual', difficulty: 3, notes: '' },
    { fromHub: 'base', toHub: 'footwork', videoIds: [], description: 'Base → Footwork', difficulty: 2, notes: '' },
    { fromHub: 'giros', toHub: 'base',    videoIds: [], description: 'Giro → Base',    difficulty: 2, notes: '' },
  ],
  commonFlows: [
    {
      name: 'Fluxo Básico',
      difficulty: '1',
      sequence: ['base', 'lateral', 'base'],
      description: 'O fluxo mais acessível para iniciantes na Bachata',
    },
    {
      name: 'Fluxo com Giro',
      difficulty: '2',
      sequence: ['base', 'lateral', 'giros', 'base'],
      description: 'Incorpora o primeiro giro ao fluxo básico',
    },
    {
      name: 'Fluxo Sensual',
      difficulty: '3',
      sequence: ['base', 'lateral', 'sensual', 'giros', 'base'],
      description: 'Combina elementos da Bachata Sensual com o fluxo clássico',
    },
  ],
}
