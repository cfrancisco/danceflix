import type { Hub, Flow } from '../../../types'

export const sambaHubs: Hub[] = [
  {
    stepId: 'samba-ginga',
    icon: '🎭',
    color: '#D97706',
    notes: 'A ginga está presente em tudo no Samba',
    incomingSteps: ['samba-volta'],
    outgoingSteps: ['samba-no-pe', 'samba-corpo'],
  },
  {
    stepId: 'samba-no-pe',
    icon: '🦶',
    color: '#F59E0B',
    notes: 'Fundamento técnico individual',
    incomingSteps: ['samba-ginga'],
    outgoingSteps: ['samba-volta', 'samba-carreteiro'],
  },
  {
    stepId: 'samba-volta',
    icon: '🔄',
    color: '#059669',
    notes: 'Um dos passos mais icônicos do Samba',
    incomingSteps: ['samba-no-pe'],
    outgoingSteps: ['samba-ginga'],
  },
  {
    stepId: 'samba-carreteiro',
    icon: '↔️',
    color: '#10B981',
    notes: '',
    incomingSteps: ['samba-no-pe'],
    outgoingSteps: [],
  },
  {
    stepId: 'samba-corpo',
    icon: '💃',
    color: '#D97706',
    notes: 'Pode ser integrado a qualquer passo',
    incomingSteps: ['samba-ginga'],
    outgoingSteps: [],
  },
]

export const sambaFlows: Flow[] = [
  {
    id: 'flow-basico',
    name: 'Fluxo Básico',
    difficulty: 1,
    sequence: ['samba-ginga', 'samba-no-pe', 'samba-ginga'],
    description: 'O coração do Samba — começa e termina na ginga',
  },
  {
    id: 'flow-volta',
    name: 'Fluxo com Volta',
    difficulty: 2,
    sequence: ['samba-ginga', 'samba-no-pe', 'samba-volta', 'samba-ginga'],
    description: 'Incorpora o icônico passo de volta',
  },
  {
    id: 'flow-completo',
    name: 'Fluxo Completo',
    difficulty: 4,
    sequence: ['samba-ginga', 'samba-no-pe', 'samba-volta', 'samba-carreteiro', 'samba-corpo', 'samba-ginga'],
    description: 'Combinação avançada com todos os elementos do Samba',
  },
]
