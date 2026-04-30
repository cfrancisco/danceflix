import type { DanceStyle } from '../../types'
import type { Video } from '../../../types'
import { sambaVideos } from './videos'
import { sambaFlowMap } from './flowMap'

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
  videos: sambaVideos.map((v): Video => ({ ...v, styleId: 'samba' })),
  flowMap: sambaFlowMap,
}
