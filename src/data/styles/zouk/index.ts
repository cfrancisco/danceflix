import type { DanceStyle, DanceStep } from '../../types'
import { zoukSteps } from './zoukSteps'
import { zoukFlows, zoukHubs } from './flowMap'

/**
 * Zouk — style descriptor.
 *
 * `styleId` is injected into every step here so the raw data
 * in `videos.ts` stays clean and style-agnostic.
 */
export const ZoukStyle: DanceStyle = {
  id: 'zouk',
  name: 'Zouk',
  description: 'Dança de salão brasileira com movimentos fluidos, ondulações e grande expressão corporal.',
  icon: '🌊',
  color: '#3B82F6',
  accentColor: '#f5a623',
  steps: zoukSteps.map((v): DanceStep => ({ ...v, styleId: 'zouk', name: v.name ?? (v as any).title ?? '' })),
  flows: zoukFlows,
  hubs: zoukHubs
}
