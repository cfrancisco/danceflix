import type { DanceStyle, DanceStep } from '../../../types'
import { bachataSteps } from './videos'
import { bachataHubs, bachataFlows } from './flowMap'

/**
 * Bachata — style descriptor.
 * Visual identity: vermelho (#DC2626) e branco.
 */
export const BachataStyle: DanceStyle = {
  id: 'bachata',
  name: 'Bachata',
  description: 'Dança de salão dominicana de movimentos sensuais, com balanço de quadril e conexão próxima ao parceiro.',
  icon: '🌹',
  color: '#DC2626',
  accentColor: '#DC2626',
  steps: bachataSteps.map((s): DanceStep => ({ ...s, styleId: 'bachata' })),
  hubs: bachataHubs,
  flows: bachataFlows,
}
