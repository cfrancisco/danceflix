import type { FlowMap } from '../../types'

/**
 * Samba flow map — hubs, directed connections, and common flows.
 */
export const sambaFlowMap: FlowMap = {
  hubs: {
    ginga: {
      id: 'ginga',
      title: 'Ginga',
      description: 'O balanço fundamental — a alma do Samba',
      icon: '🎭',
      color: '#D97706',
      difficulty: 5,
      videoIds: [],
      notes: 'A ginga está presente em tudo no Samba',
    },
    samba_no_pe: {
      id: 'samba_no_pe',
      title: 'Samba no Pé',
      description: 'Passos individuais de pé — base técnica do Samba',
      icon: '🦶',
      color: '#F59E0B',
      difficulty: 5,
      videoIds: [],
      notes: 'Fundamento técnico individual',
    },
    volta: {
      id: 'volta',
      title: 'Volta',
      description: 'Passo de volta cruzada característico do Samba',
      icon: '🔄',
      color: '#059669',
      difficulty: 3,
      videoIds: [],
      notes: 'Um dos passos mais icônicos do Samba',
    },
    carreteiro: {
      id: 'carreteiro',
      title: 'Carreteiro',
      description: 'Deslocamento lateral com cruzamento de pernas',
      icon: '↔️',
      color: '#10B981',
      difficulty: 3,
      videoIds: [],
      notes: '',
    },
    corpo: {
      id: 'corpo',
      title: 'Expressão Corporal',
      description: 'Movimentos de tronco, braços e expressão',
      icon: '💃',
      color: '#D97706',
      difficulty: 2,
      videoIds: [],
      notes: 'Pode ser integrado a qualquer passo',
    },
  },
  connections: [
    { fromHub: 'ginga',      toHub: 'samba_no_pe', videoIds: [], description: 'Ginga → Samba no Pé',  difficulty: 3, notes: '' },
    { fromHub: 'samba_no_pe', toHub: 'volta',       videoIds: [], description: 'Samba no Pé → Volta', difficulty: 3, notes: '' },
    { fromHub: 'samba_no_pe', toHub: 'carreteiro',  videoIds: [], description: 'Samba no Pé → Carreteiro', difficulty: 2, notes: '' },
    { fromHub: 'ginga',      toHub: 'corpo',        videoIds: [], description: 'Ginga → Expressão',   difficulty: 2, notes: '' },
    { fromHub: 'volta',      toHub: 'ginga',        videoIds: [], description: 'Volta → Ginga',        difficulty: 2, notes: '' },
  ],
  commonFlows: [
    {
      name: 'Fluxo Básico',
      difficulty: '1',
      sequence: ['ginga', 'samba_no_pe', 'ginga'],
      description: 'O coração do Samba — começa e termina na ginga',
    },
    {
      name: 'Fluxo com Volta',
      difficulty: '2',
      sequence: ['ginga', 'samba_no_pe', 'volta', 'ginga'],
      description: 'Incorpora o icônico passo de volta',
    },
    {
      name: 'Fluxo Completo',
      difficulty: '3',
      sequence: ['ginga', 'samba_no_pe', 'volta', 'carreteiro', 'corpo', 'ginga'],
      description: 'Combinação avançada com todos os elementos do Samba',
    },
  ],
}
