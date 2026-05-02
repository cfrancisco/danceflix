import type { Hub, Flow } from '../../../types'

export const bachataHubs: Hub[] = [
  {
    stepId: 'bachata-base',
    icon: '🎵',
    color: '#DC2626',
    notes: 'Fundamento de tudo na Bachata',
    incomingSteps: ['bachata-giros'],
    outgoingSteps: ['bachata-giros', 'bachata-lateral', 'bachata-footwork'],
  },
  {
    stepId: 'bachata-giros',
    icon: '🌀',
    color: '#EF4444',
    notes: 'Requer conexão firme na condução',
    incomingSteps: ['bachata-base'],
    outgoingSteps: ['bachata-base'],
  },
  {
    stepId: 'bachata-lateral',
    icon: '↔️',
    color: '#B91C1C',
    notes: 'Base para a maioria das combinações',
    incomingSteps: ['bachata-base'],
    outgoingSteps: ['bachata-sensual'],
  },
  {
    stepId: 'bachata-sensual',
    icon: '💃',
    color: '#7F1D1D',
    notes: 'Estilo de Bachata Sensual / Moderna',
    incomingSteps: ['bachata-lateral'],
    outgoingSteps: [],
  },
  {
    stepId: 'bachata-footwork',
    icon: '👣',
    color: '#F87171',
    notes: 'Pode ser adicionado em qualquer momento',
    incomingSteps: ['bachata-base'],
    outgoingSteps: [],
  },
]

export const bachataFlows: Flow[] = [
  {
    id: 'flow-basico',
    name: 'Fluxo Básico',
    difficulty: 1,
    sequence: ['bachata-base', 'bachata-lateral', 'bachata-base'],
    description: 'O fluxo mais acessível para iniciantes na Bachata',
  },
  {
    id: 'flow-giro',
    name: 'Fluxo com Giro',
    difficulty: 2,
    sequence: ['bachata-base', 'bachata-lateral', 'bachata-giros', 'bachata-base'],
    description: 'Incorpora o primeiro giro ao fluxo básico',
  },
  {
    id: 'flow-sensual',
    name: 'Fluxo Sensual',
    difficulty: 3,
    sequence: ['bachata-base', 'bachata-lateral', 'bachata-sensual', 'bachata-giros', 'bachata-base'],
    description: 'Combina elementos da Bachata Sensual com o fluxo clássico',
  },
]
