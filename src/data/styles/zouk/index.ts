import type { DanceStyle } from '../../types'
import type { Video } from '../../../types'
import { zoukVideos } from './videos'
import { zoukFlowMap } from './flowMap'

/**
 * Zouk — style descriptor.
 *
 * `styleId` is injected into every video here so the raw video data
 * in `videos.ts` stays clean and style-agnostic.
 */
export const ZoukStyle: DanceStyle = {
  id: 'zouk',
  name: 'Zouk',
  description: 'Dança de salão brasileira com movimentos fluidos, ondulações e grande expressão corporal.',
  icon: '🌊',
  color: '#3B82F6',
  accentColor: '#f5a623',
  videos: zoukVideos.map((v): Video => ({ ...v, styleId: 'zouk' })),
  flowMap: zoukFlowMap,
}
