import type { DanceStyle, DanceStep } from '../../../types'
import { sambaSteps } from './videos'
import { sambaHubs, sambaFlows } from './flowMap'

/**
 * Samba — style descriptor.
 * Visual identity: amarelo/âmbar (#D97706) e verde (#059669).
 */
export const SambaStyle: DanceStyle = {
  id: 'samba',
  name: 'Samba',
  description: 'Dança brasileira vibrante e percussiva, símbolo do Carnaval, com ginga característica e passos animados.',
  icon: '🎭',
  color: '#D97706',
  accentColor: '#059669',
  steps: sambaSteps.map((s): DanceStep => ({ ...s, styleId: 'samba' })),
  hubs: sambaHubs,
  flows: sambaFlows,
}
